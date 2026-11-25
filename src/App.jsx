import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import NavigationRail from './components/NavigationRail';
import MobileNavBar from './components/MobileNavBar';
import Sidebar from './components/Sidebar';
import SettingsDrawer from './components/SettingsDrawer';
import ChatWindow from './components/ChatWindow';
import ContactDetailsDrawer from './components/ContactDetailsDrawer';
import CallModal from './components/CallModal';
import NewChatModal from './components/NewChatModal';
import ScheduledQueueModal from './components/ScheduledQueueModal';
import StarredMessagesModal from './components/StarredMessagesModal';
import ConnectedDevicesModal from './components/ConnectedDevicesModal';
import DeleteMessageModal from './components/DeleteMessageModal';
import SummarizeModal from './components/SummarizeModal';
import StatusView from './components/StatusView';
import CommunitiesView from './components/CommunitiesView';
import CallsView from './components/CallsView';
import WorkspaceHubView from './components/WorkspaceHubView';
import EdTechPrepView from './components/EdTechPrepView';
import YouTubeHubView from './components/YouTubeHubView';
import AppLockScreen from './components/AppLockScreen';
import AvatarIcon from './components/AvatarIcon';
import { Plus, CheckCircle2, X, Phone, PhoneOff, Video, Laptop, ShieldCheck, UserPlus, Loader2 } from 'lucide-react';
import {
  INITIAL_ARCHIVED,
  INITIAL_FOLDERS,
  DEFAULT_STUDENT_PROFILE,
  INITIAL_BOOKMARKS,
  createSelfChat,
  createCampusWorkspaceChats,
} from './mockData';
import { requestAI } from './lib/aiClient';
import { applyThemePreferences } from './lib/themeUtils';
import { supabase } from './lib/supabase';
import {
  getOrCreateIdentityKeys,
  deriveSharedAESKey,
  encryptMessageText,
  decryptMessageText,
} from './lib/e2ee';

const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function App() {
  // 1. Direct Auto-Load Profile (No Login / Sign-Up / OTP Gateway)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexo_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name && parsed?.username) return parsed;
      }
    } catch {}
    return DEFAULT_STUDENT_PROFILE;
  });

  // 2. Navigation Tabs: 'chats' | 'updates' | 'communities' | 'calls'
  const [activeNavTab, setActiveNavTab] = useState('chats');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedContactForDetails, setSelectedContactForDetails] = useState(null);

  // 3. Modals & Screens
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isScheduledQueueOpen, setIsScheduledQueueOpen] = useState(false);
  const [isStarredOpen, setIsStarredOpen] = useState(false);
  const [isConnectedDevicesOpen, setIsConnectedDevicesOpen] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);

  // 4. Custom Chat Themes & Wallpapers (Independent of Light/Dark Mode)
  const [bubbleAccent, setBubbleAccent] = useState(() => {
    try {
      return localStorage.getItem('nexo_bubble_theme') || 'emerald_green';
    } catch {
      return 'emerald_green';
    }
  });
  const [chatWallpaper, setChatWallpaper] = useState(() => {
    try {
      return localStorage.getItem('nexo_chat_wallpaper') || 'default';
    } catch {
      return 'default';
    }
  });

  const handleChangeTheme = useCallback((accentId, wallpaperId) => {
    const nextAccent = accentId || 'emerald_green';
    const nextWallpaper = wallpaperId || 'default';
    setBubbleAccent(nextAccent);
    setChatWallpaper(nextWallpaper);
    applyThemePreferences(nextAccent, nextWallpaper);
  }, []);

  // 5. Chat & Campus Workspace State (Pre-loaded immediately on open)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('all');
  const [chats, setChats] = useState(() => createCampusWorkspaceChats(user));
  const [archivedChats, setArchivedChats] = useState(INITIAL_ARCHIVED);
  const [activeChatId, setActiveChatId] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 'chat_placement_cell' : null
  );
  const [replyingTo, setReplyingTo] = useState(null);

  // 6. Distraction-Free Exam / Study Focus Mode
  const [focusMode, setFocusMode] = useState(false);
  const [studyStatus, setStudyStatus] = useState(() => {
    try {
      return localStorage.getItem('nexo_study_status') || 'Studying for DSA & Exams 📚 — Placement alerts active';
    } catch {
      return 'Studying for DSA & Exams 📚 — Placement alerts active';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexo_study_status', studyStatus);
    } catch {}
  }, [studyStatus]);

  // 7. Cloud-Synced Categorized Resource Vault (Preserved even when clearing chats)
  const [bookmarkedVault, setBookmarkedVault] = useState(() => {
    try {
      const saved = localStorage.getItem('nexo_resource_vault');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_BOOKMARKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexo_resource_vault', JSON.stringify(bookmarkedVault));
    } catch {}
  }, [bookmarkedVault]);

  // 8. Message Scheduling Queue, E2EE Keys & Multi-Device Session Sync
  const [scheduledQueue, setScheduledQueue] = useState([]);
  const [appToast, setAppToast] = useState('');
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState('gmail');
  const [updatesSubTab, setUpdatesSubTab] = useState('statuses');
  const [loggedOutFromPrimary, setLoggedOutFromPrimary] = useState(false);
  const [myKeys, setMyKeys] = useState(null);

  const userRef = useRef(user);
  const activeChatIdRef = useRef(activeChatId);
  const chatsRef = useRef(chats);
  const myKeysRef = useRef(null);
  const peerPubKeysRef = useRef({});
  const realtimeChannelRef = useRef(null);
  const nexoDbChannelRef = useRef(null);
  const incomingCallRef = useRef(incomingCall);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const showToast = (msg) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(''), 3500);
  };

  const openHubTab = (hub, meetTab = 'gmail') => {
    if (hub === 'workspace') {
      setWorkspaceInitialTab(meetTab);
    }
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      const subMap = { workspace: 'workspace', prep: 'prep', youtube: 'lectures' };
      setUpdatesSubTab(subMap[hub] || 'statuses');
      setActiveNavTab('updates');
    } else {
      setActiveNavTab(hub);
    }
    setActiveChatId(null);
    setIsSettingsOpen(false);
  };

  // Silent Direct Entry for QR Pairing (?link_token=/?pair=/?pair_session=) & ?connect=<username>
  // Never renders any legacy login screen or blocking "Device linked!" overlay
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('link_token') || params.get('pair') || params.get('pair_session');
    const connectParam = params.get('connect');

    if (token) {
      const ua = navigator.userAgent;
      const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
      const devName = isMobile
        ? (/Android/i.test(ua) ? 'Android (Mobile Browser)' : 'iOS Safari (Mobile)')
        : 'Web Browser Session';

      const myDeviceId = localStorage.getItem('nexo_linked_device_id') || `dev_${Date.now()}`;
      try {
        localStorage.setItem('nexo_linked_device_id', myDeviceId);
        localStorage.setItem('nexo_linked_session_token', token);
      } catch {}

      const devInfo = {
        id: myDeviceId,
        linkToken: token,
        ua,
        os: devName,
        location: 'Linked via Realtime QR',
        isMobile,
        linked_at: new Date().toISOString(),
      };

      const currUser = userRef.current;
      supabase
        .from('linked_devices')
        .update({
          status: 'linked',
          user_id: currUser?.id || null,
          username: currUser?.username || '@piyush_dev',
          display_name: currUser?.name || 'Piyush Yadav',
          device_info: devInfo,
        })
        .eq('link_token', token)
        .then(() => {})
        .catch(() => {});

      try {
        const pairChan = supabase.channel(`device-link-${token}`);
        pairChan.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            pairChan.send({
              type: 'broadcast',
              event: 'device-linked',
              payload: { user: currUser, linkToken: token, deviceInfo: devInfo },
            });
            setTimeout(() => supabase.removeChannel(pairChan), 2000);
          }
        });
      } catch {}

      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (connectParam) {
      const cleanInviter = connectParam.startsWith('@') ? connectParam : `@${connectParam}`;
      supabase
        .from('profiles')
        .select('id, username, full_name, mood, focus_reply')
        .ilike('username', cleanInviter)
        .limit(1)
        .then(({ data }) => {
          const prof = data?.[0] || null;
          let inviterPubJwk = null;
          try {
            if (prof?.focus_reply?.startsWith('{')) {
              inviterPubJwk = JSON.parse(prof.focus_reply)?.e2eePubJwk || null;
            }
          } catch {}
          const peerId = prof?.id || `invite_${cleanInviter.replace('@', '')}`;
          handleStartChatWith({
            id: peerId,
            recipientId: prof?.id || peerId,
            name: prof?.full_name || cleanInviter.replace('@', ''),
            handle: prof?.username || cleanInviter,
            bio: prof?.mood || 'Nexo E2EE Peer',
            e2eePubJwk: inviterPubJwk,
          });
        })
        .catch(() => {
          handleStartChatWith({
            id: `invite_${cleanInviter.replace('@', '')}`,
            name: cleanInviter.replace('@', ''),
            handle: cleanInviter,
            bio: 'Nexo E2EE Peer',
          });
        });

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Multi-Device Remote Logout Listener (Supabase Realtime linked_devices table & channel)
  useEffect(() => {
    const handleRemoteRevoke = (payload) => {
      const myDeviceId = localStorage.getItem('nexo_linked_device_id');
      const myToken = localStorage.getItem('nexo_linked_session_token');
      if (!myDeviceId && !myToken) return;

      const matchesId = payload?.deviceId && myDeviceId && payload.deviceId === myDeviceId;
      const matchesToken =
        (payload?.linkToken && myToken && payload.linkToken === myToken) ||
        (payload?.link_token && myToken && payload.link_token === myToken);

      if (matchesId || matchesToken) {
        try {
          localStorage.removeItem('nexo_linked_device_id');
          localStorage.removeItem('nexo_linked_session_token');
          localStorage.removeItem('nexo_linked_devices');
        } catch {}
        setLoggedOutFromPrimary(true);
        showToast('Logged out from primary device');
      }
    };

    const devChannel = supabase.channel('nexo-linked-devices');
    devChannel
      .on('broadcast', { event: 'device-logout' }, ({ payload }) => {
        handleRemoteRevoke(payload);
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'linked_devices' },
        (payload) => {
          if (payload.new?.status === 'revoked') {
            handleRemoteRevoke(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(devChannel);
    };
  }, []);

  // Initialize Web Crypto ECDH P-256 E2EE Keys on Mount & Publish to Supabase profiles
  useEffect(() => {
    let isMounted = true;
    const initE2EE = async () => {
      try {
        const keys = await getOrCreateIdentityKeys();
        if (!isMounted) return;
        myKeysRef.current = keys;
        setMyKeys(keys);

        const currUser = userRef.current;
        if (currUser?.id && keys?.publicJwk) {
          try {
            await supabase.from('profiles').upsert({
              id: currUser.id,
              username: currUser.username || '@piyush_dev',
              full_name: currUser.name || 'Piyush Yadav',
              avatar_url: currUser.avatar || '',
              mood: currUser.bio || currUser.mood || 'B.Tech CSE Peer',
              focus_reply: JSON.stringify({ e2eePubJwk: keys.publicJwk }),
              updated_at: new Date().toISOString(),
            });
          } catch {}
        }
      } catch (err) {
        console.warn('E2EE init warning:', err);
      }
    };
    initE2EE();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.username, user?.name]);

  // Global Scheduled Messages Auto-Send Engine (1-second interval)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setScheduledQueue((prevQueue) => {
        const due = prevQueue.filter((item) => (item.scheduledAt || 0) <= now);
        if (due.length === 0) return prevQueue;

        due.forEach((item) => {
          const targetId = item.targetChatId || 'self_vault';
          const deliveredMsg = {
            id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            isSender: true,
            text: item.text || '',
            image: item.image || item.mediaUrl || null,
            mediaType: item.mediaType || (item.image ? 'image' : null),
            attachment: item.attachment || null,
            fileName: item.fileName || null,
            fileSize: item.fileSize || null,
            fileExt: item.fileExt || null,
            poll: item.poll || null,
            event: item.event || null,
            contactCard: item.contactCard || null,
            stickerUrl: item.stickerUrl || null,
            isSticker: Boolean(item.isSticker || item.stickerUrl),
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
            read: true,
            isStarred: false,
            isScheduledDelivery: true,
          };

          setChats((currentChats) =>
            currentChats.map((c) =>
              c.id === targetId ? { ...c, messages: [...c.messages, deliveredMsg] } : c
            )
          );

          showToast(`⏰ Scheduled message delivered to ${item.recipientName || 'chat'}!`);
        });

        return prevQueue.filter((item) => (item.scheduledAt || 0) > now);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // System Light/Dark Mode Sync + Reapply Custom Bubble Accent Theme
  useEffect(() => {
    document.title = 'Nexo • B.Tech CSE & Placement Hub';
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyThemeAndFavicon = (isDark) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      applyThemePreferences(bubbleAccent, chatWallpaper);

      const faviconLink = document.querySelector("link[rel='icon']");
      if (faviconLink) {
        faviconLink.href = '/logo.png?v=2';
      }
    };

    applyThemeAndFavicon(mediaQuery.matches);
    const handler = (e) => applyThemeAndFavicon(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [bubbleAccent, chatWallpaper]);

  // Realtime Channel Subscription (nexo-db + realtime-messages + E2EE Decryption)
  const handleIncomingMessageRecord = useCallback(async (record) => {
    if (!record || !record.id) return;
    const currentUserId = userRef.current?.id;
    const currentUsername = userRef.current?.username?.toLowerCase();
    if (!currentUserId) return;

    const isIncomingForMe =
      record.receiver_id === currentUserId ||
      (record.receiver_username && record.receiver_username.toLowerCase() === currentUsername);
    const isMySentEcho = record.sender_id === currentUserId;
    if (!isIncomingForMe && !isMySentEcho) return;

    const contactId = isIncomingForMe ? record.sender_id : record.receiver_id;
    const isCurrentlyOpen = activeChatIdRef.current === contactId;

    // Cache sender's E2EE public JWK if provided
    let senderPubJwk = record.senderPubJwk || null;
    let rawContent = record.content || '';
    let decodedText = rawContent;
    let isE2EE = false;

    if (typeof rawContent === 'string' && rawContent.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawContent);
        if (parsed?.__e2ee && parsed?.ciphertext && parsed?.iv) {
          isE2EE = true;
          if (parsed.senderPubJwk) senderPubJwk = parsed.senderPubJwk;
          if (senderPubJwk && contactId) {
            peerPubKeysRef.current[contactId] = senderPubJwk;
          }
          const seed = [currentUserId, contactId].sort().join(':');
          const aesKey = await deriveSharedAESKey(
            myKeysRef.current?.privateJwk,
            senderPubJwk || peerPubKeysRef.current[contactId],
            seed
          );
          decodedText = await decryptMessageText(parsed.ciphertext, parsed.iv, aesKey);
        }
      } catch {}
    } else if (record.ciphertext && record.iv) {
      try {
        isE2EE = true;
        if (senderPubJwk && contactId) {
          peerPubKeysRef.current[contactId] = senderPubJwk;
        }
        const seed = [currentUserId, contactId].sort().join(':');
        const aesKey = await deriveSharedAESKey(
          myKeysRef.current?.privateJwk,
          senderPubJwk || peerPubKeysRef.current[contactId],
          seed
        );
        decodedText = await decryptMessageText(record.ciphertext, record.iv, aesKey);
      } catch {}
    }

    const formattedMsg = {
      id: record.id,
      isSender: isMySentEcho,
      text: record.deleted_for_everyone ? 'This message was deleted' : decodedText,
      image: record.deleted_for_everyone ? null : (record.media_type === 'image' ? record.media_url : null),
      mediaUrl: record.deleted_for_everyone ? null : record.media_url,
      mediaType: record.media_type,
      attachment: record.attachment || null,
      fileName: record.fileName || null,
      fileSize: record.fileSize || null,
      youtubeVideo: record.youtubeVideo || null,
      time: new Date(record.created_at || Date.now()).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase(),
      read: isIncomingForMe ? isCurrentlyOpen : (record.status === 'read'),
      isStarred: Boolean(record.is_starred),
      isE2EE,
      deletedForEveryone: Boolean(record.deleted_for_everyone),
    };

    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex(
        (c) =>
          c.recipientId === contactId ||
          c.id === contactId ||
          (record.sender_username && c.handle?.toLowerCase() === record.sender_username.toLowerCase())
      );
      if (chatIndex >= 0) {
        return prevChats.map((c, idx) => {
          if (idx !== chatIndex) return c;
          const nextPubJwk = senderPubJwk || c.e2eePubJwk || null;
          const alreadyHas = c.messages.some((m) => m.id === formattedMsg.id);
          if (alreadyHas) {
            return {
              ...c,
              e2eePubJwk: nextPubJwk,
              messages: c.messages.map((m) => (m.id === formattedMsg.id ? { ...m, ...formattedMsg } : m)),
            };
          }
          return {
            ...c,
            e2eePubJwk: nextPubJwk,
            unreadCount: (isIncomingForMe && !isCurrentlyOpen) ? (c.unreadCount || 0) + 1 : c.unreadCount,
            messages: [...c.messages, formattedMsg],
          };
        });
      }
      const newChatObj = {
        id: contactId,
        recipientId: contactId,
        name: record.sender_name || 'Nexo Peer',
        handle: record.sender_username || `@peer_${contactId.slice(0, 5)}`,
        bio: 'Nexo E2EE Peer',
        e2eePubJwk: senderPubJwk || null,
        folder: 'all',
        status: 'accepted',
        online: true,
        unreadCount: isIncomingForMe && !isCurrentlyOpen ? 1 : 0,
        lastSeen: 'Active now',
        messages: [formattedMsg],
      };
      return [prevChats[0], newChatObj, ...prevChats.slice(1)];
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('realtime-messages');
    const nexoDbChannel = supabase.channel('nexo-db');

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        handleIncomingMessageRecord(payload.new);
      })
      .on('broadcast', { event: 'new-message' }, ({ payload }) => {
        handleIncomingMessageRecord(payload);
      })
      .on('broadcast', { event: 'call-offer' }, ({ payload }) => {
        if (payload?.recipientId === userRef.current?.id && payload?.caller?.id !== userRef.current?.id) {
          setIncomingCall(payload);
        }
      })
      .subscribe();

    nexoDbChannel
      .on('broadcast', { event: 'new-message' }, ({ payload }) => {
        handleIncomingMessageRecord(payload);
      })
      .on('broadcast', { event: 'peer-connect' }, ({ payload }) => {
        if (!payload || payload.peerId === userRef.current?.id) return;
        const targetsMe =
          payload.inviterHandle?.toLowerCase() === userRef.current?.username?.toLowerCase() ||
          payload.targetUserId === userRef.current?.id;
        if (targetsMe) {
          if (payload.publicJwk) {
            peerPubKeysRef.current[payload.peerId] = payload.publicJwk;
          }
          setChats((prev) => {
            const exists = prev.some(
              (c) =>
                c.recipientId === payload.peerId ||
                c.handle?.toLowerCase() === payload.peerHandle?.toLowerCase()
            );
            if (exists) return prev;
            const joinedPeer = {
              id: payload.peerId,
              recipientId: payload.peerId,
              name: payload.peerName,
              handle: payload.peerHandle,
              bio: 'Connected via E2EE Invite Link',
              e2eePubJwk: payload.publicJwk || null,
              folder: 'all',
              status: 'accepted',
              online: true,
              unreadCount: 1,
              lastSeen: 'Active now',
              messages: [
                {
                  id: `m_join_${Date.now()}`,
                  isSender: false,
                  text: `🔒 ${payload.peerName} (${payload.peerHandle}) joined via your Nexo invite link! Messages are end-to-end encrypted.`,
                  time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
                  read: false,
                },
              ],
            };
            return [prev[0], joinedPeer, ...prev.slice(1)];
          });
          showToast(`${payload.peerName} (${payload.peerHandle}) connected via invite link!`);
        }
      })
      .on('broadcast', { event: 'delete-message' }, ({ payload }) => {
        if (!payload?.messageId) return;
        setChats((prev) =>
          prev.map((c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === payload.messageId
                ? { ...m, text: 'This message was deleted', deletedForEveryone: true, image: null, mediaUrl: null }
                : m
            ),
          }))
        );
      })
      .subscribe();

    realtimeChannelRef.current = channel;
    nexoDbChannelRef.current = nexoDbChannel;
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(nexoDbChannel);
      realtimeChannelRef.current = null;
      nexoDbChannelRef.current = null;
    };
  }, [user?.id, handleIncomingMessageRecord]);

  // Selected chat
  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  // Dynamic Sidebar Badge: exact sum of unread messages in active chats (clears immediately on open)
  const totalUnreadCount = useMemo(() => {
    return chats.reduce((sum, c) => {
      if (c.status === 'pending') return sum;
      return sum + (c.unreadCount || 0);
    }, 0);
  }, [chats]);

  // Filtered and pinned chats sorting
  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return chats
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(q) ||
          (c.handle && c.handle.toLowerCase().includes(q)) ||
          c.messages.some((m) => (m.text || '').toLowerCase().includes(q));

        if (!matchesSearch) return false;
        if (activeFolder === 'all') return c.status !== 'pending';
        if (activeFolder === 'unread') {
          if (focusMode && !c.isPlacementAlert) return false;
          return c.unreadCount > 0 && c.status !== 'pending';
        }
        if (activeFolder === 'favourites') return Boolean(c.pinned || c.isFavourite) && c.status !== 'pending';
        if (activeFolder === 'friends') return !c.isGroup && !c.isSelfChat && c.id !== 'chat_placement_bot' && c.status !== 'pending';
        if (activeFolder === 'requests') return c.status === 'pending';
        if (activeFolder === 'groups') return Boolean(c.isGroup) && c.status !== 'pending';
        return c.folder === activeFolder;
      })
      .sort((a, b) => {
        if (a.isSelfChat) return -1;
        if (b.isSelfChat) return 1;
        if (a.isPlacementAlert && !b.isPlacementAlert) return -1;
        if (b.isPlacementAlert && !a.isPlacementAlert) return 1;
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      });
  }, [chats, searchQuery, activeFolder, focusMode]);

  // Request actions
  const handleAcceptRequest = (chatId) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, status: 'accepted' } : c)));
    showToast('Peer connection accepted!');
  };

  const handleDeclineRequest = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) setActiveChatId('self_vault');
    showToast('Request declined.');
  };

  // Call actions
  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      id: incomingCall.callId,
      caller: incomingCall.caller,
      recipient: user,
      type: incomingCall.type,
      isIncoming: true,
      offer: incomingCall.offer,
    });
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    setIncomingCall(null);
  };

  // Start new chat with peer via @username (no phone number exposed)
  const handleStartChatWith = (contactData) => {
    const targetRecipientId = contactData.recipientId || (isValidUUID(contactData.id) ? contactData.id : null);

    const existing = chats.find(
      (c) =>
        (targetRecipientId && (c.recipientId === targetRecipientId || c.id === targetRecipientId)) ||
        (contactData.handle && c.handle?.toLowerCase() === contactData.handle?.toLowerCase()) ||
        c.name.toLowerCase() === contactData.name.toLowerCase()
    );

    if (existing) {
      setActiveChatId(existing.id);
      setActiveNavTab('chats');
      setIsSettingsOpen(false);
      return;
    }

    const chatId = targetRecipientId || contactData.id || `c_${Date.now()}`;
    const status = contactData.isRequest ? 'pending' : (contactData.status || 'accepted');

    const newChatObj = {
      id: chatId,
      recipientId: targetRecipientId || null,
      name: contactData.name,
      handle: contactData.handle || `@${contactData.name.toLowerCase().replace(/\s+/g, '_')}`,
      bio: contactData.bio || 'B.Tech CSE Peer • JECRC University',
      e2eePubJwk: contactData.e2eePubJwk || null,
      folder: contactData.isGroup ? 'groups' : 'all',
      status,
      isGroup: Boolean(contactData.isGroup),
      online: true,
      typing: false,
      unreadCount: 0,
      lastSeen: 'Active now',
      messages: contactData.initialMessage
        ? [
            {
              id: `m_${Date.now()}`,
              isSender: true,
              text: contactData.initialMessage,
              time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
              read: true,
            },
          ]
        : [],
    };

    setChats((prevChats) => [prevChats[0] || createSelfChat(user), newChatObj, ...prevChats.slice(1)]);
    setActiveChatId(newChatObj.id);
    setActiveNavTab('chats');
    setIsSettingsOpen(false);
  };

  const handleArchiveChat = (id) => {
    const target = chats.find((c) => c.id === id);
    if (!target || target.isSelfChat) return;
    setChats(chats.filter((c) => c.id !== id));
    setArchivedChats([target, ...archivedChats]);
    if (activeChatId === id) setActiveChatId('self_vault');
  };

  const handleUnarchiveChat = (id) => {
    const target = archivedChats.find((c) => c.id === id);
    if (!target) return;
    setArchivedChats(archivedChats.filter((c) => c.id !== id));
    setChats([target, ...chats]);
  };

  const handlePinChat = (id) => {
    setChats(chats.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  };

  const handleDeleteChat = (id) => {
    const target = chats.find((c) => c.id === id);
    if (target?.isSelfChat) {
      showToast('📌 Study Vault cannot be deleted. You can clear messages instead.');
      return;
    }
    setChats(chats.filter((c) => c.id !== id));
    setArchivedChats(archivedChats.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId('self_vault');
    if (selectedContactForDetails?.id === id) setSelectedContactForDetails(null);
  };

  const handleClearChat = (id) => {
    // Clearing chat messages NEVER removes saved items from bookmarkedVault!
    setChats(chats.map((c) => (c.id === id ? { ...c, messages: [] } : c)));
    showToast('Chat cleared. Your starred bookmarks remain safe in Resource Vault!');
  };

  const handleReadAll = () => {
    setChats(
      chats.map((c) => ({
        ...c,
        unreadCount: 0,
        messages: c.messages.map((m) => ({ ...m, read: true })),
      }))
    );
  };

  // Cloud-Synced Starred & Categorized Bookmarks
  const handleToggleStarMessage = (chatId, messageId, category = '#Important') => {
    const targetChat = chats.find((c) => c.id === chatId);
    const targetMsg = targetChat?.messages?.find((m) => m.id === messageId);

    const existingIdx = bookmarkedVault.findIndex((b) => b.id === messageId);

    if (existingIdx >= 0) {
      // Remove from vault
      setBookmarkedVault((prev) => prev.filter((b) => b.id !== messageId));
      showToast('Removed from Resource Vault.');
    } else if (targetMsg) {
      // Add to persistent vault
      const newBookmark = {
        id: targetMsg.id,
        chatId: targetChat.id,
        chatName: targetChat.name,
        senderName: targetMsg.isSender ? 'You' : (targetMsg.senderName || targetChat.name),
        isSender: Boolean(targetMsg.isSender),
        category,
        text: targetMsg.text || '',
        fileName: targetMsg.fileName || null,
        fileSize: targetMsg.fileSize || null,
        time: targetMsg.time,
        date: 'Today',
      };
      setBookmarkedVault((prev) => [newBookmark, ...prev]);
      showToast(`Bookmarked to ${category} in Resource Vault!`);
    }

    // Update message flag inside chat if still present
    if (chatId) {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId
                ? { ...m, isStarred: existingIdx < 0, bookmarkCategory: existingIdx < 0 ? category : null }
                : m
            ),
          };
        })
      );
    }
  };

  const handleUpdateBookmarkCategory = (bookmarkId, newCategory) => {
    setBookmarkedVault((prev) =>
      prev.map((b) => (b.id === bookmarkId ? { ...b, category: newCategory } : b))
    );
    setChats((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === bookmarkId ? { ...m, bookmarkCategory: newCategory } : m
        ),
      }))
    );
    showToast(`Tagged bookmark as ${newCategory}`);
  };

  // Save AI Summary, Meeting MoM, Video Notes, or Prep Cards directly into (You) Self-Chat & Bookmarks
  const handleSaveSummaryToVault = (summaryText, category = '#Notes') => {
    const nowTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    const selfChatName = `${userRef.current?.name || 'Piyush Yadav'} (You)`;
    const vaultMsg = {
      id: `m_sum_${Date.now()}`,
      isSender: true,
      text: summaryText,
      time: nowTime,
      read: true,
      isStarred: true,
      bookmarkCategory: category,
    };
    setChats((prev) =>
      prev.map((c) => (c.id === 'self_vault' ? { ...c, messages: [...c.messages, vaultMsg] } : c))
    );
    setBookmarkedVault((prev) => [
      {
        id: vaultMsg.id,
        chatId: 'self_vault',
        chatName: selfChatName,
        senderName: 'You',
        isSender: true,
        category,
        text: summaryText,
        time: nowTime,
        date: 'Today',
      },
      ...prev,
    ]);
    showToast(`Saved to ${selfChatName} & ${category}!`);
  };

  // Save Recorded Call (.webm) Copy to (You) Self-Chat
  const handleSaveCallRecording = ({ blobUrl, durationSeconds, contactName, fileName }) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    const recMsg = {
      id: `m_rec_${Date.now()}`,
      isSender: true,
      text: `🎙️ Call Recording with ${contactName} (${fileName})`,
      mediaType: 'audio',
      mediaUrl: blobUrl,
      attachment: blobUrl,
      fileName,
      duration: durationSeconds,
      time: nowTime,
      read: true,
      isStarred: true,
      bookmarkCategory: '#Notes',
    };
    setChats((prev) =>
      prev.map((c) => (c.id === 'self_vault' ? { ...c, messages: [...c.messages, recMsg] } : c))
    );
    showToast(`Call recording downloaded & saved to ${userRef.current?.name || 'Piyush Yadav'} (You)!`);
  };

  // Edit Sent Message Anytime (No 15-Minute Limit) + Edit History
  const handleEditMessage = (chatId, messageId, newText) => {
    const editedAtTime = new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();

    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id !== messageId) return m;
            const prevHistory = m.editHistory || [];
            return {
              ...m,
              text: newText,
              isEdited: true,
              editHistory: [...prevHistory, { text: m.text, editedAt: editedAtTime }],
            };
          }),
        };
      })
    );

    // Also update text in Resource Vault if bookmarked
    setBookmarkedVault((prev) =>
      prev.map((b) => (b.id === messageId ? { ...b, text: newText } : b))
    );

    showToast('Message edited (Edit history saved)');
  };

  // Message Deletion
  const handleDeleteForEveryone = async (messageId) => {
    if (!deletePrompt) return;
    const { chatId } = deletePrompt;

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, text: 'This message was deleted', deletedForEveryone: true, image: null, mediaUrl: null }
                  : m
              ),
            }
          : c
      )
    );
  };

  const handleDeleteForMe = (messageId) => {
    if (!deletePrompt) return;
    const { chatId } = deletePrompt;
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c
      )
    );
  };

  // Schedule Message
  const handleScheduleMessage = (scheduleData) => {
    const queueItem = {
      id: `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: scheduleData.text || '',
      image: scheduleData.image || scheduleData.mediaUrl || null,
      mediaUrl: scheduleData.mediaUrl || scheduleData.image || null,
      mediaType: scheduleData.mediaType || (scheduleData.image ? 'image' : null),
      attachment: scheduleData.attachment || null,
      fileName: scheduleData.fileName || null,
      fileSize: scheduleData.fileSize || null,
      fileExt: scheduleData.fileExt || null,
      poll: scheduleData.poll || null,
      event: scheduleData.event || null,
      contactCard: scheduleData.contactCard || null,
      stickerUrl: scheduleData.stickerUrl || null,
      isSticker: Boolean(scheduleData.isSticker || scheduleData.stickerUrl),
      scheduledFor: scheduleData.scheduledFor,
      scheduledAt: scheduleData.scheduledAt || Date.now() + 60000,
      recipientName: scheduleData.recipientName || activeChat?.name || 'Study Vault',
      targetChatId: activeChatId || 'self_vault',
    };
    setScheduledQueue((prev) => [queueItem, ...prev]);
    showToast(`⏰ Scheduled for ${scheduleData.scheduledFor}!`);
  };

  const handleCancelScheduled = (id) => {
    setScheduledQueue(scheduledQueue.filter((item) => item.id !== id));
  };

  const handleSendNowScheduled = (item) => {
    handleSendMessage(item);
    handleCancelScheduled(item.id);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('nexo_user', JSON.stringify(updatedUser));
    } catch {}

    const dynamicSelfName = `${updatedUser.name || 'Piyush Yadav'} (You)`;
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.isSelfChat
          ? {
              ...c,
              name: dynamicSelfName,
              handle: `${updatedUser.username} • Message yourself`,
            }
          : c
      )
    );
    setBookmarkedVault((prev) =>
      prev.map((b) => (b.chatId === 'self_vault' ? { ...b, chatName: dynamicSelfName } : b))
    );
  };

  const handleResetWorkspace = () => {
    setUser(DEFAULT_STUDENT_PROFILE);
    const freshChats = createCampusWorkspaceChats(DEFAULT_STUDENT_PROFILE);
    setChats(freshChats);
    setBookmarkedVault(INITIAL_BOOKMARKS);
    setIsSettingsOpen(false);
    setActiveChatId(typeof window !== 'undefined' && window.innerWidth >= 768 ? 'chat_placement_cell' : null);
    showToast('Campus Placement workspace reset to defaults.');
  };

  // Send Message to Any Chat (with client-side Web Crypto AES-GCM-256 E2EE + nexo-db broadcast)
  const sendMessageToChat = async (targetChatId, payload) => {
    if (!targetChatId) return;

    const isString = typeof payload === 'string';
    const text = isString ? payload : (payload.text || '');
    const image = !isString ? (payload.image || payload.mediaUrl || null) : null;
    const quote = !isString ? (payload.quote || null) : null;
    const attachment = !isString ? (payload.attachment || null) : null;
    const mediaType = !isString ? (payload.mediaType || (image ? 'image' : null)) : null;
    const fileName = !isString ? (payload.fileName || null) : null;
    const fileSize = !isString ? (payload.fileSize || null) : null;
    const fileExt = !isString ? (payload.fileExt || null) : null;
    const poll = !isString ? (payload.poll || null) : null;
    const event = !isString ? (payload.event || null) : null;
    const contactCard = !isString ? (payload.contactCard || null) : null;
    const stickerUrl = !isString ? (payload.stickerUrl || null) : null;
    const youtubeVideo = !isString ? (payload.youtubeVideo || null) : null;
    const isSticker = !isString ? Boolean(payload.isSticker || stickerUrl) : false;

    const targetChat = chatsRef.current.find((c) => c.id === targetChatId);
    const shouldEncrypt = Boolean(targetChat && !targetChat.isSelfChat && !targetChat.isPlacementAlert);

    const newMsg = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isSender: true,
      text,
      image,
      quote,
      attachment,
      mediaType,
      fileName,
      fileSize,
      fileExt,
      poll,
      event,
      contactCard,
      stickerUrl,
      youtubeVideo,
      isSticker,
      isE2EE: shouldEncrypt,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
      read: true,
    };

    setChats((prev) =>
      prev.map((c) => (c.id === targetChatId ? { ...c, messages: [...c.messages, newMsg] } : c))
    );

    // Client-side AES-GCM-256 E2EE encryption + Supabase Realtime nexo-db broadcast
    if (shouldEncrypt && targetChat) {
      try {
        const recipientId = targetChat.recipientId || targetChat.id;
        const peerPubJwk = targetChat.e2eePubJwk || peerPubKeysRef.current[recipientId] || null;
        const seed = [userRef.current?.id || 'local', recipientId].sort().join(':');
        const aesKey = await deriveSharedAESKey(myKeysRef.current?.privateJwk, peerPubJwk, seed);
        const encrypted = await encryptMessageText(text || '', aesKey);

        const e2eeEnvelope = JSON.stringify({
          __e2ee: true,
          alg: 'AES-GCM-256',
          iv: encrypted.iv,
          ciphertext: encrypted.ciphertext,
          senderPubJwk: myKeysRef.current?.publicJwk || null,
        });

        const wirePayload = {
          id: newMsg.id,
          sender_id: userRef.current?.id,
          sender_name: userRef.current?.name,
          sender_username: userRef.current?.username,
          receiver_id: recipientId,
          receiver_username: targetChat.handle || null,
          content: e2eeEnvelope,
          media_url: image || attachment || null,
          media_type: mediaType || null,
          youtubeVideo: youtubeVideo || null,
          status: 'sent',
          created_at: new Date().toISOString(),
        };

        nexoDbChannelRef.current?.send({
          type: 'broadcast',
          event: 'new-message',
          payload: wirePayload,
        });

        if (isValidUUID(userRef.current?.id) && isValidUUID(recipientId)) {
          await supabase.from('messages').insert({
            id: newMsg.id,
            sender_id: userRef.current.id,
            receiver_id: recipientId,
            content: e2eeEnvelope,
            media_url: image || null,
            media_type: mediaType || null,
            status: 'sent',
          });
        }
      } catch (err) {
        console.warn('E2EE broadcast warning:', err);
      }
    }

    if (focusMode && targetChat && !targetChat.isSelfChat && !targetChat.isPlacementAlert) {
      setTimeout(async () => {
        const autoReplyText = await requestAI({
          mode: 'auto_reply',
          messages: [...targetChat.messages, newMsg],
          userStatus: studyStatus,
        });

        const replyMsg = {
          id: `m_reply_${Date.now()}`,
          isSender: false,
          text: `[Study Focus Auto-Reply] ${autoReplyText}`,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
          read: true,
        };

        setChats((current) =>
          current.map((c) => (c.id === targetChatId ? { ...c, messages: [...c.messages, replyMsg] } : c))
        );
      }, 1200);
    }
  };

  const handleSendMessage = async (payload) => {
    if (!activeChatId) return;
    await sendMessageToChat(activeChatId, payload);
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, unreadCount: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
          : c
      )
    );
  };

  // App Lock Passcode Screen (when manually locked via Settings)
  if (isAppLocked) {
    const savedPin = localStorage.getItem('nexo_app_lock_pin') || '1234';
    return <AppLockScreen correctPin={savedPin} onUnlock={() => setIsAppLocked(false)} />;
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-x-hidden overflow-y-hidden bg-[#f0f2f5] dark:bg-[#0c1317] text-[#111b21] dark:text-[#e9edef] font-sans pb-[env(safe-area-inset-bottom)]">
      {/* 1. Desktop Navigation Rail (>= 768px) */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <NavigationRail
          activeTab={activeNavTab}
          setActiveTab={(tab) => {
            setActiveNavTab(tab);
            setIsSettingsOpen(false);
          }}
          unreadTotal={totalUnreadCount}
          user={user}
          onOpenSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          isSettingsOpen={isSettingsOpen}
        />
      </div>

      {/* 2. Main Workspace Layout */}
      {isSettingsOpen ? (
        <div className="flex-1 h-full flex">
          <div className="w-full md:w-[380px] lg:w-[410px] h-full flex-shrink-0">
            <SettingsDrawer
              user={user}
              onUpdateUser={handleUpdateUser}
              onClose={() => setIsSettingsOpen(false)}
              onLogout={handleResetWorkspace}
              onOpenConnectedDevices={() => setIsConnectedDevicesOpen(true)}
              onTriggerAppLock={() => setIsAppLocked(true)}
              bubbleAccent={bubbleAccent}
              chatWallpaper={chatWallpaper}
              onChangeTheme={handleChangeTheme}
            />
          </div>
          <div className="hidden md:flex flex-1 h-full items-center justify-center bg-[#efeae2]/40 dark:bg-[#0b141a] p-8 text-center text-[#8696a0]">
            <p className="text-[14.5px]">
              Customize chat themes, wallpapers, connected devices, and your B.Tech CSE profile.
            </p>
          </div>
        </div>
      ) : activeNavTab === 'updates' ? (
        <StatusView
          user={user}
          chats={chats}
          onSendMessageToChat={sendMessageToChat}
          onSaveToVault={handleSaveSummaryToVault}
          onShowToast={showToast}
          initialSubTab={updatesSubTab}
          workspaceInitialTab={workspaceInitialTab}
        />
      ) : activeNavTab === 'communities' ? (
        <CommunitiesView
          onSelectCommunityGroup={(groupName) => {
            handleStartChatWith({
              name: groupName,
              handle: `@${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              bio: 'JECRC B.Tech CSE Collaboration Channel',
              isGroup: true,
            });
          }}
        />
      ) : activeNavTab === 'calls' ? (
        <CallsView
          user={user}
          onStartCall={(callData) => setActiveCall(callData)}
          onOpenMeetAndMoM={() => openHubTab('workspace', 'meet')}
        />
      ) : activeNavTab === 'workspace' ? (
        <WorkspaceHubView
          chats={chats}
          onSendMessageToChat={sendMessageToChat}
          onSaveToVault={handleSaveSummaryToVault}
          onShowToast={showToast}
          initialTab={workspaceInitialTab}
        />
      ) : activeNavTab === 'prep' ? (
        <EdTechPrepView
          chats={chats}
          onSendMessageToChat={sendMessageToChat}
          onSaveToVault={handleSaveSummaryToVault}
          onShowToast={showToast}
        />
      ) : activeNavTab === 'youtube' ? (
        <YouTubeHubView
          chats={chats}
          onSendMessageToChat={sendMessageToChat}
          onSaveToVault={handleSaveSummaryToVault}
          onShowToast={showToast}
        />
      ) : (
        <div className="flex-1 h-full flex overflow-hidden relative">
          {/* Chat List Pane */}
          <div className={`w-full md:w-[360px] lg:w-[390px] h-full flex-shrink-0 ${
            activeChatId ? 'hidden md:flex' : 'flex'
          }`}>
            <Sidebar
              user={user}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              folders={INITIAL_FOLDERS}
              activeFolder={activeFolder}
              setActiveFolder={setActiveFolder}
              chats={filteredChats}
              archivedChats={archivedChats}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              onNewChat={() => setIsNewChatOpen(true)}
              onArchiveChat={handleArchiveChat}
              onUnarchiveChat={handleUnarchiveChat}
              onPinChat={handlePinChat}
              onDeleteChat={handleDeleteChat}
              onShowContactDetails={(contact) => setSelectedContactForDetails(contact)}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
              studyStatus={studyStatus}
              setStudyStatus={setStudyStatus}
              scheduledCount={scheduledQueue.length}
              onOpenScheduledQueue={() => setIsScheduledQueueOpen(true)}
              onOpenConnectedDevices={() => setIsConnectedDevicesOpen(true)}
              onOpenStarredMessages={() => setIsStarredOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onNewCommunity={() => setActiveNavTab('communities')}
              onNewUpdates={() => setActiveNavTab('updates')}
              onOpenWorkspace={() => openHubTab('workspace')}
              onOpenPrep={() => openHubTab('prep')}
              onOpenYouTube={() => openHubTab('youtube')}
              onQuickCameraCapture={(dataUrl) => {
                const target = activeChatId || 'self_vault';
                sendMessageToChat(target, {
                  image: dataUrl,
                  text: '📷 Camera Capture',
                  mediaType: 'image',
                });
                setActiveChatId(target);
              }}
              onReadAll={handleReadAll}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
            />
          </div>

          {/* Mobile Floating Action Button */}
          {!activeChatId && (
            <button
              onClick={() => setIsNewChatOpen(true)}
              title="Message peer by @username"
              className="md:hidden fixed bottom-[76px] right-4 z-40 w-13 h-13 rounded-2xl bg-[#25d366] hover:bg-[#20ba5a] text-[#111b21] shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          {/* Active Chat Window */}
          <div className={`flex-1 h-full ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
            <ChatWindow
              chat={activeChat}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onOpenSummarize={() => setShowSummarizeModal(true)}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              focusMode={focusMode}
              onStartCall={(callData) => setActiveCall(callData)}
              onShowContactDetails={(contact) => setSelectedContactForDetails(contact)}
              onNewChat={() => setIsNewChatOpen(true)}
              onScheduleMessage={handleScheduleMessage}
              onBackToList={() => setActiveChatId(null)}
              onPromptDeleteMessage={(msg, cId) => setDeletePrompt({ msg, chatId: cId })}
              onToggleStarMessage={handleToggleStarMessage}
              chatWallpaper={chatWallpaper}
              myPublicJwk={myKeys?.publicJwk || null}
              onOpenMeetAndMoM={() => openHubTab('workspace', 'meet')}
            />
          </div>

          {/* Chat Info & Theme Drawer */}
          {selectedContactForDetails && (
            <ContactDetailsDrawer
              contact={selectedContactForDetails}
              onClose={() => setSelectedContactForDetails(null)}
              onClearChat={handleClearChat}
              onDeleteChat={handleDeleteChat}
              bubbleAccent={bubbleAccent}
              chatWallpaper={chatWallpaper}
              onChangeTheme={handleChangeTheme}
            />
          )}
        </div>
      )}

      {/* 3. Mobile Bottom Navigation Bar */}
      {!activeChatId && !isSettingsOpen && (
        <MobileNavBar
          activeTab={activeNavTab}
          setActiveTab={(tab) => {
            setActiveNavTab(tab);
            setIsSettingsOpen(false);
          }}
          unreadTotal={totalUnreadCount}
        />
      )}

      {/* 4. Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onStartChat={handleStartChatWith}
        currentUser={user}
      />

      <ScheduledQueueModal
        isOpen={isScheduledQueueOpen}
        onClose={() => setIsScheduledQueueOpen(false)}
        queue={scheduledQueue}
        onCancelScheduled={handleCancelScheduled}
        onSendNow={handleSendNowScheduled}
      />

      <StarredMessagesModal
        isOpen={isStarredOpen}
        onClose={() => setIsStarredOpen(false)}
        starredMessages={bookmarkedVault}
        onUnstarMessage={(cId, mId) => handleToggleStarMessage(cId, mId)}
        onUpdateBookmarkCategory={handleUpdateBookmarkCategory}
        onSelectChat={(cId) => {
          setActiveChatId(cId);
          setActiveNavTab('chats');
        }}
      />

      <ConnectedDevicesModal
        isOpen={isConnectedDevicesOpen}
        onClose={() => setIsConnectedDevicesOpen(false)}
        user={user}
      />

      <DeleteMessageModal
        isOpen={Boolean(deletePrompt)}
        message={deletePrompt?.msg}
        onClose={() => setDeletePrompt(null)}
        onDeleteForEveryone={handleDeleteForEveryone}
        onDeleteForMe={handleDeleteForMe}
      />

      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#111b21] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <AvatarIcon size="xl" name={incomingCall.caller?.name || 'Peer'} />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00a884] rounded-full ring-2 ring-white dark:ring-[#111b21] animate-ping" />
            </div>
            <h3 className="text-[19px] font-bold text-[#111b21] dark:text-white">
              {incomingCall.caller?.name || 'Nexo Peer'}
            </h3>
            <p className="text-[13px] text-[#0055ff] font-semibold mt-0.5">
              {incomingCall.caller?.username || '@peer'}
            </p>
            <p className="text-[13.5px] text-[#667781] dark:text-[#8696a0] mt-2 font-medium">
              Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call...
            </p>
            <div className="flex items-center gap-6 mt-6">
              <button
                onClick={handleDeclineIncomingCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={handleAcceptIncomingCall}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform"
              >
                {incomingCall.type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCall && (
        <CallModal
          call={activeCall}
          currentUser={user}
          onEndCall={() => setActiveCall(null)}
          onSaveCallRecording={handleSaveCallRecording}
        />
      )}

      {showSummarizeModal && activeChat && (
        <SummarizeModal
          chat={activeChat}
          onClose={() => setShowSummarizeModal(false)}
          onSaveToVault={handleSaveSummaryToVault}
        />
      )}

      {loggedOutFromPrimary && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-rose-600 text-white shadow-2xl flex items-center gap-3 animate-fadeIn">
          <div className="text-[13.5px]">
            <span className="font-bold block">Logged out from primary device</span>
            <span>This linked browser session was revoked from Connected Devices.</span>
          </div>
          <button onClick={() => setLoggedOutFromPrimary(false)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {appToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#111b21] dark:bg-white text-white dark:text-[#111b21] text-[13px] font-medium shadow-2xl animate-fadeIn flex items-center gap-2 border border-white/10 dark:border-black/10 pointer-events-none">
          <span>{appToast}</span>
        </div>
      )}
    </div>
  );
}
