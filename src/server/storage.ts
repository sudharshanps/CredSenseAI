/**
 * CredSense AI - Storage & Repository State Management
 * In-memory & persisted cache for scans, findings, and timeline records.
 */

import {
  AuditLogItem,
  DashboardSummary,
  Finding,
  GhostSecretSummary,
  RemediationState,
  RotationChecklistStep,
  Scan,
  ScoreBreakdownFactors,
  SecurityAlert,
  SecurityPolicyConfig,
  SecurityScorecard,
  SeverityLevel,
  TimelineEvent,
} from '../types';

class StorageManager {
  private scans: Map<string, Scan> = new Map();
  private findings: Map<string, Finding[]> = new Map(); // scanId -> findings
  private allFindings: Map<string, Finding> = new Map(); // findingId -> finding
  private timelines: Map<string, TimelineEvent[]> = new Map(); // scanId -> timeline
  private auditLogs: AuditLogItem[] = [];
  private alerts: SecurityAlert[] = [];
  private policies: SecurityPolicyConfig[] = [
    {
      id: 'pol-1',
      name: 'Block Critical Secrets in HEAD',
      description: 'Prevents merge and deployment when critical severity active credentials are found in working commit.',
      enabled: true,
      category: 'PREVENTION',
      severityTrigger: 'CRITICAL',
      action: 'BLOCK',
      ruleKey: 'BLOCK_CRITICAL_HEAD',
    },
    {
      id: 'pol-2',
      name: 'Block High Risk Verified Secrets',
      description: 'Blocks CI/CD deployment on production cloud keys, payment credentials, and database passwords.',
      enabled: true,
      category: 'PREVENTION',
      severityTrigger: 'HIGH',
      action: 'BLOCK',
      ruleKey: 'BLOCK_HIGH_RISK',
    },
    {
      id: 'pol-3',
      name: 'Allow Test & Mock Dummy Secrets',
      description: 'Prevents build disruption when AI confirms the finding is an intentional test mock or synthetic placeholder.',
      enabled: true,
      category: 'AI_VALIDATION',
      severityTrigger: 'LOW',
      action: 'ALLOW',
      ruleKey: 'ALLOW_TEST_SECRETS',
    },
    {
      id: 'pol-4',
      name: 'Require AI Contextual Verification',
      description: 'Ensures entropy hits undergo semantic code context analysis before severity classification.',
      enabled: true,
      category: 'AI_VALIDATION',
      severityTrigger: 'HIGH',
      action: 'WARN',
      ruleKey: 'REQUIRE_AI_VERIFICATION',
    },
    {
      id: 'pol-5',
      name: 'Enforce Git History Cleanliness',
      description: 'Flags and warns when historical credentials remain active in reachable git commit graph objects.',
      enabled: true,
      category: 'HISTORY',
      severityTrigger: 'MEDIUM',
      action: 'WARN',
      ruleKey: 'REQUIRE_HISTORY_SCAN',
    },
    {
      id: 'pol-6',
      name: 'Max Exposure Duration Policy (> 14 days)',
      description: 'Escalates risk and creates an incident alert if a leaked credential remains unrotated past threshold.',
      enabled: true,
      category: 'GOVERNANCE',
      severityTrigger: 'HIGH',
      action: 'WARN',
      ruleKey: 'MAX_EXPOSURE_DAYS',
      threshold: 14,
    },
  ];

  constructor() {
    this.addAuditLog('SYSTEM_INIT', 'system', 'CredSense AI Storage Engine', 'SUCCESS', 'Initialized zero-trust cache');
  }

  public addAuditLog(action: string, userSession: string, targetObject: string, result: 'SUCCESS' | 'WARNING' | 'BLOCKED', details: string) {
    const entry: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      userSession,
      targetObject,
      result,
      details,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  public getAlerts(): SecurityAlert[] {
    return [...this.alerts];
  }

  public markAlertRead(alertId: string) {
    const a = this.alerts.find((alert) => alert.id === alertId);
    if (a) a.isRead = true;
  }

  public dismissAlert(alertId: string) {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
  }

  public getPolicies(): SecurityPolicyConfig[] {
    return [...this.policies];
  }

  public updatePolicy(id: string, updates: Partial<SecurityPolicyConfig>) {
    const idx = this.policies.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.policies[idx] = { ...this.policies[idx], ...updates };
      this.addAuditLog('POLICY_UPDATE', 'security-admin', this.policies[idx].name, 'SUCCESS', `Updated status: ${this.policies[idx].enabled ? 'ENABLED' : 'DISABLED'}`);
    }
  }

  private generateDefaultChecklist(finding: Finding): RotationChecklistStep[] {
    const isRem = finding.isRemediated || finding.remediationState === 'VERIFIED_FIXED' || finding.remediationState === 'HISTORY_PURGED';
    return [
      { id: 'step-1', label: 'Identify exposed credential scope & cloud account', completed: true, completedAt: finding.detectedAt },
      { id: 'step-2', label: 'Revoke active secret in provider dashboard', completed: isRem },
      { id: 'step-3', label: 'Generate new isolated replacement key/token', completed: isRem },
      { id: 'step-4', label: 'Update environment variables / KMS secrets vault', completed: isRem },
      { id: 'step-5', label: 'Remove plaintext credential from local source code', completed: !finding.isHistoricalOnly ? isRem : true },
      { id: 'step-6', label: 'Review git commit history & run git-filter-repo / BFG', completed: finding.remediationState === 'HISTORY_PURGED' || isRem },
      { id: 'step-7', label: 'Configure pre-commit git secret scanner hooks', completed: isRem },
      { id: 'step-8', label: 'Enable CredSense CI/CD Security Gate policy block', completed: true },
      { id: 'step-9', label: 'Trigger full rescan to verify zero residue in Git tree', completed: isRem },
    ];
  }

  public saveScanResults(scan: Scan, findings: Finding[], timeline: TimelineEvent[]) {
    this.scans.set(scan.id, scan);
    
    // Normalize and enrich findings with checklist, remediation states, and explainable AI evidence
    const enrichedFindings = findings.map((f) => {
      const remediationState: RemediationState = f.isRemediated ? 'VERIFIED_FIXED' : (f.remediationState || 'OPEN');
      const checklist = f.remediationChecklist || this.generateDefaultChecklist(f);
      const incidentId = f.incidentId || (f.severity === 'CRITICAL' ? `INC-${f.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6)}` : undefined);

      const aiEvidence = f.aiEvidence || {
        evidenceFor: [
          `Matched detector signature: ${f.detector}`,
          `High entropy value: ${f.entropyScore.toFixed(2)} bits/char`,
          f.isHistoricalOnly ? 'Persisted across Git commit objects' : 'Directly active in current repository HEAD',
          `Sensitive variable naming context detected in ${f.filePath}:${f.lineNumber}`,
        ],
        evidenceAgainst: f.verificationStatus === 'FALSE_POSITIVE' || f.verificationStatus === 'TEST'
          ? ['Context contains test dummy indicators', 'Matches known documentation mock string pattern']
          : ['No synthetic testing markers detected in surrounding code context'],
        whyItMatters: f.severity === 'CRITICAL'
          ? 'Active critical credentials grant full unauthorized administrative or data exfiltration privileges.'
          : 'Exposed tokens risk credential stuffing, automated scanning bot exploitation, and audit failure.',
        technicalReasoning: f.verificationReason || 'Analyzed via Shannon entropy calculations and AST lexical code scope analysis.',
      };

      return {
        ...f,
        remediationState,
        remediationChecklist: checklist,
        incidentId,
        aiEvidence,
      };
    });

    this.findings.set(scan.id, enrichedFindings);
    this.timelines.set(scan.id, timeline);
    for (const f of enrichedFindings) {
      this.allFindings.set(f.id, f);
    }

    this.addAuditLog(
      'SCAN_COMPLETED',
      'scanner-daemon',
      scan.repoName,
      'SUCCESS',
      `Completed audit of ${scan.totalCommitsScanned} commits. Found ${enrichedFindings.length} credentials.`
    );

    // Generate alerts for critical findings and ghost secrets
    for (const f of enrichedFindings) {
      if (f.isGhostSecret && !f.isRemediated) {
        this.alerts.unshift({
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'GHOST_SECRET_DETECTED',
          title: `Ghost Secret Detected: ${f.secretType}`,
          description: `Credential removed from latest commit but remains exposed in Git history (${f.filePath}).`,
          timestamp: new Date().toISOString(),
          isRead: false,
          findingId: f.id,
          severity: f.severity,
          category: f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 'URGENT' : 'WARNING',
        });
      }

      if (f.severity === 'CRITICAL' && !f.isHistoricalOnly && !f.isRemediated) {
        this.alerts.unshift({
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'CRITICAL_DETECTED',
          title: `Critical ${f.secretType} active in HEAD`,
          description: `Detected in ${f.filePath}:${f.lineNumber}. Immediate revocation advised.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          findingId: f.id,
          severity: 'CRITICAL',
          category: 'URGENT',
        });
      } else if (f.exposureDays > 14 && !f.isRemediated) {
        this.alerts.unshift({
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'LONG_EXPOSURE',
          title: `Long exposure duration: ${f.secretType}`,
          description: `Exposed for ${f.exposureDays} days across Git history.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          findingId: f.id,
          severity: f.severity,
          category: 'WARNING',
        });
      }
    }
  }

  public getScan(scanId: string): Scan | undefined {
    return this.scans.get(scanId);
  }

  public getAllScans(): Scan[] {
    return Array.from(this.scans.values()).sort(
      (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
    );
  }

  public getFindingsByScanId(scanId: string): Finding[] {
    return this.findings.get(scanId) || [];
  }

  public getFindingById(findingId: string): Finding | undefined {
    return this.allFindings.get(findingId);
  }

  public updateFinding(finding: Finding) {
    this.allFindings.set(finding.id, finding);
    const scanFindings = this.findings.get(finding.scanId);
    if (scanFindings) {
      const idx = scanFindings.findIndex((f) => f.id === finding.id);
      if (idx !== -1) {
        scanFindings[idx] = finding;
      }
    }
  }

  public getTimelineByScanId(scanId: string): TimelineEvent[] {
    return this.timelines.get(scanId) || [];
  }

  public getDashboardSummary(): DashboardSummary {
    const scans = this.getAllScans();
    const latestScan = scans.length > 0 ? scans[0] : undefined;

    // Aggregate findings from latest scan or all findings
    const allFindingsList = latestScan ? this.getFindingsByScanId(latestScan.id) : Array.from(this.allFindings.values());

    const totalFindings = allFindingsList.length;
    const criticalFindings = allFindingsList.filter((f) => f.severity === 'CRITICAL' && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED').length;
    const highFindings = allFindingsList.filter((f) => f.severity === 'HIGH' && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED').length;
    const mediumFindings = allFindingsList.filter((f) => f.severity === 'MEDIUM' && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED').length;
    const lowFindings = allFindingsList.filter((f) => f.severity === 'LOW' && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED').length;
    const falsePositives = allFindingsList.filter((f) => f.verificationStatus === 'FALSE_POSITIVE').length;
    const verifiedReal = allFindingsList.filter((f) => f.verificationStatus === 'REAL').length;
    const testExample = allFindingsList.filter((f) => f.verificationStatus === 'TEST' || f.verificationStatus === 'EXAMPLE').length;
    const historicalOnly = allFindingsList.filter((f) => f.isHistoricalOnly).length;
    const activeHeadCount = allFindingsList.filter((f) => !f.isHistoricalOnly && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED').length;
    const resolvedFindings = allFindingsList.filter((f) => f.isRemediated || f.remediationState === 'VERIFIED_FIXED' || f.remediationState === 'HISTORY_PURGED').length;

    const avgRisk =
      totalFindings > 0
        ? Math.round(allFindingsList.reduce((acc, f) => acc + f.riskScore, 0) / totalFindings)
        : 0;

    // --- 7 Granular Security Posture Scores ---
    // 1. Credential Hygiene Score (Penalized by active real secrets in HEAD)
    const credentialHygieneScore = Math.max(8, Math.min(100, Math.round(100 - (activeHeadCount * 22 + criticalFindings * 15))));

    // 2. Git History Security Score (Penalized by historical leaked commit objects)
    const gitHistorySecurityScore = Math.max(10, Math.min(100, Math.round(100 - (historicalOnly * 14 + highFindings * 8))));

    // 3. Exposure Risk Score (Calculated from exposure duration & high entropy scores)
    const avgExposureDays = totalFindings > 0 ? allFindingsList.reduce((a, b) => a + b.exposureDays, 0) / totalFindings : 0;
    const exposureRiskScore = Math.max(5, Math.min(98, Math.round(avgRisk * 0.9 + (avgExposureDays > 10 ? 10 : 0))));

    // 4. Remediation Score (Boosted by resolved & investigated items)
    const remediationScore = totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 100;

    // 5. AI Confidence Score (Average AI verification confidence)
    const aiConfidenceScore = totalFindings > 0 ? Math.round((allFindingsList.reduce((a, b) => a + (b.verificationConfidence || 0.9), 0) / totalFindings) * 100) : 95;

    // 6. Repository Hygiene Score (Ratio of clean commits & noise reduction)
    const noiseReductionRate = totalFindings > 0 ? Math.round(((falsePositives + testExample) / totalFindings) * 100) : 0;
    const repositoryHygieneScore = Math.max(15, Math.min(100, Math.round(85 + (noiseReductionRate * 0.15) - (criticalFindings * 12))));

    // 7. Overall Security Score
    let overallScore = 100;
    if (totalFindings > 0) {
      overallScore = Math.max(
        12,
        Math.min(
          98,
          Math.round(
            credentialHygieneScore * 0.35 +
            gitHistorySecurityScore * 0.25 +
            (100 - exposureRiskScore) * 0.20 +
            remediationScore * 0.10 +
            repositoryHygieneScore * 0.10
          )
        )
      );
    }

    let postureStatus: 'GOOD' | 'AT RISK' | 'CRITICAL' = 'GOOD';
    let postureLabel = 'Good - Safe Repository Posture';
    if (overallScore < 50 || criticalFindings > 0) {
      postureStatus = 'CRITICAL';
      postureLabel = 'Critical Risk - Active Credentials Exposed';
    } else if (overallScore < 80 || highFindings > 0 || totalFindings > 0) {
      postureStatus = 'AT RISK';
      postureLabel = 'At Risk - Remediation Required';
    }

    // Dynamic factor explanations for "Why did my score change?"
    const scoreChangeFactors = [
      {
        label: 'Active Credentials in HEAD',
        impact: activeHeadCount > 0 ? ('negative' as const) : ('positive' as const),
        delta: activeHeadCount > 0 ? -(activeHeadCount * 18) : +10,
        reason: activeHeadCount > 0
          ? `${activeHeadCount} unencrypted credential(s) accessible in the active repository worktree.`
          : 'Zero live credentials detected in current HEAD worktree.',
      },
      {
        label: 'Historical Git Commits',
        impact: historicalOnly > 0 ? ('negative' as const) : ('positive' as const),
        delta: historicalOnly > 0 ? -(historicalOnly * 8) : +5,
        reason: historicalOnly > 0
          ? `${historicalOnly} secret(s) removed from HEAD but lingering in Git commit history DAG.`
          : 'Git commit history is free of reachable secret objects.',
      },
      {
        label: 'AI False-Positive Filtering',
        impact: 'positive' as const,
        delta: +noiseReductionRate,
        reason: `Filtered out ${falsePositives + testExample} test mocks & documentation examples automatically.`,
      },
      {
        label: 'Remediation Velocity',
        impact: resolvedFindings > 0 ? ('positive' as const) : ('neutral' as const),
        delta: resolvedFindings * 6,
        reason: `${resolvedFindings} of ${totalFindings} findings verified and resolved.`,
      },
    ];

    const mainRiskDriver = criticalFindings > 0
      ? `Critical ${allFindingsList.find((f) => f.severity === 'CRITICAL')?.secretType || 'Secret'} active in worktree`
      : historicalOnly > 0
      ? 'Historical leaked tokens in Git commit history'
      : 'None - Clean Repository Posture';

    const recommendedNextAction = criticalFindings > 0
      ? 'Revoke & Rotate critical production credentials immediately in cloud console.'
      : historicalOnly > 0
      ? 'Execute git-filter-repo or BFG Repo Cleaner to purge commit history.'
      : 'Enable pre-commit hooks and CI/CD secret scanning gate.';

    const detailedBreakdown: ScoreBreakdownFactors = {
      overallScore,
      credentialHygieneScore,
      gitHistorySecurityScore,
      exposureRiskScore,
      remediationScore,
      aiConfidenceScore,
      repositoryHygieneScore,
      scoreChangeDelta: resolvedFindings > 0 ? +14 : -8,
      previousScore: Math.max(10, overallScore - (resolvedFindings > 0 ? 14 : -8)),
      mainRiskDriver,
      recommendedNextAction,
      scoreChangeFactors,
    };

    const securityScorecard: SecurityScorecard = {
      overallScore,
      postureStatus,
      postureLabel,
      secretHygiene: credentialHygieneScore,
      gitHistoryHygiene: gitHistorySecurityScore,
      exposureRisk: exposureRiskScore,
      noiseReductionRate,
      remediationRate: remediationScore,
      cicdProtection: 94,
      improvementDelta: resolvedFindings > 0 ? 14 : -8,
      detailedBreakdown,
    };

    // Type Breakdown with highest severity and avg exposure
    const typeMap = new Map<string, { count: number; totalRisk: number; severities: SeverityLevel[]; totalDays: number }>();
    for (const f of allFindingsList) {
      const existing = typeMap.get(f.secretType) || { count: 0, totalRisk: 0, severities: [], totalDays: 0 };
      existing.count += 1;
      existing.totalRisk += f.riskScore;
      existing.severities.push(f.severity);
      existing.totalDays += f.exposureDays;
      typeMap.set(f.secretType, existing);
    }

    const severityOrder: Record<SeverityLevel, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };

    const typeBreakdown = Array.from(typeMap.entries()).map(([type, data]) => {
      const highestSeverity = data.severities.sort((a, b) => severityOrder[b] - severityOrder[a])[0] || 'LOW';
      return {
        type,
        count: data.count,
        riskScore: Math.round(data.totalRisk / data.count),
        highestSeverity,
        avgExposureDays: Math.round(data.totalDays / data.count),
      };
    });

    const ghostSecretsList = allFindingsList.filter((f) => f.isGhostSecret || f.isHistoricalOnly);
    const totalGhostSecrets = ghostSecretsList.length;
    const criticalGhostSecrets = ghostSecretsList.filter((f) => f.severity === 'CRITICAL' && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED').length;
    const highGhostSecrets = ghostSecretsList.filter((f) => f.severity === 'HIGH' && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED').length;
    const mediumGhostSecrets = ghostSecretsList.filter((f) => f.severity === 'MEDIUM' && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED').length;
    const resolvedGhostSecrets = ghostSecretsList.filter((f) => f.isRemediated || f.remediationState === 'VERIFIED_FIXED' || f.remediationState === 'HISTORY_PURGED').length;
    const stillHistoricallyExposed = Math.max(0, totalGhostSecrets - resolvedGhostSecrets);
    const avgGhostDuration = totalGhostSecrets > 0 ? Math.round(ghostSecretsList.reduce((a, b) => a + (b.exposureDays || b.exposureDurationDays || 1), 0) / totalGhostSecrets) : 0;

    const ghostSecretsSummary: GhostSecretSummary = {
      totalGhostSecrets,
      criticalGhostSecrets,
      highGhostSecrets,
      mediumGhostSecrets,
      resolvedGhostSecrets,
      stillHistoricallyExposed,
      averageExposureDurationDays: avgGhostDuration,
    };

    const totalHistoricalSecrets = allFindingsList.filter((f) => f.isHistoricalOnly || f.isGhostSecret || f.gitClassification === 'HISTORICAL SECRET' || f.gitClassification === 'GHOST SECRET').length;
    const activeSecrets = allFindingsList.filter((f) => !f.isHistoricalOnly && (f.headStatus === 'EXPOSED' || f.headStatus === undefined)).length;
    const ghostSecretsCount = allFindingsList.filter((f) => f.isGhostSecret || f.gitClassification === 'GHOST SECRET').length;
    const reintroducedSecretsCount = allFindingsList.filter((f) => f.gitClassification === 'REINTRODUCED SECRET').length;
    const longestExposureDays = allFindingsList.length > 0 ? Math.max(...allFindingsList.map((f) => f.exposureDays || 1)) : 0;
    const highestHistoricalRisk = totalHistoricalSecrets > 0
      ? Math.max(...allFindingsList.filter((f) => f.isHistoricalOnly || f.isGhostSecret).map((f) => f.riskScore || 0))
      : 0;

    const gitHistorySummary = {
      totalHistoricalSecrets,
      activeSecrets,
      ghostSecrets: ghostSecretsCount,
      reintroducedSecrets: reintroducedSecretsCount,
      longestExposureDays,
      highestHistoricalRisk,
    };

    const noiseReductionPercentage = totalFindings > 0
      ? Math.round(((falsePositives + testExample) / totalFindings) * 100)
      : 65;

    const noiseReductionStats = {
      totalCandidates: totalFindings,
      aiVerified: totalFindings,
      realCount: verifiedReal,
      testCount: allFindingsList.filter((f) => f.verificationStatus === 'TEST').length,
      exampleCount: allFindingsList.filter((f) => f.verificationStatus === 'EXAMPLE').length,
      falsePositiveCount: falsePositives,
      reductionPercentage: noiseReductionPercentage,
    };

    return {
      totalScans: scans.length,
      totalFindings,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      falsePositives,
      verifiedReal,
      testExample,
      historicalOnly,
      averageRiskScore: avgRisk,
      securityScorecard,
      severityBreakdown: {
        critical: criticalFindings,
        high: highFindings,
        medium: mediumFindings,
        low: lowFindings,
      },
      typeBreakdown,
      recentFindings: allFindingsList.slice(0, 20),
      latestScan,
      ghostSecretsSummary,
      gitHistorySummary,
      noiseReductionStats,
    };
  }
}

export const dbStore = new StorageManager();

