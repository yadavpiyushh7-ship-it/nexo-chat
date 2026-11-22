import React, { useState, useEffect } from 'react';
import { X, Search, AtSign, UserPlus, Sparkles, Loader2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function NewChatModal({ isOpen, onClose, onStartChat, currentUser }) {
  const [query, setQuery] = useState('');
  const [dbUsers, setDbUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fallback preset suggestions
  const fallbackSuggestions = [
    { name: 'Sarah Connor', handle: '@sarah_c', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120', bio: 'Product Design & HCI' },
    { name: 'Liam Patel', handle: '@liam_dev', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120', bio: 'Full-stack & AI pipelines' },
    { name: 'Elena Rostova', handle: '@elena_design', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120', bio: 'Visual Systems & UI' },
    { name: 'CS Capstone Group', handle: '@capstone_2026', avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120', bio: 'Project team group chat', isGroup: true },
  ];

  // Fetch real users from Supabase profiles
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchProfiles = async () => {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(30);

        if (!error && data && isMounted) {
          const others = data.filter((p) => p.id !== currentUser?.id && p.username !== currentUser?.username);
          setDbUsers(others);
        }
      } catch (err) {
        console.warn('Profiles search error:', err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };

    fetchProfiles();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  const handleCustomStart = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const clean = query.trim();
    const handle = clean.startsWith('@') ? clean : `@${clean.toLowerCase().replace(/\s+/g, '_')}`;
    const name = clean.replace(/^@/, '');

    // Check if matching db user exists
    const match = dbUsers.find(
      (u) =>
        u.username?.toLowerCase() === handle.toLowerCase() ||
        u.full_name?.toLowerCase() === clean.toLowerCase()
    );

    if (match) {
      onStartChat({
        id: match.id,
        recipientId: match.id,
        name: match.full_name || name,
        handle: match.username || handle,
        avatar: match.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: match.mood || 'Nexo contact'
      });
    } else {
      onStartChat({
        name,
        handle,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: 'New Nexo contact'
      });
    }

    setQuery('');
    onClose();
  };

  // Filter users by search query
  const q = query.toLowerCase().trim();
  const filteredDbUsers = dbUsers.filter((u) => {
    if (!q) return true;
    const matchUsername = (u.username || '').toLowerCase().includes(q.replace(/^@/, '')) || (u.username || '').toLowerCase().includes(q);
    const matchName = (u.full_name || '').toLowerCase().includes(q);
    return matchUsername || matchName;
  });

  const displayList = filteredDbUsers.length > 0 ? filteredDbUsers : fallbackSuggestions.filter((item) => {
    if (!q) return true;
    return item.handle.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00a884] text-white shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                New Conversation
              </h3>
              <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">
                Search registered users by @username or name
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Input Form */}
        <form onSubmit={handleCustomStart} className="mt-4 flex-shrink-0">
          <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#8696a0] mb-1.5 uppercase tracking-wider">
            Enter @username or Contact Name
          </label>
          <div className="relative">
            <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. @sarah_c or Elena..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#00a884] text-[#111b21] dark:text-white text-[14px] focus:outline-none transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white text-[12px] font-semibold cursor-pointer transition-all"
            >
              Start Chat
            </button>
          </div>
        </form>

        {/* Live User Search Results */}
        <div className="mt-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0]">
              {filteredDbUsers.length > 0 ? `Registered Users (${filteredDbUsers.length})` : 'Suggested Contacts'}
            </span>
            {loadingUsers && (
              <span className="flex items-center gap-1 text-[11px] text-[#00a884]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Searching...</span>
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {displayList.map((item) => {
              const displayName = item.full_name || item.name;
              const handle = item.username || item.handle;
              const avatar = item.avatar_url || item.avatar;
              const statusText = item.mood || item.bio || 'Available ✨';

              return (
                <div
                  key={item.id || handle}
                  onClick={() => {
                    onStartChat({
                      id: item.id || `contact_${handle}`,
                      recipientId: item.id || null,
                      name: displayName,
                      handle: handle,
                      avatar: avatar,
                      bio: statusText,
                      isGroup: Boolean(item.isGroup)
                    });
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] cursor-pointer transition-colors group"
                >
                  <img
                    src={avatar}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-[#00a884] transition-all"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate group-hover:text-[#00a884] transition-colors">
                        {displayName}
                      </h4>
                      <span className="text-[12px] text-[#00a884] font-medium ml-2 flex-shrink-0">
                        {handle}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#667781] dark:text-[#8696a0] truncate">
                      {statusText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
