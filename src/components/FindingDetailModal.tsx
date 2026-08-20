import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  GitCommit,
  Clock,
  Key,
  FileCode,
  Sparkles,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  Layers,
  AlertOctagon,
  ArrowRight,
  ExternalLink,
  Ghost,
  Calendar,
  RefreshCw,
  Cpu,
  RotateCcw,
  CheckSquare,
  Square,
  ListOrdered,
} from 'lucide-react';
import { Finding, AIClassification } from '../types';
import { safeFetch } from '../utils/api';

interface FindingDetailModalProps {
  finding: Finding | null;
  onClose: () => void;
  onToggleRemediate?: (findingId: string) => void;
  onFindingUpdated?: (updated: Finding) => void;
}

export function FindingDetailModal({
  finding: initialFinding,
  onClose,
  onToggleRemediate,
  onFindingUpdated,
}: FindingDetailModalProps) {
  const [finding, setFinding] = useState<Finding | null>(initialFinding);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<number, boolean>>({
    1: true, // Step 1 is identified by scanner
    2: Boolean(initialFinding?.isRemediated),
    3: Boolean(initialFinding?.isRemediated),
    4: true,
    5: Boolean(initialFinding?.isRemediated),
    6: false,
    7: false,
    8: Boolean(initialFinding?.isRemediated),
  });

  if (!finding) return null;

  const isCritical = finding.severity === 'CRITICAL';
  const isRemediated = Boolean(finding.isRemediated);
  const isGhost = Boolean(finding.isGhostSecret || finding.isHistoricalOnly);

  const showActionFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Re-verify finding on demand via AI
  const handleVerifyAgain = async () => {
    setIsVerifying(true);
    try {
      const data = await safeFetch<any>(`/api/findings/${finding.id}/verify`, {
        method: 'POST',
      });
      const updated = data.finding || data;
      if (updated && updated.id) {
        setFinding(updated);
        if (onFindingUpdated) onFindingUpdated(updated);
        showActionFeedback(`Re-verified with AI: ${updated.verificationStatus} (${Math.round(updated.verificationConfidence * 100)}%)`);
      }
    } catch (err: any) {
      console.error('Error re-verifying:', err);
      showActionFeedback(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Manual classification override
  const handleSetClassification = async (classification: AIClassification) => {
    try {
      const data = await safeFetch<any>(`/api/findings/${finding.id}/classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classification,
          reason: `Manually classified as ${classification} by security engineer.`,
        }),
      });
      const updated = data.finding || data;
      if (updated && updated.id) {
        setFinding(updated);
        if (onFindingUpdated) onFindingUpdated(updated);
        showActionFeedback(`Classified as ${classification}`);
      }
    } catch (err: any) {
      console.error('Error setting classification:', err);
      showActionFeedback(err.message || 'Failed to update classification');
    }
  };

  const toggleStep = (stepNum: number) => {
    setChecklist((prev) => {
      const next = { ...prev, [stepNum]: !prev[stepNum] };
      const completedCount = Object.values(next).filter(Boolean).length;
      if (completedCount >= 7 && !finding.isRemediated && onToggleRemediate) {
        onToggleRemediate(finding.id);
      }
      return next;
    });
  };

  const completedStepsCount = Object.values(checklist).filter(Boolean).length;

  const bfgCommand =
    finding.ghostRemediationGuidance?.gitFilterRepoCommand ||
    `git filter-repo --replace-text <(echo "${finding.maskedSecret}==>[REDACTED]") --force`;

  // Secret type specific remediation steps (Actionable Fixes)
  const getPlaybookSteps = (secretType: string) => {
    const st = secretType.toLowerCase();
    if (st.includes('aws')) {
      return [
        { num: 1, title: 'Revoke Exposed AWS IAM Key', detail: 'Deactivate and delete the exposed Access Key ID in the AWS IAM Console immediately.' },
        { num: 2, title: 'Generate Replacement IAM Credentials', detail: 'Provision a new IAM User key or prefer AWS IAM Roles with temporary STS credentials.' },
        { num: 3, title: 'Remove Credential from Source Code', detail: 'Delete all hardcoded AKIA strings from source code files and environment configs.' },
        { num: 4, title: 'Review AWS CloudTrail Activity', detail: 'Inspect CloudTrail events for suspicious API calls made using the exposed access key.' },
        { num: 5, title: 'Purge Git History', detail: 'Use git-filter-repo or BFG to permanently redact the credential from Git commit history.' },
        { num: 6, title: 'Move to AWS Secrets Manager / Parameter Store', detail: 'Inject secrets securely via environment variables or IAM instance profiles.' },
        { num: 7, title: 'Enable CredSense CI/CD Pre-Commit Gate', detail: 'Install git pre-commit hooks to block future AWS key commits before push.' },
        { num: 8, title: 'Run Verification Scan', detail: 'Run CredSense AI verification rescan to confirm clean repository posture.' },
      ];
    } else if (st.includes('github')) {
      return [
        { num: 1, title: 'Revoke GitHub Personal Access Token', detail: 'Immediately revoke the exposed token under GitHub Settings > Developer Settings > Personal Access Tokens.' },
        { num: 2, title: 'Generate Fine-Grained Token', detail: 'Create a fine-grained token scoped strictly to necessary repositories and minimum permissions.' },
        { num: 3, title: 'Remove Token from Repository', detail: 'Remove the hardcoded ghp_ string from all application files and configuration scripts.' },
        { num: 4, title: 'Audit GitHub Security Logs', detail: 'Review security audit logs and recent webhook/repository actions for unauthorized access.' },
        { num: 5, title: 'Purge Historical Commits', detail: 'Run git-filter-repo to remove the token from all historical branch commits.' },
        { num: 6, title: 'Store in GitHub Actions Secrets', detail: 'Migrate token to repository/organization encrypted secrets.' },
        { num: 7, title: 'Enforce Secret Scanning on Pull Requests', detail: 'Configure CredSense CI/CD GitHub Actions workflow to block merges on secret leaks.' },
        { num: 8, title: 'Verify Clean Repository Scan', detail: 'Execute CredSense AI verification rescan to ensure zero exposure remains.' },
      ];
    } else if (st.includes('database') || st.includes('postgres') || st.includes('mysql') || st.includes('mongo')) {
      return [
        { num: 1, title: 'Rotate Database User Password', detail: 'Change the password for the exposed database user account in your database management console.' },
        { num: 2, title: 'Terminate Active Connection Pools', detail: 'Sever existing connection pools to force re-authentication with new rotated credentials.' },
        { num: 3, title: 'Remove Connection URI from Code', detail: 'Strip hardcoded mongodb:// or postgres:// connection strings from configuration files.' },
        { num: 4, title: 'Audit Database Query Telemetry', detail: 'Review database access and slow query logs for unauthorized data exfiltration patterns.' },
        { num: 5, title: 'Purge Git History Blobs', detail: 'Sanitize previous Git commit diffs to prevent leakage through historical logs.' },
        { num: 6, title: 'Migrate to Secrets Manager / Vault', detail: 'Store database credentials in HashiCorp Vault or Cloud KMS with automated rotation.' },
        { num: 7, title: 'Add Pre-Commit Secret Scanning', detail: 'Block database URI patterns in developer pre-commit hooks.' },
        { num: 8, title: 'Run CredSense Verification Scan', detail: 'Verify with CredSense AI that no database credentials remain in the repository.' },
      ];
    } else if (st.includes('jwt') || st.includes('private key') || st.includes('rsa')) {
      return [
        { num: 1, title: 'Rotate Signing Key / Secret', detail: 'Generate a new RSA 2048+ private key or HMAC-SHA256 256-bit signing secret.' },
        { num: 2, title: 'Invalidate Active Sessions / Tokens', detail: 'Increment JWT token version or clear token cache to invalidate active forged tokens.' },
        { num: 3, title: 'Remove Key File from Worktree', detail: 'Delete .pem, .key, or hardcoded signing secret from source tree.' },
        { num: 4, title: 'Inspect Authentication Logs', detail: 'Review authentication service logs for anomalous token validation requests.' },
        { num: 5, title: 'Purge Key Blobs from Git History', detail: 'Execute git-filter-repo to eliminate the private key from all commit blobs.' },
        { num: 6, title: 'Inject Signing Keys via Cloud KMS', detail: 'Use asymmetric KMS signing or secure environment variables.' },
        { num: 7, title: 'Configure CI/CD Secret Gate', detail: 'Enable automated PR blocking for PEM and private key signatures.' },
        { num: 8, title: 'Verify Full Clean Status', detail: 'Trigger CredSense AI rescan to confirm zero residual key references.' },
      ];
    }

    // Generic API Key Playbook
    return [
      { num: 1, title: 'Revoke Exposed API Key', detail: `Revoke this ${finding.secretType} in the provider developer portal immediately.` },
      { num: 2, title: 'Generate Replacement Key', detail: 'Create a new key with restricted IP whitelisting and minimal functional scopes.' },
      { num: 3, title: 'Remove Key from Codebase', detail: 'Remove the hardcoded secret value from code and commit the clean file.' },
      { num: 4, title: 'Review API Usage Telemetry', detail: 'Check provider usage metrics and billing for unexpected spikes in API traffic.' },
      { num: 5, title: 'Purge Git History', detail: 'Run git-filter-repo or BFG Repo Cleaner to scrub the token from historical commits.' },
      { num: 6, title: 'Store in Centralized Secrets Manager', detail: 'Inject key at runtime via Doppler, AWS Secrets Manager, or .env files added to .gitignore.' },
      { num: 7, title: 'Enable CI/CD Guardrails', detail: 'Add CredSense CI/CD gate to block pull requests containing unmasked keys.' },
      { num: 8, title: 'Run Verification Scan', detail: 'Execute CredSense AI verification rescan to confirm complete remediation.' },
    ];
  };

  const playbookSteps = getPlaybookSteps(finding.secretType);

  // Calculated risk score contributors
  const contributors = finding.riskContributors
    ? [
        { label: 'Secret Type Sensitivity', points: finding.riskContributors.secretSensitivity, reason: `High-value API token: ${finding.secretType}` },
        { label: 'HEAD Exposure Status', points: finding.riskContributors.currentHeadExposure, reason: finding.isHistoricalOnly ? 'Lingering in Git commit DAG history' : 'Active in current working tree' },
        { label: 'AI Verification Confidence', points: finding.riskContributors.aiConfidenceScore, reason: `AI validated as ${finding.verificationStatus} (${Math.round(finding.verificationConfidence * 100)}%)` },
        { label: 'Exposure Window Duration', points: finding.riskContributors.exposureDuration, reason: `Exposed for ${finding.exposureDays} days across releases` },
        { label: 'Context Risk & Entropy', points: finding.riskContributors.contextRisk, reason: `File path context & high character entropy (${finding.entropyScore.toFixed(2)})` },
      ]
    : [
        { label: 'Secret Type Sensitivity', points: isCritical ? 35 : 20, reason: `High-value API token: ${finding.secretType}` },
        { label: 'HEAD Exposure Status', points: finding.isHistoricalOnly ? 10 : 25, reason: finding.isHistoricalOnly ? 'Lingering in Git commit DAG history' : 'Active in current working tree' },
        { label: 'AI Verification Confidence', points: 15, reason: `AI validated as ${finding.verificationStatus} (${Math.round(finding.verificationConfidence * 100)}%)` },
        { label: 'Exposure Window Duration', points: Math.min(20, Math.max(5, Math.round(finding.exposureDays * 1.5))), reason: `Exposed for ${finding.exposureDays} days across releases` },
        { label: 'Shannon Entropy Score', points: 10, reason: `High random character distribution (${finding.entropyScore.toFixed(2)})` },
      ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                isCritical ? 'bg-red-600' : 'bg-orange-500'
              }`}
            >
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">{finding.secretType}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isCritical ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}
                >
                  {finding.severity} ({finding.riskScore}/100)
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                  {finding.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {finding.filePath} : line {finding.lineNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleRemediate && onToggleRemediate(finding.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isRemediated
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isRemediated ? 'Remediated ✓' : 'Mark as Remediated'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toast Feedback */}
        {actionMessage && (
          <div className="bg-sky-600 text-white text-xs font-bold px-6 py-2 flex items-center justify-between">
            <span>{actionMessage}</span>
            <Check className="w-4 h-4" />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Ghost Secret Intelligence Banner (if ghost secret) */}
          {isGhost && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 text-white shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Ghost className="w-3.5 h-3.5" />
                    <span>GHOST SECRET CLASSIFICATION</span>
                  </span>
                  <span className="text-xs text-slate-300">Secret removed in HEAD but reachable in Git commit tree</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>CURRENT HEAD: CLEAN</span>
                  </div>
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-900/60 text-red-300 border border-red-700/60">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>GIT HISTORY: EXPOSED</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Non-Reversible Fingerprint</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <code className="text-xs font-mono font-bold text-amber-300 truncate">
                      {finding.fingerprint || 'FPR-GENERIC'}
                    </code>
                    <button
                      onClick={() => handleCopyText(finding.fingerprint || '', 'fpr')}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      {copiedKey === 'fpr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">First Exposure</span>
                  <span className="text-xs font-bold text-slate-200 block mt-0.5">
                    {new Date(finding.firstExposureDate || finding.exposureStart).toLocaleDateString()} (commit {finding.commitId.substring(0, 7)})
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Removed From HEAD</span>
                  <span className="text-xs font-bold text-emerald-300 block mt-0.5">
                    {finding.removedFromHeadDate ? new Date(finding.removedFromHeadDate).toLocaleDateString() : 'Purged in subsequent commit'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 1. Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Masked Credential</span>
              <span className="text-xs font-mono font-bold text-slate-900 truncate block mt-0.5">
                {finding.maskedSecret}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Classification</span>
              <span className="text-xs font-bold text-sky-700 block mt-0.5">
                {finding.verificationStatus} ({Math.round(finding.verificationConfidence * 100)}%)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Exposure Window</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {finding.exposureDays} Days ({finding.isHistoricalOnly ? 'Historical Only' : 'Active in HEAD'})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Shannon Entropy</span>
              <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5">
                {finding.entropyScore.toFixed(3)}
              </span>
            </div>
          </div>

          {/* 2. EXACT CORE FEATURE 1: AI VERIFICATION BLOCK */}
          <div className="bg-gradient-to-br from-sky-50/80 via-white to-blue-50/60 rounded-xl border border-sky-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">AI Verification</h4>
                  <p className="text-[11px] text-slate-500">
                    Semantic contextual evaluation to eliminate false positives
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-sky-600" />
                  <span>{finding.verificationMode === 'gemini' ? 'Gemini AI Verification' : 'Local Verification'}</span>
                </span>

                <button
                  onClick={handleVerifyAgain}
                  disabled={isVerifying}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-50"
                  title="Run real-time verification again"
                >
                  <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Verifying...' : 'Verify Again'}</span>
                </button>
              </div>
            </div>

            {/* AI Verification Structured Output */}
            <div className="bg-white rounded-lg border border-sky-100 p-4 space-y-2 text-xs font-mono text-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Classification: </span>
                  <span
                    className={`font-black px-1.5 py-0.5 rounded text-[11px] ${
                      finding.verificationStatus === 'REAL'
                        ? 'bg-red-100 text-red-800'
                        : finding.verificationStatus === 'TEST'
                        ? 'bg-amber-100 text-amber-800'
                        : finding.verificationStatus === 'EXAMPLE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {finding.verificationStatus}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Confidence: </span>
                  <span className="font-bold text-sky-700">{Math.round(finding.verificationConfidence * 100)}%</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Detection: </span>
                  <span className="font-medium text-slate-700">{finding.detectionMethod || 'Regex + Entropy'}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Context Analysis: </span>
                  <span className="font-medium text-slate-700">{finding.contextAnalysis || (finding.verificationStatus === 'REAL' ? 'Production Configuration' : 'Test/Sample Context')}</span>
                </div>
              </div>

              <div className="pt-1 font-sans text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">Why:</span>
                <p className="text-slate-600 leading-relaxed">{finding.verificationReason}</p>
              </div>
            </div>

            {/* Manual Classification Override Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500">Security Override:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleSetClassification('REAL')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                    finding.verificationStatus === 'REAL'
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-white hover:bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  Mark as Real
                </button>
                <button
                  onClick={() => handleSetClassification('TEST')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                    finding.verificationStatus === 'TEST'
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  Mark as Test
                </button>
                <button
                  onClick={() => handleSetClassification('EXAMPLE')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                    finding.verificationStatus === 'EXAMPLE'
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  Mark as Example
                </button>
                <button
                  onClick={() => handleSetClassification('FALSE_POSITIVE')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                    finding.verificationStatus === 'FALSE_POSITIVE'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  Mark as False Positive
                </button>
              </div>
            </div>
          </div>

          {/* 3. Detection Evidence Code Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                Detection Evidence (Redacted Context)
              </span>
              <span className="text-[10px] font-mono text-slate-400">{finding.filePath}:{finding.lineNumber}</span>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-inner">
              <div className="text-slate-500 text-[10px] mb-2"># Context extracted from Git Object Tree:</div>
              <div className="text-emerald-400 font-semibold">{finding.surroundingContext || `# ${finding.secretType} detected at line ${finding.lineNumber}`}</div>
            </div>
          </div>

          {/* 4. EXACT CORE FEATURE 4: ACTIONABLE FIXES & 8-STEP REMEDIATION PLAYBOOK */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Actionable Fixes • {finding.secretType} Playbook
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  Progress: <span className="text-emerald-600 font-black">{completedStepsCount} / {playbookSteps.length}</span>
                </span>
                <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(completedStepsCount / playbookSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              {playbookSteps.map((step) => {
                const isChecked = Boolean(checklist[step.num]);
                return (
                  <div
                    key={step.num}
                    onClick={() => toggleStep(step.num)}
                    className={`p-3 rounded-lg border text-xs transition cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <button className="mt-0.5 text-emerald-600 shrink-0">
                      {isChecked ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">Step {step.num}: {step.title}</span>
                        {isChecked && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Done ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Multi-Factor Risk Contributors Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Calculated Risk Contributors Breakdown (Total: {finding.riskScore}/100)
              </span>
              <span className="text-xs font-bold text-slate-500">CredSense Risk Engine v2</span>
            </div>

            <div className="space-y-2">
              {contributors.map((c, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{c.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{c.reason}</div>
                  </div>
                  <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    +{c.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Git Commit Provenance */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-slate-500" />
              Git Commit Provenance
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Commit Hash</span>
                <span className="font-mono font-bold text-slate-900">{finding.commitId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Author</span>
                <span className="font-medium text-slate-800">{finding.author}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Commit Message</span>
                <span className="font-medium text-slate-800 truncate block">{finding.commitMessage}</span>
              </div>
            </div>
          </div>

          {/* 7. Purge Git History Command */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Git History Sanitization Command
              </span>
              <button
                onClick={() => handleCopyText(bfgCommand, 'modal-cmd')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
              >
                {copiedKey === 'modal-cmd' ? 'Copied!' : 'Copy Command'}
              </button>
            </div>
            <pre className="font-mono text-[11px] text-sky-300 overflow-x-auto whitespace-pre-wrap">{bfgCommand}</pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <span className="text-[11px] text-slate-400">
            Masked with Zero-Trust CredSense Redaction
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold shadow-xs cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
