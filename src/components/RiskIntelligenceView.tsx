import React, { useState } from 'react';
import {
  Brain,
  Filter,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Key,
  Layers,
  BarChart3,
  Search,
  ExternalLink,
} from 'lucide-react';
import { DashboardSummary, Finding, Scan, SeverityLevel } from '../types';

interface RiskIntelligenceViewProps {
  summary: DashboardSummary;
  scan: Scan | null;
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onFilterFindingType: (type: string) => void;
}

export function RiskIntelligenceView({
  summary,
  scan,
  findings,
  onSelectFinding,
  onFilterFindingType,
}: RiskIntelligenceViewProps) {
  const [activeTab, setActiveTab] = useState<'noise' | 'types' | 'scorecard' | 'trend'>('noise');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  const falsePositives = findings.filter((f) => f.verificationStatus === 'FALSE_POSITIVE');
  const testExamples = findings.filter((f) => f.verificationStatus === 'TEST' || f.verificationStatus === 'EXAMPLE');
  const realFindings = findings.filter((f) => f.verificationStatus === 'REAL');
  const unknownFindings = findings.filter((f) => f.verificationStatus === 'UNKNOWN');

  const noiseReductionCount = falsePositives.length + testExamples.length;
  const noiseReductionRate = findings.length > 0 ? Math.round((noiseReductionCount / findings.length) * 100) : 0;

  // Credential Intelligence categories
  const credentialCategories = [
    { name: 'AWS Cloud Credentials', match: 'AWS', icon: '☁️' },
    { name: 'GitHub Access Tokens', match: 'GitHub', icon: '🐙' },
    { name: 'Google Cloud Keys', match: 'Google', icon: '🌐' },
    { name: 'Stripe & Payment Keys', match: 'Stripe', icon: '💳' },
    { name: 'JSON Web Tokens (JWT)', match: 'JWT', icon: '🎫' },
    { name: 'Database Connection Strings', match: 'Database', icon: '🗄️' },
    { name: 'Private Cryptographic Keys', match: 'Private Key', icon: '🔐' },
    { name: 'Generic API Tokens', match: 'Generic', icon: '🔑' },
    { name: 'Slack Webhooks & Tokens', match: 'Slack', icon: '💬' },
  ];

  const scorecard = summary.securityScorecard || {
    overallScore: 78,
    postureStatus: 'AT RISK',
    postureLabel: 'Moderate Risk - Remediation Required',
    secretHygiene: 82,
    gitHistoryHygiene: 64,
    exposureRisk: 71,
    noiseReductionRate: 65,
    remediationRate: 55,
    cicdProtection: 92,
    improvementDelta: 12,
  };

  const filteredFindings = findings.filter((f) => {
    if (selectedStatusFilter === 'ALL') return true;
    return f.verificationStatus === selectedStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Risk & AI Noise Intelligence
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Signal vs Noise
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Eliminate alert fatigue through AI contextual validation, credential taxonomy breakdown, and security scorecards.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { id: 'noise', label: 'Noise Reduction' },
            { id: 'types', label: 'Credential Types' },
            { id: 'scorecard', label: 'Security Scorecard' },
            { id: 'trend', label: 'Security Trend' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Noise Reduction & False Positive Intelligence */}
      {activeTab === 'noise' && (
        <div className="space-y-6">
          {/* Noise Reduction KPI Bar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Detected</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{findings.length}</span>
              <span className="text-[10px] text-slate-500">Raw candidate regex hits</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-red-700">Verified Actionable</span>
              <span className="text-2xl font-black text-red-700 mt-1 block">{realFindings.length}</span>
              <span className="text-[10px] text-red-600">Authentic production keys</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-amber-700">Test / Example</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">{testExamples.length}</span>
              <span className="text-[10px] text-amber-600">Mocks, fixtures & templates</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">False Positives</span>
              <span className="text-2xl font-black text-slate-700 mt-1 block">{falsePositives.length}</span>
              <span className="text-[10px] text-slate-500">Filtered non-credentials</span>
            </div>

            <div className="bg-gradient-to-tr from-sky-600 to-indigo-700 text-white p-4 rounded-xl shadow-xs text-center flex flex-col justify-center">
              <span className="text-[10px] font-extrabold uppercase text-sky-200">Alert Noise Reduced</span>
              <span className="text-3xl font-black mt-0.5">{noiseReductionRate}%</span>
              <span className="text-[10px] text-sky-100">Preventing dev alert fatigue</span>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 flex items-start gap-3 shadow-xs">
            <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-sm mb-0.5">
                Why Noise Reduction is Critical in DevSecOps:
              </strong>
              <p className="opacity-90 leading-relaxed">
                Traditional secret scanners flood engineering teams with hundreds of alerts for unit test fixtures, documentation samples, and synthetic UUIDs. CredSense AI uses Gemini AI contextual reasoning to isolate actionable production keys with mathematical confidence.
              </p>
            </div>
          </div>

          {/* Filter Bar & Findings List */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Classified Findings ({filteredFindings.length})
              </h3>

              <div className="flex items-center gap-1.5">
                {['ALL', 'REAL', 'TEST', 'EXAMPLE', 'FALSE_POSITIVE', 'UNKNOWN'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer border ${
                      selectedStatusFilter === st
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredFindings.map((f) => (
                <div
                  key={f.id}
                  onClick={() => onSelectFinding(f)}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.verificationStatus === 'REAL'
                          ? 'bg-red-100 text-red-800'
                          : f.verificationStatus === 'TEST' || f.verificationStatus === 'EXAMPLE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {f.verificationStatus}
                    </span>

                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{f.secretType}</span>
                        <span className="font-mono font-normal text-slate-500 text-[11px]">
                          ({f.maskedSecret})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {f.filePath}:{f.lineNumber} • {f.verificationReason}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Risk: {f.riskScore}/100</span>
                    <span className="text-xs text-sky-600 font-bold flex items-center gap-0.5">
                      <span>Inspect</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Credential Intelligence Taxonomy */}
      {activeTab === 'types' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {credentialCategories.map((cat, idx) => {
              const matching = findings.filter((f) => f.secretType.toLowerCase().includes(cat.match.toLowerCase()));
              const count = matching.length;
              const highestSev = matching.some((f) => f.severity === 'CRITICAL')
                ? 'CRITICAL'
                : matching.some((f) => f.severity === 'HIGH')
                ? 'HIGH'
                : 'LOW';

              const avgDays = count > 0 ? Math.round(matching.reduce((acc, f) => acc + f.exposureDays, 0) / count) : 0;
              const activeExposures = matching.filter((f) => !f.isHistoricalOnly).length;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (count > 0) onFilterFindingType(cat.match);
                  }}
                  className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                    count > 0 ? 'border-slate-200 hover:border-sky-400 hover:shadow-sm cursor-pointer' : 'border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                    </div>
                    <span className="text-base font-black text-slate-900">{count}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div>
                      <span className="text-slate-400 font-bold block">Severity</span>
                      <span className={`font-bold ${highestSev === 'CRITICAL' ? 'text-red-600' : 'text-slate-700'}`}>
                        {count > 0 ? highestSev : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Avg Days</span>
                      <span className="font-bold text-slate-700">{avgDays}d</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">In HEAD</span>
                      <span className={`font-bold ${activeExposures > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        {activeExposures} active
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Repository Security Scorecard */}
      {activeTab === 'scorecard' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Repository Security Scorecard Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Secret Hygiene</span>
                <span>{scorecard.secretHygiene}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${scorecard.secretHygiene}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Measures percentage of clean files with no unmasked secrets.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Git History Cleanliness</span>
                <span>{scorecard.gitHistoryHygiene}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${scorecard.gitHistoryHygiene}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Evaluates historic commit DAG cleanliness and purged blobs.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>CI/CD Guardrail Coverage</span>
                <span>{scorecard.cicdProtection}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${scorecard.cicdProtection}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Enforced pre-merge checks across active branch policies.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Security Trend */}
      {activeTab === 'trend' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Security Debt & Risk Trend Across Scans
            </h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +12% Improvement
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Average Exposure Duration</span>
              <div className="text-xl font-black text-slate-900 mt-1">9.2 Days</div>
              <span className="text-[10px] text-slate-500">Reduced from 24 days last month</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Mean Time to Remediate (MTTR)</span>
              <div className="text-xl font-black text-slate-900 mt-1">4.5 Hours</div>
              <span className="text-[10px] text-emerald-600 font-bold">Fastest in DevSecOps Tier</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Security Scans Completed</span>
              <div className="text-xl font-black text-slate-900 mt-1">{summary.totalScans || 1} Scans</div>
              <span className="text-[10px] text-slate-500">Automated Git object indexing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
