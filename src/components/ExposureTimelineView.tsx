import React, { useState } from 'react';
import {
  Clock,
  GitCommit,
  User,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Filter,
  Layers,
  ChevronRight,
  ExternalLink,
  Calendar,
  AlertOctagon,
} from 'lucide-react';
import { Finding, TimelineEvent } from '../types';

interface ExposureTimelineViewProps {
  timeline: TimelineEvent[];
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
}

export function ExposureTimelineView({ timeline, findings, onSelectFinding }: ExposureTimelineViewProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(findings[0]?.id || '');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const activeFinding = findings.find((f) => f.id === selectedFindingId) || findings[0];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Secret Lifecycle & Git Exposure Timeline
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Version Control Audit
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Track how secrets were introduced into Git history, persisted across releases, and their current exposure state.
              </p>
            </div>
          </div>
        </div>

        {/* Action filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter Event:</span>
          {['ALL', 'introduced', 'removed'].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-colors cursor-pointer border ${
                filterAction === act
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Dedicated Secret Lifecycle Stage Visualizer */}
      {activeFinding && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Secret Lifecycle Stage Audit</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                <span>{activeFinding.secretType}</span>
                <span className="text-xs font-mono font-normal text-slate-500">({activeFinding.maskedSecret})</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700">{activeFinding.id}</span>
              </div>
            </div>

            {/* Finding Picker */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-md pb-1">
              {findings.slice(0, 6).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFindingId(f.id)}
                  className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer border ${
                    selectedFindingId === f.id
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.id}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Lifecycle Stages */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
            {/* Stage 1: INTRODUCED */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">1. INTRODUCED</div>
              <div className="text-xs font-bold text-slate-800 mt-1">{formatDate(activeFinding.exposureStart)}</div>
              <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                {activeFinding.shortCommitId}
              </span>
            </div>

            {/* Stage 2: EXPOSED */}
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
              <div className="text-[10px] font-bold uppercase text-orange-700">2. EXPOSED</div>
              <div className="text-xs font-bold text-orange-900 mt-1">{activeFinding.exposureDays} Days Window</div>
              <span className="inline-block mt-1 text-[10px] font-bold text-orange-600">Active Exposure</span>
            </div>

            {/* Stage 3: DETECTED */}
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-center">
              <div className="text-[10px] font-bold uppercase text-sky-700">3. DETECTED</div>
              <div className="text-xs font-bold text-sky-900 mt-1">Entropy + Regex</div>
              <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-200 text-sky-800">
                Score: {activeFinding.entropyScore.toFixed(2)}
              </span>
            </div>

            {/* Stage 4: VERIFIED */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <div className="text-[10px] font-bold uppercase text-blue-700">4. VERIFIED</div>
              <div className="text-xs font-bold text-blue-900 mt-1">AI Verified: {activeFinding.verificationStatus}</div>
              <span className="inline-block mt-1 text-[10px] font-bold text-blue-600">
                {Math.round(activeFinding.verificationConfidence * 100)}% Confidence
              </span>
            </div>

            {/* Stage 5: REMOVED */}
            <div className={`p-3 rounded-lg border text-center ${activeFinding.isHistoricalOnly ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="text-[10px] font-bold uppercase text-purple-700">5. REMOVED IN HEAD</div>
              <div className="text-xs font-bold text-slate-800 mt-1">{activeFinding.isHistoricalOnly ? 'Purged in HEAD' : 'Still in HEAD'}</div>
              <span className="inline-block mt-1 text-[10px] font-bold text-purple-600">
                {activeFinding.isHistoricalOnly ? 'Code Deleted' : 'Action Required'}
              </span>
            </div>

            {/* Stage 6: PURGED / HISTORICALLY EXPOSED */}
            <div className={`p-3 rounded-lg border text-center ${activeFinding.isHistoricalOnly ? 'bg-red-50 border-red-200 ring-1 ring-red-300' : 'bg-red-50 border-red-200'}`}>
              <div className="text-[10px] font-bold uppercase text-red-700">6. GIT HISTORY STATE</div>
              <div className="text-xs font-black text-red-900 mt-1">
                {activeFinding.isHistoricalOnly ? 'HISTORICALLY EXPOSED' : 'ACTIVELY EXPOSED'}
              </div>
              <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-200 text-red-800">
                {activeFinding.isHistoricalOnly ? 'Needs BFG / git-filter-repo' : 'Delete & Invalidate'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Chronological Git Commit History Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-600" />
            Git Commit History Exposure Log ({timeline.length} Commits)
          </h3>
          <span className="text-xs text-slate-500 font-medium">Reconstructed from Git Object Database</span>
        </div>

        {timeline.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No historical commit timeline available for this scan session.
          </div>
        ) : (
          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((event, idx) => {
              const matchingSecrets = event.exposedSecrets.filter(
                (s) => filterAction === 'ALL' || s.action === filterAction
              );

              if (matchingSecrets.length === 0 && filterAction !== 'ALL') {
                return null;
              }

              return (
                <div key={event.commitId || idx} className="relative group">
                  {/* Timeline Bullet */}
                  <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-sky-600 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition-colors shadow-2xs">
                    {/* Commit Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-200 font-mono text-xs font-bold text-slate-800">
                          {event.shortCommitId || event.commitId.slice(0, 7)}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{event.message}</h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {event.author}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </div>

                    {/* Exposed Secrets in this Commit */}
                    <div className="mt-3 space-y-2">
                      {event.exposedSecrets.map((secret, sIdx) => {
                        const findingObj = findings.find((f) => f.id === secret.findingId);
                        const isCritical = secret.severity === 'CRITICAL';
                        return (
                          <div
                            key={sIdx}
                            onClick={() => findingObj && onSelectFinding(findingObj)}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all flex flex-wrap items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  secret.action === 'introduced'
                                    ? 'bg-red-100 text-red-800'
                                    : secret.action === 'removed'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {secret.action === 'introduced'
                                  ? 'SECRET INTRODUCED'
                                  : secret.action === 'removed'
                                  ? 'REMOVED FROM HEAD'
                                  : 'PERSISTED'}
                              </span>

                              <div>
                                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                  <span>{secret.secretType}</span>
                                  <span className="font-mono text-slate-500 font-normal text-[11px]">
                                    ({secret.maskedSecret})
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {secret.filePath}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isCritical ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {secret.severity}
                              </span>
                              <span className="text-xs text-sky-600 font-bold flex items-center gap-0.5">
                                <span>Inspect</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
