/**
 * CredSense AI - Git History & Repository Security Scanner
 * Safe traversal of current files and full Git commit history.
 */

import { exec } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { CommitExposure, Finding, Scan, ScanProgressStage, TimelineEvent } from '../types';
import { verifySecretWithAI } from './aiVerifier';
import { DetectedCandidate, scanFileContent } from './detector';
import { evaluateRisk } from './riskEngine';

const execAsync = promisify(exec);

export interface ScanOptions {
  repoPath: string;
  scanId: string;
  repoName: string;
  onProgress?: (stageId: string, status: 'in_progress' | 'completed' | 'failed', details?: string) => void;
}

interface GitCommitInfo {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  date: string;
  timestamp: number;
  message: string;
}

// Check if directory has a valid git repository
export async function isGitRepository(dirPath: string): Promise<boolean> {
  try {
    const gitDir = path.join(dirPath, '.git');
    if (fs.existsSync(gitDir)) {
      return true;
    }
    const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', { cwd: dirPath });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

// Get list of all commits in reverse chronological order (newest first)
async function getGitCommits(repoPath: string): Promise<GitCommitInfo[]> {
  try {
    const format = '%H|%h|%an|%ae|%aI|%at|%s';
    const { stdout } = await execAsync(`git log --pretty=format:"${format}"`, {
      cwd: repoPath,
      maxBuffer: 20 * 1024 * 1024,
    });

    if (!stdout || stdout.trim().length === 0) {
      return [];
    }

    const lines = stdout.trim().split('\n');
    const commits: GitCommitInfo[] = [];

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 7) {
        commits.push({
          hash: parts[0],
          shortHash: parts[1],
          author: parts[2],
          authorEmail: parts[3],
          date: parts[4],
          timestamp: parseInt(parts[5], 10) * 1000,
          message: parts.slice(6).join('|'),
        });
      }
    }
    return commits;
  } catch (err) {
    console.warn('Could not read git commits:', err);
    return [];
  }
}

// Recursively get all non-binary, non-ignored files in working tree
function getFilesRecursively(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (
      entry.name === '.git' ||
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'build' ||
      entry.name === '.venv' ||
      entry.name === '__pycache__'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, baseDir));
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      // Skip files larger than 2MB or binary extensions
      if (stat.size <= 2 * 1024 * 1024) {
        const ext = path.extname(entry.name).toLowerCase();
        const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib', '.wasm'];
        if (!binaryExts.includes(ext)) {
          results.push(relPath);
        }
      }
    }
  }

  return results;
}

// Scan a repository across files and git history
export async function executeFullRepositoryScan(options: ScanOptions): Promise<{
  scan: Scan;
  findings: Finding[];
  timeline: TimelineEvent[];
}> {
  const startTime = Date.now();
  const { repoPath, scanId, repoName, onProgress } = options;

  const stages: ScanProgressStage[] = [
    { id: '1_init', name: 'Repository unpacked & Git validation', status: 'pending' },
    { id: '2_source', name: 'Current source code scanning', status: 'pending' },
    { id: '3_history', name: 'Git history & commit blame analysis', status: 'pending' },
    { id: '4_secrets', name: 'Secret candidate detection & entropy analysis', status: 'pending' },
    { id: '5_ai', name: 'AI contextual verification & classification', status: 'pending' },
    { id: '6_risk', name: 'Risk scoring & remediation playbook generation', status: 'pending' },
  ];

  const updateStage = (stageId: string, status: 'in_progress' | 'completed' | 'failed', details?: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      stage.status = status;
      stage.details = details;
    }
    if (onProgress) onProgress(stageId, status, details);
  };

  // Stage 1: Validation
  updateStage('1_init', 'in_progress', 'Validating Git repository structure...');
  const isGit = await isGitRepository(repoPath);
  updateStage('1_init', 'completed', isGit ? 'Valid Git repository detected.' : 'Non-git workspace analyzed.');

  // Stage 2: Scan Working Tree
  updateStage('2_source', 'in_progress', 'Scanning current working tree files...');
  const workingFiles = getFilesRecursively(repoPath);
  const headFindingsMap = new Map<string, { candidate: DetectedCandidate; filePath: string }>();

  for (const relFile of workingFiles) {
    try {
      const fullPath = path.join(repoPath, relFile);
      const content = fs.readFileSync(fullPath, 'utf8');
      const detected = scanFileContent(relFile, content);
      for (const d of detected) {
        // key by raw secret + file
        const key = `${d.rawMatched}:::${d.filePath}`;
        headFindingsMap.set(key, { candidate: d, filePath: relFile });
      }
    } catch {
      // Ignore unreadable files safely
    }
  }
  updateStage('2_source', 'completed', `Scanned ${workingFiles.length} files in working tree.`);

  // Stage 3: Git History Crawl
  updateStage('3_history', 'in_progress', 'Crawling Git commit log and historical diffs...');
  let commits: GitCommitInfo[] = [];
  if (isGit) {
    commits = await getGitCommits(repoPath);
  }

  // Map to track all unique secrets detected across history: rawSecret => { candidate, occurrences in commits }
  interface HistoricalSecretTrace {
    candidate: DetectedCandidate;
    firstCommit: GitCommitInfo;
    latestCommit: GitCommitInfo;
    removalCommit?: GitCommitInfo;
    allCommits: GitCommitInfo[];
    isPresentInHead: boolean;
    filePath: string;
    lineNumber: number;
  }

  const secretTraces = new Map<string, HistoricalSecretTrace>();

  // If commits are available, scan diffs or files in each commit (oldest to newest)
  const sortedCommits = [...commits].sort((a, b) => a.timestamp - b.timestamp); // Chronological order

  if (isGit && sortedCommits.length > 0) {
    for (const commit of sortedCommits) {
      try {
        // Get list of changed files in this commit
        const { stdout: diffOutput } = await execAsync(`git show --unified=3 ${commit.hash}`, {
          cwd: repoPath,
          maxBuffer: 15 * 1024 * 1024,
        });

        // Scan the diff output for added AND removed secrets
        const diffLines = diffOutput.split('\n');
        let currentDiffFile = 'unknown';

        for (let idx = 0; idx < diffLines.length; idx++) {
          const line = diffLines[idx];
          if (line.startsWith('+++ b/')) {
            currentDiffFile = line.replace('+++ b/', '').trim();
          } else if (line.startsWith('--- a/') && currentDiffFile === 'unknown') {
            currentDiffFile = line.replace('--- a/', '').trim();
          }

          // Check added lines (+)
          if (line.startsWith('+') && !line.startsWith('+++')) {
            const addedLineContent = line.slice(1);
            const candidates = scanFileContent(currentDiffFile, addedLineContent);

            for (const cand of candidates) {
              const traceKey = `${cand.rawMatched}:::${currentDiffFile}`;
              if (!secretTraces.has(traceKey)) {
                secretTraces.set(traceKey, {
                  candidate: cand,
                  firstCommit: commit,
                  latestCommit: commit,
                  allCommits: [commit],
                  isPresentInHead: false, // will update below
                  filePath: currentDiffFile,
                  lineNumber: cand.lineNumber,
                });
              } else {
                const existing = secretTraces.get(traceKey)!;
                existing.latestCommit = commit;
                if (!existing.allCommits.some((c) => c.hash === commit.hash)) {
                  existing.allCommits.push(commit);
                }
              }
            }
          }

          // Check removed lines (-) to accurately track when a credential was removed from code
          if (line.startsWith('-') && !line.startsWith('---')) {
            const removedLineContent = line.slice(1);
            const candidates = scanFileContent(currentDiffFile, removedLineContent);

            for (const cand of candidates) {
              const traceKey = `${cand.rawMatched}:::${currentDiffFile}`;
              if (secretTraces.has(traceKey)) {
                const existing = secretTraces.get(traceKey)!;
                existing.removalCommit = commit;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Error scanning commit ${commit.shortHash}:`, err);
      }
    }
  }

  // Merge Head findings into secretTraces
  for (const [key, { candidate, filePath }] of headFindingsMap.entries()) {
    if (secretTraces.has(key)) {
      const trace = secretTraces.get(key)!;
      trace.isPresentInHead = true;
      trace.candidate = candidate; // use latest context
    } else {
      // Secret in HEAD that may not have commit history (or non-git)
      const defaultCommit: GitCommitInfo =
        commits.length > 0
          ? commits[0]
          : {
              hash: 'uncommitted-working-tree',
              shortHash: 'HEAD',
              author: 'Working Tree',
              authorEmail: 'dev@local',
              date: new Date().toISOString(),
              timestamp: Date.now(),
              message: 'Current Working Tree (Uncommitted / Local File)',
            };

      secretTraces.set(key, {
        candidate,
        firstCommit: defaultCommit,
        latestCommit: defaultCommit,
        allCommits: [defaultCommit],
        isPresentInHead: true,
        filePath,
        lineNumber: candidate.lineNumber,
      });
    }
  }

  updateStage('3_history', 'completed', `Analyzed ${commits.length} historical commits.`);

  // Stage 4: Secret candidates detection summary
  updateStage('4_secrets', 'in_progress', `Evaluating ${secretTraces.size} secret candidates...`);
  updateStage('4_secrets', 'completed', `Identified ${secretTraces.size} candidate secrets with entropy scoring.`);

  // Stage 5 & 6: AI Verification & Risk Scoring
  updateStage('5_ai', 'in_progress', 'Running AI / Local contextual verification...');
  const now = Date.now();
  const traceEntries = Array.from(secretTraces.entries());

  const findings: Finding[] = await Promise.all(
    traceEntries.map(async ([, trace], index) => {
      const cand = trace.candidate;

      // Calculate exposure days
      const firstTimestamp = trace.firstCommit.timestamp || now;
      const exposureMs = Math.max(0, now - firstTimestamp);
      const exposureDays = Math.max(1, Math.round(exposureMs / (1000 * 60 * 60 * 24)));
      const exposureDurationStr = trace.isPresentInHead
        ? `${exposureDays} days (Active in HEAD)`
        : `${exposureDays} days (Purged in HEAD, alive in history)`;

      // AI / Local Context Verification
      const verification = await verifySecretWithAI({
        secretType: cand.secretType,
        maskedSecret: cand.maskedSecret,
        variableName: cand.variableName,
        filePath: trace.filePath,
        lineNumber: cand.lineNumber,
        maskedContext: cand.surroundingContext,
        entropyScore: cand.entropyScore,
      });

      // Risk Scoring
      const risk = evaluateRisk({
        secretType: cand.secretType,
        sensitivityWeight: cand.sensitivityWeight,
        exposureDays,
        isPresentInHead: trace.isPresentInHead,
        aiClassification: verification.classification,
        aiConfidence: verification.confidence,
        entropyScore: cand.entropyScore,
        commitsCount: trace.allCommits.length,
      });

      const findingId = `cs-${scanId.slice(0, 6)}-${String(index + 1).padStart(3, '0')}`;

      const isGhost = !trace.isPresentInHead && trace.allCommits.length > 0;
      const wasRemovedAndReadded = trace.isPresentInHead && trace.removalCommit !== undefined;
      const gitClassification: 'ACTIVE SECRET' | 'HISTORICAL SECRET' | 'GHOST SECRET' | 'REINTRODUCED SECRET' =
        wasRemovedAndReadded
          ? 'REINTRODUCED SECRET'
          : isGhost
          ? 'GHOST SECRET'
          : trace.isPresentInHead
          ? 'ACTIVE SECRET'
          : 'HISTORICAL SECRET';

      const hashDigest = crypto.createHash('sha256').update(cand.rawMatched).digest('hex').substring(0, 16).toUpperCase();
      const fingerprint = `FPR-${hashDigest}`;

      const removedDate = trace.removalCommit ? trace.removalCommit.date : (!trace.isPresentInHead ? (trace.latestCommit ? trace.latestCommit.date : new Date().toISOString()) : undefined);
      const removedCommitHash = trace.removalCommit ? trace.removalCommit.hash : (!trace.isPresentInHead ? (trace.latestCommit ? trace.latestCommit.hash : 'HEAD') : undefined);

      const ghostGuidance = isGhost ? {
        rotateRevoke: `Immediately rotate and revoke this ${cand.secretType} in your cloud/service provider console. Even though removed from current HEAD code, previously exposed credentials must be treated as permanently compromised.`,
        investigateAuditLogs: `Inspect audit logs and access history between ${new Date(trace.firstCommit.date).toLocaleDateString()} and ${removedDate ? new Date(removedDate).toLocaleDateString() : 'present'} for suspicious queries or unauthorized access.`,
        purgeGitHistory: `Purge the secret blob object from Git history using git-filter-repo or BFG Repo Cleaner, then force-push to all remotes and notify your team to re-clone.`,
        secretsManagerGuidance: `Migrate all credentials to a centralized secrets manager (e.g. AWS Secrets Manager, HashiCorp Vault, Azure Key Vault, or Doppler) and inject via environment variables.`,
        rescanStep: `Perform a full historical DAG rescan with CredSense AI to verify zero residual blob references remain in any reachable commit branch.`,
        gitFilterRepoCommand: `git filter-repo --replace-text <(echo "${cand.maskedSecret}==>[REDACTED]") --force`,
        bfgRepoCleanerCommand: `bfg --replace-text <(echo "${cand.maskedSecret}") my-repo.git && git reflog expire --expire=now --all && git gc --prune=now --aggressive`,
      } : undefined;

      return {
        id: findingId,
        scanId,
        secretType: cand.secretType,
        detector: cand.detector,
        filePath: trace.filePath,
        lineNumber: cand.lineNumber,
        commitId: trace.firstCommit.hash,
        shortCommitId: trace.firstCommit.shortHash,
        commitMessage: trace.firstCommit.message,
        author: trace.firstCommit.author,
        detectedAt: new Date().toISOString(),
        exposureStart: trace.firstCommit.date,
        exposureDuration: exposureDurationStr,
        exposureDays,
        entropyScore: cand.entropyScore,
        confidence: cand.baseConfidence,
        verificationStatus: verification.classification,
        verificationReason: verification.reason,
        verificationConfidence: verification.confidence,
        verificationMode: verification.mode,
        contextAnalysis: verification.contextAnalysis,
        detectionMethod: verification.detectionMethod,
        riskScore: risk.riskScore,
        severity: risk.severity,
        riskExplanation: risk.riskExplanation,
        riskContributors: risk.riskContributors,
        recommendedAction: verification.recommendedAction || risk.recommendedAction,
        remediationSteps: risk.remediationSteps,
        maskedSecret: cand.maskedSecret,
        isHistoricalOnly: !trace.isPresentInHead,
        surroundingContext: cand.surroundingContext,
        rawSecretLength: cand.rawMatched.length,
        // Git History Intelligence & Ghost Secrets
        gitClassification,
        isGhostSecret: isGhost,
        headStatus: trace.isPresentInHead ? ('EXPOSED' as const) : ('CLEAN' as const),
        gitHistoryStatus: 'EXPOSED' as const,
        fingerprint,
        firstExposureDate: trace.firstCommit.date,
        firstExposureCommit: trace.firstCommit.hash,
        firstExposureAuthor: trace.firstCommit.author,
        lastExposureCommit: trace.latestCommit ? trace.latestCommit.hash : trace.firstCommit.hash,
        lastExposureDate: trace.latestCommit ? trace.latestCommit.date : trace.firstCommit.date,
        removedFromHeadDate: removedDate,
        removedFromHeadCommit: removedCommitHash,
        exposureDurationDays: exposureDays,
        ghostRemediationGuidance: ghostGuidance,
      };
    })
  );

  updateStage('5_ai', 'completed', 'AI & Contextual classification complete.');
  updateStage('6_risk', 'in_progress', 'Computing multi-factor risk scores and remediation steps...');
  updateStage('6_risk', 'completed', 'Risk scoring and remediation playbooks generated.');

  // Build timeline events
  const timeline: TimelineEvent[] = [];
  for (const commit of commits) {
    const exposedInThisCommit = findings.filter((f) => f.commitId === commit.hash);
    if (exposedInThisCommit.length > 0) {
      timeline.push({
        commitId: commit.hash,
        shortCommitId: commit.shortHash,
        date: commit.date,
        author: commit.author,
        message: commit.message,
        exposedSecrets: exposedInThisCommit.map((f) => ({
          findingId: f.id,
          secretType: f.secretType,
          maskedSecret: f.maskedSecret,
          filePath: f.filePath,
          action: 'introduced',
          severity: f.severity,
        })),
      });
    }
  }

  // Count metrics
  const findingsCount = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === 'CRITICAL').length,
    high: findings.filter((f) => f.severity === 'HIGH').length,
    medium: findings.filter((f) => f.severity === 'MEDIUM').length,
    low: findings.filter((f) => f.severity === 'LOW').length,
    falsePositive: findings.filter((f) => f.verificationStatus === 'FALSE_POSITIVE').length,
    verifiedReal: findings.filter((f) => f.verificationStatus === 'REAL').length,
    testExample: findings.filter((f) => f.verificationStatus === 'TEST' || f.verificationStatus === 'EXAMPLE').length,
    historicalOnly: findings.filter((f) => f.isHistoricalOnly).length,
  };

  const scan: Scan = {
    id: scanId,
    repoName,
    isGitRepo: isGit,
    totalCommitsScanned: commits.length,
    totalFilesScanned: workingFiles.length,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    status: 'completed',
    stages,
    findingsCount,
  };

  return { scan, findings, timeline };
}
