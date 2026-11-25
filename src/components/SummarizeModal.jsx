import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Copy, Check, BookmarkPlus } from 'lucide-react';
import { requestAI } from '../lib/aiClient';

export default function SummarizeModal({ chat, onClose, onSaveToVault }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const unreadMessages = chat.messages.filter((m) => !m.read);
        const res = await requestAI({
          mode: 'summarize',
          messages: unreadMessages.length > 0 ? unreadMessages : chat.messages.slice(-6),
        });
        setSummary(res);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [chat]);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#0055ff] via-[#7b2cbf] to-[#d946ef] text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                Summarize Lecture / Thread
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                {chat.name} ({chat.handle})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 min-h-[150px] flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2.5 text-[#8696a0]">
              <Loader2 className="w-6 h-6 animate-spin text-[#0055ff]" />
              <span className="text-[13px]">Synthesizing notes & deadlines with Gemini AI...</span>
            </div>
          ) : (
            <div className="w-full text-[13.5px] text-[#111b21] dark:text-[#e9edef] whitespace-pre-wrap leading-relaxed bg-[#f0f2f5] dark:bg-[#111b21] p-4 rounded-xl border border-black/5 dark:border-white/5 max-h-[50vh] overflow-y-auto">
              {summary}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!loading && summary && (
              <>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-[#111b21] dark:text-white text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {onSaveToVault && (
                  <button
                    onClick={() => {
                      onSaveToVault(`[Summary: ${chat.name}]\n${summary}`);
                      setSaved(true);
                    }}
                    disabled={saved}
                    className="px-3 py-1.5 rounded-xl bg-[#0055ff]/10 hover:bg-[#0055ff]/20 text-[#0055ff] dark:text-sky-400 text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {saved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    <span>{saved ? 'Saved to Vault' : 'Save to Study Vault'}</span>
                  </button>
                )}
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-[13.5px] font-medium shadow-md shadow-[#00a884]/20 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
