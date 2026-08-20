import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Lock,
  GitBranch,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
  ListOrdered,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Activity,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Finding, RemediationVerificationResult } from '../types';
import { safeFetch } from '../utils/api';

interface RemediationPlaybookViewProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onToggleRemediate?: (findingId: string) => void;
  onExportReport?: () => void;
  onRefreshData?: () => void;
}

export function RemediationPlaybookView({
  findings,
  onSelectFinding,
  onToggleRemediate,
  onExportReport,
  onRefreshData,
}: RemediationPlaybookViewProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(findings[0]?.id || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRunningVerificationScan, setIsRunningVerificationScan] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<RemediationVerificationResult | null>(null);
  const [checklist, setChecklist] = useState<Record<string, Record<number, boolean>>>({});

  const activeFinding = findings.find((f) => f.id === selectedFindingId) || findings[0];

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRunVerificationScan = async () => {
    setIsRunningVerificationScan(true);
    try {
      const data = await safeFetch<any>('/api/remediation/verify-scan', {
        method: 'POST',
      });
      if (data?.verification) {
        setVerificationResult(data.verification);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Error running verification scan:', err);
    } finally {
      setIsRunningVerificationScan(false);
    }
  };

  const toggleChecklistStep = (findingId: string, stepNum: number) => {
    setChecklist((prev) => {
      const current = prev[findingId] || { 1: true, 2: false, 3: false, 4: true, 5: false, 6: false, 7: false, 8: false };
      const next = { ...current, [stepNum]: !current[stepNum] };
      const completedCount = Object.values(next).filter(Boolean).length;
      if (completedCount >= 7 && activeFinding && !activeFinding.isRemediated && onToggleRemediate) {
        onToggleRemediate(findingId);
      }
      return { ...prev, [findingId]: next };
    });
  };

  if (!activeFinding) {
    return (
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-700">No Remediations Pending</h3>
        <p className="text-xs text-slate-400 mt-1">Scan a repository to generate tailored 8-step remediation playbooks.</p>
      </div>
    );
  }

  const isRemediated = Boolean(activeFinding.isRemediated);
  const findingSteps = checklist[activeFinding.id] || {
    1: true,
    2: isRemediated,
    3: isRemediated,
    4: true,
    5: isRemediated,
    6: false,
    7: false,
    8: isRemediated,
  };
  const completedStepsCount = Object.values(findingSteps).filter(Boolean).length;

  const gitFilterCommand = `git filter-repo --replace-text <(echo "${activeFinding.maskedSecret}==>[REDACTED]") --force`;
  const bfgCommand = `bfg --replace-text <(echo "${activeFinding.maskedSecret}") my-repo.git && git reflog expire --expire=now --all && git gc --prune=now --aggressive`;

  // Secret-type tailored steps
  const getPlaybookSteps = (secretType: string) => {
    const st = secretType.toLowerCase();
    if (st.includes('aws')) {
      return [
        { num: 1, tag: 'Immediate', title: 'Revoke Exposed AWS IAM Key in Console', detail: `Log into the AWS IAM console and deactivate access key ID for ${activeFinding.maskedSecret}.` },
        { num: 2, tag: 'Security Best Practice', title: 'Generate Replacement IAM Credentials', detail: 'Create a new key or use IAM Roles with short-lived STS temporary credentials.' },
        { num: 3, tag: 'Code Modification', title: 'Remove Hardcoded Key from Source Code', detail: `Replace AKIA occurrences in ${activeFinding.filePath} with process.env.AWS_ACCESS_KEY_ID.` },
        { num: 4, tag: 'Audit Log Inspection', title: 'Review AWS CloudTrail Activity', detail: 'Inspect CloudTrail events for suspicious API activity using the exposed key.' },
        { num: 5, tag: 'History Rewrite', title: 'Purge Git Commit History DAG', detail: 'Scrub the credential blob from Git commit history using git-filter-repo.' },
        { num: 6, tag: 'Infrastructure', title: 'Migrate to AWS Secrets Manager / Parameter Store', detail: 'Store secret in AWS Secrets Manager and inject into containers at runtime.' },
        { num: 7, tag: 'Automation', title: 'Enable Pre-Commit and CI/CD Secret Gates', detail: 'Install git pre-commit hooks to block unmasked keys before git push.' },
        { num: 8, tag: 'Verification', title: 'Run CredSense AI Verification Rescan', detail: 'Execute verification rescan to confirm zero exposure residue remains.' },
      ];
    } else if (st.includes('github')) {
      return [
        { num: 1, tag: 'Immediate', title: 'Revoke Personal Access Token (PAT)', detail: 'Revoke the compromised token in GitHub Settings > Developer Settings > Personal Access Tokens.' },
        { num: 2, tag: 'Security Best Practice', title: 'Generate Fine-Grained Token', detail: 'Provision a fine-grained token with minimum repo permissions and expiration date.' },
        { num: 3, tag: 'Code Modification', title: 'Remove Hardcoded Token from Code', detail: `Remove hardcoded ghp_ string from ${activeFinding.filePath}.` },
        { num: 4, tag: 'Audit Log Inspection', title: 'Inspect GitHub Security Audit Logs', detail: 'Check organization and repository audit logs for unauthorized repo clones or push events.' },
        { num: 5, tag: 'History Rewrite', title: 'Purge Git History with git-filter-repo', detail: 'Permanently remove token blobs from past commits in the repository DAG.' },
        { num: 6, tag: 'Infrastructure', title: 'Store in GitHub Actions Secrets / Vault', detail: 'Add token as an encrypted repository secret rather than in committed files.' },
        { num: 7, tag: 'Automation', title: 'Enforce Pull Request Secret Scanning Guardrails', detail: 'Enable CredSense CI/CD Action to fail builds if tokens are detected in PRs.' },
        { num: 8, tag: 'Verification', title: 'Execute Verification Scan', detail: 'Confirm clean repository tree via CredSense verification rescan.' },
      ];
    }

    // Default Playbook
    return [
      { num: 1, tag: 'Immediate', title: 'Revoke Compromised Credential', detail: `Log into the provider developer console for ${activeFinding.secretType} and invalidate the key.` },
      { num: 2, tag: 'Security Best Practice', title: 'Generate Replacement Key', detail: 'Provision a new key with restricted permissions and IP allowlists.' },
      { num: 3, tag: 'Code Modification', title: 'Remove Plaintext Secret from Worktree', detail: `Replace secret in ${activeFinding.filePath} with environment variable lookup.` },
      { num: 4, tag: 'Audit Log Inspection', title: 'Review API Usage & Access Telemetry', detail: 'Check provider API dashboards for anomalous usage spikes or unauthorized requests.' },
      { num: 5, tag: 'History Rewrite', title: 'Purge Git Commit History Blobs', detail: 'Run git-filter-repo or BFG Repo Cleaner to scrub historical commits.' },
      { num: 6, tag: 'Infrastructure', title: 'Move to Centralized Secrets Manager', detail: 'Inject secrets securely via Doppler, HashiCorp Vault, or AWS Secrets Manager.' },
      { num: 7, tag: 'Automation', title: 'Enable Pre-Commit & CI/CD Guardrails', detail: 'Block future secret leaks using CredSense CI/CD automated gates.' },
      { num: 8, tag: 'Verification', title: 'Run Verification Scan', detail: 'Execute CredSense AI verification rescan to confirm complete remediation.' },
    ];
  };

  const currentPlaybook = getPlaybookSteps(activeFinding.secretType);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Actionable Fixes & Remediation Playbook
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  8-Step Interactive Guide
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Step-by-step guidance to safely invalidate credentials, purge Git history blobs, and enforce guardrails.
              </p>
            </div>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-remediation-rescan"
            onClick={handleRunVerificationScan}
            disabled={isRunningVerificationScan}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningVerificationScan ? 'animate-spin' : ''}`} />
            <span>{isRunningVerificationScan ? 'Verifying...' : 'Run Verification Scan'}</span>
          </button>

          {onExportReport && (
            <button
              onClick={onExportReport}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Verification Scan Before vs After Comparison Card */}
      {verificationResult && (
        <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                  verificationResult.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>VERIFICATION STATUS: {verificationResult.status}</span>
              </span>
              <span className="text-xs text-slate-600 font-medium">
                {verificationResult.message}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Verified at {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Before vs After Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Box */}
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-red-900 uppercase tracking-wider">Before Remediation</span>
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">Pre-Fix Baseline</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-red-100">
                  <span className="text-[10px] text-slate-500 block">Critical</span>
                  <span className="text-base font-black text-red-600">{verificationResult.before.critical}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-red-100">
                  <span className="text-[10px] text-slate-500 block">High</span>
                  <span className="text-base font-black text-orange-600">{verificationResult.before.high}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-red-100">
                  <span className="text-[10px] text-slate-500 block">Risk Score</span>
                  <span className="text-base font-black text-red-700">{verificationResult.before.riskScore}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-red-100">
                  <span className="text-[10px] text-slate-500 block">Posture</span>
                  <span className="text-base font-black text-slate-700">{verificationResult.before.postureScore}/100</span>
                </div>
              </div>
            </div>

            {/* After Box */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">After Remediation</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Rescan Results</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">Critical</span>
                  <span className="text-base font-black text-emerald-600">{verificationResult.after.critical}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">High</span>
                  <span className="text-base font-black text-slate-700">{verificationResult.after.high}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">Risk Score</span>
                  <span className="text-base font-black text-emerald-600">{verificationResult.after.riskScore}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">Posture</span>
                  <span className="text-base font-black text-emerald-600">{verificationResult.after.postureScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Playbook Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Finding Selector & Status */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Select Finding to Remediate ({findings.length})
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {findings.map((f) => {
                const isSel = f.id === selectedFindingId;
                const isCrit = f.severity === 'CRITICAL';
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFindingId(f.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-sky-50/90 border-sky-400 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{f.secretType}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isCrit ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                      {f.filePath}:{f.lineNumber}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10px]">
                      <span className="text-slate-400">ID: {f.id}</span>
                      {f.isRemediated ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Remediated
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">Action Required</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs leading-relaxed shadow-xs">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Safety Guidance Policy
            </div>
            <p className="text-[11px] text-amber-800">
              CredSense AI provides tactical guidance only. It does not initiate automated revocations against third-party provider APIs without manual engineer approval.
            </p>
          </div>
        </div>

        {/* Right 8-Step Playbook Canvas */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Finding Header & Remediate Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">{activeFinding.secretType}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-700">{activeFinding.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeFinding.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                  {activeFinding.severity} ({activeFinding.riskScore}/100)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">{activeFinding.filePath} (Line {activeFinding.lineNumber})</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-slate-500">
                Playbook Progress: <span className="text-emerald-600 font-black">{completedStepsCount} / {currentPlaybook.length}</span>
              </div>

              {/* Toggle Status Button */}
              <button
                onClick={() => onToggleRemediate && onToggleRemediate(activeFinding.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                  isRemediated
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRemediated ? 'Remediated ✓' : 'Mark as Remediated'}</span>
              </button>
            </div>
          </div>

          {/* 8-Step Interactive Checklist */}
          <div className="space-y-3">
            {currentPlaybook.map((step) => {
              const isChecked = Boolean(findingSteps[step.num]);
              return (
                <div
                  key={step.num}
                  onClick={() => toggleChecklistStep(activeFinding.id, step.num)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <button className="mt-0.5 text-emerald-600 shrink-0">
                    {isChecked ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-900">
                          STEP {step.num} • {step.title}
                        </span>
                        {isChecked && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Done ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {step.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {step.detail}
                    </p>

                    {/* Step 5 Git Filter command display */}
                    {step.num === 5 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 bg-slate-900 text-slate-200 rounded-lg p-3 text-[11px] font-mono flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 overflow-x-auto">
                          <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="text-sky-300 truncate">{gitFilterCommand}</span>
                        </div>
                        <button
                          onClick={() => handleCopyText(gitFilterCommand, 'filter-cmd')}
                          className="ml-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold shrink-0 cursor-pointer"
                        >
                          {copiedKey === 'filter-cmd' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
