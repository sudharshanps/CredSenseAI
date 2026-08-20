import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  GitCommit,
  Flame,
  BrainCircuit,
  Sliders,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface JudgeQuickTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tabId: string) => void;
}

interface TourStep {
  stepNumber: number;
  title: string;
  badge: string;
  description: string;
  keyDifferentiator: string;
  targetTab: string;
  icon: any;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: '7-Factor Security Scorecard',
    badge: 'Enterprise Posture',
    description: 'Calculates a deterministic 0-100 posture score across 7 distinct security vectors, including "Why did my score change?" factor explanations and a "What If?" simulator.',
    keyDifferentiator: 'Moves beyond binary alerts into auditable continuous risk measurement.',
    targetTab: 'posture',
    icon: ShieldCheck,
  },
  {
    stepNumber: 2,
    title: 'Git History Exposure & DAG Blame',
    badge: 'Historical Intelligence',
    description: 'Scans the full Git commit graph to identify secrets deleted from recent files that still linger in historical packfiles.',
    keyDifferentiator: 'Detects credentials that standard static file linters completely miss.',
    targetTab: 'timeline',
    icon: GitCommit,
  },
  {
    stepNumber: 3,
    title: 'AI Semantic Verification & AST Scope',
    badge: 'Noise Elimination',
    description: 'Disambiguates real production keys from test mocks, documentation samples, and benign hashes using Gemini 2.5 Flash + Local Fallback.',
    keyDifferentiator: 'Reduces false positive triage noise by up to 35% with explainable evidence.',
    targetTab: 'intelligence',
    icon: BrainCircuit,
  },
  {
    stepNumber: 4,
    title: 'Automatic Risk Prioritization',
    badge: 'Actionable Triage',
    description: 'Provides a "What Should I Fix First?" remediation queue with 9-step rotation checklists and 6-step incident response playbooks.',
    keyDifferentiator: 'Directly guides developers through end-to-end credential revocation.',
    targetTab: 'remediation',
    icon: Flame,
  },
  {
    stepNumber: 5,
    title: 'CI/CD Policy Gate & Governance',
    badge: 'Shift-Left Guardrails',
    description: 'Simulates pre-merge deployment blocking gates with customizable policy rules and interactive diagnostic explanations.',
    keyDifferentiator: 'Blocks unsafe PRs before they ever reach production deployment.',
    targetTab: 'cicd',
    icon: Sliders,
  },
];

export function JudgeQuickTour({ isOpen, onClose, onNavigateTab }: JudgeQuickTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (onNavigateTab) onNavigateTab(TOUR_STEPS[nextIndex].targetTab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      if (onNavigateTab) onNavigateTab(TOUR_STEPS[prevIndex].targetTab);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-sky-500/40 backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Judge 60-Sec Quick Tour
            </span>
            <span className="text-[11px] text-slate-400">
              Step {currentStep.stepNumber} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0 border border-sky-400/30">
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-sky-400 tracking-wider">
                {currentStep.badge}
              </div>
              <h3 className="text-base font-bold text-white leading-tight">{currentStep.title}</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-800/80 text-[11px] text-sky-200">
            <strong>Key Innovation:</strong> {currentStep.keyDifferentiator}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="text-xs text-slate-400 hover:text-white font-bold disabled:opacity-30 cursor-pointer"
          >
            Back
          </button>

          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStepIndex ? 'w-4 bg-sky-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
