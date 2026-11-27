import React, { useState } from 'react';
import { Star, X, ArrowRight, Bookmark, Tag, Trash2, Search } from 'lucide-react';

const VAULT_CATEGORIES = ['All', '#DSA', '#Placement', '#Notes', '#Important'];

const CATEGORY_COLORS = {
  '#DSA': 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
  '#Placement': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  '#Notes': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
  '#Important': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

export default function StarredMessagesModal({
  isOpen,
  onClose,
  starredMessages = [],
  onUnstarMessage,
  onUpdateBookmarkCategory,
  onSelectChat,
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = starredMessages.filter((item) => {
    const matchesCat =
      selectedCategory === 'All' || (item.category || '#Important') === selectedCategory;
    const q = searchTerm.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (item.text || '').toLowerCase().includes(q) ||
      (item.chatName || '').toLowerCase().includes(q) ||
      (item.fileName || '').toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-xl bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="h-[64px] px-5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
              <Bookmark className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-[16.5px] font-bold text-[#111b21] dark:text-white">
                Resource Vault & Bookmarks ({starredMessages.length})
              </h3>
              <p className="text-[11.5px] text-[#667781] dark:text-[#8696a0]">
                Cloud-synced & preserved even when clearing chats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="p-3.5 border-b border-[#d1d7db]/50 dark:border-[#2a3942]/50 space-y-2.5 bg-white dark:bg-[#111b21] flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved code snippets, OA links, notes..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#0055ff]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {VAULT_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const count =
                cat === 'All'
                  ? starredMessages.length
                  : starredMessages.filter((m) => (m.category || '#Important') === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-[#0055ff] text-white shadow-xs'
                      : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10.5px] ${isActive ? 'text-white/80' : 'text-[#8696a0]'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vault Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#8696a0]">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="text-[15px] font-semibold text-[#111b21] dark:text-white">
                No bookmarks in {selectedCategory}
              </p>
              <p className="text-[12.5px] max-w-xs mx-auto mt-1">
                Click the Star icon on any message or code snippet to save it safely in your categorized vault.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const currentTag = item.category || '#Important';
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-slate-200/70 dark:border-white/5 space-y-2.5 hover:border-[#0055ff]/30 transition-colors"
                >
                  {/* Source & Category Badge */}
                  <div className="flex items-center justify-between gap-2 text-[12px]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0055ff] dark:text-sky-400 truncate">
                      <span>{item.isSender ? 'You' : item.senderName || item.chatName}</span>
                      <span className="text-[#8696a0]">▸</span>
                      <span className="truncate">{item.chatName || 'Chat'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 text-[#8696a0]">
                      <span>{item.date || 'Today'}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="text-[13.5px] leading-relaxed text-[#111b21] dark:text-[#e9edef] bg-white dark:bg-[#111b21] p-3 rounded-lg border border-[#e9edef] dark:border-[#222e35] whitespace-pre-wrap break-words font-sans select-text cursor-text">
                    {item.text || (item.fileName ? `📎 Attached file: ${item.fileName} (${item.fileSize || ''})` : 'Saved media item')}
                  </div>

                  {/* Tag Switcher & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11.5px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3 h-3 text-[#8696a0] mr-0.5" />
                      {['#DSA', '#Placement', '#Notes', '#Important'].map((tag) => {
                        const isTagActive = currentTag === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => onUpdateBookmarkCategory?.(item.id, tag)}
                            className={`px-2 py-0.5 rounded-full border font-semibold cursor-pointer transition-all ${
                              isTagActive
                                ? CATEGORY_COLORS[tag]
                                : 'border-transparent bg-black/5 dark:bg-white/5 text-[#667781] dark:text-[#8696a0] hover:bg-black/10'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <button
                        onClick={() => onUnstarMessage(item.chatId, item.id)}
                        className="text-[#8696a0] hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                        title="Remove from Resource Vault"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>

                      {item.chatId && (
                        <button
                          onClick={() => {
                            onSelectChat(item.chatId);
                            onClose();
                          }}
                          className="text-[#0055ff] dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>Go to chat</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
