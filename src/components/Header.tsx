import React from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  GitBranch,
  FileText,
  Upload,
  RefreshCw,
  Cpu,
  Clock,
  Presentation,
  Compass,
} from 'lucide-react';
import { Scan, SecurityScorecard } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLoadDemo: () => void;
  isLoadingDemo: boolean;
  aiMode: string;
  repoName?: string;
  totalFindings: number;
  criticalFindings: number;
  lastScan?: Scan;
  securityScorecard?: SecurityScorecard;
  onOpenReport?: () => void;
  onOpenScan?: () => void;
  onOpenPresentation?: () => void;
  onOpenTour?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  onLoadDemo,
  isLoadingDemo,
  aiMode,
  repoName = 'demo-credsense-repo',
  totalFindings,
  criticalFindings,
  lastScan,
  securityScorecard,
  onOpenReport,
  onOpenScan,
  onOpenPresentation,
  onOpenTour,
}: HeaderProps) {
  const isCritical = criticalFindings > 0 || (securityScorecard && securityScorecard.overallScore < 50);
  const isAtRisk = !isCritical && totalFindings > 0;
  
  const postureStatus = isCritical ? 'CRITICAL' : isAtRisk ? 'AT RISK' : 'GOOD';
  const postureColor = isCritical
    ? 'bg-red-50 text-red-700 border-red-200'
    : isAtRisk
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner / Status Strip */}
      <div className="bg-slate-900 text-white px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Security Engine Online
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            Zero-Trust Privacy: <span className="text-sky-300 font-medium">Secrets Masked Client & Server</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            AI Mode: <span className="text-white font-medium capitalize">{aiMode.includes('gemini') ? 'Gemini 2.5 Flash AI' : 'Local Heuristic AI'}</span>
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Last Scan: <span className="text-slate-100">{formatTime(lastScan?.scannedAt)}</span>
          </span>
        </div>
      </div>

      {/* Main Brand & Action Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Product Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 rounded-xl bg-slate-900 border border-sky-400/40 flex items-center justify-center shadow-md overflow-hidden ring-2 ring-sky-100/80 group">
            <img
              src="/logo.jpg"
              alt="CredSense AI Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback if image fails to render
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                CredSense <span className="text-sky-600 font-extrabold">AI</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                Enterprise Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              AI-Powered Secret Detection & Git History Security • <span className="text-slate-700 font-semibold">Detect. Verify. Prioritize. Secure.</span>
            </p>
          </div>
        </div>

        {/* Security Posture & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Posture Badge */}
          <div
            onClick={() => setActiveTab('posture')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 ${postureColor}`}
            title="Open Security Posture Center"
          >
            {isCritical ? (
              <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
            ) : isAtRisk ? (
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 leading-none">Score: {securityScorecard?.overallScore ?? 65}/100</div>
              <div className="text-xs font-black tracking-tight">{postureStatus}</div>
            </div>
          </div>

          {/* Active Repo Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
            <GitBranch className="w-4 h-4 text-slate-500" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">Repository</div>
              <div className="text-xs font-mono font-semibold text-slate-800 truncate max-w-[140px]">{repoName}</div>
            </div>
          </div>

          {/* Quick Tour & Demo Mode Buttons */}
          <button
            onClick={onOpenTour}
            className="px-2.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            title="60-Second Judge Tour"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Judge Tour</span>
          </button>

          <button
            onClick={onOpenPresentation}
            className="px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            title="Fullscreen Presentation Mode"
          >
            <Presentation className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Demo Mode</span>
          </button>

          <button
            id="btn-header-scan"
            onClick={() => {
              if (onOpenScan) onOpenScan();
              else setActiveTab('scan');
            }}
            className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>

          <button
            id="btn-header-demo"
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingDemo ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoadingDemo ? 'Generating...' : 'Load Demo'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-slate-50/80 border-t border-slate-200 px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
        <nav className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 min-w-max">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'posture', label: 'Posture Center', icon: '🛡️', badge: '7-Score' },
            { id: 'findings', label: `Findings (${totalFindings})`, icon: '🔍' },
            { id: 'ghosts', label: 'Ghost Secrets', icon: '👻', badge: 'Forensics' },
            { id: 'remediation', label: 'Risk Prioritization & Playbook', icon: '🔥', badge: 'Action' },
            { id: 'heatmap', label: 'Exposure Heatmap & Git Risks', icon: '🗺️' },
            { id: 'timeline', label: 'Git Timeline', icon: '⏳' },
            { id: 'graph', label: 'Exposure Graph', icon: '🕸️' },
            { id: 'intelligence', label: 'Detection & AI Confidence', icon: '💡' },
            { id: 'cicd', label: 'CI/CD Gate & Policies', icon: '🚦' },
            { id: 'guardrail', label: 'CI/CD Guardrail (YAML)', icon: '🛡️', badge: 'YAML' },
            { id: 'knowledge', label: 'Knowledge & Recommendations', icon: '📚' },
            { id: 'governance', label: 'Audit Logs & Alerts', icon: '📋' },
            { id: 'report', label: 'Executive Summary', icon: '📄' },
            { id: 'copilot', label: 'AI Copilot', icon: '🤖', badge: 'AI' },
            { id: 'privacy', label: 'Privacy & Architecture', icon: '🔒' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-sky-800 text-sky-100' : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
