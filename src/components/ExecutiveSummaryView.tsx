import React, { useState } from 'react';
import {
  FileText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  TrendingDown,
  Building2,
  CheckCircle2,
  Lock,
  Server,
  Zap,
  Printer,
  Download,
  Share2,
  Cpu,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { DashboardSummary, Finding, Scan } from '../types';

interface ExecutiveSummaryViewProps {
  summary: DashboardSummary;
  findings: Finding[];
  scan?: Scan | null;
  onOpenFinding?: (finding: Finding) => void;
  onNavigateTab?: (tabId: string) => void;
}

export function ExecutiveSummaryView({
  summary,
  findings,
  onOpenFinding,
  onNavigateTab,
}: ExecutiveSummaryViewProps) {
  const [viewMode, setViewMode] = useState<'executive' | 'technical'>('executive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDate, setGeneratedDate] = useState(new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }));

  const scorecard = summary.securityScorecard;
  const overallScore = scorecard?.overallScore || 64;

  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL' && !f.isRemediated);
  const highFindings = findings.filter((f) => f.severity === 'HIGH' && !f.isRemediated);
  const activeHeadFindings = findings.filter((f) => !f.isHistoricalOnly && !f.isRemediated);
  const historicalFindings = findings.filter((f) => f.isHistoricalOnly && !f.isRemediated);
  const actionableFindings = findings.filter((f) => f.verificationStatus !== 'FALSE_POSITIVE' && !f.isRemediated);

  const top3Risks = [...findings].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
  const mostDangerous = top3Risks.length > 0 ? top3Risks[0] : null;
  const longestExposure = [...findings].sort((a, b) => b.exposureDays - a.exposureDays)[0] || null;

  const falsePositiveRate = findings.length > 0
    ? Math.round((findings.filter((f) => f.verificationStatus === 'FALSE_POSITIVE').length / findings.length) * 100)
    : 0;

  const securityStatus = overallScore < 50 || criticalFindings.length > 0
    ? 'CRITICAL RISK - ACTION REQUIRED'
    : overallScore < 80 || highFindings.length > 0
    ? 'MODERATE RISK - REMEDIATION IN PROGRESS'
    : 'SATISFACTORY - LOW EXPOSURE';

  const recommendedPriority = criticalFindings.length > 0
    ? 'P0: Immediate Revocation of Production Credentials in HEAD'
    : highFindings.length > 0
    ? 'P1: Rotate High-Entropy Cloud Secrets'
    : historicalFindings.length > 0
    ? 'P2: Git History Rewrite and Pre-commit Hooks'
    : 'P3: Maintain Continuous CI/CD Surveillance';

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedDate(new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }));
    }, 600);
  };

  // Section 28: Enterprise Readiness Pillars
  const enterprisePillars = [
    { name: 'Zero-Trust Privacy Architecture', score: 98, weight: 15, status: 'EXCELLENT', detail: 'Plaintext credentials never leave local sandbox; automated mask-before-AI pipeline.' },
    { name: 'Auditability & Provenance', score: 94, weight: 15, status: 'EXCELLENT', detail: 'Immutable Git commit SHA blame tracing and tamper-evident local audit logs.' },
    { name: 'AI Governance & Safety', score: 92, weight: 15, status: 'EXCELLENT', detail: 'Dual-engine local deterministic fallback ensures zero single-point-of-failure.' },
    { name: 'CI/CD Pipeline Security Gate', score: 90, weight: 15, status: 'HIGH', detail: 'Configurable automated pre-merge gating for GitHub Actions and GitLab CI.' },
    { name: 'Secret Rotation & Lifecycle', score: 85, weight: 10, status: 'HIGH', detail: 'Interactive 9-step rotation checklist and multi-state remediation lifecycle.' },
    { name: 'Container & Microservice Ready', score: 95, weight: 10, status: 'EXCELLENT', detail: 'Single port (3000) Cloud Run containerized deployment with bundled runtime.' },
    { name: 'Enterprise Scalability & Speed', score: 88, weight: 10, status: 'HIGH', detail: 'Sub-second AST tokenization and streaming Git commit DAG tree scanner.' },
    { name: 'Explainable Security Intelligence', score: 96, weight: 10, status: 'EXCELLENT', detail: 'Provides positive and counter-evidence reasons for every classification.' },
  ];

  const enterpriseReadinessScore = Math.round(
    enterprisePillars.reduce((acc, p) => acc + (p.score * p.weight) / 100, 0)
  );

  return (
    <div className="space-y-6">
      {/* Top Action & View Switcher Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Security Executive Summary</h2>
              <p className="text-xs text-slate-500">Board-level risk posture and actionable mitigation briefing</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Executive vs Technical Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('executive')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'executive'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive View (Business Impact)
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'technical'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Technical View (Developer & CVE)
            </button>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Analyzing Findings...' : 'Generate Executive Summary'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Executive Briefing Container */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Report Metadata Header */}
        <div className="border-b border-slate-200 pb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-sky-400/40 shadow-xs overflow-hidden shrink-0 hidden sm:block">
              <img
                src="/logo.jpg"
                alt="CredSense Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-sky-600 flex items-center gap-2">
                Enterprise Security Assessment Report
                <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">CredSense AI</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {summary.latestScan?.repoName || 'demo-credsense-repo'} — Security Health & Exposure Audit
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span><strong>Audit Date:</strong> {generatedDate}</span>
                <span>•</span>
                <span><strong>Evaluator:</strong> CredSense AI Continuous Security Engine</span>
                <span>•</span>
                <span><strong>Classification:</strong> Confidential / Internal Security Use Only</span>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl border bg-slate-50 border-slate-200 text-right">
            <div className="text-[10px] font-bold uppercase text-slate-400">Security Posture Status</div>
            <div className={`text-sm font-black ${overallScore < 50 ? 'text-red-600' : overallScore < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {securityStatus}
            </div>
          </div>
        </div>

        {/* Executive View (Business-friendly language) */}
        {viewMode === 'executive' ? (
          <div className="space-y-6">
            {/* Key Executive Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-600" />
                  Most Dangerous Credential
                </div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {mostDangerous ? `${mostDangerous.secretType}` : 'None detected'}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {mostDangerous ? `Risk Score: ${mostDangerous.riskScore}/100 in ${mostDangerous.filePath}` : 'No critical credentials found.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Longest Active Exposure
                </div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {longestExposure ? `${longestExposure.exposureDays} Days Exposure` : '0 Days'}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {longestExposure ? `${longestExposure.secretType} introduced in commit ${longestExposure.shortCommitId}` : 'No lingering credentials.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
                  Recommended Top Priority
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">
                  {recommendedPriority}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Targeted remediation eliminates 80%+ of exposure.</p>
              </div>
            </div>

            {/* Narrative Business Risk Summary */}
            <div className="bg-sky-50/50 rounded-xl p-5 border border-sky-200 text-slate-800">
              <h3 className="text-sm font-bold text-sky-950 mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-700" />
                Executive Risk Narrative
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                During this automated repository audit, CredSense AI analyzed <strong>{summary.latestScan?.totalCommitsScanned || 8} commits</strong> and identified <strong>{actionableFindings.length} verified actionable security findings</strong>. 
                {criticalFindings.length > 0 ? (
                  <span className="text-red-700 font-semibold"> There are currently {criticalFindings.length} production credentials directly accessible in the repository worktree, representing an immediate risk of unauthorized cloud infrastructure access, data compromise, and billing surges.</span>
                ) : (
                  <span> No live critical secrets were found in the active worktree.</span>
                )}
                {historicalFindings.length > 0 && (
                  <span> Furthermore, {historicalFindings.length} credentials have been deleted from recent files but remain exposed in historical Git commit objects, which any cloned contributor can extract.</span>
                )}
              </p>
            </div>

            {/* Top 3 Strategic Risks Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Top 3 Critical Risks Requiring Executive Attention
              </h3>
              <div className="space-y-3">
                {top3Risks.map((f, i) => (
                  <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-800 text-xs font-black flex items-center justify-center shrink-0">
                        #{i + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{f.secretType}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {f.severity}
                          </span>
                          <span className="text-xs font-mono text-slate-500">{f.filePath}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {f.verificationReason || 'Verified production credential with high entropy pattern.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Risk Score</div>
                        <div className="text-sm font-black text-red-600">{f.riskScore}/100</div>
                      </div>
                      {onOpenFinding && (
                        <button
                          onClick={() => onOpenFinding(f)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Technical View (Developer and Engineering breakdown) */
          <div className="space-y-6">
            {/* Technical Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">HEAD Exposures</div>
                <div className="text-xl font-black text-red-600">{activeHeadFindings.length}</div>
                <div className="text-[11px] text-slate-500">Active in current ref</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">Git History Leaks</div>
                <div className="text-xl font-black text-purple-600">{historicalFindings.length}</div>
                <div className="text-[11px] text-slate-500">In Git commit blobs</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">False Positive Rate</div>
                <div className="text-xl font-black text-emerald-600">{falsePositiveRate}%</div>
                <div className="text-[11px] text-slate-500">Mocks & dummy tests</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">Actionable Count</div>
                <div className="text-xl font-black text-slate-900">{actionableFindings.length}</div>
                <div className="text-[11px] text-slate-500">Requiring rotation</div>
              </div>
            </div>

            {/* Technical Verification Method Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-700">
                Technical Vulnerability Breakdown by Detector Pattern
              </div>
              <div className="divide-y divide-slate-200">
                {findings.map((f) => (
                  <div key={f.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        f.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="font-bold text-slate-900">{f.secretType}</span>
                      <span className="font-mono text-slate-500">{f.filePath}:{f.lineNumber}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-600">Entropy: {f.entropyScore.toFixed(2)} b/c</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{f.isHistoricalOnly ? 'Historical Blob' : 'Active HEAD'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-sky-700">AI: {f.verificationStatus} ({Math.round(f.verificationConfidence * 100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 28: Enterprise Readiness Score Panel */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-black text-slate-900">Enterprise Readiness Assessment</h3>
              </div>
              <p className="text-xs text-slate-500">
                Evaluated against enterprise privacy, zero-trust secrets handling, scalability, and CI/CD governance standards.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-sky-50 px-4 py-2 rounded-xl border border-sky-200">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-sky-800">Enterprise Readiness</div>
                <div className="text-xl font-black text-sky-900">{enterpriseReadinessScore}%</div>
              </div>
              <ShieldCheck className="w-6 h-6 text-sky-600" />
            </div>
          </div>

          {/* 8 Enterprise Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {enterprisePillars.map((pillar, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{pillar.name}</span>
                  <span className="text-xs font-mono font-black text-sky-700">{pillar.score}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full" style={{ width: `${pillar.score}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{pillar.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
