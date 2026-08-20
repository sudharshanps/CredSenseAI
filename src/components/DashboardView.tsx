import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  GitCommit,
  Sparkles,
  ArrowRight,
  Clock,
  Key,
  Layers,
  Bot,
  ListOrdered,
  GitPullRequest,
  FileText,
  Lock,
  ChevronRight,
  Filter,
  Ghost,
} from 'lucide-react';
import { DashboardSummary, Finding, Scan } from '../types';
import { PostureScoreCard } from './PostureScoreCard';

interface DashboardViewProps {
  summary: DashboardSummary;
  scan: Scan | null;
  findings: Finding[];
  onNavigateTab: (tab: string) => void;
  onSelectFinding: (finding: Finding) => void;
  onFilterSeverity: (sev: string) => void;
}

export function DashboardView({
  summary,
  scan,
  findings,
  onNavigateTab,
  onSelectFinding,
  onFilterSeverity,
}: DashboardViewProps) {
  const topCriticalFindings = findings
    .filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .slice(0, 4);

  const ghostSecrets = findings.filter((f) => f.isGhostSecret || f.isHistoricalOnly);
  const unresolvedGhosts = ghostSecrets.filter((f) => !f.isRemediated && f.remediationState !== 'VERIFIED_FIXED' && f.remediationState !== 'HISTORY_PURGED');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Ghost Secret Urgent Alert Banner (if any detected) */}
      {unresolvedGhosts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Ghost className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  Ghost Secret Detected
                </span>
                <span className="text-sm font-bold text-white">
                  {unresolvedGhosts.length} credential{unresolvedGhosts.length > 1 ? 's' : ''} removed from HEAD but exposed in Git history
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Current HEAD is clean, but unencrypted credentials remain reachable in previous commit blobs. Revocation and history purge recommended.
              </p>
            </div>
          </div>

          <button
            id="btn-alert-investigate-ghosts"
            onClick={() => onNavigateTab('ghosts')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Ghost className="w-3.5 h-3.5" />
            <span>Investigate Ghost Secrets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Security Posture Score & Differentiator Banner */}
      <PostureScoreCard
        summary={summary}
        onNavigateTab={onNavigateTab}
        onFilterSeverity={onFilterSeverity}
      />

      {/* 2. Top Critical / Action Required Findings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Priority Action Items ({topCriticalFindings.length} High-Risk Findings)
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('findings')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All Findings ({findings.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topCriticalFindings.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No critical or high-risk findings detected in this repository.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topCriticalFindings.map((f) => {
              const isCrit = f.severity === 'CRITICAL';
              return (
                <div
                  key={f.id}
                  onClick={() => onSelectFinding(f)}
                  className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-sky-400 hover:bg-sky-50/30 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{f.secretType}</span>
                        <span className="font-mono text-[10px] text-slate-400">ID: {f.id}</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCrit
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}
                      >
                        {f.severity} ({f.riskScore}/100)
                      </span>
                    </div>

                    <div className="font-mono text-xs text-slate-600 truncate mt-1">
                      {f.filePath}:{f.lineNumber}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {f.verificationReason}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">
                      {f.isHistoricalOnly ? 'Purged in HEAD • Alive in Commit' : 'Active in HEAD'}
                    </span>
                    <span className="font-bold text-sky-600 flex items-center gap-0.5">
                      <span>Investigate</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. DevSecOps Operations Quick Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 0: Ghost Secrets Forensics */}
        <div
          id="hub-card-ghosts"
          onClick={() => onNavigateTab('ghosts')}
          className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Ghost className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Ghost Secrets</h4>
              {ghostSecrets.length > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  {ghostSecrets.length} Detected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Correlate credentials purged from HEAD but lingering in Git commit history DAG.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-600">
            <span>Ghost Forensics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 1: AI Copilot */}
        <div
          id="hub-card-copilot"
          onClick={() => onNavigateTab('copilot')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">CredSense Copilot</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Ask AI security queries across Git DAG and exposure windows with zero plaintext leakage.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-sky-600">
            <span>Launch Copilot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Attack Path Exposure Graph */}
        <div
          id="hub-card-graph"
          onClick={() => onNavigateTab('graph')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Exposure Attack Graph</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Traverse interactive DAG from repo files to commits, exposure duration, and blast radius.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-sky-600">
            <span>Explore Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: 7-Step Remediation Playbook */}
        <div
          id="hub-card-remediation"
          onClick={() => onNavigateTab('remediation')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <ListOrdered className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Remediation Playbook</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Step-by-step invalidation guidance with copyable <code>git-filter-repo</code> scripts.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-600">
            <span>Open Playbook</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: CI/CD Security Gate */}
        <div
          id="hub-card-cicd"
          onClick={() => onNavigateTab('cicd')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">CI/CD Security Gate</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Simulate pre-merge deployment guardrails to block unauthorized secret commits.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-purple-600">
            <span>Simulate Gate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
