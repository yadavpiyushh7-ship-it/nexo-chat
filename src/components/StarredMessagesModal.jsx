import React from 'react';
import { Star, X, ArrowRight, CornerUpLeft, MessageSquare } from 'lucide-react';

export default function StarredMessagesModal({ isOpen, onClose, starredMessages = [], onUnstarMessage, onSelectChat }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="h-[60px] px-5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-amber-500/15 text-amber-500">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
              Starred Messages ({starredMessages.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Starred Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {starredMessages.length === 0 ? (
            <div className="py-12 text-center text-[#8696a0]">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="text-[15px] font-semibold text-[#111b21] dark:text-white">
                No starred messages yet
              </p>
              <p className="text-[12.5px] max-w-xs mx-auto mt-1">
                Tap and hold or hover over any message and click Star to save it here.
              </p>
            </div>
          ) : (
            starredMessages.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-slate-200/70 dark:border-white/5 space-y-2 hover:border-[#0044ff]/30 transition-colors"
              >
                {/* Contact header: You ▸ @username */}
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0044ff] dark:text-[#0055ff]">
                    <span>{item.isSender ? 'You' : item.senderName || item.chatName}</span>
                    <span className="text-[#8696a0]">▸</span>
                    <span>{item.isSender ? (item.chatName || '@contact') : 'You'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#8696a0]">
                    <span>{item.date || 'Today'}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 ml-1" />
                  </div>
                </div>

                {/* Message body */}
                <p className="text-[14.5px] leading-relaxed text-[#111b21] dark:text-[#e9edef] bg-white dark:bg-[#111b21] p-3 rounded-lg border border-black/5 dark:border-white/5">
                  {item.text}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-1 text-[12px]">
                  <button
                    onClick={() => onUnstarMessage(item.chatId, item.id)}
                    className="text-[#8696a0] hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Unstar</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectChat(item.chatId);
                      onClose();
                    }}
                    className="text-[#0044ff] dark:text-[#0055ff] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Go to chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-[13px] font-semibold text-[#111b21] dark:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
