import React, { useState, useEffect } from 'react';
import { Wand2, X, Check, Loader2, Globe, Code2, Briefcase, Copy, Presentation, ExternalLink } from 'lucide-react';
import { requestAI } from '../lib/aiClient';
import { useGoogleAuth, exportPresentationToGoogleSlides } from '../lib/googleApis';

export default function AiToneModal({ initialText = '', initialMode = 'rewrite', onApply, onClose }) {
  const { token: googleToken, signIn: signInGoogle } = useGoogleAuth();
  const [mode, setMode] = useState(initialMode); // 'explain_code' | 'interview_answer' | 'rewrite'
  const [tone, setTone] = useState('Professional');
  const [language, setLanguage] = useState('Original');
  const [inputText, setInputText] = useState(
    initialText || 'Built a real-time chat app using WebSockets, Supabase, and Gemini 2.5 Flash.'
  );
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportingSlides, setExportingSlides] = useState(false);
  const [slidesUrl, setSlidesUrl] = useState('');
  const [slidesErr, setSlidesErr] = useState('');

  const handleExportToSlides = async () => {
    if (!output) return;
    setSlidesErr('');
    let activeToken = googleToken;
    if (!activeToken) {
      const res = await signInGoogle();
      if (!res?.ok || !res?.token) {
        setSlidesErr(res?.error || 'Sign in with Google to export to Slides.');
        return;
      }
      activeToken = res.token;
    }
    setExportingSlides(true);
    try {
      const { url } = await exportPresentationToGoogleSlides({
        accessToken: activeToken,
        title: mode === 'explain_code' ? 'Nexo AI Code Breakdown' : mode === 'interview_answer' ? 'Nexo AI Interview Answer' : 'Nexo AI Draft',
        bodyText: output,
      });
      setSlidesUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setSlidesErr(err?.message || 'Google Slides export failed.');
    } finally {
      setExportingSlides(false);
    }
  };

  const MODES = [
    { id: 'explain_code', label: 'Explain Code / Logic', icon: Code2 },
    { id: 'interview_answer', label: 'Interview Answer', icon: Briefcase },
    { id: 'rewrite', label: 'Rewrite & Translate', icon: Wand2 },
  ];

  const TONES = ['Professional', 'Technical', 'Casual', 'Concise', 'Friendly', 'Urgent'];
  const LANGUAGES = ['Original', 'Hindi', 'Spanish', 'French', 'German', 'Japanese'];

  const runAssistant = async (overrideMode = mode, overrideText = inputText) => {
    if (!overrideText.trim()) return;
    setLoading(true);
    setOutput('');
    try {
      const res = await requestAI({
        mode: overrideMode,
        text: overrideText,
        tone,
        language: language === 'Original' ? '' : language,
      });
      setOutput(res);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run when opened directly from a message's "Explain Code" or "Interview Answer" action
  useEffect(() => {
    if (initialText && (initialMode === 'explain_code' || initialMode === 'interview_answer')) {
      runAssistant(initialMode, initialText);
    }
  }, []);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-xl bg-white dark:bg-[#202c33] rounded-2xl p-5 sm:p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#0055ff] via-[#7b2cbf] to-[#d946ef] text-white shadow-sm">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16.5px] font-bold text-[#111b21] dark:text-white">
                Nexo AI Placement Assistant
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                Explain Code / Logic, Interview Answers & Tone Rewrite
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-0.5">
          {/* Mode Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id);
                    setOutput('');
                  }}
                  className={`px-3 py-2 rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#0055ff] text-white border-[#0055ff] shadow-sm'
                      : 'bg-[#f0f2f5] dark:bg-[#111b21] text-[#54656f] dark:text-[#aebac1] border-transparent hover:bg-[#e9edef] dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Area */}
          <div>
            <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] mb-1">
              {mode === 'explain_code'
                ? 'Paste Code Snippet or Algorithm'
                : mode === 'interview_answer'
                ? 'Rough Project / Experience Note'
                : 'Message to Rewrite or Translate'}
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === 'explain_code'
                  ? 'Paste C++, Python, JS, or SQL code here...'
                  : mode === 'interview_answer'
                  ? 'e.g. Built Nexo real-time chat with code blocks & AI summarizer...'
                  : 'Type your message...'
              }
              className="w-full p-3 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#0055ff] text-[#111b21] dark:text-white text-[13.5px] font-mono leading-relaxed focus:outline-none"
            />
          </div>

          {/* Rewrite Options */}
          {mode === 'rewrite' && (
            <>
              <div>
                <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] mb-1.5">
                  Choose Tone
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 text-[12px] rounded-xl font-medium transition-all cursor-pointer ${
                        tone === t
                          ? 'bg-[#00a884] text-white shadow-sm'
                          : 'bg-[#f0f2f5] dark:bg-[#111b21] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-white/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Translate Language
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`px-2.5 py-1 text-[12px] rounded-lg transition-all cursor-pointer ${
                        language === lang
                          ? 'bg-[#0055ff] text-white font-medium'
                          : 'bg-[#f0f2f5] dark:bg-[#111b21] text-[#667781] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-white/10'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Output Preview */}
          {loading ? (
            <div className="p-5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] flex items-center justify-center gap-2.5 text-[13px] text-[#667781] dark:text-[#8696a0]">
              <Loader2 className="w-4 h-4 animate-spin text-[#0055ff]" />
              <span>Analyzing with Nexo AI Placement Assistant...</span>
            </div>
          ) : output ? (
            <div className="p-3.5 rounded-xl bg-[#0055ff]/10 dark:bg-[#0055ff]/15 border border-[#0055ff]/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0055ff] dark:text-sky-400">
                  {mode === 'explain_code'
                    ? 'AI Code & Complexity Breakdown'
                    : mode === 'interview_answer'
                    ? 'Interview-Ready Answer'
                    : 'Rewritten Output'}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11.5px] font-semibold text-[#0055ff] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[13.5px] text-[#111b21] dark:text-white leading-relaxed whitespace-pre-wrap">
                {output}
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        {slidesErr && (
          <p className="text-[12px] text-rose-500 mt-2">{slidesErr}</p>
        )}
        {slidesUrl && (
          <a
            href={slidesUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 mt-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Exported Google Slides Deck</span>
          </a>
        )}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
          {output && (
            <button
              type="button"
              onClick={handleExportToSlides}
              disabled={exportingSlides}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {exportingSlides ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Presentation className="w-3.5 h-3.5" />}
              <span>Export to Google Slides</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => runAssistant()}
            disabled={loading || !inputText.trim()}
            className="px-4 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>
              {mode === 'explain_code'
                ? 'Explain Code / Logic'
                : mode === 'interview_answer'
                ? 'Generate Interview Answer'
                : 'Generate Rewrite'}
            </span>
          </button>

          {output && onApply && (
            <button
              type="button"
              onClick={() => {
                onApply(output);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0055ff] to-[#7b2cbf] text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Insert into Chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
