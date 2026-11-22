import React, { useState } from 'react';
import { Wand2, X, Check, Loader2, Globe } from 'lucide-react';
import { requestAI } from '../lib/aiClient';

export default function AiToneModal({ initialText, onApply, onClose }) {
  const [tone, setTone] = useState('Professional');
  const [language, setLanguage] = useState('Original');
  const [inputText, setInputText] = useState(initialText || 'Can we discuss the Capstone project deliverables?');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const TONES = ['Professional', 'Casual', 'Concise', 'Friendly', 'Urgent'];
  const LANGUAGES = ['Original', 'Spanish', 'French', 'German', 'Hindi', 'Japanese'];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await requestAI({
        mode: 'rewrite',
        text: inputText,
        tone,
        language: language === 'Original' ? '' : language
      });
      setOutput(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-[#202c33] rounded-2xl p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#00C896] to-[#00A3FF] text-white shadow-sm">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                AI Tone Rewrite & Translate
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                Powered by Gemini 2.5 Flash
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Text */}
        <div className="mt-4">
          <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] mb-1">
            Original Text
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#00a884] text-[#111b21] dark:text-white text-[14px] focus:outline-none"
          />
        </div>

        {/* Select Tone */}
        <div className="mt-4">
          <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] mb-2">
            Choose Tone
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-1.5 text-[12.5px] rounded-xl font-medium transition-all cursor-pointer ${
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

        {/* Language Translate */}
        <div className="mt-4">
          <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] mb-2 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Translate Language
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 text-[12px] rounded-lg transition-all cursor-pointer ${
                  language === lang
                    ? 'bg-[#00A3FF] text-white font-medium'
                    : 'bg-[#f0f2f5] dark:bg-[#111b21] text-[#667781] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-white/10'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Output Preview */}
        {output && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#00a884]/10 border border-[#00a884]/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00a884] block mb-1">
              Rewritten Result:
            </span>
            <p className="text-[14px] text-[#111b21] dark:text-white leading-relaxed">{output}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading || !inputText.trim()}
            className="px-4 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-[13px] font-medium flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>Generate Rewrite</span>
          </button>

          {output && (
            <button
              onClick={() => onApply(output)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00A3FF] to-[#7928CA] text-white text-[13px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Composer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
