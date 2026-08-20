import React, { useState, useEffect } from 'react';
import {
  Ghost,
  ShieldAlert,
  History,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Terminal,
  Copy,
  Check,
  Play,
  RotateCw,
  Search,
  Filter,
  ArrowRight,
  GitCommit,
  User,
  Calendar,
  Layers,
  KeyRound,
  FileCode,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Finding, GhostSecretSummary, GhostSecretTestScenarioResult } from '../types';
import { safeFetch } from '../utils/api';

interface GhostSecretsViewProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onToggleRemediate: (findingId: string, currentState: boolean) => void;
  onRefreshData?: () => void;
}

export const GhostSecretsView: React.FC<GhostSecretsViewProps> = ({
  findings,
  onSelectFinding,
  onToggleRemediate,
  onRefreshData,
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'inventory' | 'guidance' | 'testsuite'>('inventory');

  // Test suite state
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{
    passedAll: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    durationMs: number;
    scenarios: GhostSecretTestScenarioResult[];
  } | null>(null);

  // Filter Ghost Secrets
  const ghostSecrets = findings.filter((f) => f.isGhostSecret || f.isHistoricalOnly);

  const filteredGhostSecrets = ghostSecrets.filter((f) => {
    const matchesSearch =
      f.secretType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.filePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.fingerprint && f.fingerprint.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UNRESOLVED' && !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED' && f.remediationState !== 'HISTORY_PURGED') ||
      (statusFilter === 'RESOLVED' && (f.isRemediated || f.remediationState === 'VERIFIED_FIXED' || f.remediationState === 'HISTORY_PURGED'));

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const criticalGhosts = ghostSecrets.filter((f) => f.severity === 'CRITICAL');
  const highGhosts = ghostSecrets.filter((f) => f.severity === 'HIGH');
  const resolvedGhosts = ghostSecrets.filter((f) => f.isRemediated || f.remediationState === 'VERIFIED_FIXED' || f.remediationState === 'HISTORY_PURGED');
  const activeUnresolved = ghostSecrets.length - resolvedGhosts.length;
  const avgDays = ghostSecrets.length > 0
    ? Math.round(ghostSecrets.reduce((a, b) => a + (b.exposureDays || b.exposureDurationDays || 1), 0) / ghostSecrets.length)
    : 0;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const runTestSuite = async () => {
    setIsRunningTests(true);
    try {
      const res = await safeFetch<{ success: boolean; results: any }>('/api/ghost-secrets/test-suite', {
        method: 'POST',
      });
      if (res?.results) {
        setTestResults(res.results);
      }
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="space-y-6" id="ghost-secrets-view">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Ghost className="w-80 h-80 text-amber-400" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Ghost className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white">Ghost Secrets Intelligence</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Git History Forensics
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  Detect credentials that were deleted or replaced in current <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded">HEAD</code> but permanently persist in reachable Git commit history.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                id="btn-run-ghost-testsuite"
                onClick={() => {
                  setActiveTab('testsuite');
                  runTestSuite();
                }}
                disabled={isRunningTests}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isRunningTests ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>{isRunningTests ? 'Executing Scenarios...' : 'Run Test Suite (4 Cases)'}</span>
              </button>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
              <div className="text-xs font-medium text-slate-400">Total Ghost Secrets</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{ghostSecrets.length}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                <span>{activeUnresolved} unresolved</span>
                <span>•</span>
                <span>{resolvedGhosts.length} resolved</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
              <div className="text-xs font-medium text-slate-400">Critical & High Risk</div>
              <div className="text-2xl font-bold text-red-400 mt-1">{criticalGhosts.length + highGhosts.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {criticalGhosts.length} Critical • {highGhosts.length} High
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
              <div className="text-xs font-medium text-slate-400">Avg Exposure Duration</div>
              <div className="text-2xl font-bold text-slate-200 mt-1">{avgDays} <span className="text-xs font-normal text-slate-400">days</span></div>
              <div className="text-[11px] text-slate-400 mt-1">Reachable in commit DAG</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
              <div className="text-xs font-medium text-slate-400">HEAD Code Status</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">100% CLEAN</div>
              <div className="text-[11px] text-emerald-400/80 mt-1">Removed from worktree</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          id="tab-ghost-inventory"
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'inventory'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Ghost className="w-4 h-4 text-amber-500" />
          <span>Ghost Secrets Inventory ({ghostSecrets.length})</span>
        </button>

        <button
          id="tab-ghost-guidance"
          onClick={() => setActiveTab('guidance')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'guidance'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-slate-500" />
          <span>Purge Playbook & Guidance</span>
        </button>

        <button
          id="tab-ghost-testsuite"
          onClick={() => setActiveTab('testsuite')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'testsuite'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Play className="w-4 h-4 text-indigo-500" />
          <span>Automated Verification Tests (4 Scenarios)</span>
        </button>
      </div>

      {/* SUB-VIEW 1: INVENTORY TABLE & CARDS */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by secret type, file path, fingerprint, or author..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Severity</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNRESOLVED">Unresolved / Lingering</option>
                <option value="RESOLVED">Resolved / Purged</option>
              </select>
            </div>
          </div>

          {/* Ghost Secrets List */}
          {filteredGhostSecrets.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Ghost className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No Ghost Secrets Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {ghostSecrets.length === 0
                  ? 'All historical commits in this repository appear clean of unpurged historical credentials.'
                  : 'No ghost secrets match your active filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGhostSecrets.map((ghost) => {
                const isResolved = ghost.isRemediated || ghost.remediationState === 'VERIFIED_FIXED' || ghost.remediationState === 'HISTORY_PURGED';

                return (
                  <div
                    key={ghost.id}
                    className={`bg-white rounded-xl border shadow-sm transition overflow-hidden ${
                      isResolved
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : ghost.severity === 'CRITICAL'
                        ? 'border-red-200 hover:border-red-300'
                        : 'border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    {/* Top Status Bar */}
                    <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Ghost className="w-3.5 h-3.5" />
                          <span>GHOST SECRET</span>
                        </span>
                        <span className="text-sm font-semibold text-slate-100">{ghost.secretType}</span>
                        <span className="text-xs text-slate-400 font-mono">({ghost.filePath})</span>
                      </div>

                      {/* Head vs History Comparison Pills */}
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

                    {/* Main Content Body */}
                    <div className="p-5 space-y-4">
                      {/* Intelligence Metrics Row */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Non-Reversible Fingerprint</div>
                          <div className="mt-1 flex items-center space-x-1.5">
                            <code className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {ghost.fingerprint || 'FPR-GENERIC'}
                            </code>
                            <button
                              onClick={() => copyToClipboard(ghost.fingerprint || '', `fpr-${ghost.id}`)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Copy Fingerprint"
                            >
                              {copiedText === `fpr-${ghost.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">Masked SHA256 identifier</div>
                        </div>

                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">First Exposure</div>
                          <div className="text-xs font-semibold text-slate-800 mt-1 flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(ghost.firstExposureDate || ghost.exposureStart).toLocaleDateString()}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1 font-mono">
                            <GitCommit className="w-3 h-3" />
                            <span>{(ghost.firstExposureCommit || ghost.commitId).substring(0, 7)}</span>
                            <span>• {ghost.firstExposureAuthor || ghost.author}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Removed From HEAD</div>
                          <div className="text-xs font-semibold text-emerald-700 mt-1 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{ghost.removedFromHeadDate ? new Date(ghost.removedFromHeadDate).toLocaleDateString() : 'Purged in subsequent commit'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1 font-mono">
                            <GitCommit className="w-3 h-3" />
                            <span>{ghost.removedFromHeadCommit ? ghost.removedFromHeadCommit.substring(0, 7) : 'Commit Diff'}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Risk Assessment</div>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              ghost.severity === 'CRITICAL'
                                ? 'bg-red-100 text-red-700'
                                : ghost.severity === 'HIGH'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {ghost.severity} ({ghost.riskScore}/100)
                            </span>
                            <span className="text-xs text-slate-600">{ghost.exposureDays || ghost.exposureDurationDays} days active</span>
                          </div>
                        </div>
                      </div>

                      {/* Secret Masked Display */}
                      <div className="bg-slate-900 rounded-lg p-3 text-slate-200 font-mono text-xs flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>Secret: <span className="text-amber-300 font-bold">{ghost.maskedSecret}</span></span>
                          <span className="text-slate-500">|</span>
                          <span className="text-slate-400">Entropy: {ghost.entropyScore} bits/char</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Zero-exposure guarantee</span>
                      </div>

                      {/* Remediation Action Playbook Box */}
                      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>Ghost Secret Remediation Guidance</span>
                          </div>
                          <span className="text-[11px] text-amber-700 font-medium">Immediate Action Required</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                          <div className="bg-white p-3 rounded-lg border border-amber-200/80 shadow-2xs">
                            <div className="font-semibold text-slate-900 mb-1 flex items-center space-x-1.5">
                              <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">1</span>
                              <span>Rotate & Revoke in Cloud Console</span>
                            </div>
                            <p className="text-slate-600 text-[11px]">
                              {ghost.ghostRemediationGuidance?.rotateRevoke ||
                                'Rotate this credential immediately at the identity provider. Even though absent in HEAD, leaked keys are perpetually queryable.'}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-amber-200/80 shadow-2xs">
                            <div className="font-semibold text-slate-900 mb-1 flex items-center space-x-1.5">
                              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">2</span>
                              <span>Purge Historical Git Commit Objects</span>
                            </div>
                            <p className="text-slate-600 text-[11px]">
                              {ghost.ghostRemediationGuidance?.purgeGitHistory ||
                                'Execute git-filter-repo or BFG to permanently scrub the secret blob from the Git commit graph.'}
                            </p>
                          </div>
                        </div>

                        {/* Copyable Purge Command */}
                        <div className="bg-slate-900 rounded-lg p-2.5 text-xs font-mono text-slate-300 flex items-center justify-between">
                          <div className="flex items-center space-x-2 overflow-x-auto">
                            <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-slate-400">git-filter-repo:</span>
                            <span className="text-amber-300">
                              {ghost.ghostRemediationGuidance?.gitFilterRepoCommand ||
                                `git filter-repo --replace-text <(echo "${ghost.maskedSecret}==>[REDACTED]") --force`}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                ghost.ghostRemediationGuidance?.gitFilterRepoCommand ||
                                  `git filter-repo --replace-text <(echo "${ghost.maskedSecret}==>[REDACTED]") --force`,
                                `cmd-${ghost.id}`
                              )
                            }
                            className="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center space-x-1 shrink-0"
                          >
                            {copiedText === `cmd-${ghost.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedText === `cmd-${ghost.id}` ? 'Copied' : 'Copy Command'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() => onSelectFinding(ghost)}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1.5"
                        >
                          <span>Open Comprehensive Forensics & Incident Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onToggleRemediate(ghost.id, isResolved)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            {isResolved ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Remediated & Verified</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Historical Purge Complete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: PURGE GUIDANCE & RUNBOOK */}
      {activeTab === 'guidance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Why Deleting Code Does Not Secure Credentials</h2>
            <p className="text-xs text-slate-600 mt-1">
              Git is an immutable append-only Directed Acyclic Graph (DAG). When a developer removes a secret in a subsequent commit, the previous commit snapshot still contains the exact unencrypted string in its blob object forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                Step 1
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Revoke & Invalidate First</h4>
              <p className="text-xs text-slate-600">
                Treat any credential ever committed to Git as compromised. Rotate the key in AWS, GitHub, Stripe, or Google Cloud before touching Git history.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                Step 2
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Scrub Git History DAG</h4>
              <p className="text-xs text-slate-600">
                Use modern high-speed tools like <code className="text-slate-800 font-bold">git-filter-repo</code> or <code className="text-slate-800 font-bold">BFG Repo-Cleaner</code> to rewrite commit trees and purge blob references.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                Step 3
              </div>
              <h4 className="text-sm font-semibold text-slate-900">Centralize Secrets Management</h4>
              <p className="text-xs text-slate-600">
                Inject secrets dynamically via AWS Secrets Manager, HashiCorp Vault, Doppler, or GitHub Actions Encrypted Secrets.
              </p>
            </div>
          </div>

          {/* Detailed Script Commands */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Recommended Purge Commands</h3>

            <div className="bg-slate-900 rounded-xl p-4 text-slate-200 font-mono text-xs space-y-3">
              <div className="text-slate-400"># 1. Install git-filter-repo (recommended by Git core team)</div>
              <div className="text-amber-300">pip install git-filter-repo</div>

              <div className="text-slate-400 mt-3"># 2. Replace the secret across all historical commits</div>
              <div className="text-amber-300">git-filter-repo --replace-text &lt;(echo "SECRET_TO_REMOVE==&gt;[REDACTED]") --force</div>

              <div className="text-slate-400 mt-3"># 3. Expire reflogs and aggressively prune dangling blob objects</div>
              <div className="text-amber-300">git reflog expire --expire=now --all && git gc --prune=now --aggressive</div>

              <div className="text-slate-400 mt-3"># 4. Force push rewritten branches to remote repository</div>
              <div className="text-amber-300">git push origin --force --all</div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: AUTOMATED TEST SUITE (4 SCENARIOS) */}
      {activeTab === 'testsuite' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ghost Secrets Verification Test Suite</h2>
              <p className="text-xs text-slate-600 mt-1">
                Executes isolated temporary Git commit flows to mathematically verify Ghost Secret detection, correlation fingerprints, and HEAD status classification.
              </p>
            </div>

            <button
              id="btn-trigger-full-testsuite"
              onClick={runTestSuite}
              disabled={isRunningTests}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isRunningTests ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isRunningTests ? 'Running Verification Suite...' : 'Run All 4 Test Cases'}</span>
            </button>
          </div>

          {/* Test Results Summary */}
          {testResults ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                testResults.passedAll
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-center space-x-3">
                  {testResults.passedAll ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold">
                      {testResults.passedAll ? 'All Ghost Secret Scenarios Passed' : 'Some Test Scenarios Failed'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {testResults.passedTests} of {testResults.totalTests} test cases verified in {testResults.durationMs}ms.
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  testResults.passedAll ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                }`}>
                  {testResults.passedAll ? '100% PASSED' : `${testResults.failedTests} FAILED`}
                </span>
              </div>

              {/* Individual Scenario Cards */}
              <div className="space-y-3">
                {testResults.scenarios.map((scenario, idx) => (
                  <div
                    key={scenario.scenarioId}
                    className={`p-4 rounded-xl border transition ${
                      scenario.passed
                        ? 'bg-white border-slate-200 hover:border-emerald-300'
                        : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          scenario.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{scenario.name}</h4>
                          <p className="text-xs text-slate-500">{scenario.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-400 font-mono">{scenario.durationMs}ms</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                          scenario.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {scenario.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>

                    {/* Assertion Breakdown */}
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Expected</span>
                        <span className="font-semibold text-slate-800">{scenario.expectedClassification}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Actual</span>
                        <span className="font-semibold text-slate-800">{scenario.actualClassification}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">HEAD / History</span>
                        <span className="font-semibold text-slate-800">{scenario.headStatus} / {scenario.historyStatus}</span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Fingerprint</span>
                        <span className="font-mono font-semibold text-slate-800 text-[11px] truncate block">{scenario.fingerprint}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 italic bg-slate-50/50 p-2 rounded">
                      {scenario.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Play className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">Test Suite Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Click "Run All 4 Test Cases" above to spin up temporary Git repositories and verify Ghost Secret detection scenarios automatically.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
