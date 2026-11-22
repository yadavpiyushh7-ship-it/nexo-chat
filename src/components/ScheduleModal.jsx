import React, { useState } from 'react';
import { Clock, X, Zap } from 'lucide-react';

export default function ScheduleModal({ messageText, mediaAttachment, imagePreview, onSchedule, onClose }) {
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String((now.getMinutes() + 1) % 60).padStart(2, '0')}`;

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);

  const handleCustomConfirm = () => {
    const targetDate = new Date(`${date}T${time}:00`);
    const scheduledAt = targetDate.getTime();
    onSchedule({
      scheduledFor: `${date} at ${time}`,
      scheduledAt: isNaN(scheduledAt) ? Date.now() + 60000 : scheduledAt,
    });
  };

  const handleQuickSchedule = (seconds, label) => {
    const scheduledAt = Date.now() + seconds * 1000;
    onSchedule({
      scheduledFor: label,
      scheduledAt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-2xl p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0044ff] text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                Schedule Message
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                Deliver message automatically
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Attached Media Preview */}
        {(imagePreview || mediaAttachment) && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] flex items-center gap-2.5 border border-slate-200/60 dark:border-white/5">
            {imagePreview && (
              <img src={imagePreview} alt="Media to schedule" className="w-12 h-12 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[12.5px] font-semibold text-[#111b21] dark:text-white block truncate">
                {mediaAttachment?.fileName || 'Attached Photo'}
              </span>
              <span className="text-[11px] text-[#00a884] font-medium">Will deliver with scheduled message</span>
            </div>
          </div>
        )}

        {/* Quick Test Presets */}
        <div className="mt-4 space-y-2">
          <label className="block text-[12px] font-semibold text-[#00a884] uppercase tracking-wider">
            Quick Auto-Send Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSchedule(5, 'In 5 seconds')}
              className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[12.5px] font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/20 cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>In 5s (Test ⚡)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSchedule(30, 'In 30 seconds')}
              className="py-2 px-3 rounded-xl bg-[#0055ff]/10 hover:bg-[#0055ff]/20 text-[#0055ff] text-[12.5px] font-semibold flex items-center justify-center gap-1.5 border border-[#0055ff]/20 cursor-pointer transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>In 30 seconds</span>
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5">
          <div>
            <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#8696a0] mb-1">
              Select Specific Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#0044ff] text-[#111b21] dark:text-white text-[13.5px] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#8696a0] mb-1">
              Select Specific Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#0044ff] text-[#111b21] dark:text-white text-[13.5px] focus:outline-none"
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
            className="px-4 py-2 rounded-xl bg-[#0044ff] hover:bg-[#0038d1] text-white text-[13.5px] font-medium shadow-md shadow-[#0044ff]/20 cursor-pointer"
          >
            Confirm Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
