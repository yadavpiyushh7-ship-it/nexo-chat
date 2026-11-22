import React, { useState } from 'react';
import { Calendar, X, MapPin, Clock } from 'lucide-react';

export default function CreateEventModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      date,
      time,
      location: location.trim() || 'Online / Remote',
      description: description.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Calendar className="w-5 h-5" />
            <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
              Create an Event
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
              Event Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Sprint Demo, Tech Sync..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-purple-500 focus:bg-white dark:focus:bg-[#111b21] text-[14px] text-[#111b21] dark:text-white focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-purple-500 text-[13px] text-[#111b21] dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
                Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-purple-500 text-[13px] text-[#111b21] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Google Meet / Room 302"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-purple-500 text-[13.5px] text-[#111b21] dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agenda or notes for participants..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-purple-500 text-[13px] text-[#111b21] dark:text-white focus:outline-none"
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
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-[13px] shadow-md shadow-purple-600/25 disabled:opacity-40 cursor-pointer transition-all"
            >
              Share Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
