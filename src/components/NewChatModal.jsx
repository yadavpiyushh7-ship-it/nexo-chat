import React, { useState, useEffect } from 'react';
import { X, Search, AtSign, UserPlus, Sparkles, Loader2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AvatarIcon from './AvatarIcon';
import { parseProfileInfo } from './AuthScreen';

export default function NewChatModal({ isOpen, onClose, onStartChat, currentUser }) {
  const [query, setQuery] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [dbUsers, setDbUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fallback initial directory
  const fallbackSuggestions = [
    { name: 'Sarah Connor', handle: '@sarah_c', bio: 'Product Design & HCI' },
    { name: 'Liam Patel', handle: '@liam_dev', bio: 'Full-stack & AI pipelines' },
    { name: 'Elena Rostova', handle: '@elena_design', bio: 'Visual Systems & UI' },
    { name: 'CS Capstone Group', handle: '@capstone_2026', bio: 'Project team group chat', isGroup: true },
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
          .limit(50);

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

  const handleStart = (target) => {
    const info = parseProfileInfo(target);
    const displayName = info.name || target.full_name || target.name || 'Nexo Contact';
    const handle = info.handle || target.username || target.handle || `@user_${(target.id || '').slice(0, 5)}`;
    const bio = info.bio || target.mood || target.bio || 'Available ✨';

    onStartChat({
      id: target.id || `contact_${handle.replace('@', '')}`,
      recipientId: target.id || null,
      name: displayName,
      handle: handle,
      bio: bio,
      phone: info.phone || target.phone || '',
      email: info.email || target.email || '',
      isGroup: Boolean(target.isGroup),
      firstMessage: firstMessage.trim() || undefined,
      isRequest: true
    });

    setQuery('');
    setFirstMessage('');
    setSelectedUser(null);
    onClose();
  };

  const parsedDbUsers = dbUsers.map((u) => {
    const info = parseProfileInfo(u);
    return {
      ...u,
      id: u.id,
      name: info.name,
      handle: info.handle,
      bio: info.bio,
      phone: info.phone,
      email: info.email,
      isGroup: Boolean(u.isGroup)
    };
  });

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const clean = query.trim();
    const handle = clean.startsWith('@') ? clean : `@${clean.toLowerCase().replace(/\s+/g, '_')}`;
    const cleanDigits = clean.replace(/\D/g, '');

    // 1. Check local parsed list
    const match = parsedDbUsers.find(
      (u) =>
        u.handle?.toLowerCase() === handle.toLowerCase() ||
        u.name?.toLowerCase() === clean.toLowerCase() ||
        (u.phone && (u.phone.includes(clean) || (cleanDigits.length >= 10 && u.phone.includes(cleanDigits.slice(-10))))) ||
        (u.email && u.email.toLowerCase() === clean.toLowerCase())
    );

    if (match) {
      handleStart(match);
      return;
    }

    // 2. Query Supabase directly
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${clean}%,full_name.ilike.%${clean}%,mood.ilike.%${clean}%`)
        .limit(1);

      if (data && data.length > 0) {
        handleStart(data[0]);
        return;
      }
    } catch (err) {
      console.warn('Direct search error:', err);
    }

    // 3. Fallback start
    handleStart({
      name: clean.replace(/^@/, ''),
      handle,
      bio: 'New Nexo contact'
    });
  };

  const q = query.toLowerCase().trim();
  const cleanPhoneQ = q.replace(/\D/g, '');
  const filteredDbUsers = parsedDbUsers.filter((u) => {
    if (!q) return true;
    const matchUsername = (u.handle || '').toLowerCase().includes(q.replace(/^@/, '')) || (u.handle || '').toLowerCase().includes(q);
    const matchName = (u.name || '').toLowerCase().includes(q);
    const matchPhone = (u.phone || '').includes(q) || (cleanPhoneQ.length >= 4 && (u.phone || '').includes(cleanPhoneQ));
    const matchEmail = (u.email || '').toLowerCase().includes(q);
    return matchUsername || matchName || matchPhone || matchEmail;
  });

  const displayList = filteredDbUsers.length > 0 ? filteredDbUsers : fallbackSuggestions.filter((item) => {
    if (!q) return true;
    return item.handle.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-5 sm:p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00a884] text-white shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                New Chat / Send Request
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                Search users by @username, phone number, or email
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleCustomSubmit} className="mt-4 flex-shrink-0">
          <div className="relative">
            <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search @username, phone, or email..."
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

        {/* Optional First Message Input */}
        <div className="mt-3 flex-shrink-0">
          <input
            type="text"
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            placeholder="Add an optional greeting message or note..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#00a884] text-[#111b21] dark:text-white text-[13px] focus:outline-none transition-all"
          />
        </div>

        {/* Live User Search Results */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0]">
              {filteredDbUsers.length > 0 ? `Registered Users (${filteredDbUsers.length})` : 'Directory Users'}
            </span>
            {loadingUsers && (
              <span className="flex items-center gap-1 text-[11px] text-[#00a884]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Searching...</span>
              </span>
            )}
          </div>

          <div className="space-y-1">
            {displayList.map((item) => {
              const displayName = item.full_name || item.name;
              const handle = item.username || item.handle;
              const statusText = item.mood || item.bio || 'Available ✨';

              return (
                <div
                  key={item.id || handle}
                  onClick={() => handleStart(item)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] cursor-pointer transition-colors group"
                >
                  {/* Clean Monochrome Silhouette Avatar (Zero stock profile images) */}
                  <AvatarIcon
                    size="sm"
                    isGroup={Boolean(item.isGroup)}
                    name={displayName}
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
                      {item.phone ? `${item.phone} • ${statusText}` : statusText}
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
