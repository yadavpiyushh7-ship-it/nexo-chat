import React, { useState, useEffect } from 'react';
import { X, AtSign, UserPlus, Loader2, Link2, Copy, Check, ShieldCheck, RefreshCw, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AvatarIcon from './AvatarIcon';
import { DEFAULT_DIRECTORY_PEERS } from '../mockData';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoogleAuth, fetchGoogleContacts } from '../lib/googleApis';

export default function NewChatModal({ isOpen, onClose, onStartChat, currentUser }) {
  const { t } = useLanguage();
  const { token: googleToken, isSignedIn: googleSignedIn, loading: googleLoading, signIn: signInGoogle } = useGoogleAuth();
  const [query, setQuery] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [dbUsers, setDbUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [googleContacts, setGoogleContacts] = useState([]);
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [contactsError, setContactsError] = useState('');

  const handleSyncGoogleContacts = async () => {
    setContactsError('');
    let activeToken = googleToken;
    if (!activeToken) {
      const res = await signInGoogle();
      if (!res?.ok || !res?.token) {
        setContactsError(res?.error || 'Sign in with Google to sync contacts.');
        return;
      }
      activeToken = res.token;
    }

    setSyncingContacts(true);
    try {
      const list = await fetchGoogleContacts(activeToken);
      setGoogleContacts(list);
      if (list.length === 0) {
        setContactsError('No contacts found in your Google Contacts.');
      }
    } catch (err) {
      setContactsError(err?.message || 'Unable to fetch Google Contacts.');
    } finally {
      setSyncingContacts(false);
    }
  };

  useEffect(() => {
    if (isOpen && googleSignedIn && googleToken && googleContacts.length === 0) {
      handleSyncGoogleContacts();
    }
  }, [isOpen, googleSignedIn, googleToken]);

  const userHandle = currentUser?.username || '@piyush_dev';
  const inviteLink = `https://nexo-chat-pi.vercel.app/?connect=${encodeURIComponent(userHandle)}`;

  // Fetch real P2P peers from Supabase profiles (nexo-db)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchProfiles = async () => {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, mood, focus_reply, updated_at')
          .order('updated_at', { ascending: false })
          .limit(40);

        if (!error && data && isMounted) {
          const others = data.filter(
            (p) => p.id !== currentUser?.id && p.username !== currentUser?.username
          );
          setDbUsers(others);
        }
      } catch (err) {
        console.warn('Profiles search warning:', err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };

    fetchProfiles();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser?.id, currentUser?.username]);

  if (!isOpen) return null;

  const cleanBio = (moodStr) => {
    if (!moodStr) return 'Nexo E2EE Peer';
    return moodStr.split(' | ')[0] || 'Nexo E2EE Peer';
  };

  const parsePublicKey = (focusReply) => {
    if (!focusReply || !focusReply.startsWith('{')) return null;
    try {
      const parsed = JSON.parse(focusReply);
      return parsed.e2eePubJwk || null;
    } catch {
      return null;
    }
  };

  const combinedPeers = (() => {
    const map = new Map();
    DEFAULT_DIRECTORY_PEERS.forEach((p) => map.set(p.username.toLowerCase(), p));
    dbUsers.forEach((u) => {
      if (u.username) {
        map.set(u.username.toLowerCase(), {
          id: u.id,
          full_name: u.full_name || u.username.replace('@', ''),
          username: u.username,
          mood: cleanBio(u.mood),
          publicKeyJwk: parsePublicKey(u.focus_reply),
        });
      }
    });
    return Array.from(map.values());
  })();

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleStart = (target) => {
    const displayName = target.full_name || target.name || 'Nexo Peer';
    const handle = target.username || target.handle || `@peer_${(target.id || '').slice(0, 5)}`;
    const bio = cleanBio(target.mood || target.bio);

    onStartChat({
      id: target.id || `contact_${handle.replace('@', '')}`,
      recipientId: target.id || null,
      name: displayName,
      handle,
      bio,
      publicKeyJwk: target.publicKeyJwk || null,
      isGroup: Boolean(target.isGroup),
      initialMessage: firstMessage.trim() || undefined,
      isRequest: false,
    });

    setQuery('');
    setFirstMessage('');
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const clean = query.trim();
    const handle = clean.startsWith('@') ? clean : `@${clean.toLowerCase().replace(/\s+/g, '_')}`;

    const match = combinedPeers.find(
      (u) =>
        u.username?.toLowerCase() === handle.toLowerCase() ||
        u.full_name?.toLowerCase() === clean.toLowerCase()
    );

    if (match) {
      handleStart(match);
    } else {
      handleStart({
        name: clean.replace(/^@/, ''),
        username: handle,
        mood: 'Live P2P E2EE Peer',
      });
    }
  };

  const q = query.toLowerCase().trim();
  const filteredPeers = combinedPeers.filter((u) => {
    if (!q) return true;
    const matchUsername =
      (u.username || '').toLowerCase().includes(q.replace(/^@/, '')) ||
      (u.username || '').toLowerCase().includes(q);
    const matchName = (u.full_name || '').toLowerCase().includes(q);
    return matchUsername || matchName;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-5 sm:p-6 relative border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0055ff] text-white shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                {t('newChatTitle')}
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                Free E2EE P2P via Supabase Realtime • Zero phone exposure
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shareable P2P Invite Link Box */}
        <div className="mt-3.5 p-3 rounded-xl bg-[#0055ff]/10 border border-[#0055ff]/25 space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between text-[11.5px] font-bold text-[#0055ff] dark:text-sky-400">
            <span className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              <span>Shareable Friend Invite Link</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3 h-3" /> E2EE Ready
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111b21] text-[11.5px] font-mono text-[#111b21] dark:text-[#e9edef] border border-black/5 dark:border-white/10 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-3 py-1.5 rounded-lg bg-[#0055ff] hover:bg-[#0044cc] text-white text-[11.5px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedInvite ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleCustomSubmit} className="mt-3.5 flex-shrink-0">
          <div className="relative">
            <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search @username or enter peer handle..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#0055ff] text-[#111b21] dark:text-white text-[14px] focus:outline-none transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#0055ff] hover:bg-[#0044cc] disabled:opacity-40 text-white text-[12px] font-semibold cursor-pointer transition-all"
            >
              Connect
            </button>
          </div>
        </form>

        {/* Optional First Message Input */}
        <div className="mt-2.5 flex-shrink-0">
          <input
            type="text"
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            placeholder="Optional encrypted greeting message..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-transparent focus:border-[#0055ff] text-[#111b21] dark:text-white text-[13px] focus:outline-none transition-all"
          />
        </div>

        {/* Live Directory + Sync Google Contacts (People API) */}
        <div className="mt-3.5 flex-1 overflow-y-auto space-y-3">
          {/* Google People API Contacts Section */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Sync Google Contacts ({googleContacts.length})
              </span>
              <button
                type="button"
                onClick={handleSyncGoogleContacts}
                disabled={syncingContacts || googleLoading}
                className="px-2.5 py-1 rounded-lg bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {syncingContacts || googleLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>{googleSignedIn ? 'Refresh Contacts' : 'Sync Google Contacts'}</span>
              </button>
            </div>

            {contactsError && (
              <p className="text-[11.5px] text-amber-600 dark:text-amber-400">{contactsError}</p>
            )}

            {googleContacts.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {googleContacts
                  .filter(
                    (c) =>
                      !q ||
                      c.full_name.toLowerCase().includes(q) ||
                      (c.email || '').toLowerCase().includes(q)
                  )
                  .map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {contact.photo ? (
                          <img
                            src={contact.photo}
                            alt={contact.full_name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <AvatarIcon size="sm" name={contact.full_name} />
                        )}
                        <div className="min-w-0">
                          <h5 className="text-[13px] font-semibold text-[#111b21] dark:text-white truncate">
                            {contact.full_name}
                          </h5>
                          <p className="text-[11px] text-[#667781] dark:text-[#8696a0] truncate">
                            {contact.email || contact.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStart(contact)}
                          className="px-2.5 py-1 rounded-lg bg-[#0055ff] text-white text-[11px] font-bold cursor-pointer"
                        >
                          Chat
                        </button>
                        {contact.email && (
                          <a
                            href={`mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent('Join me on Nexo E2EE Chat')}&body=${encodeURIComponent(`Hey ${contact.full_name},\n\nConnect with me on Nexo using my E2EE invite link: ${inviteLink}`)}`}
                            className="p-1.5 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] text-[#00a884] hover:bg-emerald-500/15"
                            title="Email Invite Link"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0]">
              Live @username Peers ({filteredPeers.length})
            </span>
            {loadingUsers && (
              <span className="flex items-center gap-1 text-[11px] text-[#0055ff]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Syncing...</span>
              </span>
            )}
          </div>

          <div className="space-y-1">
            {filteredPeers.map((item) => (
              <div
                key={item.id || item.username}
                onClick={() => handleStart(item)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] cursor-pointer transition-colors group"
              >
                <AvatarIcon size="sm" name={item.full_name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate group-hover:text-[#0055ff] transition-colors">
                      {item.full_name}
                    </h4>
                    <span className="text-[12px] text-[#0055ff] dark:text-sky-400 font-semibold ml-2 flex-shrink-0">
                      {item.username}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0] truncate">
                    {item.mood}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
