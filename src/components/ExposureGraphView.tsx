import React, { useState } from 'react';
import {
  GitBranch,
  FileCode,
  Key,
  GitCommit,
  Clock,
  ShieldAlert,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Finding, Scan } from '../types';

interface ExposureGraphViewProps {
  scan: Scan | null;
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
}

export function ExposureGraphView({ scan, findings, onSelectFinding }: ExposureGraphViewProps) {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(findings[0]?.id || '');

  const activeFinding = findings.find((f) => f.id === selectedFindingId) || findings[0];

  if (!activeFinding) {
    return (
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <GitBranch className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-700">No Exposure Graph Available</h3>
        <p className="text-xs text-slate-400 mt-1">Run a repository scan or load demo data to view attack paths.</p>
      </div>
    );
  }

  // Derive potential impact based on credential type
  const getPotentialImpact = (type: string, severity: string) => {
    if (type.includes('AWS')) {
      return {
        title: 'Full Cloud Infrastructure Takeover',
        desc: 'Attacker can provision compute instances, access S3 data buckets, or delete production RDS databases.',
        color: 'border-red-500 bg-red-50 text-red-900',
        badge: 'CRITICAL IMPACT',
      };
    }
    if (type.includes('Database') || type.includes('postgres') || type.includes('mysql')) {
      return {
        title: 'Direct Database Exfiltration & Tampering',
        desc: 'Unrestricted read/write access to customer tables, user records, and password hashes.',
        color: 'border-red-500 bg-red-50 text-red-900',
        badge: 'CRITICAL IMPACT',
      };
    }
    if (type.includes('Stripe')) {
      return {
        title: 'Payment Gateway Unauthorized Charges',
        desc: 'Attacker can initiate unauthorized customer refunds, create synthetic customers, or manipulate billing subscriptions.',
        color: 'border-red-500 bg-red-50 text-red-900',
        badge: 'FINANCIAL RISK',
      };
    }
    if (type.includes('GitHub')) {
      return {
        title: 'Source Code Theft & CI/CD Supply Chain Attack',
        desc: 'Private source code exfiltration, malicious branch injection, or compromised release artifacts.',
        color: 'border-orange-500 bg-orange-50 text-orange-900',
        badge: 'HIGH IMPACT',
      };
    }
    return {
      title: 'API Abuse & Quota Exfiltration',
      desc: 'Unauthorized API calls, rate limit exhaustion, and service downtime.',
      color: 'border-blue-500 bg-blue-50 text-blue-900',
      badge: 'SCOPED IMPACT',
    };
  };

  const impact = getPotentialImpact(activeFinding.secretType, activeFinding.severity);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Security Attack Path & Exposure Graph
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  DAG Traversal
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualize how credentials traverse from source code to Git commits, exposure windows, and blast radius impact.
              </p>
            </div>
          </div>
        </div>

        {/* Finding Selector Dropdown / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          <span className="text-xs font-bold text-slate-500 shrink-0">Select Finding:</span>
          {findings.slice(0, 5).map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFindingId(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors border ${
                selectedFindingId === f.id
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{f.id}</span>
              <span className="ml-1 opacity-80 text-[10px]">({f.secretType.split(' ')[0]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Graph Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attack Path for:</span>
            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {activeFinding.id} — {activeFinding.secretType}
            </span>
          </div>

          <button
            onClick={() => onSelectFinding(activeFinding)}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Open Finding Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step-by-Step Interactive Flow Graph */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
          {/* Node 1: Repository */}
          <div className="bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-xl p-4 text-center shadow-xs transition-all">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
              <GitBranch className="w-4 h-4" />
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">1. Git Repository</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">{scan?.repoName || 'credsense-repo'}</div>
            <div className="text-[10px] text-slate-500 mt-1">Git DAG Versioned</div>
          </div>

          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-5 h-5 text-sky-400 animate-pulse" />
          </div>

          {/* Node 2: File */}
          <div className="bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-xl p-4 text-center shadow-xs transition-all">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-2">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">2. Source File</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5 truncate font-mono">{activeFinding.filePath}</div>
            <div className="text-[10px] text-slate-500 mt-1">Line {activeFinding.lineNumber}</div>
          </div>

          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-5 h-5 text-sky-400 animate-pulse" />
          </div>

          {/* Node 3: Secret */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 text-center shadow-xs transition-all">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-2">
              <Key className="w-4 h-4" />
            </div>
            <div className="text-[10px] uppercase font-bold text-sky-800">3. Detected Secret</div>
            <div className="text-xs font-bold text-sky-900 mt-0.5 truncate">{activeFinding.secretType}</div>
            <div className="text-[10px] font-mono font-semibold text-sky-700 mt-1 truncate">{activeFinding.maskedSecret}</div>
          </div>

          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-5 h-5 text-sky-400 animate-pulse" />
          </div>

          {/* Node 4: Commit */}
          <div className="bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-xl p-4 text-center shadow-xs transition-all">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
              <GitCommit className="w-4 h-4" />
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">4. Introduced In</div>
            <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{activeFinding.shortCommitId}</div>
            <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[120px] mx-auto">{activeFinding.commitMessage}</div>
          </div>
        </div>

        {/* Second Row: Exposure -> Risk -> Blast Radius */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-slate-100 items-stretch">
          {/* Exposure Window */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <Clock className="w-4 h-4 text-slate-500" />
                5. Exposure Duration
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {activeFinding.exposureDays} Days Exposed
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {activeFinding.isHistoricalOnly
                  ? 'Removed in current HEAD, but lingering in commit objects'
                  : 'Active in working tree and public clone surface'}
              </p>
            </div>
            <div className="mt-3">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeFinding.isHistoricalOnly
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {activeFinding.isHistoricalOnly ? 'HISTORICALLY EXPOSED' : 'ACTIVE IN HEAD'}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center text-slate-300">
            <ArrowRight className="w-5 h-5 text-sky-400" />
          </div>

          {/* Risk Level */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                6. Multi-Factor Risk
              </div>
              <div className="text-lg font-black text-red-600 mt-1">
                {activeFinding.riskScore} / 100 ({activeFinding.severity})
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                AI Verified: <strong className="text-slate-800">{activeFinding.verificationStatus}</strong> ({Math.round(activeFinding.verificationConfidence * 100)}% confidence)
              </p>
            </div>
            <div className="mt-3">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                IMMEDIATE ROTATION REQUIRED
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center text-slate-300">
            <ArrowRight className="w-5 h-5 text-sky-400" />
          </div>

          {/* Potential Impact */}
          <div className={`border-2 rounded-xl p-4 flex flex-col justify-between ${impact.color}`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <AlertOctagon className="w-4 h-4" />
                  7. Potential Blast Radius
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/10">
                  {impact.badge}
                </span>
              </div>
              <div className="text-sm font-extrabold mt-1">{impact.title}</div>
              <p className="text-[11px] mt-1 opacity-90 leading-relaxed">{impact.desc}</p>
            </div>

            <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-bold">
              <span>Remediation Priority: Priority 1</span>
              <span>Audit logs recommended</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
