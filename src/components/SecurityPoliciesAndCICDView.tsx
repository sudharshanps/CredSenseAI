import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Sliders,
  Sparkles,
  ArrowRight,
  Info,
  Terminal,
  Layers,
  ChevronDown,
  ChevronUp,
  Workflow,
} from 'lucide-react';
import { SecurityPolicyConfig, CICDGateSimulation, Finding } from '../types';

interface SecurityPoliciesAndCICDViewProps {
  findings: Finding[];
  onOpenFinding?: (finding: Finding) => void;
  onNavigateTab?: (tab: string) => void;
}

export function SecurityPoliciesAndCICDView({ findings, onOpenFinding, onNavigateTab }: SecurityPoliciesAndCICDViewProps) {
  const [policies, setPolicies] = useState<SecurityPolicyConfig[]>([]);
  const [simulation, setSimulation] = useState<CICDGateSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [selectedCommitHash, setSelectedCommitHash] = useState('a9f4c12');
  const [selectedGatePolicy, setSelectedGatePolicy] = useState('CRITICAL_AND_HIGH');
  const [showDiagnostic, setShowDiagnostic] = useState(true);

  // Load Policies from backend
  const loadPolicies = () => {
    fetch('/api/policies')
      .then((res) => res.json())
      .then((data) => {
        if (data.policies) setPolicies(data.policies);
      })
      .catch((err) => console.error('Failed to load policies:', err));
  };

  useEffect(() => {
    loadPolicies();
    handleRunSimulation();
  }, []);

  const handleTogglePolicy = async (id: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.policies) setPolicies(data.policies);
    } catch (err) {
      console.error('Failed to toggle policy:', err);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/cicd/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: selectedBranch,
          commitHash: selectedCommitHash,
          policy: selectedGatePolicy,
        }),
      });
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Security Policy Engine & CI/CD Security Gate</h2>
              <p className="text-xs text-slate-500">Automated pre-merge deployment guardrails and policy enforcement rules</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('guardrail')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
            >
              <Workflow className="w-3.5 h-3.5 text-sky-600" />
              <span>CI/CD Guardrail Template (YAML)</span>
            </button>
          )}

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Evaluating Pipeline...' : 'Simulate CI/CD Gate'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 12: CI/CD Pipeline Visual Flow */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              Automated CI/CD Pipeline Stages
            </h3>
            <p className="text-xs text-slate-500">
              Live progression of the security verification gate across your delivery lifecycle.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Gate Policy:</span>
            <select
              value={selectedGatePolicy}
              onChange={(e) => setSelectedGatePolicy(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800"
            >
              <option value="CRITICAL_AND_HIGH">Strict: Block Critical & High</option>
              <option value="CRITICAL_ONLY">Moderate: Block Critical Only</option>
              <option value="ALLOW_ALL">Permissive: Warn Only</option>
            </select>
          </div>
        </div>

        {/* 6-Stage Pipeline Graphic */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 sm:gap-3">
          {[
            { step: '1. Ingestion', label: 'Commit Diff', status: 'passed' },
            { step: '2. Detection', label: 'Regex & Entropy', status: 'passed' },
            { step: '3. AI Verify', label: 'Context AST', status: 'passed' },
            { step: '4. Scoring', label: 'Risk Matrix', status: 'passed' },
            { step: '5. Policies', label: 'Rule Engine', status: 'passed' },
            { step: '6. Decision', label: simulation?.status === 'BLOCKED' ? 'BLOCKED' : 'PERMITTED', status: simulation?.status === 'BLOCKED' ? 'failed' : 'passed' },
          ].map((stage, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-center transition-all ${
                stage.status === 'failed'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase">{stage.step}</div>
              <div className="text-xs font-black mt-1">{stage.label}</div>
              <div className="mt-2 flex justify-center">
                {stage.status === 'failed' ? (
                  <XCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* SECTION 12: "Why was deployment blocked?" Interactive Diagnostic Drawer */}
        {simulation && simulation.status === 'BLOCKED' && (
          <div className="mt-6 bg-red-50/80 rounded-xl p-5 border border-red-200 text-slate-800">
            <div
              onClick={() => setShowDiagnostic(!showDiagnostic)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-bold text-red-950">
                  Why was this deployment blocked? (Diagnostic Breakdown)
                </h4>
              </div>
              <button className="text-red-700 text-xs font-bold flex items-center gap-1">
                {showDiagnostic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showDiagnostic && (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-slate-700">
                  The security gate prevented merge/deployment because active credentials violated one or more enterprise policies:
                </div>

                <div className="space-y-2">
                  {simulation.blockedReasonDetails?.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/90 p-3 rounded-lg border border-red-200 text-xs">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="font-semibold text-red-950">{reason}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-red-900">
                  <span>Commit: <strong className="font-mono">{simulation.commitHash}</strong> on branch <strong className="font-mono">{simulation.branch}</strong></span>
                  <span className="font-bold">Remediate secrets to unblock pipeline</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 11: Security Policy Engine */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              Configurable Security Policy Rules
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle specific compliance rules to adjust security gate tolerance.
            </p>
          </div>
          <span className="text-xs font-mono text-sky-700 font-bold px-2.5 py-1 bg-sky-50 rounded-lg border border-sky-200">
            {policies.filter((p) => p.enabled).length} of {policies.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {policies.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                p.enabled ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-50/70 border-slate-200 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    p.action === 'BLOCK' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.action}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{p.description}</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={() => handleTogglePolicy(p.id, p.enabled)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
