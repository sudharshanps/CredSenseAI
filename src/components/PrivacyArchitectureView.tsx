import React from 'react';
import {
  Lock,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  FileCode,
  Sparkles,
  GitBranch,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

export function PrivacyArchitectureView() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Privacy Guarantees & System Architecture
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Zero-Trust Security
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                How CredSense AI safely analyzes proprietary Git repositories without leaking raw secrets or code.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero Plaintext Transmission Policy</span>
        </div>
      </div>

      {/* 1. Privacy Architecture Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">1. Instant Regex Masking</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All detected credential candidates are masked immediately upon extraction (<code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[10px]">AKIA...****3B8A</code>) before entering application memory or telemetry.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">2. Redacted AI Payloads</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            AI verification and Copilot calls receive sanitized variable names and synthetic placeholders. Raw credential strings are strictly blocked from AI prompts.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">3. Ephemeral In-Memory Storage</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Scans and extracted metadata are held in volatile session memory. Uploaded ZIP files are processed in sandboxed temporary buffers and purged upon scan completion.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">4. Local Fallback Mode</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            If external cloud LLM connections are unavailable or restricted by corporate proxy, CredSense AI seamlessly falls back to offline deterministic heuristic verification.
          </p>
        </div>
      </div>

      {/* 2. End-to-End System Pipeline Architecture Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            End-to-End Pipeline Architecture (Detect → Verify → Investigate → Prioritize → Remediate)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">CredSense Architecture v2.4</span>
        </div>

        {/* Pipeline Diagram Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
          {/* Stage 1: INGESTION */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-sky-700">STAGE 1 • INGESTION</div>
              <div className="text-xs font-bold text-slate-900 mt-1">Git Repository Scanner</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Indexes source files, commits, author timestamps, and uncommitted working trees.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono bg-white p-1.5 rounded border border-slate-200 text-slate-600">
              Git Commit DAG Indexer
            </div>
          </div>

          {/* Stage 2: DETECT & MASK */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-sky-700">STAGE 2 • DETECT & MASK</div>
              <div className="text-xs font-bold text-slate-900 mt-1">Entropy + Regex Engine</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Matches 15+ credential provider patterns and computes Shannon character entropy. Immediately masks secrets.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono bg-white p-1.5 rounded border border-slate-200 text-slate-600">
              Zero-Trust Masking
            </div>
          </div>

          {/* Stage 3: AI VERIFY */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-sky-800">STAGE 3 • AI VERIFY</div>
              <div className="text-xs font-bold text-sky-950 mt-1">Gemini AI Context Reasoning</div>
              <p className="text-[11px] text-sky-800 mt-1">
                Analyzes surrounding code context (tests, mocks, documentation vs live keys) to reduce false positives by up to 65%.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono bg-white p-1.5 rounded border border-sky-200 text-sky-700">
              Gemini 3.7 Flash AI
            </div>
          </div>

          {/* Stage 4: RISK ENGINE */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-sky-700">STAGE 4 • PRIORITIZE</div>
              <div className="text-xs font-bold text-slate-900 mt-1">Multi-Factor Risk Engine</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Synthesizes secret sensitivity, active HEAD exposure, Git history duration, entropy, and file path context.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono bg-white p-1.5 rounded border border-slate-200 text-slate-600">
              Score: 0 to 100
            </div>
          </div>

          {/* Stage 5: SECURE */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-800">STAGE 5 • SECURE</div>
              <div className="text-xs font-bold text-emerald-950 mt-1">Remediation & Guardrails</div>
              <p className="text-[11px] text-emerald-800 mt-1">
                Generates 7-step playbooks, copyable <code>git-filter-repo</code> commands, and CI/CD gate simulations.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono bg-white p-1.5 rounded border border-emerald-200 text-emerald-700">
              Security Posture Fixed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
