import React from 'react';
import { Ban, Trash2, X } from 'lucide-react';

export default function DeleteMessageModal({
  isOpen,
  onClose,
  message,
  onDeleteForEveryone,
  onDeleteForMe
}) {
  if (!isOpen || !message) return null;

  const isSender = message.isSender;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
        <div>
          <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
            Delete message?
          </h3>
          <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-1">
            You can delete messages for everyone in this chat or delete for yourself.
          </p>
        </div>

        {/* Message snippet */}
        <div className="p-3 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-black/5 dark:border-white/5 text-[13.5px] text-[#111b21] dark:text-[#e9edef] truncate italic">
          "{message.text}"
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {/* Delete for everyone (available if user is sender) */}
          {isSender && (
            <button
              onClick={() => {
                onDeleteForEveryone(message.id);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 font-semibold text-[13.5px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span>Delete for everyone</span>
            </button>
          )}

          {/* Delete for me */}
          <button
            onClick={() => {
              onDeleteForMe(message.id);
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-[#111b21] dark:text-white font-medium text-[13.5px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete for me</span>
          </button>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full py-2 text-[13px] text-[#667781] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
