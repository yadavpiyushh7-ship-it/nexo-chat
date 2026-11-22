import React, { useState } from 'react';
import { BarChart2, Plus, Trash2, X, Check } from 'lucide-react';

export default function CreatePollModal({ isOpen, onClose, onSubmit }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleRemoveOption = (idx) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((opt) => opt.trim()).filter(Boolean);

    if (!cleanQuestion || cleanOptions.length < 2) return;

    onSubmit({
      question: cleanQuestion,
      allowMultiple,
      options: cleanOptions.map((text, i) => ({
        id: `opt_${i + 1}`,
        text,
        votes: 0,
        voters: []
      }))
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500">
            <BarChart2 className="w-5 h-5" />
            <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
              Create a Poll
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
              Poll Question
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-[#111b21] text-[14px] text-[#111b21] dark:text-white focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider">
              Options
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required={idx < 2}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-[#111b21] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none transition-all"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-1 text-[12.5px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between">
            <label className="text-[13px] text-[#111b21] dark:text-white cursor-pointer select-none">
              Allow multiple answers
            </label>
            <input
              type="checkbox"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-[13px] shadow-md shadow-amber-500/25 disabled:opacity-40 cursor-pointer transition-all"
            >
              Send Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
