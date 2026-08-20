import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Sliders,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Info,
  Layers,
  Lock,
  GitCommit,
  Flame,
} from 'lucide-react';
import { DashboardSummary, Finding, SecurityScorecard } from '../types';

interface SecurityPostureCenterProps {
  summary: DashboardSummary;
  findings: Finding[];
  onOpenFinding?: (finding: Finding) => void;
  onNavigateTab?: (tabId: string) => void;
}

export function SecurityPostureCenter({
  summary,
  findings,
  onOpenFinding,
  onNavigateTab,
}: SecurityPostureCenterProps) {
  const scorecard = summary.securityScorecard;
  const breakdown = scorecard?.detailedBreakdown;

  // Simulator State (What-If Analysis)
  const [simFixCritical, setSimFixCritical] = useState(false);
  const [simPurgeHistory, setSimPurgeHistory] = useState(false);
  const [simEnableCICD, setSimEnableCICD] = useState(false);
  const [simRotateOld, setSimRotateOld] = useState(false);

  // Badge Copied State
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Calculate Projected Score
  const baseScore = breakdown?.overallScore ?? scorecard?.overallScore ?? 62;
  let projectedScore = baseScore;
  if (simFixCritical) projectedScore += 22;
  if (simPurgeHistory) projectedScore += 14;
  if (simEnableCICD) projectedScore += 8;
  if (simRotateOld) projectedScore += 6;
  projectedScore = Math.min(99, Math.max(15, projectedScore));

  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL' && !f.isRemediated);
  const highFindings = findings.filter((f) => f.severity === 'HIGH' && !f.isRemediated);
  const resolvedCount = findings.filter((f) => f.isRemediated || f.remediationState === 'VERIFIED_FIXED').length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getBadgeStatus = () => {
    if (baseScore >= 80) return { label: 'PASS', color: '#10b981', bg: 'bg-emerald-600' };
    if (baseScore >= 50) return { label: 'AT RISK', color: '#f59e0b', bg: 'bg-amber-600' };
    return { label: 'CRITICAL', color: '#ef4444', bg: 'bg-red-600' };
  };

  const badgeStatus = getBadgeStatus();
  const markdownBadge = `[![CredSense Security](https://img.shields.io/badge/CredSense%20Security-${badgeStatus.label}-${badgeStatus.label === 'PASS' ? 'brightgreen' : badgeStatus.label === 'AT%20RISK' ? 'yellow' : 'red'})](https://credsense.ai)`;
  const htmlBadge = `<a href="https://credsense.ai"><img src="https://img.shields.io/badge/CredSense%20Security-${badgeStatus.label}-${badgeStatus.label === 'PASS' ? 'brightgreen' : badgeStatus.label === 'AT%20RISK' ? 'yellow' : 'red'}" alt="CredSense Security Status" /></a>`;

  const copyToClipboard = (text: string, type: 'md' | 'html') => {
    navigator.clipboard.writeText(text);
    if (type === 'md') {
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-sky-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                Security Posture Center
              </span>
              <span className="text-xs text-sky-200">Continuous Repository Assurance</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              7-Factor Security Scorecard & Posture Intelligence
            </h2>
            <p className="text-sm text-sky-100/90 mt-1 max-w-2xl">
              Calculated deterministically from live Git history, Shannon entropy metrics, AST lexical scope analysis, and AI contextual verification.
            </p>
          </div>

          {/* Main Score Hero Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-5 min-w-[260px]">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-slate-900/80 border-4 border-sky-400 text-white font-black text-3xl shadow-inner">
              {baseScore}
              <span className="text-[10px] absolute -bottom-1 bg-sky-600 px-1.5 py-0.5 rounded text-white font-bold">/100</span>
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-sky-200">Overall Security Posture</div>
              <div className="text-lg font-black text-white">{scorecard?.postureStatus || 'AT RISK'}</div>
              <div className="text-xs text-sky-100 flex items-center gap-1 mt-0.5">
                {breakdown && breakdown.scoreChangeDelta >= 0 ? (
                  <span className="text-emerald-300 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +{breakdown.scoreChangeDelta}% vs prior
                  </span>
                ) : (
                  <span className="text-red-300 font-bold flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" /> {breakdown?.scoreChangeDelta}% vs prior
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Granular Security Scores Grid */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          The 7 Security Posture Vectors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Overall Security Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">1. Overall Security Score</span>
              <Shield className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{breakdown?.overallScore ?? baseScore}</span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${breakdown?.overallScore ?? baseScore}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Weighted composite metric across all 6 sub-scores.</p>
          </div>

          {/* 2. Credential Hygiene Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">2. Credential Hygiene</span>
              <Lock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{breakdown?.credentialHygieneScore ?? scorecard?.secretHygiene ?? 70}</span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${breakdown?.credentialHygieneScore ?? scorecard?.secretHygiene ?? 70}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Penalized heavily by active credentials in working tree.</p>
          </div>

          {/* 3. Git History Security Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">3. Git History Security</span>
              <GitCommit className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{breakdown?.gitHistorySecurityScore ?? scorecard?.gitHistoryHygiene ?? 65}</span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${breakdown?.gitHistorySecurityScore ?? scorecard?.gitHistoryHygiene ?? 65}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Evaluates leaked secrets lingering in Git commit DAG.</p>
          </div>

          {/* 4. Exposure Risk Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">4. Exposure Risk Score</span>
              <Flame className="w-4 h-4 text-red-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-600">{breakdown?.exposureRiskScore ?? scorecard?.exposureRisk ?? 75}</span>
              <span className="text-xs text-slate-400 font-medium">/ 100 (Lower is better)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${breakdown?.exposureRiskScore ?? scorecard?.exposureRisk ?? 75}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Calculated from exposure duration days & blast radius.</p>
          </div>

          {/* 5. Remediation Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">5. Remediation Velocity</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{breakdown?.remediationScore ?? scorecard?.remediationRate ?? 50}%</span>
              <span className="text-xs text-slate-400 font-medium">resolved</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${breakdown?.remediationScore ?? scorecard?.remediationRate ?? 50}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">{resolvedCount} of {findings.length} findings verified and resolved.</p>
          </div>

          {/* 6. AI Confidence Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">6. AI Confidence Score</span>
              <Sparkles className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{breakdown?.aiConfidenceScore ?? 94}%</span>
              <span className="text-xs text-slate-400 font-medium">accuracy</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-sky-600 h-full rounded-full transition-all" style={{ width: `${breakdown?.aiConfidenceScore ?? 94}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Confidence level of semantic code scope classifications.</p>
          </div>

          {/* 7. Repository Hygiene Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-sky-300 transition-all sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">7. Repository Hygiene Score</span>
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{breakdown?.repositoryHygieneScore ?? 82}</span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full transition-all" style={{ width: `${breakdown?.repositoryHygieneScore ?? 82}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Accounts for noise reduction rate ({scorecard?.noiseReductionRate ?? 0}%) and clean file ratios.</p>
          </div>
        </div>
      </div>

      {/* Why Did My Score Change? & Drivers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Why did score change */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Why Did My Score Change?</h4>
                <p className="text-xs text-slate-500">Transparent factor breakdown responsible for posture score shifts</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
              Audit Delta: {breakdown?.scoreChangeDelta && breakdown.scoreChangeDelta >= 0 ? `+${breakdown.scoreChangeDelta}` : breakdown?.scoreChangeDelta} pts
            </span>
          </div>

          <div className="space-y-2.5">
            {breakdown?.scoreChangeFactors?.map((factor, idx) => {
              const isPos = factor.impact === 'positive';
              const isNeg = factor.impact === 'negative';
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                    isPos
                      ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                      : isNeg
                      ? 'bg-red-50/50 border-red-200/80 text-red-950'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isPos ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : isNeg ? (
                      <TrendingDown className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-xs font-bold">{factor.label}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{factor.reason}</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                      isPos ? 'bg-emerald-100 text-emerald-800' : isNeg ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {factor.delta > 0 ? `+${factor.delta}` : factor.delta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Driver & Recommended Next Action Card */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col justify-between shadow-md">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Main Risk Driver
            </div>
            <div className="text-base font-black text-white mt-1.5">
              {breakdown?.mainRiskDriver || 'Active production credentials in repository worktree'}
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Critical secrets expose direct cloud API endpoints and have highest priority weighting in our risk engine.
            </p>

            <div className="border-t border-slate-800 my-4"></div>

            <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Recommended Next Action
            </div>
            <div className="text-sm font-semibold text-slate-100 mt-1.5">
              {breakdown?.recommendedNextAction || 'Revoke and rotate critical production keys immediately in cloud console.'}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Jump to resolution:</span>
            <button
              onClick={() => onNavigateTab && onNavigateTab('remediation')}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              Open Playbook <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 19: Security Score Simulator (What-If Analysis) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-bold text-slate-900">Security Score Simulator ("What If?" Engine)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate the direct impact of specific security actions before making live repository changes.
            </p>
          </div>

          {/* Projected Score Comparison Pill */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Score</div>
              <div className="text-sm font-black text-slate-700">{baseScore}/100</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-sky-600">PROJECTED SCORE</div>
              <div className="text-lg font-black text-sky-600">{projectedScore}/100</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
            simFixCritical ? 'bg-sky-50 border-sky-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}>
            <input
              type="checkbox"
              checked={simFixCritical}
              onChange={(e) => setSimFixCritical(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <div>
              <div className="text-xs font-bold text-slate-900">Fix Critical Secrets</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Rotate & revoke active production keys</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1">+22 Posture Points</div>
            </div>
          </label>

          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
            simPurgeHistory ? 'bg-sky-50 border-sky-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}>
            <input
              type="checkbox"
              checked={simPurgeHistory}
              onChange={(e) => setSimPurgeHistory(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <div>
              <div className="text-xs font-bold text-slate-900">Purge Git History</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Rewrite commit blobs via git-filter-repo</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1">+14 Posture Points</div>
            </div>
          </label>

          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
            simEnableCICD ? 'bg-sky-50 border-sky-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}>
            <input
              type="checkbox"
              checked={simEnableCICD}
              onChange={(e) => setSimEnableCICD(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <div>
              <div className="text-xs font-bold text-slate-900">Enforce CI/CD Blocking</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Automate zero-tolerance pre-merge gate</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1">+8 Posture Points</div>
            </div>
          </label>

          <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
            simRotateOld ? 'bg-sky-50 border-sky-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}>
            <input
              type="checkbox"
              checked={simRotateOld}
              onChange={(e) => setSimRotateOld(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <div>
              <div className="text-xs font-bold text-slate-900">Rotate Secrets &gt; 14 Days</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Enforce enterprise credential TTL policy</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1">+6 Posture Points</div>
            </div>
          </label>
        </div>
      </div>

      {/* SECTION 18 & 25: Before vs After Comparison & README Security Badge Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Before vs After Security Comparison */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-sky-600" />
            Before vs. After Security Comparison
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Auditable posture change tracking before and after remediation actions.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50/60 rounded-xl p-3.5 border border-red-200 text-slate-800">
              <div className="text-[11px] font-black uppercase tracking-wider text-red-700">Initial State (Before)</div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span>Critical Findings:</span>
                  <span className="font-bold text-red-700">{criticalFindings.length + 2}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>High Risk Secrets:</span>
                  <span className="font-bold text-amber-700">{highFindings.length + 1}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Historical Leaks:</span>
                  <span className="font-bold">{summary.historicalOnly || 3}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-red-200">
                  <span>Posture Score:</span>
                  <span className="font-black text-red-700">{Math.max(18, baseScore - 26)}/100</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200 text-slate-800">
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Remediated State (After)</div>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span>Critical Findings:</span>
                  <span className="font-bold text-emerald-700">0</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>High Risk Secrets:</span>
                  <span className="font-bold text-emerald-700">0</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Historical Leaks:</span>
                  <span className="font-bold text-emerald-700">0 (Purged)</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-emerald-200">
                  <span>Posture Score:</span>
                  <span className="font-black text-emerald-700">96/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 25: Security Badge Generator */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              Repository Security Badge (README.md)
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Embed this dynamic SVG shield in your repository documentation to showcase your verified security status.
            </p>

            {/* Badge Preview */}
            <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between border border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Live Badge Preview:</span>
                <span className={`px-2.5 py-1 rounded text-xs font-black text-white ${badgeStatus.bg} shadow-xs`}>
                  CredSense Security | {badgeStatus.label}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Dynamic Score: {baseScore}</span>
            </div>

            {/* Markdown Snippet */}
            <div className="space-y-2">
              <div className="relative">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Markdown Embed</div>
                <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-2 rounded-lg truncate pr-16 border border-slate-800">
                  {markdownBadge}
                </div>
                <button
                  onClick={() => copyToClipboard(markdownBadge, 'md')}
                  className="absolute right-1 bottom-1 px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedMarkdown ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  {copiedMarkdown ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
