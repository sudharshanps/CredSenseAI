import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Key,
  FileCode,
  GitCommit,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Layers,
  Download,
  Ghost,
} from 'lucide-react';
import { Finding, SeverityLevel } from '../types';

interface FindingsExplorerViewProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  onToggleRemediate?: (findingId: string) => void;
  initialTypeFilter?: string;
  initialSeverityFilter?: string;
}

export function FindingsExplorerView({
  findings,
  onSelectFinding,
  onToggleRemediate,
  initialTypeFilter,
  initialSeverityFilter,
}: FindingsExplorerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>(initialSeverityFilter || 'ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [exposureFilter, setExposureFilter] = useState<string>('ALL'); // ALL, HEAD, HISTORICAL, GHOST
  const [typeFilter, setTypeFilter] = useState<string>(initialTypeFilter || 'ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'exposure' | 'entropy' | 'type'>('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract unique secret types for filter dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set(findings.map((f) => f.secretType));
    return Array.from(types);
  }, [findings]);

  // Filtered & Sorted findings
  const processedFindings = useMemo(() => {
    return findings
      .filter((f) => {
        // Search query match (ID, type, file, commit, message, author, fingerprint)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            f.id.toLowerCase().includes(q) ||
            f.secretType.toLowerCase().includes(q) ||
            f.filePath.toLowerCase().includes(q) ||
            f.maskedSecret.toLowerCase().includes(q) ||
            (f.fingerprint && f.fingerprint.toLowerCase().includes(q)) ||
            f.shortCommitId.toLowerCase().includes(q) ||
            f.author.toLowerCase().includes(q) ||
            f.commitMessage.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Severity
        if (severityFilter !== 'ALL' && f.severity !== severityFilter) {
          return false;
        }

        // Verification
        if (verificationFilter !== 'ALL' && f.verificationStatus !== verificationFilter) {
          return false;
        }

        // Exposure (HEAD vs Historical vs Ghost)
        if (exposureFilter === 'HEAD' && (f.isHistoricalOnly || f.isGhostSecret)) return false;
        if (exposureFilter === 'HISTORICAL' && !f.isHistoricalOnly && !f.isGhostSecret) return false;
        if (exposureFilter === 'GHOST' && !f.isGhostSecret && !f.isHistoricalOnly) return false;

        // Secret Type
        if (typeFilter !== 'ALL' && f.secretType !== typeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'risk') diff = a.riskScore - b.riskScore;
        else if (sortBy === 'exposure') diff = a.exposureDays - b.exposureDays;
        else if (sortBy === 'entropy') diff = a.entropyScore - b.entropyScore;
        else if (sortBy === 'type') diff = a.secretType.localeCompare(b.secretType);

        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [findings, searchQuery, severityFilter, verificationFilter, exposureFilter, typeFilter, sortBy, sortOrder]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Severity', 'RiskScore', 'Type', 'FilePath', 'Line', 'Commit', 'Author', 'Verification', 'HistoricalOnly', 'ExposureDays', 'Remediated'];
    const rows = processedFindings.map((f) => [
      f.id,
      f.severity,
      f.riskScore,
      `"${f.secretType}"`,
      `"${f.filePath}"`,
      f.lineNumber,
      f.shortCommitId,
      `"${f.author}"`,
      f.verificationStatus,
      f.isHistoricalOnly ? 'TRUE' : 'FALSE',
      f.exposureDays,
      f.isRemediated ? 'TRUE' : 'FALSE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credsense-findings-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Findings & Vulnerability Explorer
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {processedFindings.length} of {findings.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Filter, triage, and inspect candidate credentials with multi-factor risk scoring and AI verification evidence.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Global Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by secret type, file path, commit hash, author name, or finding ID..."
            className="w-full bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* Severity */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* AI Verification */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">AI Verification</label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="REAL">Real (Actionable)</option>
              <option value="TEST">Test / Mock</option>
              <option value="EXAMPLE">Example / Template</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </select>
          </div>

          {/* Exposure Location */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Exposure Location</label>
            <select
              value={exposureFilter}
              onChange={(e) => setExposureFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Locations</option>
              <option value="GHOST">Ghost Secrets (Lingering in History)</option>
              <option value="HEAD">Active in HEAD Branch</option>
              <option value="HISTORICAL">Historical Only (Purged in HEAD)</option>
            </select>
          </div>

          {/* Secret Type */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Secret Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Secret Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Sort Order</label>
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="risk">Risk Score</option>
                <option value="exposure">Exposure Days</option>
                <option value="entropy">Entropy</option>
                <option value="type">Type Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-600"
                title="Toggle Ascending / Descending"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {processedFindings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600">No matching security findings</p>
            <p className="text-[11px]">Try clearing search filters or scanning a new repository.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Severity / Risk</th>
                  <th className="p-3.5">Secret Candidate</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Git Origin</th>
                  <th className="p-3.5">AI Verification</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {processedFindings.map((f) => {
                  const isCrit = f.severity === 'CRITICAL';
                  const isHigh = f.severity === 'HIGH';
                  return (
                    <tr
                      key={f.id}
                      onClick={() => onSelectFinding(f)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Severity & Score */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isCrit
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : isHigh
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {f.severity}
                          </span>
                          <span className="font-mono font-bold text-slate-700 text-[11px]">
                            {f.riskScore}/100
                          </span>
                        </div>
                      </td>

                      {/* Secret Type & Masked Secret */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{f.secretType}</div>
                        <div className="font-mono text-[11px] text-slate-500 truncate max-w-[180px]">
                          {f.maskedSecret}
                        </div>
                      </td>

                      {/* File Path & Line */}
                      <td className="p-3.5">
                        <div className="font-mono text-[11px] text-slate-700 truncate max-w-[200px]">
                          {f.filePath}
                        </div>
                        <div className="text-[10px] text-slate-400">Line {f.lineNumber}</div>
                      </td>

                      {/* Git Origin Commit */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-slate-800 flex items-center gap-1">
                          <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                          {f.shortCommitId}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{f.author}</div>
                      </td>

                      {/* AI Verification */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.verificationStatus === 'REAL'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : f.verificationStatus === 'TEST' || f.verificationStatus === 'EXAMPLE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {f.verificationStatus}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {Math.round(f.verificationConfidence * 100)}% Conf
                        </div>
                      </td>

                      {/* Exposure Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {f.isRemediated ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Remediated ✓
                          </span>
                        ) : f.isGhostSecret ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Ghost className="w-3 h-3 text-amber-600" />
                              <span>Ghost Secret</span>
                            </span>
                            <div className="text-[9px] text-slate-500 font-mono">HEAD: Clean • History: Exposed</div>
                          </div>
                        ) : f.isHistoricalOnly ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Historical Only
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            Active in HEAD
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">{f.exposureDays}d window</div>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <span className="text-xs font-bold text-sky-600 group-hover:text-sky-700 flex items-center justify-end gap-0.5">
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
