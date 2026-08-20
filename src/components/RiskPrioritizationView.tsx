import React, { useState } from 'react';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  FileCode,
  Zap,
  ListOrdered,
  Radio,
  ExternalLink,
  ChevronRight,
  RotateCw,
  Eye,
  CheckSquare,
  Square,
  Shield,
  Info,
} from 'lucide-react';
import { Finding, RemediationState, RotationChecklistStep } from '../types';

interface RiskPrioritizationViewProps {
  findings: Finding[];
  onOpenFinding?: (finding: Finding) => void;
  onUpdateFindingState?: (findingId: string, newState: RemediationState) => Promise<void>;
  onToggleChecklistStep?: (findingId: string, stepId: string) => Promise<void>;
  onToggleRemediate?: (findingId: string) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export function RiskPrioritizationView({
  findings,
  onOpenFinding,
  onUpdateFindingState,
  onToggleChecklistStep,
}: RiskPrioritizationViewProps) {
  // Active selected finding for incident / checklist mode
  const sortedFindings = [...findings].sort((a, b) => b.riskScore - a.riskScore);
  const [selectedFindingId, setSelectedFindingId] = useState<string>(sortedFindings[0]?.id || '');
  const [filterState, setFilterState] = useState<string>('ALL');

  const selectedFinding = findings.find((f) => f.id === selectedFindingId) || sortedFindings[0];

  // Remediation Status Totals
  const totalFindings = findings.length;
  const openCount = findings.filter((f) => !f.remediationState || f.remediationState === 'OPEN').length;
  const inProgressCount = findings.filter((f) =>
    f.remediationState === 'INVESTIGATING' || f.remediationState === 'ROTATION_REQUIRED' || f.remediationState === 'SECRET_REMOVED'
  ).length;
  const resolvedCount = findings.filter((f) => f.isRemediated || f.remediationState === 'VERIFIED_FIXED' || f.remediationState === 'HISTORY_PURGED').length;
  const acceptedRiskCount = findings.filter((f) => f.remediationState === 'ACCEPTED_RISK').length;

  const progressPercentage = totalFindings > 0 ? Math.round((resolvedCount / totalFindings) * 100) : 100;

  // Filtered list
  const displayFindings = sortedFindings.filter((f) => {
    if (filterState === 'ALL') return true;
    if (filterState === 'OPEN') return !f.remediationState || f.remediationState === 'OPEN';
    if (filterState === 'IN_PROGRESS') return f.remediationState === 'INVESTIGATING' || f.remediationState === 'ROTATION_REQUIRED' || f.remediationState === 'SECRET_REMOVED';
    if (filterState === 'RESOLVED') return f.isRemediated || f.remediationState === 'VERIFIED_FIXED' || f.remediationState === 'HISTORY_PURGED';
    if (filterState === 'ACCEPTED') return f.remediationState === 'ACCEPTED_RISK';
    return true;
  });

  // Potential Impact Knowledge lookup by type
  const getImpactRationale = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('aws')) {
      return {
        impacts: ['Cloud infrastructure takeover & resource deletion', 'Massive unbudgeted GPU/EC2 compute billing spikes', 'S3 data exfiltration and customer data leakage'],
        blastRadius: 'Extreme',
        accessLevel: 'Full AWS IAM Tenant & Administrative Access',
      };
    }
    if (lower.includes('github') || lower.includes('token') || lower.includes('gitlab')) {
      return {
        impacts: ['Private source code theft and IP leakage', 'CI/CD pipeline compromise & supply-chain artifact poisoning', 'Repository secret variable exfiltration'],
        blastRadius: 'High',
        accessLevel: 'Organization VCS & CI/CD Pipeline Control',
      };
    }
    if (lower.includes('stripe') || lower.includes('payment')) {
      return {
        impacts: ['Unauthorized financial charge creation and refunds', 'Customer payment data & bank ledger exfiltration', 'Payment gateway account suspension and PCI audit failure'],
        blastRadius: 'Extreme',
        accessLevel: 'Financial Gateway Live Processing & Vault',
      };
    }
    if (lower.includes('database') || lower.includes('postgres') || lower.includes('mongo') || lower.includes('sql')) {
      return {
        impacts: ['Direct relational database table exfiltration', 'Destructive SQL injection or database drop', 'PII privacy compliance violations (GDPR/HIPAA/CCPA)'],
        blastRadius: 'Extreme',
        accessLevel: 'Production Database Read/Write/Admin',
      };
    }
    if (lower.includes('private key') || lower.includes('rsa') || lower.includes('ssh')) {
      return {
        impacts: ['Direct SSH shell access to production servers', 'Cryptographic signature forging & SSL interception', 'Lateral movement across internal VPC networks'],
        blastRadius: 'Extreme',
        accessLevel: 'Host-Level Root / OS Shell Execution',
      };
    }
    return {
      impacts: ['Service authentication and session spoofing', 'Unauthorized API consumption and quota exhaustion', 'Potential lateral movement across microservices'],
      blastRadius: 'Medium',
      accessLevel: 'Application Service API Credentials',
    };
  };

  const checklist = selectedFinding?.remediationChecklist || [];
  const completedSteps = checklist.filter((s) => s.completed).length;
  const totalSteps = checklist.length || 9;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Automatic Risk Prioritization & Remediation Engine</h2>
              <p className="text-xs text-slate-500">"What Should I Fix First?" — Algorithmic remediation queue & incident response</p>
            </div>
          </div>
        </div>

        {/* Section 4: Progress Tracker Mini Card */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Remediation Progress</div>
            <div className="text-sm font-black text-slate-900">{resolvedCount} of {totalFindings} Resolved ({progressPercentage}%)</div>
          </div>
          <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Remediation Progress Tracker Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterState('OPEN')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterState === 'OPEN' ? 'bg-red-50 border-red-300 ring-2 ring-red-100' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-red-600">Total Open</div>
          <div className="text-2xl font-black text-red-700 mt-0.5">{openCount}</div>
          <div className="text-[11px] text-slate-500">Awaiting action</div>
        </button>

        <button
          onClick={() => setFilterState('IN_PROGRESS')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterState === 'IN_PROGRESS' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-amber-600">In Progress</div>
          <div className="text-2xl font-black text-amber-700 mt-0.5">{inProgressCount}</div>
          <div className="text-[11px] text-slate-500">Rotation / Purging</div>
        </button>

        <button
          onClick={() => setFilterState('RESOLVED')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterState === 'RESOLVED' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-emerald-600">Resolved & Purged</div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">{resolvedCount}</div>
          <div className="text-[11px] text-slate-500">Verified safe in Git</div>
        </button>

        <button
          onClick={() => setFilterState('ACCEPTED')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            filterState === 'ACCEPTED' ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-slate-600">Accepted Risk</div>
          <div className="text-2xl font-black text-slate-700 mt-0.5">{acceptedRiskCount}</div>
          <div className="text-[11px] text-slate-500">Documented bypass</div>
        </button>
      </div>

      {/* Main 2-Column Split: Remediation Queue (Left) vs Incident Playbook & Checklist (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ranked Remediation Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-sky-600" />
              Ordered Remediation Queue ({displayFindings.length})
            </h3>
            {filterState !== 'ALL' && (
              <button
                onClick={() => setFilterState('ALL')}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {displayFindings.map((f, index) => {
              const isSelected = selectedFinding?.id === f.id;
              const isCrit = f.severity === 'CRITICAL';
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFindingId(f.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-400 shadow-xs ring-1 ring-sky-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                        isCrit ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{f.secretType}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        isCrit ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Risk: {f.riskScore}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Factor Reason List */}
                  <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <FileCode className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{f.filePath}:{f.lineNumber}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {!f.isHistoricalOnly ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700">Active in HEAD</span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700">Historical Leak</span>
                      )}
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700">{f.exposureDays}d Exposure</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-700">AI: {f.verificationStatus}</span>
                    </div>
                  </div>

                  {/* Remediation State Pill */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono">Status:</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      f.remediationState === 'VERIFIED_FIXED' || f.isRemediated
                        ? 'bg-emerald-100 text-emerald-800'
                        : f.remediationState === 'ROTATION_REQUIRED'
                        ? 'bg-red-100 text-red-800'
                        : f.remediationState === 'INVESTIGATING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {f.remediationState || 'OPEN'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: SECTION 13 (Incident Mode), SECTION 14 (Impact), SECTION 15 (Checklist) */}
        {selectedFinding ? (
          <div className="lg:col-span-7 space-y-6">
            {/* SECTION 13: Security Incident Mode Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-red-200 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-red-600 tracking-wider">
                        Security Incident Mode
                      </span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-mono text-xs font-bold">
                        {selectedFinding.incidentId || `INC-${selectedFinding.id.slice(-6).toUpperCase()}`}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      {selectedFinding.secretType} Exposure Incident
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Remediation State Switcher */}
                  <select
                    value={selectedFinding.remediationState || 'OPEN'}
                    onChange={(e) => onUpdateFindingState && onUpdateFindingState(selectedFinding.id, e.target.value as RemediationState)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="OPEN">State: Open</option>
                    <option value="INVESTIGATING">State: Investigating</option>
                    <option value="ROTATION_REQUIRED">State: Rotation Required</option>
                    <option value="SECRET_REMOVED">State: Secret Removed</option>
                    <option value="HISTORY_PURGED">State: History Purged</option>
                    <option value="VERIFIED_FIXED">State: Verified Fixed</option>
                    <option value="ACCEPTED_RISK">State: Accepted Risk</option>
                  </select>
                </div>
              </div>

              {/* Incident Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Severity Level</div>
                  <div className="text-xs font-black text-red-700">{selectedFinding.severity} ({selectedFinding.riskScore}/100)</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">HEAD Status</div>
                  <div className="text-xs font-bold text-slate-900">{selectedFinding.isHistoricalOnly ? 'Historical Only' : 'Active in HEAD'}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">First Exposure</div>
                  <div className="text-xs font-bold text-slate-900 truncate">{selectedFinding.shortCommitId || 'Initial Commit'}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Exposure Window</div>
                  <div className="text-xs font-bold text-slate-900">{selectedFinding.exposureDays} Days</div>
                </div>
              </div>

              {/* 6-Step Incident Response Playbook */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-600" />
                  Recommended Incident Response Playbook (6-Step Procedure)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                    <div>
                      <strong className="text-slate-900">Revoke Credential:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">Disable the active API key in provider console immediately.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                    <div>
                      <strong className="text-slate-900">Rotate & Inject KMS:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">Generate new key and store in secrets manager / environment.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                    <div>
                      <strong className="text-slate-900">Investigate Git Tree:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">Trace commit blame to identify all exposed branches & tags.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">4</span>
                    <div>
                      <strong className="text-slate-900">Purge Commit Objects:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">Execute git-filter-repo to scrub blobs from Git graph.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">5</span>
                    <div>
                      <strong className="text-slate-900">Audit Dependent Systems:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">Verify cloud access logs (CloudTrail/Datadog) for anomalies.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">6</span>
                    <div>
                      <strong className="text-slate-900">Verify Remediation:</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">Run rescan to ensure zero plaintext artifacts remain.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 14: Potential Impact Analysis Card */}
            {(() => {
              const impactData = getImpactRationale(selectedFinding.secretType);
              return (
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Potential Business Impact Analysis
                    </h4>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                      Blast Radius: {impactData.blastRadius}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">
                    *Rule-based impact evaluation based on credential category scope (labeled as potential risk, not confirmed compromise).
                  </p>

                  <div className="space-y-2">
                    {impactData.impacts.map((imp, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* SECTION 15: Secret Rotation Checklist (Interactive) */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    Secret Rotation Checklist
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Interactive step-by-step resolution tracking for this credential</p>
                </div>
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Remediation: {completedSteps} / {totalSteps} Complete
                </span>
              </div>

              <div className="space-y-2 mt-4">
                {checklist.map((step) => (
                  <div
                    key={step.id}
                    onClick={() => onToggleChecklistStep && onToggleChecklistStep(selectedFinding.id, step.id)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      step.completed
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={`text-xs ${step.completed ? 'line-through text-slate-500 font-medium' : 'font-medium'}`}>
                        {step.label}
                      </span>
                    </div>

                    {step.completedAt && (
                      <span className="text-[10px] text-emerald-700 font-mono shrink-0">
                        {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
            Select a finding from the left to view incident controls and remediation checklist.
          </div>
        )}
      </div>
    </div>
  );
}
