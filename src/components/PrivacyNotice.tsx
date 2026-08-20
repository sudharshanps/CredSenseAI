import React from 'react';
import { Lock, ShieldCheck, EyeOff, Server, Terminal, Sparkles, AlertCircle } from 'lucide-react';

interface PrivacyNoticeProps {
  aiMode: string;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ aiMode }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-slate-800 bg-[#0F141E] p-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-mono">Privacy-First Architecture & Security Model</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              CredSense AI follows strict non-persistence guidelines for raw credential data.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0F141E] p-5">
          <div className="flex items-center space-x-2 text-cyan-400">
            <EyeOff className="h-5 w-5" />
            <h3 className="text-sm font-bold font-mono text-slate-200">Zero Plaintext Secret Storage</h3>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Raw detected secrets are immediately masked in memory (<code className="text-cyan-300 font-mono">AKIA**************AMPLE</code>). Database records and in-memory caches only store masked strings and mathematical metadata (entropy, line numbers, commit SHA).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0F141E] p-5">
          <div className="flex items-center space-x-2 text-purple-400">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-sm font-bold font-mono text-slate-200">Masked-Only AI Ingestion</h3>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            When communicating with Google Gemini AI, raw secrets are replaced with safe identifiers and sanitized placeholders. The AI model only receives surrounding syntax and masked variables to evaluate context.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0F141E] p-5">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Server className="h-5 w-5" />
            <h3 className="text-sm font-bold font-mono text-slate-200">Local Sandbox Execution</h3>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Uploaded repositories and ZIP archives are safely unpacked into ephemeral temporary directories and are never executed. Static AST and Git commit history traversals operate with strict read-only guarantees.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0F141E] p-5">
          <div className="flex items-center space-x-2 text-amber-400">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-sm font-bold font-mono text-slate-200">Deterministic Fallback Ready</h3>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Currently running in <strong>{aiMode.includes('gemini') ? 'Gemini 3.7 Flash Cloud AI Mode' : 'Deterministic Local Verification Mode'}</strong>. Full functionality remains active even without cloud connectivity or API keys.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0F141E] p-5">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Formal Privacy Notice</h4>
        <p className="mt-2 text-xs text-slate-300 italic">
          "CredSense AI follows a privacy-first scanning model. Detected secret values are masked and are not stored as plaintext. Repository artifacts are deleted upon session termination, and no user telemetry is recorded."
        </p>
      </div>
    </div>
  );
};
