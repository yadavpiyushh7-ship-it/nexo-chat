import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { requestAI } from '../lib/aiClient';

export default function SummarizeModal({ chat, onClose }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const unreadMessages = chat.messages.filter((m) => !m.read);
        const res = await requestAI({
          mode: 'summarize',
          messages: unreadMessages.length > 0 ? unreadMessages : chat.messages.slice(-4),
        });
        setSummary(res);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [chat]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#00C896] via-[#00A3FF] to-[#7928CA] text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                Unread Messages Summary
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                Conversation with {chat.name} ({chat.handle})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 min-h-[140px] flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2.5 text-[#8696a0]">
              <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
              <span className="text-[13px]">Analyzing unread messages with Gemini...</span>
            </div>
          ) : (
            <div className="w-full text-[13.5px] text-[#111b21] dark:text-[#e9edef] whitespace-pre-wrap leading-relaxed bg-[#f0f2f5] dark:bg-[#111b21] p-4 rounded-xl border border-black/5 dark:border-white/5">
              {summary}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end">
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
