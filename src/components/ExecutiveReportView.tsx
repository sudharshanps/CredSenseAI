import React from 'react';
import {
  FileText,
  Printer,
  Download,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Lock,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DashboardSummary, Finding, Scan } from '../types';

interface ExecutiveReportViewProps {
  summary: DashboardSummary;
  scan: Scan | null;
  findings: Finding[];
}

export function ExecutiveReportView({ summary, scan, findings }: ExecutiveReportViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      title: 'CredSense AI Enterprise Security Audit Report',
      generatedAt: new Date().toISOString(),
      repository: scan?.repoName || 'demo-credsense-repo',
      securityScorecard: summary.securityScorecard,
      summaryMetrics: {
        totalFindings: summary.totalFindings,
        criticalFindings: summary.criticalFindings,
        highFindings: summary.highFindings,
        falsePositives: summary.falsePositives,
        historicalOnly: summary.historicalOnly,
        averageRiskScore: summary.averageRiskScore,
      },
      topVulnerabilities: findings.map((f) => ({
        id: f.id,
        secretType: f.secretType,
        filePath: f.filePath,
        lineNumber: f.lineNumber,
        commit: f.shortCommitId,
        severity: f.severity,
        riskScore: f.riskScore,
        verificationStatus: f.verificationStatus,
        isHistoricalOnly: f.isHistoricalOnly,
        exposureDays: f.exposureDays,
        recommendedAction: f.recommendedAction,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credsense-security-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCritical = summary.criticalFindings > 0;
  const isAtRisk = !isCritical && summary.totalFindings > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Report Action Bar (Hidden on print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Executive Security Audit Report Generator
          </h2>
          <p className="text-xs text-slate-500">
            Formatted for CISO presentations, compliance audits (SOC2, ISO27001), and developer triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJSON}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none">
        {/* Report Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                CredSense <span className="text-sky-600">AI</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
                AUDIT REPORT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Automated Git Object & AI-Verified Secret Security Assessment
            </p>
          </div>

          <div className="text-right text-xs text-slate-600 space-y-1">
            <div>
              <strong className="text-slate-900">Generated:</strong> {new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div>
              <strong className="text-slate-900">Repository:</strong> {scan?.repoName || 'demo-credsense-repo'}
            </div>
            <div>
              <strong className="text-slate-900">Security Engine:</strong> CredSense AI Hybrid (Gemini 3.7 Flash)
            </div>
          </div>
        </div>

        {/* 1. Executive Summary & Posture Banner */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Executive Summary</h3>
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isCritical
                ? 'bg-red-50/80 border-red-200 text-red-950'
                : isAtRisk
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                {isCritical ? (
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                )}
                <h4 className="text-base font-black tracking-tight">
                  Security Posture: {isCritical ? 'CRITICAL RISK' : isAtRisk ? 'MODERATE RISK' : 'SECURE'}
                </h4>
              </div>
              <p className="text-xs mt-1 opacity-90 max-w-xl">
                {isCritical
                  ? `Immediate action required: Detected ${summary.criticalFindings} critical secret(s) in active source or historical Git commit records.`
                  : `Repository audit passed with ${summary.totalFindings} findings requiring standard scheduled remediation.`}
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-300/40 sm:pl-6">
              <div className="text-3xl font-black">{summary.securityScorecard?.overallScore || 78}/100</div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Security Score</div>
            </div>
          </div>
        </div>

        {/* 2. Key Audit Metrics Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Key Security Findings</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Candidates</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{summary.totalFindings}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200">
              <span className="text-[10px] uppercase font-bold text-red-700 block">Critical Risks</span>
              <span className="text-xl font-black text-red-700 mt-0.5 block">{summary.criticalFindings}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-200">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Historical Only</span>
              <span className="text-xl font-black text-purple-700 mt-0.5 block">{summary.historicalOnly}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Noise Filtered</span>
              <span className="text-xl font-black text-slate-700 mt-0.5 block">{summary.falsePositives}</span>
            </div>
          </div>
        </div>

        {/* 3. Detailed Vulnerability Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Prioritized Vulnerability Register</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Secret Type</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Git Commit</th>
                  <th className="p-2.5">Exposure</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {findings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          f.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : f.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {f.severity} ({f.riskScore})
                      </span>
                    </td>
                    <td className="p-2.5 font-bold">{f.secretType}</td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">
                      {f.filePath}:{f.lineNumber}
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">{f.shortCommitId}</td>
                    <td className="p-2.5">{f.exposureDays} days</td>
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          f.isHistoricalOnly ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {f.isHistoricalOnly ? 'Historical Only' : 'Active in HEAD'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Remediation Directives */}
        <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-700">
          <h3 className="font-bold text-slate-900 uppercase text-xs">4. Mandatory Remediation Directives</h3>
          <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
            <li><strong>Immediate Credential Invalidation:</strong> Rotate all cloud keys discovered in active commits with cloud providers.</li>
            <li><strong>Git History Sanitization:</strong> Execute <code>git-filter-repo</code> on upstream branches to eliminate orphaned blobs from developer clones.</li>
            <li><strong>Secrets Management Migration:</strong> Move static tokens to AWS Secrets Manager, HashiCorp Vault, or Doppler.</li>
            <li><strong>CI/CD Gate Integration:</strong> Enforce CredSense pre-commit hooks on developer workstations.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
