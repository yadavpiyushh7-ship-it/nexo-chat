import React, { useState } from 'react';
import { User, Phone, X, AtSign } from 'lucide-react';

export default function ShareContactModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [phoneOrHandle, setPhoneOrHandle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      phoneOrHandle: phoneOrHandle.trim() || '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#029eb4]">
            <User className="w-5 h-5" />
            <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
              Share Contact Card
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
              Contact Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#029eb4] focus:bg-white dark:focus:bg-[#111b21] text-[14px] text-[#111b21] dark:text-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
              Phone Number or @Handle
            </label>
            <input
              type="text"
              value={phoneOrHandle}
              onChange={(e) => setPhoneOrHandle(e.target.value)}
              placeholder="+1 (555) 234-5678 or @maya_l"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#029eb4] focus:bg-white dark:focus:bg-[#111b21] text-[14px] text-[#111b21] dark:text-white focus:outline-none transition-all"
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
              disabled={!name.trim()}
              className="px-5 py-2 rounded-xl bg-[#029eb4] hover:bg-[#02889b] active:scale-95 text-white font-bold text-[13px] shadow-md shadow-[#029eb4]/25 disabled:opacity-40 cursor-pointer transition-all"
            >
              Share Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
