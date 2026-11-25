import React, { useState } from 'react';
import { Clock, X, Zap } from 'lucide-react';

export default function ScheduleModal({
  chat,
  pendingText = '',
  pendingImage = null,
  pendingAttachment = null,
  pendingCodeBlock = null,
  onSchedule,
  onClose,
}) {
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const nextMinute = new Date(now.getTime() + 60000);
  const defaultTime = `${String(nextMinute.getHours()).padStart(2, '0')}:${String(nextMinute.getMinutes()).padStart(2, '0')}`;

  const [messageText, setMessageText] = useState(pendingText || '');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);

  const buildPayload = (scheduledFor, scheduledAt) => {
    const formattedCode = pendingCodeBlock?.code
      ? `${messageText.trim() ? messageText.trim() + '\n' : ''}\`\`\`${pendingCodeBlock.language}\n${pendingCodeBlock.code}\n\`\`\``
      : messageText.trim();

    return {
      text: formattedCode,
      image: pendingImage || null,
      attachment: pendingAttachment?.fileUrl || null,
      fileName: pendingAttachment?.fileName || null,
      fileSize: pendingAttachment?.fileSize || null,
      mediaType: pendingAttachment?.type || (pendingImage ? 'image' : null),
      scheduledFor,
      scheduledAt,
      recipientName: chat?.name || 'Study Vault',
    };
  };

  const handleCustomConfirm = () => {
    const targetDate = new Date(`${date}T${time}:00`);
    const scheduledAt = targetDate.getTime();
    onSchedule(buildPayload(`${date} at ${time}`, isNaN(scheduledAt) ? Date.now() + 60000 : scheduledAt));
    onClose();
  };

  const handleQuickSchedule = (seconds, label) => {
    const scheduledAt = Date.now() + seconds * 1000;
    onSchedule(buildPayload(label, scheduledAt));
    onClose();
  };

  const hasContent = Boolean(messageText.trim() || pendingImage || pendingAttachment || pendingCodeBlock?.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0055ff] text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                Schedule Message
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                Auto-deliver to {chat?.name || 'chat'} at exact time
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Editable Message Content */}
        <div className="mt-4">
          <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#8696a0] mb-1">
            Message / Study Reminder Text
          </label>
          <textarea
            rows={2}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="e.g. Reminder: Atlassian OA starts in 15 mins!"
            className="w-full p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#0055ff] text-[#111b21] dark:text-white text-[13.5px] focus:outline-none"
          />
        </div>

        {/* Attached Media / File Preview */}
        {(pendingImage || pendingAttachment || pendingCodeBlock?.code) && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] flex items-center gap-2.5 border border-slate-200/60 dark:border-white/5">
            {pendingImage && (
              <img src={pendingImage} alt="Media to schedule" className="w-11 h-11 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[12.5px] font-semibold text-[#111b21] dark:text-white block truncate">
                {pendingAttachment?.fileName || (pendingCodeBlock?.code ? `${pendingCodeBlock.language.toUpperCase()} Code Snippet` : 'High-Res Photo')}
              </span>
              <span className="text-[11px] text-[#00a884] font-medium">
                {pendingAttachment?.fileSize ? `${pendingAttachment.fileSize} • ` : ''}Will deliver automatically
              </span>
            </div>
          </div>
        )}

        {/* Quick Test Presets */}
        <div className="mt-4 space-y-2">
          <label className="block text-[11.5px] font-bold text-[#00a884] uppercase tracking-wider">
            Quick Auto-Send Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!hasContent}
              onClick={() => handleQuickSchedule(5, 'In 5 seconds')}
              className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-40 text-emerald-700 dark:text-emerald-400 text-[12.5px] font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/20 cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>In 5s (Test ⚡)</span>
            </button>
            <button
              type="button"
              disabled={!hasContent}
              onClick={() => handleQuickSchedule(30, 'In 30 seconds')}
              className="py-2 px-3 rounded-xl bg-[#0055ff]/10 hover:bg-[#0055ff]/20 disabled:opacity-40 text-[#0055ff] dark:text-sky-400 text-[12.5px] font-semibold flex items-center justify-center gap-1.5 border border-[#0055ff]/20 cursor-pointer transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>In 30 seconds</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5">
          <div>
            <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#8696a0] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#0055ff] text-[#111b21] dark:text-white text-[13px] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#8696a0] mb-1">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#0055ff] text-[#111b21] dark:text-white text-[13px] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-[13px] text-[#667781] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCustomConfirm}
            disabled={!hasContent}
            className="px-4 py-2 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] disabled:opacity-40 text-white text-[13.5px] font-semibold shadow-md shadow-[#0055ff]/20 cursor-pointer"
          >
            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
