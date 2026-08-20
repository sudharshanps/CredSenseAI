import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  GitBranch,
  Terminal,
  Settings,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { CICDGateSimulation, Finding, Scan } from '../types';
import { safeFetch } from '../utils/api';

interface CICDSimulationViewProps {
  scan: Scan | null;
  findings: Finding[];
}

export function CICDSimulationView({ scan, findings }: CICDSimulationViewProps) {
  const [policy, setPolicy] = useState<'CRITICAL_ONLY' | 'CRITICAL_AND_HIGH' | 'STRICT_ZERO_TOLERANCE'>('CRITICAL_AND_HIGH');
  const [branch, setBranch] = useState<string>('feature/payment-v2');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<CICDGateSimulation | null>(null);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const data = await safeFetch<CICDGateSimulation>('/api/cicd/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: scan?.id,
          policy,
          branch,
          commitHash: 'f4e29b1',
        }),
      });

      setSimulationResult(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                CI/CD Security Gate Simulation
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Pre-Merge Guardrail
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Simulate pull request & deployment pipeline checks to prevent committing unmasked secrets into production branches.
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSimulating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          <span>{isSimulating ? 'Running Pipeline Simulation...' : 'Simulate Pipeline Gate'}</span>
        </button>
      </div>

      {/* Pipeline Stage Diagram */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Simulated Continuous Integration Workflow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {/* Stage 1 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2 font-bold text-xs">
              1
            </div>
            <div className="text-xs font-bold text-slate-900">Git Push / PR</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">{branch}</div>
          </div>

          <div className="text-center text-slate-300 font-bold hidden md:block">→</div>

          {/* Stage 2 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-2 font-bold text-xs">
              2
            </div>
            <div className="text-xs font-bold text-slate-900">CredSense Secret Scan</div>
            <div className="text-[10px] text-slate-500 mt-1">Shannon Entropy + Regex</div>
          </div>

          <div className="text-center text-slate-300 font-bold hidden md:block">→</div>

          {/* Stage 3 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2 font-bold text-xs">
              3
            </div>
            <div className="text-xs font-bold text-slate-900">AI Context Verification</div>
            <div className="text-[10px] text-slate-500 mt-1">Gemini / Local Heuristic</div>
          </div>
        </div>

        {/* Policy Configuration Controls */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Gate Enforcement Policy
            </label>
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="CRITICAL_ONLY">Block on CRITICAL Findings Only</option>
              <option value="CRITICAL_AND_HIGH">Block on CRITICAL & HIGH Findings (Recommended)</option>
              <option value="STRICT_ZERO_TOLERANCE">Strict Zero Tolerance (Block Any Unmasked Secret)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Target Branch Simulation
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Simulation Result Box */}
      {simulationResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              {simulationResult.status === 'BLOCKED' ? (
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
                      simulationResult.status === 'BLOCKED'
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {simulationResult.status === 'BLOCKED' ? '✕ DEPLOYMENT BLOCKED' : '✓ PIPELINE PASSED'}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Branch: {simulationResult.branch} ({simulationResult.commitHash})
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {simulationResult.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Policy Checks Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Security Policy Gate Audit Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {simulationResult.checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    check.passed
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-red-50/70 border-red-200 text-red-900'
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-bold">{check.name}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{check.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
