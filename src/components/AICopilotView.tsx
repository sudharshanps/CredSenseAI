import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Lock,
  User,
  Cpu,
  CornerDownLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CopilotMessage, Finding, Scan } from '../types';
import { safeFetch } from '../utils/api';

interface AICopilotViewProps {
  scan: Scan | null;
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
}

export function AICopilotView({ scan, findings, onSelectFinding }: AICopilotViewProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `### Welcome to CredSense Copilot 👋
I am your DevSecOps AI Copilot. I analyze your repository's Git commit history, verified credentials, exposure windows, and risk vectors to give you precise, actionable remediation guidance.

**Ask me anything about your scanned secrets, or choose a prompt below:**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'What are Ghost Secrets and how do I purge them from Git history?',
        'Which secret should I fix first?',
        'Why is this finding critical?',
        'Which credentials were exposed for the longest time?',
        'Show me secrets that still exist in HEAD.',
        'Which findings are probably false positives?',
        'Summarize this repository security posture.',
        'Give me a remediation plan.',
      ],
      mode: 'gemini',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isSending) return;

    setInputQuery('');
    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const data = await safeFetch<any>('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          scanId: scan?.id,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const botMsg: CopilotMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: data.suggestedActions,
        findingReferences: data.findingReferences,
        mode: data.mode,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: CopilotMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue processing that query with the upstream model. You can re-try or inspect your findings directly in the Explorer.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'local',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    { title: 'Priority #1', query: 'Which secret should I fix first?' },
    { title: 'Critical Risk Why', query: 'Why is this finding critical?' },
    { title: 'Longest Exposed', query: 'Which credentials were exposed for the longest time?' },
    { title: 'Active in HEAD', query: 'Show me secrets that still exist in HEAD.' },
    { title: 'Noise Analysis', query: 'Which findings are probably false positives?' },
    { title: 'Posture Summary', query: 'Summarize this repository security posture.' },
    { title: 'Remediation Plan', query: 'Give me a remediation plan.' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Privacy Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                CredSense Copilot
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  DevSecOps Intelligence
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ask interactive security queries across your Git DAG, exposure durations, and verified secrets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-sky-50/80 border border-sky-200 px-3.5 py-2 rounded-lg text-xs text-sky-900">
          <Lock className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong className="font-bold">Zero-Exposure Guarantee:</strong> Plaintext secrets are stripped before AI evaluation. Only masked metadata is analyzed.
          </span>
        </div>
      </div>

      {/* Quick Question Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Suggested:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            disabled={isSending}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-xs font-semibold text-slate-700 hover:text-sky-800 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {p.query}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[580px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/40">
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                    isBot ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                    isBot
                      ? 'bg-white text-slate-800 border border-slate-200'
                      : 'bg-sky-600 text-white font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2 opacity-70 text-[10px]">
                    <span className="font-bold uppercase tracking-wider">
                      {isBot ? 'CredSense Copilot' : 'You'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Content formatted with Markdown-like blocks */}
                  <div className="space-y-2 whitespace-pre-wrap font-sans">
                    {msg.content.split('\n\n').map((para, pIdx) => {
                      if (para.startsWith('### ')) {
                        return (
                          <h4 key={pIdx} className="font-extrabold text-sm text-slate-900 mt-1">
                            {para.replace('### ', '')}
                          </h4>
                        );
                      }
                      if (para.startsWith('> ')) {
                        return (
                          <blockquote
                            key={pIdx}
                            className="border-l-2 border-sky-500 pl-2.5 py-1 text-slate-600 bg-sky-50/50 rounded-r text-[11px]"
                          >
                            {para.replace('> ', '')}
                          </blockquote>
                        );
                      }
                      return (
                        <p key={pIdx} className={isBot ? 'text-slate-700' : 'text-white'}>
                          {para}
                        </p>
                      );
                    })}
                  </div>

                  {/* Finding References Chips */}
                  {isBot && msg.findingReferences && msg.findingReferences.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Referenced Finding Records:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.findingReferences.map((fId) => {
                          const findingObj = findings.find((f) => f.id === fId);
                          return (
                            <button
                              key={fId}
                              onClick={() => findingObj && onSelectFinding(findingObj)}
                              className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>{fId}</span>
                              {findingObj && <span className="opacity-70">({findingObj.secretType})</span>}
                              <ExternalLink className="w-3 h-3 text-sky-600" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Actions */}
                  {isBot && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSend(action)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-3 h-3 text-slate-500" />
                          <span>{action}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3.5 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="rounded-2xl p-3.5 bg-white text-slate-600 border border-slate-200 text-xs flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span className="font-semibold text-slate-700">
                  Analyzing repository DAG & evaluating risk telemetry...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Copilot about any leaked secret, exposure window, or remediation step..."
              disabled={isSending}
              className="flex-1 bg-slate-50 border border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isSending}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Powered by CredSense AI Engine • Zero-Exposure Redacted Mode</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}
