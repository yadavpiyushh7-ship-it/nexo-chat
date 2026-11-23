import React, { useState } from 'react';
import { Plus, Music } from 'lucide-react';
import AvatarIcon from './AvatarIcon';
import { INITIAL_NOTES } from '../mockData';

export default function NotesTray({ user }) {
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [editingMyNote, setEditingMyNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('In the zone 🎧');

  const handleUpdateNote = (e) => {
    e.preventDefault();
    setNotes((prev) =>
      prev.map((n) => (n.isCurrentUser ? { ...n, note: newNoteText } : n))
    );
    setEditingMyNote(false);
  };

  return (
    <div className="py-2.5 px-3 border-b border-[#d1d7db]/60 dark:border-[#2a3942]/60 select-none">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 pt-3">
        {notes.map((item) => {
          const isMe = item.isCurrentUser;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isMe) setEditingMyNote(true);
              }}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
              style={{ width: '74px' }}
            >
              {/* Note Speech Bubble above avatar */}
              <div className="relative mb-1">
                <div className="px-2 py-0.5 rounded-xl bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] text-[10.5px] font-medium shadow-subtle border border-black/5 dark:border-white/10 max-w-[72px] truncate text-center flex items-center justify-center gap-0.5 group-hover:scale-105 transition-transform">
                  {item.hasMusic && <Music className="w-2.5 h-2.5 text-[#00a884] flex-shrink-0" />}
                  <span className="truncate">{item.note}</span>
                </div>
                {/* Speech bubble tail pointer */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white dark:bg-[#202c33] rotate-45 border-r border-b border-black/5 dark:border-white/10" />
              </div>

              {/* Avatar (Monochrome Silhouette Icon) */}
              <div className="relative mt-1">
                <AvatarIcon
                  size="md"
                  name={isMe ? (user?.name || 'You') : item.name}
                  showOnline={!isMe && item.online}
                  online={!isMe && item.online}
                />

                {isMe && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#00a884] text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#111b21]">
                    <Plus className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Name */}
              <span className="text-[11.5px] font-medium text-[#667781] dark:text-[#8696a0] truncate mt-1 max-w-[70px] text-center">
                {isMe ? 'Your note' : item.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Edit note popup modal */}
      {editingMyNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white dark:bg-[#202c33] rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-white/10">
            <h4 className="text-[15px] font-semibold text-[#111b21] dark:text-white mb-2">
              Share a thought...
            </h4>
            <p className="text-[12px] text-[#8696a0] mb-3">
              Friends can see your note above your avatar for 24 hours.
            </p>
            <form onSubmit={handleUpdateNote}>
              <input
                type="text"
                maxLength={40}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] text-[#111b21] dark:text-white text-[13.5px] border border-transparent focus:border-[#00a884] focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMyNote(false)}
                  className="px-3 py-1.5 rounded-lg text-[13px] text-[#667781] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-[13px] bg-[#00a884] text-white font-medium hover:bg-[#008f6f] cursor-pointer"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
