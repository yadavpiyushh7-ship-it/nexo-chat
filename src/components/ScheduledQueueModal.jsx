import React from 'react';
import { Clock, X, Trash2, Send, CheckCircle2 } from 'lucide-react';

export default function ScheduledQueueModal({ isOpen, onClose, queue = [], onCancelScheduled, onSendNow }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0044ff] text-white shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                Scheduled Messages Queue ({queue.length})
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                Messages waiting to be delivered automatically
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue List */}
        <div className="mt-4 max-h-72 overflow-y-auto space-y-2.5">
          {queue.length === 0 ? (
            <div className="py-8 text-center text-[#8696a0]">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-[14px] font-semibold text-[#111b21] dark:text-white">
                No scheduled messages
              </p>
              <p className="text-[12px] mt-0.5">
                Use the Clock icon in the composer to schedule messages for later.
              </p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-slate-200/60 dark:border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[#0044ff] dark:text-[#0055ff]">
                    To: {item.recipientName || 'Self-Chat'}
                  </span>
                  <span className="text-[#8696a0] font-mono">
                    ⏰ {item.scheduledFor}
                  </span>
                </div>
                {item.text && (
                  <p className="text-[13.5px] text-[#111b21] dark:text-[#e9edef] bg-white dark:bg-[#202c33] p-2 rounded-lg">
                    "{item.text}"
                  </p>
                )}
                {/* Media thumbnail if attached */}
                {(item.image || item.mediaUrl) && (
                  <div className="relative rounded-lg overflow-hidden max-w-[140px] max-h-[90px] border border-slate-200 dark:border-white/10 mt-1">
                    <img
                      src={item.image || item.mediaUrl}
                      alt="Scheduled attachment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {item.fileName && (
                  <div className="text-[12px] text-[#0044ff] dark:text-[#0055ff] font-medium flex items-center gap-1 mt-1">
                    <span>📎 {item.fileName}</span>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => onCancelScheduled(item.id)}
                    className="px-2.5 py-1 text-[11.5px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={() => onSendNow(item)}
                    className="px-3 py-1 text-[11.5px] font-semibold text-white bg-[#0044ff] hover:bg-[#0038d1] rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Now</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-[13px] font-semibold text-[#111b21] dark:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
