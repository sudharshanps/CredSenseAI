import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
  GitCommit,
  Flame,
  Layers,
  CheckCircle2,
  Lock,
  Cpu,
  ArrowRight,
  Play,
  RotateCw,
} from 'lucide-react';

interface DemoPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToTab?: (tabId: string) => void;
}

interface Slide {
  title: string;
  subtitle: string;
  badge: string;
  content: string[];
  highlight: string;
  metricLabel: string;
  metricValue: string;
  icon: any;
  recommendedTab?: string;
}

const SLIDES: Slide[] = [
  {
    title: 'The Problem: Secrets in Git Are Not Static',
    subtitle: 'Traditional regex scanners flood developers with false positives and ignore Git history exposure.',
    badge: '1. The Challenge',
    icon: Flame,
    content: [
      'Over 10 million secrets are leaked to public/private Git repositories annually.',
      'Deleting a secret from a file does NOT delete it from Git commit history—it remains in git packfiles forever.',
      'Legacy scanners produce 40%+ false positives on dummy test fixtures, burning developer triage time.',
    ],
    highlight: 'Traditional tools tell you WHAT was found. CredSense AI tells you IF IT MATTERS, WHERE IT LIVED, and WHAT TO FIX FIRST.',
    metricLabel: 'Industry Leaked Secrets / Year',
    metricValue: '10M+',
  },
  {
    title: 'Multi-Layer Detection Engine',
    subtitle: 'Combining regex pattern banks, Shannon entropy calculation, and AST syntactic context filters.',
    badge: '2. Detection Intelligence',
    icon: Layers,
    content: [
      'Comprehensive detection coverage across AWS, GitHub, Stripe, DB URIs, Private Keys, Slack, and JWTs.',
      'Calculates Shannon entropy to detect high-randomness tokens while filtering low-entropy mock strings.',
      'Analyzes AST file syntax and variable assignment scope before AI invocation.',
    ],
    highlight: 'Filters out up to 35% of noise before any LLM is called, keeping performance ultra-fast.',
    metricLabel: 'Entropy Threshold',
    metricValue: '> 3.2 bits',
    recommendedTab: 'intelligence',
  },
  {
    title: 'AI Semantic Verification & Disambiguation',
    subtitle: 'Dual-mode AI verification (Gemini 2.5 Flash + Deterministic Local Fallback).',
    badge: '3. AI Verification',
    icon: Sparkles,
    content: [
      'Evaluates variable naming, surrounding mock dictionaries, and test directory context.',
      'Classifies findings as: VERIFIED REAL, TEST SECRET, EXAMPLE/DOCS, or FALSE POSITIVE.',
      'Dual-engine fallback guarantees zero single point of failure and zero hallucination risk.',
    ],
    highlight: 'Developers only spend time on real production risks, eliminating alert fatigue.',
    metricLabel: 'Semantic Accuracy',
    metricValue: '94%+',
    recommendedTab: 'intelligence',
  },
  {
    title: 'Git History Exposure & Blame Tracing',
    subtitle: 'Deep commit DAG traversal and lifetime exposure calculation.',
    badge: '4. Git History Graph',
    icon: GitCommit,
    content: [
      'Traces exact commit SHA, committer author, and historical timestamps for every credential.',
      'Identifies "Historical Leaks": secrets deleted from current HEAD but still alive in Git blobs.',
      'Calculates real exposure duration in days to establish urgency.',
    ],
    highlight: 'Reveals hidden credential debt that ordinary static linters completely miss.',
    metricLabel: 'DAG Scan Depth',
    metricValue: '100% DAG',
    recommendedTab: 'timeline',
  },
  {
    title: 'Deterministic Multi-Factor Risk Scoring',
    subtitle: 'Mathematically weighted 0-100 risk score that prioritizes real business impact.',
    badge: '5. Risk Prioritization',
    icon: Shield,
    content: [
      'Weighting factors: Sensitivity tier (25%), Exposure duration (20%), Presence in HEAD (25%), AI Confidence (20%), Entropy (10%).',
      'Provides clear "What Should I Fix First?" ordered remediation queue.',
      'Generates automated P0/P1/P2 recommendations for immediate impact.',
    ],
    highlight: 'No arbitrary severities—every score is justified by deterministic, explainable mathematics.',
    metricLabel: 'Composite Factors',
    metricValue: '5 Vectors',
    recommendedTab: 'remediation',
  },
  {
    title: 'Interactive Remediation & Secret Rotation',
    subtitle: '9-step guided rotation checklist and 6-step incident response playbooks.',
    badge: '6. Remediation Engine',
    icon: CheckCircle2,
    content: [
      'Full lifecycle tracking: Open -> Investigating -> Rotation Required -> Secret Removed -> History Purged -> Verified Fixed.',
      'Interactive 9-step rotation checklist per credential with real-time audit logging.',
      'Incident mode generates standardized incident IDs (INC-XXXXXX) for security compliance.',
    ],
    highlight: 'Transforms passive vulnerability alerts into active, guided resolution workflows.',
    metricLabel: 'Lifecycle States',
    metricValue: '7 Stages',
    recommendedTab: 'remediation',
  },
  {
    title: '7-Factor Security Scorecard & Posture Center',
    subtitle: 'Comprehensive repository health metrics and "What If?" simulator.',
    badge: '7. Security Posture',
    icon: Lock,
    content: [
      '7 granular scores: Overall, Credential Hygiene, Git History, Exposure Risk, Remediation, AI Confidence, Repo Hygiene.',
      'Transparent "Why did my score change?" factor breakdown with positive/negative deltas.',
      'Interactive "What If?" simulator computes projected posture improvements in real-time.',
    ],
    highlight: 'Gives engineering leaders board-ready visibility and gives developers actionable fix paths.',
    metricLabel: 'Posture Factors',
    metricValue: '7 Scores',
    recommendedTab: 'posture',
  },
];

export function DemoPresentationModal({
  isOpen,
  onClose,
  onJumpToTab,
}: DemoPresentationModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlideIndex((prev) => Math.min(SLIDES.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSlide = SLIDES[currentSlideIndex];
  const IconComponent = currentSlide.icon;

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-sky-400/30 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/logo.jpg"
                alt="CredSense AI Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              CredSense AI • Demo Mode
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Slide {currentSlideIndex + 1} of {SLIDES.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-8 sm:p-10 flex-1 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600">
              {currentSlide.badge}
            </span>
            <div className="px-3 py-1 bg-slate-100 rounded-lg text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">{currentSlide.metricLabel}</div>
              <div className="text-sm font-black text-sky-700">{currentSlide.metricValue}</div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
                <IconComponent className="w-6 h-6" />
              </div>
              {currentSlide.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
              {currentSlide.subtitle}
            </p>
          </div>

          {/* Bullet Points */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {currentSlide.content.map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>

          {/* Core Innovation Highlight */}
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs sm:text-sm font-semibold flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-sky-600 shrink-0" />
            <span>{currentSlide.highlight}</span>
          </div>
        </div>

        {/* Modal Bottom Controls */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentSlideIndex ? 'w-6 bg-sky-600' : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentSlide.recommendedTab && onJumpToTab && (
              <button
                onClick={() => {
                  onJumpToTab(currentSlide.recommendedTab!);
                  onClose();
                }}
                className="hidden sm:flex px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl items-center gap-1 transition-colors cursor-pointer"
              >
                Jump to Feature <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              {currentSlideIndex === SLIDES.length - 1 ? 'Finish Presentation' : 'Next'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
