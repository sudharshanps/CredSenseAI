import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  Flame,
  Folder,
  FileCode,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import { Finding, HeatmapNode, Scan } from '../types';

interface HeatmapAndGitRiskViewProps {
  findings: Finding[];
  scan?: Scan | null;
  onOpenFinding?: (finding: Finding) => void;
}

interface BranchInfo {
  branch: string;
  isDefault: boolean;
  secretsCount: number;
  criticalCount: number;
  highCount: number;
  historicalExposures: number;
  riskScore: number;
  lastCommitHash: string;
  lastCommitDate: string;
  status: 'PROTECTED' | 'AT RISK' | 'CRITICAL';
}

interface CommitRiskInfo {
  commitHash: string;
  shortCommit: string;
  author: string;
  date: string;
  message: string;
  filesChanged: number;
  secretsIntroduced: number;
  riskScore: number;
  findingIds: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export function HeatmapAndGitRiskView({ findings, onOpenFinding }: HeatmapAndGitRiskViewProps) {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'commits' | 'branches'>('heatmap');
  const [selectedFileFilter, setSelectedFileFilter] = useState<string | null>(null);

  // Dynamic Branches State
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [branchesAvailable, setBranchesAvailable] = useState(true);
  const [branchesMessage, setBranchesMessage] = useState('');

  // Risky Commits State
  const [commits, setCommits] = useState<CommitRiskInfo[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<CommitRiskInfo | null>(null);

  // Fetch branch and commit data
  useEffect(() => {
    fetch('/api/branches/security')
      .then((res) => res.json())
      .then((data) => {
        if (data.available && data.branches) {
          setBranches(data.branches);
          setBranchesAvailable(true);
        } else {
          setBranchesAvailable(false);
          setBranchesMessage(data.message || 'Branch analysis unavailable for current repository.');
        }
      })
      .catch(() => {
        setBranchesAvailable(false);
      });

    fetch('/api/commits/risks')
      .then((res) => res.json())
      .then((data) => {
        if (data.commits) {
          setCommits(data.commits);
          if (data.commits.length > 0) setSelectedCommit(data.commits[0]);
        }
      })
      .catch((err) => console.error('Failed to load risky commits:', err));
  }, [findings]);

  // Generate directory/file hierarchy for heatmap
  const buildHeatmapTree = (): HeatmapNode[] => {
    const map = new Map<string, { count: number; maxRisk: number; critCount: number; findings: Finding[] }>();

    for (const f of findings) {
      const parts = f.filePath.split('/');
      let currentPath = '';
      for (let i = 0; i < parts.length; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        const isFile = i === parts.length - 1;
        const key = currentPath;
        const prev = map.get(key) || { count: 0, maxRisk: 0, critCount: 0, findings: [] };
        prev.count += 1;
        prev.maxRisk = Math.max(prev.maxRisk, f.riskScore);
        if (f.severity === 'CRITICAL') prev.critCount += 1;
        prev.findings.push(f);
        map.set(key, prev);
      }
    }

    // Convert top level directories and direct files
    const nodes: HeatmapNode[] = [];
    const processed = new Set<string>();

    for (const f of findings) {
      const dir = f.filePath.includes('/') ? f.filePath.split('/')[0] : f.filePath;
      if (processed.has(dir)) continue;
      processed.add(dir);

      const data = map.get(dir);
      if (data) {
        nodes.push({
          path: dir,
          name: dir,
          type: f.filePath.includes('/') ? 'folder' : 'file',
          secretsCount: data.count,
          maxRiskScore: data.maxRisk,
          criticalCount: data.critCount,
          highCount: data.findings.filter((x) => x.severity === 'HIGH').length,
          mediumCount: data.findings.filter((x) => x.severity === 'MEDIUM').length,
          findings: data.findings,
        });
      }
    }

    return nodes.sort((a, b) => b.maxRiskScore - a.maxRiskScore);
  };

  const heatmapNodes = buildHeatmapTree();

  const filteredFindings = selectedFileFilter
    ? findings.filter((f) => f.filePath.startsWith(selectedFileFilter))
    : findings;

  const getHeatmapColor = (risk: number, critCount: number) => {
    if (critCount > 0 || risk >= 85) return 'bg-red-500 text-white border-red-600';
    if (risk >= 70) return 'bg-amber-500 text-white border-amber-600';
    if (risk >= 40) return 'bg-sky-500 text-white border-sky-600';
    return 'bg-emerald-500 text-white border-emerald-600';
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Exposure Heatmap & Git History Risk Intelligence</h2>
              <p className="text-xs text-slate-500">Spatial repository exposure, branch health, and historical commit risk</p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'heatmap' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Directory Heatmap
          </button>
          <button
            onClick={() => setActiveTab('commits')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'commits' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5 text-purple-600" />
            Risky Commits ({commits.length})
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'branches' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
            Branch Analysis
          </button>
        </div>
      </div>

      {/* SECTION 5: Secret Exposure Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-600" />
                  Spatial Repository Exposure Heatmap
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual directory mapping showing credential concentration and blast radius intensity. Click any node to filter findings.
                </p>
              </div>

              {selectedFileFilter && (
                <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
                  <span className="text-xs font-bold text-sky-800">Filtering: {selectedFileFilter}</span>
                  <button
                    onClick={() => setSelectedFileFilter(null)}
                    className="text-xs text-sky-600 hover:text-sky-800 font-bold ml-2 cursor-pointer"
                  >
                    ✕ Clear
                  </button>
                </div>
              )}
            </div>

            {/* Heatmap Visual Matrix Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {heatmapNodes.map((node) => {
                const isSelected = selectedFileFilter === node.path;
                return (
                  <div
                    key={node.path}
                    onClick={() => setSelectedFileFilter(isSelected ? null : node.path)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          {node.type === 'folder' ? <Folder className="w-4 h-4 text-sky-600 shrink-0" /> : <FileCode className="w-4 h-4 text-indigo-600 shrink-0" />}
                          <span className="text-xs font-black text-slate-900 truncate">{node.path}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${getHeatmapColor(node.maxRiskScore, node.criticalCount)}`}>
                          {node.maxRiskScore}/100
                        </span>
                      </div>

                      <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Detected Secrets:</span>
                          <strong className="text-slate-900">{node.secretsCount}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Critical Exposures:</span>
                          <strong className={node.criticalCount > 0 ? 'text-red-600 font-black' : 'text-slate-700'}>{node.criticalCount}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-sky-600 font-bold">
                      <span>{isSelected ? 'Active Filter' : 'Click to inspect'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtered Findings List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-sky-600" />
              {selectedFileFilter ? `Findings inside "${selectedFileFilter}" (${filteredFindings.length})` : `All Repository Findings (${findings.length})`}
            </h4>

            <div className="divide-y divide-slate-100">
              {filteredFindings.map((f) => (
                <div key={f.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        f.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="font-bold text-slate-900">{f.secretType}</span>
                      <span className="font-mono text-slate-500">{f.filePath}:{f.lineNumber}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">{f.riskExplanation || f.verificationReason}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">{f.exposureDays}d exposure</span>
                    {onOpenFinding && (
                      <button
                        onClick={() => onOpenFinding(f)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: Commit Risk Analysis ("Risky Commits") */}
      {activeTab === 'commits' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Commit List Left */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-purple-600" />
              High-Risk Git Commits ({commits.length})
            </h3>

            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {commits.map((c) => {
                const isSelected = selectedCommit?.commitHash === c.commitHash;
                return (
                  <div
                    key={c.commitHash}
                    onClick={() => setSelectedCommit(c)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                        {c.shortCommit}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        c.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Max Risk: {c.riskScore}/100
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">
                      {c.message}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {c.author}
                      </span>
                      <span className="font-bold text-red-600">
                        {c.secretsIntroduced} secret(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commit Inspector Right */}
          {selectedCommit ? (
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-purple-100 text-purple-800 px-2.5 py-1 rounded">
                    commit {selectedCommit.commitHash}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(selectedCommit.date).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-2">{selectedCommit.message}</h3>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <span>Author: <strong>{selectedCommit.author}</strong></span>
                  <span>•</span>
                  <span>Files Impacted: <strong>{selectedCommit.filesChanged}</strong></span>
                </div>
              </div>

              {/* Secrets Introduced in this commit */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Credentials Introduced in this Commit ({selectedCommit.secretsIntroduced})
                </h4>

                <div className="space-y-3">
                  {findings
                    .filter((f) => selectedCommit.findingIds.includes(f.id))
                    .map((f) => (
                      <div key={f.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{f.secretType}</span>
                            <span className="font-mono text-xs text-slate-500">{f.filePath}:{f.lineNumber}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{f.riskExplanation}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-red-600 font-mono">Risk: {f.riskScore}</span>
                          {onOpenFinding && (
                            <button
                              onClick={() => onOpenFinding(f)}
                              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              Select a commit on the left to inspect introduced credentials.
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: Branch Security Analysis */}
      {activeTab === 'branches' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-600" />
              Branch Security & Drift Analysis
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Audits active branches for leaked credentials and divergent security posture compared to the default branch.
            </p>
          </div>

          {branchesAvailable && branches.length > 0 ? (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 grid grid-cols-12 gap-3 text-xs font-bold text-slate-600">
                <span className="col-span-4">Branch Name</span>
                <span className="col-span-2 text-center">Status</span>
                <span className="col-span-2 text-center">Secrets Count</span>
                <span className="col-span-2 text-center">Criticals</span>
                <span className="col-span-2 text-right">Risk Score</span>
              </div>

              {branches.map((b) => (
                <div key={b.branch} className="px-4 py-3.5 grid grid-cols-12 gap-3 items-center text-xs hover:bg-slate-50 transition-colors">
                  <div className="col-span-4 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-slate-400" />
                    <span className="font-mono font-bold text-slate-900">{b.branch}</span>
                    {b.isDefault && (
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      b.status === 'CRITICAL' ? 'bg-red-100 text-red-800' : b.status === 'AT RISK' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="col-span-2 text-center font-bold text-slate-800">
                    {b.secretsCount}
                  </div>

                  <div className="col-span-2 text-center font-black text-red-600">
                    {b.criticalCount}
                  </div>

                  <div className="col-span-2 text-right font-black text-slate-900 font-mono">
                    {b.riskScore}/100
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              {branchesMessage || 'Branch analysis is unavailable for this standalone repository.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
