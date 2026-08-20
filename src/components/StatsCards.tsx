import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info, ShieldCheck, CheckCircle2, History } from 'lucide-react';
import { DashboardSummary } from '../types';

interface StatsCardsProps {
  summary: DashboardSummary;
  onFilterSeverity?: (severity: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ summary, onFilterSeverity }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {/* 1. Total Findings */}
      <div
        id="stat-total-findings"
        className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-slate-700"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Findings</span>
          <AlertCircle className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">{summary.totalFindings}</span>
          <span className="text-[11px] text-slate-400">detected</span>
        </div>
      </div>

      {/* 2. Critical */}
      <div
        id="stat-critical-findings"
        onClick={() => onFilterSeverity && onFilterSeverity('CRITICAL')}
        className="group relative overflow-hidden rounded-xl border border-rose-900/40 bg-rose-950/20 p-3.5 transition-all hover:border-rose-700/60 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-rose-300">Critical</span>
          <AlertOctagon className="h-4 w-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-rose-400">{summary.criticalFindings}</span>
          <span className="text-[11px] text-rose-300/80">urgent</span>
        </div>
      </div>

      {/* 3. High */}
      <div
        id="stat-high-findings"
        onClick={() => onFilterSeverity && onFilterSeverity('HIGH')}
        className="group relative overflow-hidden rounded-xl border border-amber-900/40 bg-amber-950/20 p-3.5 transition-all hover:border-amber-700/60 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-300">High</span>
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-amber-400">{summary.highFindings}</span>
          <span className="text-[11px] text-amber-300/80">priority</span>
        </div>
      </div>

      {/* 4. Medium */}
      <div
        id="stat-medium-findings"
        onClick={() => onFilterSeverity && onFilterSeverity('MEDIUM')}
        className="group relative overflow-hidden rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-3.5 transition-all hover:border-yellow-700/60 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-yellow-300">Medium</span>
          <Info className="h-4 w-4 text-yellow-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-yellow-400">{summary.mediumFindings}</span>
          <span className="text-[11px] text-yellow-300/80">review</span>
        </div>
      </div>

      {/* 5. Low */}
      <div
        id="stat-low-findings"
        onClick={() => onFilterSeverity && onFilterSeverity('LOW')}
        className="group relative overflow-hidden rounded-xl border border-blue-900/40 bg-blue-950/20 p-3.5 transition-all hover:border-blue-700/60 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-300">Low</span>
          <ShieldCheck className="h-4 w-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-blue-400">{summary.lowFindings}</span>
          <span className="text-[11px] text-blue-300/80">scoped</span>
        </div>
      </div>

      {/* 6. False Positives / Test */}
      <div
        id="stat-false-positives"
        className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-slate-700"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-400">Test / False +</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">{summary.falsePositives + summary.testExample}</span>
          <span className="text-[11px] text-slate-400">filtered</span>
        </div>
      </div>

      {/* 7. Historical Only */}
      <div
        id="stat-historical-findings"
        className="group relative overflow-hidden rounded-xl border border-purple-900/40 bg-purple-950/20 p-3.5 transition-all hover:border-purple-700/60"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-purple-300">Git History Only</span>
          <History className="h-4 w-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-purple-400">{summary.historicalOnly}</span>
          <span className="text-[11px] text-purple-300/80">purged in HEAD</span>
        </div>
      </div>
    </div>
  );
};
