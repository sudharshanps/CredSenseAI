/**
 * CredSense AI - Risk Scoring & Explainability Engine
 * Transparent, weighted mathematical risk evaluation with actionable remediation playbooks.
 */

import { AIClassification, RiskContributors, SeverityLevel } from '../types';

export interface RiskEvaluation {
  riskScore: number; // 0 - 100
  severity: SeverityLevel;
  riskExplanation: string[];
  riskContributors: RiskContributors;
  recommendedAction: string;
  remediationSteps: string[];
}

interface RiskParameters {
  secretType: string;
  sensitivityWeight: number; // 0 - 30
  exposureDays: number;
  isPresentInHead: boolean;
  aiClassification: AIClassification;
  aiConfidence: number;
  entropyScore: number;
  commitsCount: number;
}

export function evaluateRisk(params: RiskParameters): RiskEvaluation {
  const explanation: string[] = [];

  // 1. Sensitivity Score (0 - 30)
  let sensitivityScore = params.sensitivityWeight || 20;
  if (params.secretType.includes('Private Key') || params.secretType.includes('AWS') || params.secretType.includes('Database')) {
    explanation.push(`High-sensitivity credential class (${params.secretType}) with potential for direct infrastructure access.`);
  } else {
    explanation.push(`Standard credential class (${params.secretType}) with scoped API access.`);
  }

  // 2. Exposure Duration Score (0 - 20)
  let exposureScore = 0;
  if (params.exposureDays >= 30) {
    exposureScore = 20;
    explanation.push(`Prolonged exposure duration (${params.exposureDays} days in version control) increases probability of automated crawler discovery.`);
  } else if (params.exposureDays >= 14) {
    exposureScore = 15;
    explanation.push(`Substantial exposure window (${params.exposureDays} days across commits).`);
  } else if (params.exposureDays >= 7) {
    exposureScore = 10;
    explanation.push(`Moderate exposure window (${params.exposureDays} days).`);
  } else if (params.exposureDays >= 1) {
    exposureScore = 6;
    explanation.push(`Recent exposure (${params.exposureDays} days).`);
  } else {
    exposureScore = 3;
    explanation.push(`Newly introduced finding (< 24 hours).`);
  }

  // 3. Current Exposure Status (0 - 20)
  let presenceScore = 0;
  if (params.isPresentInHead) {
    presenceScore = 20;
    explanation.push(`Currently active in working tree (HEAD) — actively vulnerable to clone/checkout.`);
  } else {
    presenceScore = 11;
    explanation.push(`Removed from current HEAD, but still fully retrievable from Git commit history across ${params.commitsCount} historical commit(s).`);
  }

  // 4. AI & Context Verification (0 - 15)
  let contextScore = 0;
  if (params.aiClassification === 'REAL') {
    contextScore = 15;
    explanation.push(`AI context analysis verified as authentic production credential (${Math.round(params.aiConfidence * 100)}% confidence).`);
  } else if (params.aiClassification === 'UNKNOWN') {
    contextScore = 8;
    explanation.push(`AI context analysis is inconclusive; manual security triage recommended.`);
  } else if (params.aiClassification === 'TEST') {
    contextScore = 2;
    explanation.push(`AI classified as non-production test/mock credential; risk downgraded.`);
  } else if (params.aiClassification === 'EXAMPLE') {
    contextScore = 1;
    explanation.push(`AI classified as documentation or sample template credential.`);
  } else if (params.aiClassification === 'FALSE_POSITIVE') {
    contextScore = 0;
    explanation.push(`AI classified as likely false positive pattern match.`);
  }

  // 5. Entropy & Confidence Bonus (0 - 15)
  let entropyBonus = 0;
  if (params.entropyScore >= 4.0) {
    entropyBonus = 15;
  } else if (params.entropyScore >= 3.4) {
    entropyBonus = 10;
  } else if (params.entropyScore >= 2.8) {
    entropyBonus = 5;
  } else {
    entropyBonus = 1;
  }

  // Calculate raw total
  let rawScore = sensitivityScore + exposureScore + presenceScore + contextScore + entropyBonus;

  // Apply dampening rules for test / false positives
  if (params.aiClassification === 'FALSE_POSITIVE') {
    rawScore = Math.min(15, Math.round(rawScore * 0.15));
  } else if (params.aiClassification === 'EXAMPLE' || params.aiClassification === 'TEST') {
    rawScore = Math.min(38, Math.round(rawScore * 0.35));
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Calculate scaled risk contributors
  const scale = finalScore > 0 && rawScore > 0 ? finalScore / rawScore : 1;
  const riskContributors: RiskContributors = {
    secretSensitivity: Math.round(sensitivityScore * scale),
    currentHeadExposure: Math.round(presenceScore * scale),
    exposureDuration: Math.round(exposureScore * scale),
    aiConfidenceScore: Math.round(contextScore * scale),
    contextRisk: Math.max(0, finalScore - Math.round(sensitivityScore * scale) - Math.round(presenceScore * scale) - Math.round(exposureScore * scale) - Math.round(contextScore * scale)),
    total: finalScore,
  };

  // Determine Severity
  let severity: SeverityLevel = 'LOW';
  if (finalScore >= 80) {
    severity = 'CRITICAL';
  } else if (finalScore >= 60) {
    severity = 'HIGH';
  } else if (finalScore >= 30) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  // Remediation Playbook Generation
  const remediation = generateRemediationPlaybook(severity, params.secretType, params.isPresentInHead, params.aiClassification);

  return {
    riskScore: finalScore,
    severity,
    riskExplanation: explanation,
    riskContributors,
    recommendedAction: remediation.recommendedAction,
    remediationSteps: remediation.steps,
  };
}

function generateRemediationPlaybook(
  severity: SeverityLevel,
  secretType: string,
  isPresentInHead: boolean,
  aiClassification: AIClassification
): { recommendedAction: string; steps: string[] } {
  if (aiClassification === 'FALSE_POSITIVE' || aiClassification === 'EXAMPLE') {
    return {
      recommendedAction: 'Mark finding as reviewed or non-actionable template.',
      steps: [
        'Review the file location to confirm it is intended as a public example or documentation.',
        'Ensure the template variable does not contain sensitive live production values.',
        'Optionally add an inline suppression comment `# credsense:ignore` if necessary.',
      ],
    };
  }

  if (aiClassification === 'TEST') {
    return {
      recommendedAction: 'Replace hardcoded test credential with automated test mock or env variable.',
      steps: [
        'Verify this key cannot access live external environments or staging databases.',
        'Replace with deterministic synthetic mocks or ephemeral test fixtures.',
        'Add pre-commit linting to avoid committing real tokens into test directories.',
      ],
    };
  }

  if (severity === 'CRITICAL') {
    return {
      recommendedAction: 'IMMEDIATE ACTION: Revoke and rotate this credential, purge Git history, and audit access logs.',
      steps: [
        `1. Revoke Credential Immediately: Log into the provider management console (${secretType}) and invalidate the compromised key.`,
        '2. Rotate & Distribute: Provision a new secret and store it securely in a dedicated Secrets Manager (e.g. AWS Secrets Manager, HashiCorp Vault, Doppler).',
        isPresentInHead
          ? '3. Remove from Source: Delete the secret from current codebase and replace with environment variable references (e.g. process.env or os.environ).'
          : '3. Purge Git Commit History: Even though the secret was removed from HEAD, rewrite repository history using `git-filter-repo` or `BFG Repo-Cleaner` to purge historic blobs.',
        '4. Audit Cloud Access Logs: Check CloudTrail / SIEM audit logs during the exposure window for unauthorized API calls.',
        '5. Enforce CI/CD Guardrails: Install pre-commit hooks (CredSense / Trufflehog) to block future unmasked commits.',
      ],
    };
  }

  if (severity === 'HIGH') {
    return {
      recommendedAction: 'Rotate credential within 24 hours and clean repository history.',
      steps: [
        '1. Invalidate and rotate the active API credential with the service provider.',
        '2. Migrate configuration to environment variables or secret injection in CI/CD.',
        '3. Rewrite Git history if the repository is public or shared with third-party collaborators.',
        '4. Review commit logs to ensure no other credentials were simultaneously committed.',
      ],
    };
  }

  if (severity === 'MEDIUM') {
    return {
      recommendedAction: 'Schedule secret rotation and migrate configuration to secrets management.',
      steps: [
        '1. Inspect whether this key is scoped or ephemeral.',
        '2. Rotate the credential during the next maintenance cycle.',
        '3. Ensure configuration files are added to `.gitignore`.',
      ],
    };
  }

  return {
    recommendedAction: 'Verify credential validity and ensure proper scoping.',
    steps: [
      '1. Review whether this token represents an active credential.',
      '2. Ensure low-privilege access scoping and add to `.gitignore`.',
    ],
  };
}
