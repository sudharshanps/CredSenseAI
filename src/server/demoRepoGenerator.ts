/**
 * CredSense AI - Demo Repository Generator
 * Generates an on-demand Git repository with real commit history and safe demo credentials.
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function createDemoGitRepository(): Promise<{ repoPath: string; repoName: string }> {
  const repoName = 'credsense-demo-repository';
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'credsense-demo-'));

  try {
    // 1. Git Init
    await execAsync('git init -b main', { cwd: tempDir });
    await execAsync('git config user.name "Alex SecurityDev"', { cwd: tempDir });
    await execAsync('git config user.email "alex.dev@example-org.internal"', { cwd: tempDir });

    // Helper to commit
    const commitWithDate = async (message: string, daysAgo: number) => {
      const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      await execAsync('git add .', { cwd: tempDir });
      await execAsync(`git commit -m "${message}" --date="${date}"`, {
        cwd: tempDir,
        env: {
          ...process.env,
          GIT_AUTHOR_DATE: date,
          GIT_COMMITTER_DATE: date,
        },
      });
    };

    // Commit 1: Initial project baseline
    fs.mkdirSync(path.join(tempDir, 'config'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'README.md'),
      `# CredSense Cloud Microservices Demo\n\nDemo repository containing simulated configurations and test suites.\n`
    );
    fs.writeFileSync(
      path.join(tempDir, '.env.example'),
      `# Environment Configuration Template (Demo)\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nPORT=8080\nNODE_ENV=development\n`
    );
    fs.writeFileSync(
      path.join(tempDir, 'config/settings.py'),
      `# Core Application Settings\nimport os\n\n# SAFE DEMO AWS CREDENTIAL\nAWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"\nAWS_REGION = "us-east-1"\n`
    );
    await commitWithDate('Initial commit: project structure and baseline settings', 24);

    // Commit 2: Added Auth Service with GitHub Token & Stripe Key, plus Deploy Helper
    fs.mkdirSync(path.join(tempDir, 'src/services'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'scripts'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'src/services/authService.js'),
      `/**\n * Authentication & OAuth Dispatcher\n */\n// DEMO SECRET - DO NOT USE IN PROD\nconst GITHUB_ACCESS_TOKEN = "ghp_DEMO_EXAMPLE_NOT_REAL_9876543210AB";\n\nexport function verifyUserSession(token) {\n  return token && token.startsWith('demo_');\n}\n`
    );
    fs.writeFileSync(
      path.join(tempDir, 'src/services/billingService.ts'),
      `// Payment Gateway Integration\nexport const STRIPE_KEY = "sk_test_demo51NqZ1234567890ABCDEF";\nexport function processInvoice(amount: number) {\n  console.log("Processing demo charge:", amount);\n}\n`
    );
    fs.writeFileSync(
      path.join(tempDir, 'scripts/deploy_helper.sh'),
      `#!/bin/bash\n# CI deployment helper with legacy root credentials (simulated demo)\nexport aws_secret_access_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"\necho "Deploying stack..."\n`
    );
    await commitWithDate('feat(auth): integrate GitHub OAuth, Stripe test billing, and deploy helper', 18);

    // Commit 3: Hotfix - Removed GitHub token from authService.js, deleted deploy_helper.sh, added DB connection
    fs.writeFileSync(
      path.join(tempDir, 'src/services/authService.js'),
      `/**\n * Authentication & OAuth Dispatcher (Updated)\n */\nconst GITHUB_ACCESS_TOKEN = process.env.GITHUB_TOKEN || '';\n\nexport function verifyUserSession(token) {\n  return token && token.startsWith('demo_');\n}\n`
    );
    // Delete legacy deploy script (demonstrates ghost secret in deleted file!)
    if (fs.existsSync(path.join(tempDir, 'scripts/deploy_helper.sh'))) {
      fs.unlinkSync(path.join(tempDir, 'scripts/deploy_helper.sh'));
    }
    fs.writeFileSync(
      path.join(tempDir, 'src/services/database.ts'),
      `// Database Connection Pool\nexport const DATABASE_URL = "postgres://dbadmin:demo_password_only@prod-cluster.internal:5432/credsense_prod";\nexport const POOL_SIZE = 10;\n`
    );
    await commitWithDate('hotfix(security): remove hardcoded github token and purge deploy script; configure db pool', 9);

    // Commit 4: Added Test Suite with JWT token and mock fixtures
    fs.mkdirSync(path.join(tempDir, 'tests/fixtures'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'tests/test_auth_tokens.py'),
      `# Unit test token verification\nimport unittest\n\n# SAFE TEST JWT PAYLOAD\nTEST_MOCK_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRlbW8gVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.demo_signature_payload_only"\n\nclass TestAuth(unittest.TestCase):\n    def test_jwt_decode(self):\n        self.assertTrue(len(TEST_MOCK_JWT) > 20)\n`
    );
    fs.writeFileSync(
      path.join(tempDir, 'tests/fixtures/dummy_placeholders.json'),
      `{\n  "demo_password": "demo_password_only",\n  "api_dummy_key": "demo_test_api_key_123456"\n}\n`
    );
    await commitWithDate('test: add token validation unit tests and synthetic fixture mocks', 2);

    return { repoPath: tempDir, repoName };
  } catch (error) {
    console.error('Failed to create demo repository:', error);
    return { repoPath: tempDir, repoName };
  }
}
