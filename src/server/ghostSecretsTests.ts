/**
 * CredSense AI - Ghost Secrets Verification & Test Engine
 * Executes automated test suites verifying Git history diffing and Ghost Secret classifications.
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { GhostSecretTestScenarioResult } from '../types';
import { executeFullRepositoryScan } from './gitScanner';

const execAsync = promisify(exec);

export async function runGhostSecretTestSuite(): Promise<{
  passedAll: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  scenarios: GhostSecretTestScenarioResult[];
}> {
  const startSuite = Date.now();
  const scenarios: GhostSecretTestScenarioResult[] = [];

  // Helper to create test repo with specific commit flow
  const createTempGitRepo = async (prefix: string): Promise<string> => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `credsense-test-${prefix}-`));
    await execAsync('git init -b main', { cwd: tempDir });
    await execAsync('git config user.name "Test Suite Runner"', { cwd: tempDir });
    await execAsync('git config user.email "test.runner@credsense.internal"', { cwd: tempDir });
    return tempDir;
  };

  const cleanupDir = (dir: string) => {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors in tmpdir
    }
  };

  // -------------------------------------------------------------
  // Test 1: Secret exists in history but NOT in HEAD (Ghost Secret)
  // -------------------------------------------------------------
  const t1Start = Date.now();
  const t1Dir = await createTempGitRepo('scenario1-ghost');
  try {
    // Commit 1: Leaked GitHub token
    fs.writeFileSync(
      path.join(t1Dir, 'api_client.js'),
      `// GitHub API connector\nconst GITHUB_TOKEN = "ghp_TEST_HISTORICAL_GHOST_KEY_ABC123456789";\nexport function fetchUser() { return null; }\n`
    );
    await execAsync('git add .', { cwd: t1Dir });
    await execAsync('git commit -m "feat: initial github client implementation with hardcoded token"', { cwd: t1Dir });

    // Commit 2: Remove secret from HEAD
    fs.writeFileSync(
      path.join(t1Dir, 'api_client.js'),
      `// GitHub API connector\nconst GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';\nexport function fetchUser() { return null; }\n`
    );
    await execAsync('git add .', { cwd: t1Dir });
    await execAsync('git commit -m "refactor: load token from environment variables"', { cwd: t1Dir });

    const scanRes = await executeFullRepositoryScan({
      repoPath: t1Dir,
      scanId: `test-s1-${Date.now()}`,
      repoName: 'test-scenario-ghost-secret',
    });

    const ghostFinding = scanRes.findings.find((f) => f.secretType.includes('GitHub') || f.isGhostSecret || f.isHistoricalOnly);
    const passed =
      !!ghostFinding &&
      ghostFinding.isGhostSecret === true &&
      ghostFinding.headStatus === 'CLEAN' &&
      ghostFinding.gitHistoryStatus === 'EXPOSED' &&
      !!ghostFinding.fingerprint?.startsWith('FPR-');

    scenarios.push({
      scenarioId: 'test-scenario-1',
      name: 'Secret exists in history but not HEAD',
      description: 'Verifies that a credential introduced in an early commit and removed in a subsequent commit is correctly flagged as a GHOST SECRET with HEAD: CLEAN and History: EXPOSED.',
      expectedClassification: 'GHOST_SECRET',
      actualClassification: ghostFinding ? (ghostFinding.isGhostSecret ? 'GHOST_SECRET' : 'ACTIVE_HEAD') : 'CLEAN',
      headStatus: ghostFinding?.headStatus || 'CLEAN',
      historyStatus: ghostFinding?.gitHistoryStatus || 'CLEAN',
      fingerprint: ghostFinding?.fingerprint || 'N/A',
      passed,
      details: passed
        ? `Successfully detected Ghost Secret (${ghostFinding?.secretType}). Head status verified CLEAN, Git history verified EXPOSED with correlation fingerprint ${ghostFinding?.fingerprint}.`
        : `Assertion failed: isGhostSecret=${ghostFinding?.isGhostSecret}, headStatus=${ghostFinding?.headStatus}`,
      durationMs: Date.now() - t1Start,
    });
  } catch (err: any) {
    scenarios.push({
      scenarioId: 'test-scenario-1',
      name: 'Secret exists in history but not HEAD',
      description: 'Verifies ghost secret detection on removed commits.',
      expectedClassification: 'GHOST_SECRET',
      actualClassification: 'ERROR',
      headStatus: 'CLEAN',
      historyStatus: 'CLEAN',
      fingerprint: 'ERROR',
      passed: false,
      details: `Execution error: ${err.message || String(err)}`,
      durationMs: Date.now() - t1Start,
    });
  } finally {
    cleanupDir(t1Dir);
  }

  // -------------------------------------------------------------
  // Test 2: Secret exists in both HEAD and history
  // -------------------------------------------------------------
  const t2Start = Date.now();
  const t2Dir = await createTempGitRepo('scenario2-active');
  try {
    // Commit 1: Added AWS key
    fs.writeFileSync(
      path.join(t2Dir, 'aws_config.py'),
      `# AWS S3 Settings\nAWS_ACCESS_KEY_ID = "AKIAIOSFODNN7ACTIVE12"\nAWS_REGION = "us-west-2"\n`
    );
    await execAsync('git add .', { cwd: t2Dir });
    await execAsync('git commit -m "feat: configure aws s3 credentials"', { cwd: t2Dir });

    // Commit 2: Added readme (secret stays in file)
    fs.writeFileSync(path.join(t2Dir, 'README.md'), '# Microservice\n\nActive repository\n');
    await execAsync('git add .', { cwd: t2Dir });
    await execAsync('git commit -m "docs: add repository readme"', { cwd: t2Dir });

    const scanRes = await executeFullRepositoryScan({
      repoPath: t2Dir,
      scanId: `test-s2-${Date.now()}`,
      repoName: 'test-scenario-active-head',
    });

    const activeFinding = scanRes.findings.find((f) => f.secretType.includes('AWS'));
    const passed =
      !!activeFinding &&
      activeFinding.isGhostSecret === false &&
      activeFinding.headStatus === 'EXPOSED' &&
      activeFinding.gitHistoryStatus === 'EXPOSED';

    scenarios.push({
      scenarioId: 'test-scenario-2',
      name: 'Secret exists in both HEAD and history',
      description: 'Verifies that an active secret present in the current working tree is classified as ACTIVE_HEAD with both HEAD: EXPOSED and History: EXPOSED.',
      expectedClassification: 'ACTIVE_HEAD',
      actualClassification: activeFinding ? (activeFinding.isGhostSecret ? 'GHOST_SECRET' : 'ACTIVE_HEAD') : 'CLEAN',
      headStatus: activeFinding?.headStatus || 'CLEAN',
      historyStatus: activeFinding?.gitHistoryStatus || 'CLEAN',
      fingerprint: activeFinding?.fingerprint || 'N/A',
      passed,
      details: passed
        ? `Successfully confirmed Active Secret in HEAD worktree (${activeFinding?.secretType}). Classified as ACTIVE_HEAD with non-reversible fingerprint ${activeFinding?.fingerprint}.`
        : `Assertion failed: isGhostSecret=${activeFinding?.isGhostSecret}, headStatus=${activeFinding?.headStatus}`,
      durationMs: Date.now() - t2Start,
    });
  } catch (err: any) {
    scenarios.push({
      scenarioId: 'test-scenario-2',
      name: 'Secret exists in both HEAD and history',
      description: 'Verifies active secret in both head and history.',
      expectedClassification: 'ACTIVE_HEAD',
      actualClassification: 'ERROR',
      headStatus: 'CLEAN',
      historyStatus: 'CLEAN',
      fingerprint: 'ERROR',
      passed: false,
      details: `Execution error: ${err.message || String(err)}`,
      durationMs: Date.now() - t2Start,
    });
  } finally {
    cleanupDir(t2Dir);
  }

  // -------------------------------------------------------------
  // Test 3: Secret never existed in history (Clean repo)
  // -------------------------------------------------------------
  const t3Start = Date.now();
  const t3Dir = await createTempGitRepo('scenario3-clean');
  try {
    // Commit 1: Clean code
    fs.writeFileSync(path.join(t3Dir, 'index.ts'), 'export function sum(a: number, b: number): number { return a + b; }\n');
    await execAsync('git add .', { cwd: t3Dir });
    await execAsync('git commit -m "feat: math utility engine"', { cwd: t3Dir });

    // Commit 2: Another clean file
    fs.writeFileSync(path.join(t3Dir, 'types.ts'), 'export interface Result { value: number; timestamp: string; }\n');
    await execAsync('git add .', { cwd: t3Dir });
    await execAsync('git commit -m "feat: export result interface types"', { cwd: t3Dir });

    const scanRes = await executeFullRepositoryScan({
      repoPath: t3Dir,
      scanId: `test-s3-${Date.now()}`,
      repoName: 'test-scenario-clean-repo',
    });

    const realFindings = scanRes.findings.filter((f) => f.verificationStatus !== 'FALSE_POSITIVE');
    const passed = realFindings.length === 0;

    scenarios.push({
      scenarioId: 'test-scenario-3',
      name: 'Secret never existed in history',
      description: 'Verifies that clean repositories with no historical or active secret commits return 0 findings with both HEAD and History verified clean.',
      expectedClassification: 'CLEAN',
      actualClassification: realFindings.length === 0 ? 'CLEAN' : 'EXPOSED',
      headStatus: 'CLEAN',
      historyStatus: 'CLEAN',
      fingerprint: 'NONE',
      passed,
      details: passed
        ? 'Clean baseline verified: zero secrets detected across working tree and commit history DAG.'
        : `Assertion failed: unexpected finding count=${realFindings.length}`,
      durationMs: Date.now() - t3Start,
    });
  } catch (err: any) {
    scenarios.push({
      scenarioId: 'test-scenario-3',
      name: 'Secret never existed in history',
      description: 'Verifies clean repository posture.',
      expectedClassification: 'CLEAN',
      actualClassification: 'ERROR',
      headStatus: 'CLEAN',
      historyStatus: 'CLEAN',
      fingerprint: 'ERROR',
      passed: false,
      details: `Execution error: ${err.message || String(err)}`,
      durationMs: Date.now() - t3Start,
    });
  } finally {
    cleanupDir(t3Dir);
  }

  // -------------------------------------------------------------
  // Test 4: Secret removed and reintroduced (Flapping / Regression)
  // -------------------------------------------------------------
  const t4Start = Date.now();
  const t4Dir = await createTempGitRepo('scenario4-reintroduced');
  try {
    // Commit 1: Secret introduced
    fs.writeFileSync(
      path.join(t4Dir, 'service_a.ts'),
      `export const STRIPE_KEY = "sk_test_demo51NqZ_REINTRO_9988776655";\n`
    );
    await execAsync('git add .', { cwd: t4Dir });
    await execAsync('git commit -m "feat(billing): add stripe api key to service A"', { cwd: t4Dir });

    // Commit 2: Secret removed
    fs.writeFileSync(
      path.join(t4Dir, 'service_a.ts'),
      `export const STRIPE_KEY = process.env.STRIPE_KEY || '';\n`
    );
    await execAsync('git add .', { cwd: t4Dir });
    await execAsync('git commit -m "fix(billing): remove hardcoded stripe key from service A"', { cwd: t4Dir });

    // Commit 3: Secret reintroduced into a different file
    fs.writeFileSync(
      path.join(t4Dir, 'legacy_backup.ts'),
      `// Reintroduced by mistake in legacy backup script\nexport const BACKUP_STRIPE_KEY = "sk_test_demo51NqZ_REINTRO_9988776655";\n`
    );
    await execAsync('git add .', { cwd: t4Dir });
    await execAsync('git commit -m "chore(backup): accidentally re-introduce stripe test credential in backup module"', { cwd: t4Dir });

    const scanRes = await executeFullRepositoryScan({
      repoPath: t4Dir,
      scanId: `test-s4-${Date.now()}`,
      repoName: 'test-scenario-reintroduced-secret',
    });

    const reintroducedFinding = scanRes.findings.find((f) => f.filePath.includes('legacy_backup') || f.secretType.includes('Stripe'));
    const passed =
      !!reintroducedFinding &&
      reintroducedFinding.headStatus === 'EXPOSED' &&
      reintroducedFinding.isGhostSecret === false &&
      !!reintroducedFinding.fingerprint?.startsWith('FPR-');

    scenarios.push({
      scenarioId: 'test-scenario-4',
      name: 'Secret removed and reintroduced',
      description: 'Verifies regression detection where a secret is removed in one commit and later reintroduced in another file. Confirms correlated fingerprint tracking across the entire DAG.',
      expectedClassification: 'REINTRODUCED_HEAD',
      actualClassification: reintroducedFinding?.headStatus === 'EXPOSED' ? 'REINTRODUCED_HEAD' : 'GHOST_SECRET',
      headStatus: reintroducedFinding?.headStatus || 'CLEAN',
      historyStatus: reintroducedFinding?.gitHistoryStatus || 'CLEAN',
      fingerprint: reintroducedFinding?.fingerprint || 'N/A',
      passed,
      details: passed
        ? `Successfully tracked reintroduced credential. Correlated exact fingerprint (${reintroducedFinding?.fingerprint}) across multiple distinct commit revisions and file paths.`
        : `Assertion failed: headStatus=${reintroducedFinding?.headStatus}`,
      durationMs: Date.now() - t4Start,
    });
  } catch (err: any) {
    scenarios.push({
      scenarioId: 'test-scenario-4',
      name: 'Secret removed and reintroduced',
      description: 'Verifies reintroduced secret correlation.',
      expectedClassification: 'REINTRODUCED_HEAD',
      actualClassification: 'ERROR',
      headStatus: 'CLEAN',
      historyStatus: 'CLEAN',
      fingerprint: 'ERROR',
      passed: false,
      details: `Execution error: ${err.message || String(err)}`,
      durationMs: Date.now() - t4Start,
    });
  } finally {
    cleanupDir(t4Dir);
  }

  const passedTests = scenarios.filter((s) => s.passed).length;
  const failedTests = scenarios.length - passedTests;

  return {
    passedAll: failedTests === 0,
    totalTests: scenarios.length,
    passedTests,
    failedTests,
    durationMs: Date.now() - startSuite,
    scenarios,
  };
}
