import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  Wand2, 
  Send, 
  Loader2, 
  Check, 
  Cpu, 
  Sliders,
  ShieldCheck 
} from 'lucide-react';
import { requestAI } from '../lib/aiClient';

export default function AiStudioView({ focusMode, setFocusMode }) {
  const [testMode, setTestMode] = useState('rewrite');
  const [testTone, setTestTone] = useState('Professional');
  const [testInput, setTestInput] = useState('Hey team, wanted to let you know the Capstone demo is ready for review.');
  const [testOutput, setTestOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoReplyRule, setAutoReplyRule] = useState('Busy in lecture. Will reply after 4 PM.');

  const handleRunAi = async () => {
    setLoading(true);
    try {
      const res = await requestAI({
        mode: testMode,
        text: testInput,
        tone: testTone,
        userStatus: autoReplyRule
      });
      setTestOutput(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full flex bg-[#f0f2f5] dark:bg-[#0c1317] select-none font-sans overflow-hidden">
      {/* Left Studio Config Pane */}
      <div className="w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#2a3942] flex-shrink-0">
        <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 bg-[#f0f2f5] dark:bg-[#202c33] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-[#00C896] via-[#00A3FF] to-[#7928CA] text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-[19px] font-bold text-[#111b21] dark:text-white">
              AI Studio
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            Gemini 3.5
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Focus Mode AI Auto-Reply Switch */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00C896]/10 to-[#00A3FF]/10 border border-[#00C896]/20 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#00a884] text-white shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14.5px] font-bold text-[#111b21] dark:text-white">
                    Focus Mode Auto-Reply
                  </h4>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                    Auto-draft replies when busy
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={focusMode}
                  onChange={(e) => setFocusMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-300 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884] shadow-inner"></div>
              </label>
            </div>

            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] mb-1">
                Active Focus Status Instruction
              </label>
              <input
                type="text"
                value={autoReplyRule}
                onChange={(e) => setAutoReplyRule(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#202c33] border border-slate-200 dark:border-white/10 text-[13px] text-[#111b21] dark:text-white focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          {/* Model Telemetry */}
          <div className="space-y-3">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] block">
              Configured Model
            </span>
            <div className="p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8696a0]">Model Endpoint:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">gemini-3.5-flash-lite</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8696a0]">Server Route:</span>
                <span className="font-mono text-[#111b21] dark:text-white">/api/ai</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8696a0]">Status:</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Supported AI Modes */}
          <div className="space-y-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] block">
              Interactive Test Modes
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'rewrite', label: 'Rewrite' },
                { id: 'summarize', label: 'Summarize' },
                { id: 'auto_reply', label: 'Auto-Reply' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTestMode(m.id)}
                  className={`py-2 px-1 text-[12.5px] rounded-xl font-medium transition-all cursor-pointer ${
                    testMode === m.id
                      ? 'bg-[#00a884] text-white shadow-sm'
                      : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#667781] dark:text-[#8696a0] hover:bg-[#e9edef]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Stage: Interactive Sandbox */}
      <div className="flex-1 h-full flex flex-col p-6 bg-[#efeae2]/30 dark:bg-[#0b141a] overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full space-y-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#202c33] shadow-sm border border-black/5 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-[#00a884]" />
                <span>Test Mode: {testMode.toUpperCase()}</span>
              </h3>
              {testMode === 'rewrite' && (
                <div className="flex items-center gap-1.5">
                  {['Professional', 'Casual', 'Concise', 'Urgent'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTestTone(t)}
                      className={`px-2.5 py-1 text-[11.5px] rounded-lg font-medium transition-all ${
                        testTone === t ? 'bg-[#00a884] text-white' : 'bg-[#f0f2f5] dark:bg-[#111b21] text-[#8696a0]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#8696a0] uppercase mb-1">
                Prompt / Input Message
              </label>
              <textarea
                rows={4}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] text-[#111b21] dark:text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              />
            </div>

            <button
              onClick={handleRunAi}
              disabled={loading || !testInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00C896] via-[#00A3FF] to-[#7928CA] text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating with Gemini 3.5...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Generation</span>
                </>
              )}
            </button>
          </div>

          {/* Result Card */}
          {testOutput && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#202c33] shadow-sm border border-[#00a884]/30 space-y-2 animate-fadeIn">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#00a884] block">
                Gemini Output
              </span>
              <p className="text-[15px] leading-relaxed text-[#111b21] dark:text-[#e9edef] whitespace-pre-wrap">
                {testOutput}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
