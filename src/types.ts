export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type AIClassification = 'REAL' | 'TEST' | 'EXAMPLE' | 'FALSE_POSITIVE' | 'UNKNOWN';

export type RemediationState =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'ROTATION_REQUIRED'
  | 'SECRET_REMOVED'
  | 'HISTORY_PURGED'
  | 'VERIFIED_FIXED'
  | 'ACCEPTED_RISK';

export interface CommitExposure {
  commitId: string;
  shortCommitId: string;
  author: string;
  authorEmail?: string;
  date: string;
  message: string;
  isPresent: boolean;
  isIntroduction: boolean;
  isLatest: boolean;
}

export interface RiskContributors {
  secretSensitivity: number;
  currentHeadExposure: number;
  exposureDuration: number;
  aiConfidenceScore: number;
  contextRisk: number;
  total: number;
}

export interface RotationChecklistStep {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
}

export interface ExplainableEvidence {
  evidenceFor: string[];
  evidenceAgainst: string[];
  whyItMatters: string;
  technicalReasoning: string;
}

export interface Finding {
  id: string;
  scanId: string;
  secretType: string;
  detector: string;
  filePath: string;
  lineNumber: number;
  commitId: string;
  shortCommitId: string;
  commitMessage: string;
  author: string;
  detectedAt: string;
  exposureStart: string;
  exposureDuration: string; // e.g. "18 days (Active in HEAD)"
  exposureDays: number;
  entropyScore: number;
  confidence: number;
  verificationStatus: AIClassification;
  verificationReason: string;
  verificationConfidence: number;
  verificationMode: 'gemini' | 'local';
  contextAnalysis?: string;
  detectionMethod?: string;
  riskScore: number; // 0 - 100
  severity: SeverityLevel;
  riskExplanation: string[];
  riskContributors?: RiskContributors;
  recommendedAction: string;
  remediationSteps: string[];
  maskedSecret: string;
  isHistoricalOnly: boolean; // true if removed in HEAD but alive in git history
  surroundingContext: string;
  rawSecretLength?: number;
  isRemediated?: boolean;
  remediationState?: RemediationState;
  remediationChecklist?: RotationChecklistStep[];
  aiEvidence?: ExplainableEvidence;
  incidentId?: string;
  // Git History Intelligence & Ghost Secrets
  gitClassification?: 'ACTIVE SECRET' | 'HISTORICAL SECRET' | 'GHOST SECRET' | 'REINTRODUCED SECRET';
  isGhostSecret?: boolean;
  headStatus?: 'CLEAN' | 'EXPOSED';
  gitHistoryStatus?: 'EXPOSED' | 'CLEAN';
  fingerprint?: string; // Non-reversible token fingerprint (e.g. SHA256-derived correlation key)
  firstExposureDate?: string;
  firstExposureCommit?: string;
  firstExposureAuthor?: string;
  lastExposureCommit?: string;
  lastExposureDate?: string;
  removedFromHeadDate?: string;
  removedFromHeadCommit?: string;
  exposureDurationDays?: number;
  ghostRemediationGuidance?: {
    rotateRevoke: string;
    investigateAuditLogs: string;
    purgeGitHistory: string;
    secretsManagerGuidance: string;
    rescanStep: string;
    gitFilterRepoCommand?: string;
    bfgRepoCleanerCommand?: string;
  };
}

export interface GitHistorySummary {
  totalHistoricalSecrets: number;
  activeSecrets: number;
  ghostSecrets: number;
  reintroducedSecrets: number;
  longestExposureDays: number;
  highestHistoricalRisk: number;
}

export interface RemediationVerificationResult {
  scanId: string;
  status: 'SUCCESS' | 'WARNING';
  message: string;
  verifiedAt: string;
  resolvedFindingsCount: number;
  remainingFindingsCount: number;
  before: {
    critical: number;
    high: number;
    riskScore: number;
    postureScore: number;
  };
  after: {
    critical: number;
    high: number;
    riskScore: number;
    postureScore: number;
  };
}

export interface GhostSecretSummary {
  totalGhostSecrets: number;
  criticalGhostSecrets: number;
  highGhostSecrets: number;
  mediumGhostSecrets: number;
  resolvedGhostSecrets: number;
  stillHistoricallyExposed: number;
  averageExposureDurationDays: number;
}

export interface ScanProgressStage {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: string;
}

export interface Scan {
  id: string;
  repoName: string;
  isGitRepo: boolean;
  totalCommitsScanned: number;
  totalFilesScanned: number;
  scannedAt: string;
  durationMs: number;
  status: 'ready' | 'scanning' | 'completed' | 'failed';
  stages: ScanProgressStage[];
  findingsCount: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    falsePositive: number;
    verifiedReal: number;
    testExample: number;
    historicalOnly: number;
  };
}

export interface ScoreBreakdownFactors {
  overallScore: number;
  credentialHygieneScore: number;
  gitHistorySecurityScore: number;
  exposureRiskScore: number;
  remediationScore: number;
  aiConfidenceScore: number;
  repositoryHygieneScore: number;
  scoreChangeDelta: number;
  previousScore: number;
  mainRiskDriver: string;
  recommendedNextAction: string;
  scoreChangeFactors: {
    label: string;
    impact: 'positive' | 'negative' | 'neutral';
    delta: number;
    reason: string;
  }[];
}

export interface SecurityScorecard {
  overallScore: number; // 0-100
  postureStatus: 'GOOD' | 'AT RISK' | 'CRITICAL';
  postureLabel: string;
  secretHygiene: number; // percentage
  gitHistoryHygiene: number; // percentage
  exposureRisk: number; // percentage
  noiseReductionRate: number; // percentage
  remediationRate: number; // percentage
  cicdProtection: number; // percentage
  improvementDelta: number; // e.g. +12%
  detailedBreakdown?: ScoreBreakdownFactors;
}

export interface DashboardSummary {
  totalScans: number;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  falsePositives: number;
  verifiedReal: number;
  testExample: number;
  historicalOnly: number;
  averageRiskScore: number;
  securityScorecard?: SecurityScorecard;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  typeBreakdown: {
    type: string;
    count: number;
    riskScore: number;
    highestSeverity?: SeverityLevel;
    avgExposureDays?: number;
  }[];
  recentFindings: Finding[];
  latestScan?: Scan;
  ghostSecretsSummary?: GhostSecretSummary;
  gitHistorySummary?: GitHistorySummary;
  noiseReductionStats?: {
    totalCandidates: number;
    aiVerified: number;
    realCount: number;
    testCount: number;
    exampleCount: number;
    falsePositiveCount: number;
    reductionPercentage: number;
  };
}

export interface TimelineEvent {
  commitId: string;
  shortCommitId: string;
  date: string;
  author: string;
  message: string;
  exposedSecrets: {
    findingId: string;
    secretType: string;
    maskedSecret: string;
    filePath: string;
    action: 'introduced' | 'persisted' | 'removed';
    severity: SeverityLevel;
  }[];
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
  findingReferences?: string[];
  mode?: 'gemini' | 'local';
}

export interface SecurityPolicyConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'PREVENTION' | 'GOVERNANCE' | 'HISTORY' | 'AI_VALIDATION';
  severityTrigger: SeverityLevel;
  action: 'BLOCK' | 'WARN' | 'ALLOW';
  ruleKey: string;
  threshold?: number;
}

export interface CICDGateSimulation {
  id: string;
  branch: string;
  commitHash: string;
  author: string;
  timestamp: string;
  policy: 'CRITICAL_ONLY' | 'CRITICAL_AND_HIGH' | 'STRICT_ZERO_TOLERANCE';
  status: 'PASSED' | 'BLOCKED';
  summary: string;
  totalFindingsEvaluated: number;
  criticalCount: number;
  highCount: number;
  checks: {
    name: string;
    passed: boolean;
    reason: string;
  }[];
  blockedReasonDetails?: string[];
  pipelineStages?: {
    name: string;
    status: 'passed' | 'failed' | 'skipped' | 'warning';
    detail: string;
  }[];
}

export interface BranchSecurityAnalysis {
  branch: string;
  isDefault: boolean;
  secretsCount: number;
  criticalCount: number;
  highCount: number;
  historicalExposures: number;
  riskScore: number;
  lastCommitHash: string;
  lastCommitDate: string;
  status: 'PROTECTED' | 'AT RISK' | 'CRITICAL';
}

export interface CommitRiskItem {
  commitHash: string;
  shortCommit: string;
  author: string;
  date: string;
  message: string;
  filesChanged: number;
  secretsIntroduced: number;
  riskScore: number;
  findingIds: string[];
  severity: SeverityLevel;
}

export interface SecurityAlert {
  id: string;
  type: 'CRITICAL_DETECTED' | 'LONG_EXPOSURE' | 'HEAD_EXPOSURE' | 'HIGH_RISK_COMMIT' | 'REMEDIATION_COMPLETE' | 'SCORE_IMPROVED' | 'GHOST_SECRET_DETECTED';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  findingId?: string;
  severity: SeverityLevel;
  category: 'URGENT' | 'WARNING' | 'INFO';
}

export interface GhostSecretTestScenarioResult {
  scenarioId: string;
  name: string;
  description: string;
  expectedClassification: 'GHOST_SECRET' | 'ACTIVE_HEAD' | 'CLEAN' | 'REINTRODUCED_HEAD';
  actualClassification: string;
  headStatus: 'CLEAN' | 'EXPOSED';
  historyStatus: 'EXPOSED' | 'CLEAN';
  fingerprint: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  userSession: string;
  targetObject: string;
  result: 'SUCCESS' | 'WARNING' | 'BLOCKED';
  details: string;
}

export interface HeatmapNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  secretsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  maxRiskScore: number;
  findings: Finding[];
}

export interface ImpactKnowledgeItem {
  credentialType: string;
  displayName: string;
  category: 'Cloud Provider' | 'Payment Gateway' | 'VCS & CI/CD' | 'Database' | 'Authentication' | 'Communication';
  description: string;
  dangerRationale: string;
  detectionApproach: string;
  potentialImpacts: string[];
  complianceRisks: string[];
  remediationBestPractices: string[];
  blastRadius: 'Extreme' | 'High' | 'Medium';
}

export interface CICDGuardrailConfig {
  workflowName: string;
  fileName: string;
  triggers: {
    pullRequest: boolean;
    push: boolean;
    schedule: boolean;
    cronExpression?: string;
    workflowDispatch: boolean;
  };
  branches: string[];
  runner: 'ubuntu-latest' | 'self-hosted' | 'macos-latest';
  policyMode: 'SYNCED_POLICIES' | 'STRICT' | 'DEVELOPER' | 'AUDIT_ONLY';
  blockOnSeverity: SeverityLevel;
  scanDepth: 'full' | 'incremental' | 'shallow';
  enableAISemanticFilter: boolean;
  enableEntropyCheck: boolean;
  entropyThreshold: number;
  enableSarifUpload: boolean;
  enablePRComment: boolean;
  enableSecretMasking: boolean;
  enableWebhookAlerts: boolean;
  excludePaths: string[];
  ignoreTestFiles: boolean;
  environmentVariables: {
    apiKeySecretName: string;
    geminiKeySecretName?: string;
    webhookSecretName?: string;
  };
}
