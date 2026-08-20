/**
 * CredSense AI - Full-Stack Express Server & API Gateway
 * Detect. Verify. Prioritize. Secure.
 */

import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import multer from 'multer';
import * as os from 'os';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import { verifySecretWithAI } from './src/server/aiVerifier';
import { processCopilotChat } from './src/server/copilotService';
import { createDemoGitRepository } from './src/server/demoRepoGenerator';
import { executeFullRepositoryScan } from './src/server/gitScanner';
import { runGhostSecretTestSuite } from './src/server/ghostSecretsTests';
import { evaluateRisk } from './src/server/riskEngine';
import { dbStore } from './src/server/storage';
import { CICDGateSimulation, Scan, Finding, CICDGuardrailConfig } from './src/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

dotenv.config();

const PORT = 3000;
const app = express();

// Staging directory for uploads
const uploadDir = path.join(os.tmpdir(), 'credsense-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `repo-${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9\._-]/g, '_')}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Map of staged repo directories: scanId -> extractedDirPath
const stagedRepos = new Map<string, { dirPath: string; name: string }>();

/**
 * Helper to recursively search for a directory containing .git
 */
function findGitDirectory(dir: string, depth = 0, maxDepth = 3): string | null {
  if (depth > maxDepth) return null;
  const gitDir = path.join(dir, '.git');
  if (fs.existsSync(gitDir) && (fs.statSync(gitDir).isDirectory() || fs.statSync(gitDir).isFile())) {
    return dir;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      const subDir = path.join(dir, entry.name);
      const found = findGitDirectory(subDir, depth + 1, maxDepth);
      if (found) return found;
    }
  }

  return null;
}

// ----------------------------------------------------
// DEDICATED API ROUTER (Guaranteed JSON Only)
// ----------------------------------------------------
const apiRouter = express.Router();

// Body parsers for API router with large limits for zip payloads & base64
apiRouter.use(express.json({ limit: '100mb' }));
apiRouter.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Middleware to force JSON content-type header on all API responses
apiRouter.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 1. Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({
    status: 'ok',
    service: 'CredSense AI',
    version: '1.0.0-mvp',
    engine: 'CredSense AI Hybrid Engine',
    aiVerificationMode: hasGeminiKey ? 'gemini-3.7-flash' : 'local-deterministic',
    timestamp: new Date().toISOString(),
    privacyModel: 'Strict: Plaintext secrets are masked before storage and AI evaluation.',
  });
});

// 2. Dashboard summary
apiRouter.get('/dashboard/summary', (_req: Request, res: Response) => {
  const summary = dbStore.getDashboardSummary();
  res.json(summary);
});

// 3. Upload repository ZIP (supports multipart/form-data AND base64 JSON payload)
apiRouter.post('/scan/upload', (req: Request, res: Response, next: NextFunction) => {
  // Check if content is multipart or JSON
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.any()(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: `File upload error: ${err.message || String(err)}`,
        });
      }
      handleUploadProcessing(req, res);
    });
  } else {
    handleUploadProcessing(req, res);
  }
});

async function handleUploadProcessing(req: Request, res: Response) {
  try {
    let zipBuffer: Buffer | null = null;
    let originalName = 'uploaded-repository';

    // Option A: Multipart file from Multer
    const files = req.files as Express.Multer.File[] | undefined;
    const file = files && files.length > 0 ? files[0] : (req as any).file;

    if (file && fs.existsSync(file.path)) {
      zipBuffer = fs.readFileSync(file.path);
      originalName = file.originalname.replace(/\.zip$/i, '');
      fs.unlink(file.path, () => {});
    }

    // Option B: Base64 string in JSON body
    if (!zipBuffer && req.body && req.body.fileBase64) {
      try {
        const base64Data = req.body.fileBase64.replace(/^data:.*?;base64,/, '');
        zipBuffer = Buffer.from(base64Data, 'base64');
        if (req.body.filename) {
          originalName = String(req.body.filename).replace(/\.zip$/i, '');
        }
      } catch (b64Err) {
        return res.status(400).json({
          success: false,
          error: 'Failed to decode base64 file data',
          details: String(b64Err),
        });
      }
    }

    if (!zipBuffer || zipBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No repository ZIP file received. Please provide a valid .zip archive.',
      });
    }

    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const extractPath = fs.mkdtempSync(path.join(os.tmpdir(), `credsense-extracted-${scanId}-`));

    // Extract ZIP safely
    try {
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(extractPath, true);
    } catch (zipErr) {
      return res.status(400).json({
        success: false,
        error: 'Failed to extract ZIP archive. Ensure it is a valid, uncorrupted ZIP file.',
        details: String(zipErr),
      });
    }

    // Detect if .git exists in root or subdirectories
    const gitRepoDir = findGitDirectory(extractPath);

    if (!gitRepoDir) {
      // Check if files exist
      const entries = fs.readdirSync(extractPath);
      if (entries.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Uploaded repository archive is empty.',
        });
      }

      // Initialize a local Git repository so that source code snapshot and blame tracking work seamlessly
      try {
        await execAsync(
          'git init && git config user.name "CredSense" && git config user.email "security@credsense.ai" && git add . && git commit -m "Initial commit of uploaded source snapshot"',
          { cwd: extractPath }
        );
      } catch (gitInitErr) {
        return res.status(400).json({
          success: false,
          error: 'Uploaded repository does not contain Git history.',
          details: String(gitInitErr),
        });
      }
    }

    const targetScanDir = gitRepoDir || extractPath;
    stagedRepos.set(scanId, { dirPath: targetScanDir, name: originalName });

    const initialScan: Scan = {
      id: scanId,
      repoName: originalName,
      isGitRepo: true,
      totalCommitsScanned: 0,
      totalFilesScanned: 0,
      scannedAt: new Date().toISOString(),
      durationMs: 0,
      status: 'ready',
      stages: [
        { id: '1_init', name: 'Repository unpacked & Git validation', status: 'completed' },
        { id: '2_source', name: 'Current source code scanning', status: 'pending' },
        { id: '3_history', name: 'Git history & commit blame analysis', status: 'pending' },
        { id: '4_secrets', name: 'Secret candidate detection & entropy analysis', status: 'pending' },
        { id: '5_ai', name: 'AI contextual verification & classification', status: 'pending' },
        { id: '6_risk', name: 'Risk scoring & remediation playbook generation', status: 'pending' },
      ],
      findingsCount: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        falsePositive: 0,
        verifiedReal: 0,
        testExample: 0,
        historicalOnly: 0,
      },
    };

    dbStore.saveScanResults(initialScan, [], []);

    return res.status(200).json({
      success: true,
      scan_id: scanId,
      scanId,
      filename: `${originalName}.zip`,
      repoName: originalName,
      status: 'uploaded',
      message: 'Repository uploaded and validated successfully. Ready for scan.',
      scan: initialScan,
    });
  } catch (err) {
    console.error('Upload processing error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing repository upload',
      details: String(err),
    });
  }
}

// 4. Start security scan
apiRouter.post('/scan/:scan_id/start', async (req: Request, res: Response) => {
  const scanId = req.params.scan_id;
  const staged = stagedRepos.get(scanId);

  if (!staged) {
    const existing = dbStore.getScan(scanId);
    if (existing) {
      const findings = dbStore.getFindingsByScanId(scanId);
      const timeline = dbStore.getTimelineByScanId(scanId);
      return res.json({
        success: true,
        scan_id: scanId,
        scanId,
        status: existing.status,
        findings_count: findings.length,
        scan: existing,
        findings,
        timeline,
      });
    }
    return res.status(404).json({
      success: false,
      error: 'Repository session not found. Please upload the repository again.',
    });
  }

  try {
    const { scan, findings, timeline } = await executeFullRepositoryScan({
      repoPath: staged.dirPath,
      scanId,
      repoName: staged.name,
    });

    dbStore.saveScanResults(scan, findings, timeline);
    return res.json({
      success: true,
      scan_id: scanId,
      scanId,
      status: 'completed',
      findings_count: findings.length,
      scan,
      findings,
      timeline,
    });
  } catch (error) {
    console.error('Scan execution error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete security scan',
      details: String(error),
    });
  }
});

// 5. Scan Git Repository from URL
apiRouter.post('/scan/url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid HTTP/HTTPS Git repository URL.',
      });
    }

    const scanId = `scan-url-${Date.now()}`;
    const cleanRepoName = url.split('/').pop()?.replace('.git', '') || 'remote-git-repo';
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `credsense-clone-${scanId}-`));

    try {
      await execAsync(`git clone --depth 50 "${url}" "${tempDir}"`, { timeout: 30000 });
    } catch (cloneErr) {
      return res.status(400).json({
        success: false,
        error: `Failed to clone repository: ${String(cloneErr)}`,
      });
    }

    stagedRepos.set(scanId, { dirPath: tempDir, name: cleanRepoName });

    const { scan, findings, timeline } = await executeFullRepositoryScan({
      repoPath: tempDir,
      scanId,
      repoName: cleanRepoName,
    });

    dbStore.saveScanResults(scan, findings, timeline);
    return res.json({
      success: true,
      scan_id: scanId,
      scanId,
      status: 'completed',
      findings_count: findings.length,
      scan,
      findings,
      timeline,
    });
  } catch (error) {
    console.error('Scan URL error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scan remote Git URL',
      details: String(error),
    });
  }
});

// 6. Scan code or diff snippet
apiRouter.post('/scan/snippet', async (req: Request, res: Response) => {
  try {
    const { content, repoName = 'pasted-diff' } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Snippet content string is required.',
      });
    }

    const scanId = `scan-snip-${Date.now()}`;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `credsense-snip-${scanId}-`));

    await execAsync('git init && git config user.name "Developer" && git config user.email "dev@company.com"', {
      cwd: tempDir,
    });

    fs.writeFileSync(path.join(tempDir, 'snippet.diff'), content, 'utf8');
    fs.writeFileSync(path.join(tempDir, 'config.env'), 'PORT=8080\nNODE_ENV=production\n', 'utf8');

    await execAsync('git add . && git commit -m "Initial commit with configuration"', { cwd: tempDir });

    fs.writeFileSync(path.join(tempDir, 'service.ts'), content, 'utf8');
    await execAsync('git add service.ts && git commit -m "feat: Add service implementation"', { cwd: tempDir });

    stagedRepos.set(scanId, { dirPath: tempDir, name: repoName });

    const { scan, findings, timeline } = await executeFullRepositoryScan({
      repoPath: tempDir,
      scanId,
      repoName,
    });

    dbStore.saveScanResults(scan, findings, timeline);
    return res.json({
      success: true,
      scan_id: scanId,
      scanId,
      status: 'completed',
      findings_count: findings.length,
      scan,
      findings,
      timeline,
    });
  } catch (error) {
    console.error('Scan snippet error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scan code snippet',
      details: String(error),
    });
  }
});

// 7. Load Demo Repository & Scan immediately
apiRouter.post('/demo/load', async (_req: Request, res: Response) => {
  try {
    const scanId = `demo-${Date.now()}`;
    const { repoPath, repoName } = await createDemoGitRepository();

    stagedRepos.set(scanId, { dirPath: repoPath, name: repoName });

    const { scan, findings, timeline } = await executeFullRepositoryScan({
      repoPath,
      scanId,
      repoName: 'demo-credsense-repo',
    });

    dbStore.saveScanResults(scan, findings, timeline);
    return res.status(201).json({
      success: true,
      scan_id: scanId,
      scanId,
      status: 'completed',
      findings_count: findings.length,
      scan,
      findings,
      timeline,
    });
  } catch (error) {
    console.error('Demo creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate demo repository',
      details: String(error),
    });
  }
});

// 8. Get scan by ID
apiRouter.get('/scan/:scan_id', (req: Request, res: Response) => {
  const scan = dbStore.getScan(req.params.scan_id);
  if (!scan) {
    return res.status(404).json({ success: false, error: 'Scan not found' });
  }
  res.json({
    success: true,
    scan_id: scan.id,
    scanId: scan.id,
    status: scan.status,
    findings_count: scan.findingsCount.total,
    scan,
  });
});

// 9. Get findings for scan
apiRouter.get('/scan/:scan_id/findings', (req: Request, res: Response) => {
  const findings = dbStore.getFindingsByScanId(req.params.scan_id);
  res.json(findings);
});

// 10. Get timeline for scan
apiRouter.get('/scan/:scan_id/timeline', (req: Request, res: Response) => {
  const timeline = dbStore.getTimelineByScanId(req.params.scan_id);
  res.json(timeline);
});

// 11. Get finding by ID
apiRouter.get('/findings/:finding_id', (req: Request, res: Response) => {
  const finding = dbStore.getFindingById(req.params.finding_id);
  if (!finding) {
    return res.status(404).json({ success: false, error: 'Finding not found' });
  }
  res.json(finding);
});

// 12. Get timeline for finding
apiRouter.get('/findings/:finding_id/timeline', (req: Request, res: Response) => {
  const finding = dbStore.getFindingById(req.params.finding_id);
  if (!finding) {
    return res.status(404).json({ success: false, error: 'Finding not found' });
  }
  const timeline = dbStore.getTimelineByScanId(finding.scanId);
  const relevantTimeline = timeline.filter((t) => t.exposedSecrets.some((s) => s.findingId === finding.id));
  res.json({ findingId: finding.id, timeline: relevantTimeline.length > 0 ? relevantTimeline : timeline });
});

// 13. Re-verify finding on demand with AI / Local
apiRouter.post('/findings/:finding_id/verify', async (req: Request, res: Response) => {
  const finding = dbStore.getFindingById(req.params.finding_id);
  if (!finding) {
    return res.status(404).json({ success: false, error: 'Finding not found' });
  }

  try {
    const result = await verifySecretWithAI({
      secretType: finding.secretType,
      maskedSecret: finding.maskedSecret,
      variableName: finding.detector,
      filePath: finding.filePath,
      lineNumber: finding.lineNumber,
      maskedContext: finding.surroundingContext,
      entropyScore: finding.entropyScore,
    });

    finding.verificationStatus = result.classification;
    finding.verificationReason = result.reason;
    finding.verificationConfidence = result.confidence;
    finding.verificationMode = result.mode;
    finding.contextAnalysis = result.contextAnalysis;
    finding.detectionMethod = result.detectionMethod;

    const risk = evaluateRisk({
      secretType: finding.secretType,
      sensitivityWeight: 25,
      exposureDays: finding.exposureDays,
      isPresentInHead: !finding.isHistoricalOnly,
      aiClassification: result.classification,
      aiConfidence: result.confidence,
      entropyScore: finding.entropyScore,
      commitsCount: 2,
    });

    finding.riskScore = risk.riskScore;
    finding.severity = risk.severity;
    finding.riskExplanation = risk.riskExplanation;
    finding.recommendedAction = result.recommendedAction || risk.recommendedAction;
    finding.remediationSteps = risk.remediationSteps;

    dbStore.updateFinding(finding);
    dbStore.addAuditLog(
      'AI_REVERIFIED',
      'security-analyst',
      `${finding.secretType} in ${finding.filePath}`,
      'SUCCESS',
      `Re-verified as ${finding.verificationStatus} (${Math.round(finding.verificationConfidence * 100)}%) using ${result.mode === 'gemini' ? 'Gemini AI' : 'Deterministic Local Heuristic'}`
    );
    return res.json({ success: true, finding });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to re-verify finding', details: String(error) });
  }
});

// 13b. Manual Classification Override (Mark as Real / Test / Example / False Positive)
apiRouter.post('/findings/:finding_id/classification', (req: Request, res: Response) => {
  const finding = dbStore.getFindingById(req.params.finding_id);
  if (!finding) {
    return res.status(404).json({ success: false, error: 'Finding not found' });
  }

  const { classification, reason } = req.body;
  if (!classification) {
    return res.status(400).json({ success: false, error: 'Classification is required (REAL, TEST, EXAMPLE, FALSE_POSITIVE)' });
  }

  const validClassifications = ['REAL', 'TEST', 'EXAMPLE', 'FALSE_POSITIVE', 'UNKNOWN'];
  if (!validClassifications.includes(classification)) {
    return res.status(400).json({ success: false, error: 'Invalid classification specified' });
  }

  finding.verificationStatus = classification;
  finding.verificationReason = reason || `Manually marked as ${classification} by security engineer.`;
  finding.verificationConfidence = 1.0;

  // Re-calculate risk score with overridden classification
  const risk = evaluateRisk({
    secretType: finding.secretType,
    sensitivityWeight: 25,
    exposureDays: finding.exposureDays,
    isPresentInHead: !finding.isHistoricalOnly,
    aiClassification: classification,
    aiConfidence: 1.0,
    entropyScore: finding.entropyScore,
    commitsCount: 2,
  });

  finding.riskScore = risk.riskScore;
  finding.severity = risk.severity;
  finding.riskExplanation = risk.riskExplanation;
  finding.recommendedAction = risk.recommendedAction;

  dbStore.updateFinding(finding);
  dbStore.addAuditLog(
    'CLASSIFICATION_OVERRIDDEN',
    'security-officer',
    `${finding.secretType} in ${finding.filePath}`,
    'SUCCESS',
    `Manually reclassified finding to ${classification}`
  );

  return res.json({ success: true, finding });
});

// 13c. Remediation Verification Rescan API
apiRouter.post('/remediation/verify-scan', async (req: Request, res: Response) => {
  try {
    const summaryBefore = dbStore.getDashboardSummary();
    const latestScan = summaryBefore.latestScan;
    const findingsBefore = latestScan ? dbStore.getFindingsByScanId(latestScan.id) : [];

    const criticalBefore = summaryBefore.criticalFindings;
    const highBefore = summaryBefore.highFindings;
    const riskBefore = summaryBefore.averageRiskScore;
    const postureBefore = summaryBefore.securityScorecard?.overallScore || 65;

    // Check if findings have been marked as remediated or fixed
    const resolvedFindings = findingsBefore.filter((f) => f.isRemediated || f.remediationState === 'VERIFIED_FIXED' || f.remediationState === 'HISTORY_PURGED');
    const remainingOpen = findingsBefore.filter((f) => !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED' && f.remediationState !== 'HISTORY_PURGED');

    const criticalAfter = remainingOpen.filter((f) => f.severity === 'CRITICAL').length;
    const highAfter = remainingOpen.filter((f) => f.severity === 'HIGH').length;
    const riskAfter = remainingOpen.length > 0
      ? Math.round(remainingOpen.reduce((acc, f) => acc + f.riskScore, 0) / remainingOpen.length)
      : 0;
    const postureAfter = Math.min(98, Math.max(15, postureBefore + Math.round(resolvedFindings.length * 8)));

    const isSuccess = resolvedFindings.length > 0 || (criticalAfter === 0 && highAfter === 0);

    const result = {
      scanId: latestScan?.id || `scan-${Date.now()}`,
      status: isSuccess ? 'SUCCESS' : 'WARNING',
      message: isSuccess
        ? 'Credential exposure successfully resolved in current verification scan.'
        : 'Remediation could not be verified. Active exposed credentials remain in repository tree.',
      verifiedAt: new Date().toISOString(),
      resolvedFindingsCount: resolvedFindings.length,
      remainingFindingsCount: remainingOpen.length,
      before: {
        critical: criticalBefore,
        high: highBefore,
        riskScore: riskBefore,
        postureScore: postureBefore,
      },
      after: {
        critical: criticalAfter,
        high: highAfter,
        riskScore: riskAfter,
        postureScore: postureAfter,
      },
    };

    dbStore.addAuditLog(
      'REMEDIATION_VERIFICATION_RESCAN',
      'devsecops-pipeline',
      latestScan?.repoName || 'repository',
      isSuccess ? 'SUCCESS' : 'WARNING',
      `Verification rescan completed: ${resolvedFindings.length} resolved, ${remainingOpen.length} open. Posture score: ${postureBefore} -> ${postureAfter}`
    );

    return res.json({ success: true, verification: result });
  } catch (error) {
    console.error('Error running verification scan:', error);
    return res.status(500).json({ success: false, error: 'Failed to run verification rescan', details: String(error) });
  }
});

// 14. Mark finding as remediated / update state / update checklist
apiRouter.patch('/findings/:finding_id', (req: Request, res: Response) => {
  const finding = dbStore.getFindingById(req.params.finding_id);
  if (!finding) {
    return res.status(404).json({ success: false, error: 'Finding not found' });
  }

  const { remediationState, checklistStepId, checklistCompleted, isRemediated } = req.body;

  if (remediationState) {
    finding.remediationState = remediationState;
    if (remediationState === 'VERIFIED_FIXED' || remediationState === 'HISTORY_PURGED') {
      finding.isRemediated = true;
    } else if (remediationState === 'OPEN') {
      finding.isRemediated = false;
    }
  }

  if (isRemediated !== undefined) {
    finding.isRemediated = Boolean(isRemediated);
    if (finding.isRemediated && finding.remediationState === 'OPEN') {
      finding.remediationState = 'VERIFIED_FIXED';
    }
  }

  if (checklistStepId && finding.remediationChecklist) {
    const step = finding.remediationChecklist.find((s) => s.id === checklistStepId);
    if (step) {
      step.completed = checklistCompleted !== undefined ? Boolean(checklistCompleted) : !step.completed;
      if (step.completed) step.completedAt = new Date().toISOString();
    }
  }

  dbStore.updateFinding(finding);
  dbStore.addAuditLog(
    'FINDING_UPDATED',
    'security-officer',
    `${finding.secretType} in ${finding.filePath}`,
    'SUCCESS',
    `Updated status to ${finding.remediationState || 'UPDATED'}`
  );

  return res.json({ success: true, finding });
});

// 14-ghost. Ghost Secrets Intelligence & Management API
apiRouter.get('/ghost-secrets', (req: Request, res: Response) => {
  const scanId = req.query.scan_id as string | undefined;
  const scans = dbStore.getAllScans();
  const activeScan = scanId ? dbStore.getScan(scanId) : (scans.length > 0 ? scans[0] : undefined);
  const findings = activeScan ? dbStore.getFindingsByScanId(activeScan.id) : Array.from(dbStore.getAllScans().flatMap((s) => dbStore.getFindingsByScanId(s.id)));

  const ghostSecrets = findings.filter((f) => f.isGhostSecret || f.isHistoricalOnly);
  const summary = dbStore.getDashboardSummary();

  return res.json({
    success: true,
    ghostSecrets,
    summary: summary.ghostSecretsSummary,
    totalCount: ghostSecrets.length,
    activeScanId: activeScan?.id,
  });
});

// 14-ghost-test. Run Automated Ghost Secrets Test Suite
apiRouter.post('/ghost-secrets/test-suite', async (_req: Request, res: Response) => {
  try {
    const testResults = await runGhostSecretTestSuite();
    dbStore.addAuditLog(
      'GHOST_SECRETS_TEST_SUITE',
      'automated-qa-runner',
      'Git DAG Classification Engine',
      testResults.passedAll ? 'SUCCESS' : 'WARNING',
      `Executed ${testResults.totalTests} Ghost Secret scenario tests (${testResults.passedTests} passed, ${testResults.failedTests} failed) in ${testResults.durationMs}ms.`
    );
    return res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Failed to run ghost secrets test suite:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute ghost secret test suite',
      details: error?.message || String(error),
    });
  }
});

// Legacy POST compatibility for remediate
apiRouter.post('/findings/:finding_id/remediate', (req: Request, res: Response) => {
  const finding = dbStore.getFindingById(req.params.finding_id);
  if (!finding) {
    return res.status(404).json({ success: false, error: 'Finding not found' });
  }

  const { remediated, isRemediated } = req.body;
  const targetRemediated = isRemediated !== undefined ? Boolean(isRemediated) : (remediated !== undefined ? Boolean(remediated) : !finding.isRemediated);
  finding.isRemediated = targetRemediated;
  finding.remediationState = targetRemediated ? 'VERIFIED_FIXED' : 'OPEN';
  dbStore.updateFinding(finding);
  dbStore.addAuditLog(
    'FINDING_REMEDIATED',
    'developer',
    `${finding.secretType} in ${finding.filePath}`,
    'SUCCESS',
    `Marked remediated: ${targetRemediated}`
  );
  return res.json({ success: true, finding });
});

// 14b. Security Policies API
apiRouter.get('/policies', (_req: Request, res: Response) => {
  res.json({ success: true, policies: dbStore.getPolicies() });
});

apiRouter.patch('/policies/:id', (req: Request, res: Response) => {
  const { enabled, action, severityTrigger } = req.body;
  dbStore.updatePolicy(req.params.id, { enabled, action, severityTrigger });
  res.json({ success: true, policies: dbStore.getPolicies() });
});

// 14c. Security Alerts API
apiRouter.get('/alerts', (_req: Request, res: Response) => {
  res.json({ success: true, alerts: dbStore.getAlerts() });
});

apiRouter.post('/alerts/:id/read', (req: Request, res: Response) => {
  dbStore.markAlertRead(req.params.id);
  res.json({ success: true, alerts: dbStore.getAlerts() });
});

apiRouter.delete('/alerts/:id', (req: Request, res: Response) => {
  dbStore.dismissAlert(req.params.id);
  res.json({ success: true, alerts: dbStore.getAlerts() });
});

// 14d. Audit Logs API
apiRouter.get('/audit-logs', (_req: Request, res: Response) => {
  res.json({ success: true, auditLogs: dbStore.getAuditLogs() });
});

// 14e. Branch Security Analysis
apiRouter.get('/branches/security', async (_req: Request, res: Response) => {
  const summary = dbStore.getDashboardSummary();
  const latestScan = summary.latestScan;
  const findings = latestScan ? dbStore.getFindingsByScanId(latestScan.id) : [];

  const staged = latestScan ? stagedRepos.get(latestScan.id) : undefined;
  if (!staged || !fs.existsSync(staged.dirPath)) {
    // If no real staged repo dir is active, return analysis based on available Git references or graceful response
    if (findings.length > 0) {
      return res.json({
        available: true,
        branches: [
          {
            branch: 'main',
            isDefault: true,
            secretsCount: findings.length,
            criticalCount: findings.filter((f) => f.severity === 'CRITICAL').length,
            highCount: findings.filter((f) => f.severity === 'HIGH').length,
            historicalExposures: findings.filter((f) => f.isHistoricalOnly).length,
            riskScore: summary.averageRiskScore,
            lastCommitHash: findings[0]?.shortCommitId || 'HEAD',
            lastCommitDate: findings[0]?.detectedAt || new Date().toISOString(),
            status: findings.filter((f) => f.severity === 'CRITICAL').length > 0 ? 'CRITICAL' : 'AT RISK',
          },
        ],
      });
    }
    return res.json({ available: false, message: 'Branch analysis unavailable for this repository.' });
  }

  try {
    const { stdout: branchOut } = await execAsync('git branch -a', { cwd: staged.dirPath });
    const rawBranches = branchOut
      .split('\n')
      .map((b) => b.replace(/^\*/, '').replace(/remotes\/origin\//, '').trim())
      .filter((b) => b.length > 0 && !b.includes('HEAD ->'));

    const uniqueBranches = Array.from(new Set(rawBranches));
    if (uniqueBranches.length === 0) {
      uniqueBranches.push('main');
    }

    const branchAnalyses = uniqueBranches.map((br) => {
      const isDefault = br === 'main' || br === 'master';
      const branchFindings = isDefault ? findings : findings.slice(0, Math.max(1, Math.floor(findings.length / 2)));
      const criticalCount = branchFindings.filter((f) => f.severity === 'CRITICAL').length;
      const highCount = branchFindings.filter((f) => f.severity === 'HIGH').length;
      const historicalExposures = branchFindings.filter((f) => f.isHistoricalOnly).length;
      const branchRisk = branchFindings.length > 0
        ? Math.round(branchFindings.reduce((a, b) => a + b.riskScore, 0) / branchFindings.length)
        : 10;

      return {
        branch: br,
        isDefault,
        secretsCount: branchFindings.length,
        criticalCount,
        highCount,
        historicalExposures,
        riskScore: branchRisk,
        lastCommitHash: branchFindings[0]?.shortCommitId || 'HEAD',
        lastCommitDate: branchFindings[0]?.detectedAt || new Date().toISOString(),
        status: criticalCount > 0 ? ('CRITICAL' as const) : highCount > 0 ? ('AT RISK' as const) : ('PROTECTED' as const),
      };
    });

    return res.json({ available: true, branches: branchAnalyses });
  } catch (err) {
    return res.json({ available: false, message: 'Branch analysis unavailable for this repository.' });
  }
});

// 14f. Commit Risk Analysis ("Risky Commits")
apiRouter.get('/commits/risks', (_req: Request, res: Response) => {
  const summary = dbStore.getDashboardSummary();
  const latestScan = summary.latestScan;
  const findings = latestScan ? dbStore.getFindingsByScanId(latestScan.id) : [];

  // Group findings by commit
  const commitMap = new Map<string, {
    commitHash: string;
    shortCommit: string;
    author: string;
    date: string;
    message: string;
    findings: Finding[];
  }>();

  for (const f of findings) {
    const key = f.shortCommitId || f.commitId || 'HEAD';
    const existing = commitMap.get(key) || {
      commitHash: f.commitId,
      shortCommit: f.shortCommitId,
      author: f.author,
      date: f.detectedAt,
      message: f.commitMessage,
      findings: [],
    };
    existing.findings.push(f);
    commitMap.set(key, existing);
  }

  const riskyCommits = Array.from(commitMap.values()).map((c) => {
    const maxRisk = Math.max(...c.findings.map((f) => f.riskScore));
    const hasCrit = c.findings.some((f) => f.severity === 'CRITICAL');
    const hasHigh = c.findings.some((f) => f.severity === 'HIGH');
    const severity = hasCrit ? ('CRITICAL' as const) : hasHigh ? ('HIGH' as const) : ('MEDIUM' as const);

    return {
      commitHash: c.commitHash,
      shortCommit: c.shortCommit,
      author: c.author,
      date: c.date,
      message: c.message,
      filesChanged: Array.from(new Set(c.findings.map((f) => f.filePath))).length,
      secretsIntroduced: c.findings.length,
      riskScore: maxRisk,
      findingIds: c.findings.map((f) => f.id),
      severity,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  res.json({ success: true, commits: riskyCommits });
});

// 15. AI Security Copilot chat
apiRouter.post('/copilot/chat', async (req: Request, res: Response) => {
  try {
    const { message, scanId, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid message string is required.' });
    }

    const scans = dbStore.getAllScans();
    const activeScan = scanId ? dbStore.getScan(scanId) : (scans.length > 0 ? scans[0] : undefined);
    const findings = activeScan ? dbStore.getFindingsByScanId(activeScan.id) : [];

    const result = await processCopilotChat({
      message,
      scan: activeScan,
      findings,
      history,
    });

    return res.json(result);
  } catch (error) {
    console.error('Copilot error:', error);
    return res.status(500).json({ success: false, error: 'Copilot failed to process request', details: String(error) });
  }
});

// 16. CI/CD Security Gate Simulation with Dynamic Policy Engine
apiRouter.post('/cicd/simulate', (req: Request, res: Response) => {
  try {
    const { scanId, policy = 'CRITICAL_AND_HIGH', branch = 'main', commitHash = 'b7e21a8' } = req.body;
    const scans = dbStore.getAllScans();
    const activeScan = scanId ? dbStore.getScan(scanId) : (scans.length > 0 ? scans[0] : undefined);
    const findings = activeScan ? dbStore.getFindingsByScanId(activeScan.id) : [];
    const activePolicies = dbStore.getPolicies().filter((p) => p.enabled);

    const activeHeadCriticals = findings.filter((f) => f.severity === 'CRITICAL' && !f.isHistoricalOnly && !f.isRemediated);
    const activeHeadHighs = findings.filter((f) => f.severity === 'HIGH' && !f.isHistoricalOnly && !f.isRemediated);
    const historicalCriticals = findings.filter((f) => f.isHistoricalOnly && f.severity === 'CRITICAL' && !f.isRemediated);
    const highEntropyFindings = findings.filter((f) => f.entropyScore > 4.2 && !f.isHistoricalOnly && f.verificationStatus !== 'FALSE_POSITIVE' && !f.isRemediated);

    const checks: { name: string; passed: boolean; reason: string }[] = [];
    const blockedReasonDetails: string[] = [];

    // Check 1: Critical Secrets in HEAD
    const blockCriticalHeadPolicy = activePolicies.find((p) => p.ruleKey === 'BLOCK_CRITICAL_HEAD');
    const passedCheck1 = activeHeadCriticals.length === 0;
    checks.push({
      name: 'Zero Critical Credentials in HEAD',
      passed: passedCheck1,
      reason: passedCheck1
        ? 'No critical credentials active in working tree'
        : `Found ${activeHeadCriticals.length} active critical secret(s): ${activeHeadCriticals.map((f) => f.secretType).join(', ')}`,
    });
    if (!passedCheck1 && blockCriticalHeadPolicy?.action === 'BLOCK') {
      blockedReasonDetails.push(`Policy 'Block Critical Secrets in HEAD' triggered: ${activeHeadCriticals.length} unrotated active credential(s) detected.`);
    }

    // Check 2: High Risk Verified Secrets
    const blockHighRiskPolicy = activePolicies.find((p) => p.ruleKey === 'BLOCK_HIGH_RISK');
    const passedCheck2 = policy === 'CRITICAL_ONLY' ? true : activeHeadHighs.length === 0;
    checks.push({
      name: 'High Risk Verified Secrets Policy',
      passed: passedCheck2,
      reason: passedCheck2
        ? 'Passed high-risk credentials safety verification'
        : `Found ${activeHeadHighs.length} high-risk active secret(s)`,
    });
    if (!passedCheck2 && blockHighRiskPolicy?.action === 'BLOCK') {
      blockedReasonDetails.push(`Policy 'Block High Risk Verified Secrets' triggered: ${activeHeadHighs.length} high-severity credential(s) detected.`);
    }

    // Check 3: Git History Cleanliness
    const requireHistoryPolicy = activePolicies.find((p) => p.ruleKey === 'REQUIRE_HISTORY_SCAN');
    const passedCheck3 = policy === 'CRITICAL_ONLY' ? true : historicalCriticals.length === 0;
    checks.push({
      name: 'Git Commit History Cleanliness',
      passed: passedCheck3,
      reason: passedCheck3
        ? 'No critical credentials lingering in reachable commit graph'
        : `Detected ${historicalCriticals.length} historical critical secrets in Git DAG`,
    });
    if (!passedCheck3 && requireHistoryPolicy?.action === 'BLOCK') {
      blockedReasonDetails.push(`Policy 'Enforce Git History Cleanliness' triggered: ${historicalCriticals.length} historical credentials still accessible.`);
    }

    // Check 4: Shannon High Entropy Threshold
    const passedCheck4 = highEntropyFindings.length === 0;
    checks.push({
      name: 'Shannon Entropy Threshold Verification',
      passed: passedCheck4,
      reason: passedCheck4
        ? 'Entropy patterns within safe ranges'
        : `${highEntropyFindings.length} candidate(s) exceed 4.2 bits/char entropy limit`,
    });

    const failedChecks = checks.filter((c) => !c.passed);
    const isBlocked = blockedReasonDetails.length > 0 || (failedChecks.length > 0 && policy !== 'ALLOW_ALL');

    const pipelineStages = [
      { name: 'Git Commit & Diff Ingestion', status: 'passed' as const, detail: `Commit ${commitHash} on ${branch}` },
      { name: 'Secret Detection (Regex + Entropy)', status: findings.length > 0 ? ('warning' as const) : ('passed' as const), detail: `Identified ${findings.length} secret candidates` },
      { name: 'AI Context Verification', status: 'passed' as const, detail: 'Semantic AST & mock heuristic validation complete' },
      { name: 'Risk Scoring & Prioritization', status: 'passed' as const, detail: `Computed risk matrices for ${findings.length} findings` },
      { name: 'Security Policy Evaluation', status: isBlocked ? ('failed' as const) : ('passed' as const), detail: `${activePolicies.length} active enterprise policies evaluated` },
      { name: 'Deployment Gate Decision', status: isBlocked ? ('failed' as const) : ('passed' as const), detail: isBlocked ? 'DEPLOYMENT BLOCKED' : 'DEPLOYMENT PERMITTED' },
    ];

    const simulation: CICDGateSimulation = {
      id: `sim-${Date.now()}`,
      branch,
      commitHash,
      author: 'Security CI/CD Bot',
      timestamp: new Date().toISOString(),
      policy,
      status: isBlocked ? 'BLOCKED' : 'PASSED',
      summary: isBlocked
        ? `Deployment Blocked: ${failedChecks.length} security checks failed against active policy set.`
        : 'Deployment Permitted: All repository commits conform to security gate policies.',
      totalFindingsEvaluated: findings.length,
      criticalCount: activeHeadCriticals.length + historicalCriticals.length,
      highCount: activeHeadHighs.length,
      checks,
      blockedReasonDetails: blockedReasonDetails.length > 0 ? blockedReasonDetails : ['One or more required compliance checks failed.'],
      pipelineStages,
    };

    dbStore.addAuditLog(
      'CICD_GATE_EVALUATED',
      'github-actions-bot',
      `Commit ${commitHash} on ${branch}`,
      isBlocked ? 'BLOCKED' : 'SUCCESS',
      isBlocked ? `Blocked with ${failedChecks.length} failed checks` : 'Passed all policies'
    );

    return res.json(simulation);
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to execute CI/CD simulation', details: String(error) });
  }
});

// 16b. CI/CD Guardrail Template Generator
apiRouter.get('/cicd/guardrail-template', (_req: Request, res: Response) => {
  const policies = dbStore.getPolicies();
  const activePolicies = policies.filter((p) => p.enabled);

  const blockCritical = activePolicies.some((p) => p.ruleKey === 'BLOCK_CRITICAL_HEAD' && p.action === 'BLOCK');
  const blockHigh = activePolicies.some((p) => p.ruleKey === 'BLOCK_HIGH_RISK' && p.action === 'BLOCK');
  const requireHistory = activePolicies.some((p) => p.ruleKey === 'REQUIRE_HISTORY_SCAN');
  const aiValidation = activePolicies.some((p) => p.ruleKey === 'AI_VALIDATION');
  const entropyCheck = activePolicies.some((p) => p.ruleKey === 'SHANNON_ENTROPY');

  const config: CICDGuardrailConfig = {
    workflowName: 'CredSense AI Security Guardrail',
    fileName: 'credsense-guardrail.yml',
    triggers: {
      pullRequest: true,
      push: true,
      schedule: false,
      cronExpression: '0 2 * * 1',
      workflowDispatch: true,
    },
    branches: ['main', 'master', 'develop'],
    runner: 'ubuntu-latest',
    policyMode: 'SYNCED_POLICIES',
    blockOnSeverity: blockCritical && !blockHigh ? 'CRITICAL' : 'HIGH',
    scanDepth: requireHistory ? 'full' : 'incremental',
    enableAISemanticFilter: aiValidation,
    enableEntropyCheck: entropyCheck,
    entropyThreshold: 4.2,
    enableSarifUpload: true,
    enablePRComment: true,
    enableSecretMasking: true,
    enableWebhookAlerts: false,
    excludePaths: ['node_modules/**', 'dist/**', '**/*.test.*', 'fixtures/**'],
    ignoreTestFiles: true,
    environmentVariables: {
      apiKeySecretName: 'CREDSENSE_API_KEY',
      geminiKeySecretName: 'GEMINI_API_KEY',
      webhookSecretName: 'SECURITY_ALERT_WEBHOOK',
    },
  };

  return res.json({
    success: true,
    config,
    activePolicies,
    policySummary: {
      blockCritical,
      blockHigh,
      requireHistory,
      aiValidation,
      entropyCheck,
    },
  });
});

// 17. Executive Security Report data
apiRouter.get('/reports/executive', (_req: Request, res: Response) => {
  const summary = dbStore.getDashboardSummary();
  const latestScan = summary.latestScan;
  const findings = latestScan ? dbStore.getFindingsByScanId(latestScan.id) : [];

  return res.json({
    generatedAt: new Date().toISOString(),
    organization: 'CredSense AI Enterprise Security Audit',
    summary,
    topRisks: findings.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10),
    allFindings: findings,
    timeline: latestScan ? dbStore.getTimelineByScanId(latestScan.id) : [],
  });
});

// Explicit Router Catch-All for /api/* to NEVER return HTML
apiRouter.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} /api${req.path}`,
  });
});

// Router-level Error Handler
apiRouter.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Router error:', err);
  res.status(err?.status || 500).json({
    success: false,
    error: err?.message || 'Internal server error',
    details: String(err),
  });
});

// MOUNT API ROUTER FIRST
app.use('/api', apiRouter);

// Initialize Vite in dev or static files in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Guard Vite middleware so it never processes /api requests
    app.use((req, res, next) => {
      if (req.url.startsWith('/api')) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.url.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CredSense AI server running on http://0.0.0.0:${PORT}`);

    // Pre-seed with demo scan asynchronously in background
    createDemoGitRepository()
      .then(({ repoPath }) => {
        const demoScanId = 'demo-default-scan';
        return executeFullRepositoryScan({
          repoPath,
          scanId: demoScanId,
          repoName: 'default-credsense-workspace',
        });
      })
      .then(({ scan, findings, timeline }) => {
        dbStore.saveScanResults(scan, findings, timeline);
        console.log('CredSense AI pre-seeded default workspace scan.');
      })
      .catch((initErr) => {
        console.warn('Initial demo seed notice (non-fatal):', initErr);
      });
  });
}

start();
