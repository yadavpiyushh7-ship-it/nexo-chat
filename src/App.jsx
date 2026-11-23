import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
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
import SyncLoadingScreen from './components/SyncLoadingScreen';
import AppLockScreen from './components/AppLockScreen';
import AvatarIcon from './components/AvatarIcon';
import { Plus, CheckCircle2, X, Phone, PhoneOff, Video, Laptop } from 'lucide-react';
import { INITIAL_ARCHIVED, INITIAL_FOLDERS, createSelfChat, createDemoChats } from './mockData';
import { requestAI } from './lib/aiClient';
import { supabase } from './lib/supabase';

const isValidUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function App() {
  // 1. Authentication State (Never auto-login on startup!)
  const [user, setUser] = useState(null);
  const [isSyncingChats, setIsSyncingChats] = useState(false);

  // 2. Navigation Tabs: 'chats' | 'updates' | 'communities' | 'calls'
  const [activeNavTab, setActiveNavTab] = useState('chats');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedContactForDetails, setSelectedContactForDetails] = useState(null);

  // 3. Modals & Screens
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isScheduledQueueOpen, setIsScheduledQueueOpen] = useState(false);
  const [isStarredOpen, setIsStarredOpen] = useState(false);
  const [isConnectedDevicesOpen, setIsConnectedDevicesOpen] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState(null); // { msg, chatId }
  const [activeCall, setActiveCall] = useState(null); // { contact, type: 'voice' | 'video' }
  const [incomingCall, setIncomingCall] = useState(null); // { callId, caller, type, offer }
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);

  // 4. Chat State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('all');
  const [chats, setChats] = useState([]);
  const [archivedChats, setArchivedChats] = useState(INITIAL_ARCHIVED);
  const [activeChatId, setActiveChatId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [scheduledQueue, setScheduledQueue] = useState([]);
  const [appToast, setAppToast] = useState('');
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [pairSuccessBanner, setPairSuccessBanner] = useState(false);
  const [linkDevicePrompt, setLinkDevicePrompt] = useState(null); // token string

  // References for realtime callbacks
  const userRef = useRef(user);
  const activeChatIdRef = useRef(activeChatId);
  const chatsRef = useRef(chats);
  const realtimeChannelRef = useRef(null);
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

  // Detect mobile QR code pairing scan (?link_token=... or ?pair_session=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('link_token') || params.get('pair_session');

    if (token) {
      if (userRef.current) {
        setLinkDevicePrompt(token);
      } else {
        try {
          sessionStorage.setItem('nexo_pending_link_token', token);
        } catch {}
      }
    }
  }, []);

  // Confirm linking to desktop session when prompt is confirmed on mobile
  const handleConfirmLinkDevice = async (token) => {
    if (!token || !user) return;
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const devName = isMobile
      ? (/Android/i.test(ua) ? 'Android (Mobile Browser)' : 'iOS Safari (Mobile)')
      : 'Mobile Web Session';

    const devInfo = {
      ua,
      os: devName,
      linked_at: new Date().toISOString()
    };

    // 1. Update Supabase linked_devices table
    try {
      await supabase
        .from('linked_devices')
        .update({
          status: 'linked',
          user_id: user.id,
          phone: user.phone || '',
          username: user.username || '',
          display_name: user.name || user.full_name || '',
          device_info: devInfo
        })
        .eq('link_token', token);
    } catch (err) {
      console.warn('linked_devices update error:', err);
    }

    // 2. Broadcast to Realtime channels
    try {
      const qrChan = supabase.channel(`qr-login-${token}`);
      qrChan.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          qrChan.send({
            type: 'broadcast',
            event: 'device-linked',
            payload: { user, deviceInfo: devInfo }
          });
        }
      });
    } catch {}

    try {
      const legChan = supabase.channel(`device-link-${token}`);
      legChan.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          legChan.send({
            type: 'broadcast',
            event: 'device-linked',
            payload: { user, deviceInfo: devInfo }
          });
        }
      });
    } catch {}

    // 3. Local device entry
    const newDevice = {
      id: `dev_${Date.now()}`,
      os: 'Desktop Browser (Linked)',
      isCurrent: false,
      status: 'Active now',
      location: 'Linked via QR Scan',
      isMobile: false,
      lastActive: 'Just now'
    };

    try {
      const existing = JSON.parse(localStorage.getItem('nexo_linked_devices') || '[]');
      const updated = [newDevice, ...existing.filter((d) => d.id !== newDevice.id)];
      localStorage.setItem('nexo_linked_devices', JSON.stringify(updated));
      localStorage.setItem('nexo_pair_event', JSON.stringify({ type: 'PAIR_SUCCESS', sessionId: token, timestamp: Date.now() }));
    } catch {}

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('nexo_pair_channel');
        channel.postMessage({ type: 'PAIR_SUCCESS', sessionId: token });
        setTimeout(() => channel.close(), 1000);
      }
    } catch {}

    setLinkDevicePrompt(null);
    setPairSuccessBanner(true);
    window.history.replaceState({}, document.title, window.location.pathname);
    showToast('Device linked! You can now return to your computer.');
  };

  // Global Scheduled Messages Auto-Send Engine (Runs every 1000ms / 1 second)
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
            poll: item.poll || null,
            event: item.event || null,
            contactCard: item.contactCard || null,
            stickerUrl: item.stickerUrl || null,
            isSticker: Boolean(item.isSticker || item.stickerUrl),
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
            read: true,
            isStarred: false,
            isScheduledDelivery: true
          };

          setChats((currentChats) =>
            currentChats.map((c) => {
              if (c.id === targetId) {
                return {
                  ...c,
                  messages: [...c.messages, deliveredMsg]
                };
              }
              return c;
            })
          );

          showToast(`⏰ Scheduled message sent to ${item.recipientName || 'chat'}!`);
        });

        return prevQueue.filter((item) => (item.scheduledAt || 0) > now);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 5. Automatic System Theme Sync & Dynamic Adaptive Favicon
  useEffect(() => {
    document.title = 'Nexo';
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyThemeAndFavicon = (isDark) => {
      // Toggle HTML dark class
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Keep browser favicon pointing to /logo.png
      const faviconLink = document.querySelector("link[rel='icon']");
      if (faviconLink) {
        faviconLink.href = '/logo.png?v=2';
      }
    };

    applyThemeAndFavicon(mediaQuery.matches);
    const handler = (e) => applyThemeAndFavicon(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 5b. Fetch Conversation History from Supabase
  const loadSupabaseMessages = useCallback(async (currentUser) => {
    if (!currentUser?.id || !isValidUUID(currentUser.id)) return;
    try {
      const { data: dbMsgs, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });

      if (error || !dbMsgs || dbMsgs.length === 0) return;

      const otherUserIds = Array.from(
        new Set(
          dbMsgs
            .map((m) => (m.sender_id === currentUser.id ? m.receiver_id : m.sender_id))
            .filter((id) => id && id !== currentUser.id && isValidUUID(id))
        )
      );

      if (otherUserIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherUserIds);

      const profileMap = new Map();
      (profiles || []).forEach((p) => {
        profileMap.set(p.id, p);
      });

      setChats((prevChats) => {
        const selfChat = prevChats.find((c) => c.isSelfChat) || createSelfChat(currentUser);
        const existingMap = new Map();
        prevChats.filter((c) => !c.isSelfChat).forEach((c) => {
          const key = c.recipientId || c.id;
          existingMap.set(key, c);
        });

        otherUserIds.forEach((otherId) => {
          const contactProfile = profileMap.get(otherId);
          const contactMessages = dbMsgs
            .filter(
              (m) =>
                (m.sender_id === otherId && m.receiver_id === currentUser.id) ||
                (m.sender_id === currentUser.id && m.receiver_id === otherId)
            )
            .map((m) => {
              const isMe = m.sender_id === currentUser.id;
              return {
                id: m.id,
                isSender: isMe,
                text: m.deleted_for_everyone ? 'This message was deleted' : (m.content || ''),
                image: m.deleted_for_everyone ? null : (m.media_type === 'image' ? m.media_url : null),
                mediaUrl: m.deleted_for_everyone ? null : m.media_url,
                mediaType: m.media_type,
                deletedForEveryone: Boolean(m.deleted_for_everyone),
                isStarred: Boolean(m.is_starred),
                read: m.status === 'read',
                time: new Date(m.created_at || Date.now()).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }).toLowerCase()
              };
            });

          const unreadCount = contactMessages.filter((m) => !m.isSender && !m.read).length;
          const displayName = contactProfile?.full_name || 'Nexo Contact';
          const displayHandle = contactProfile?.username || `@user_${otherId.slice(0, 5)}`;
          const avatar =
            contactProfile?.avatar_url || null;
          const bio = contactProfile?.mood || 'Available ✨';

          const existing = existingMap.get(otherId);
          existingMap.set(otherId, {
            id: otherId,
            recipientId: otherId,
            name: displayName,
            handle: displayHandle,
            avatar,
            bio,
            folder: existing?.folder || 'all',
            online: true,
            typing: false,
            unreadCount,
            lastSeen: 'Active now',
            messages: contactMessages
          });
        });

        return [selfChat, ...Array.from(existingMap.values())];
      });
    } catch (err) {
      console.warn('Load messages error:', err);
    }
  }, []);

  // 5c. Handle Incoming Realtime Messages
  const handleIncomingMessageRecord = useCallback(async (record) => {
    if (!record || !record.id) return;
    const currentUserId = userRef.current?.id;
    if (!currentUserId) return;

    const isIncomingForMe = record.receiver_id === currentUserId;
    const isMySentEcho = record.sender_id === currentUserId;

    if (!isIncomingForMe && !isMySentEcho) return;

    const contactId = isIncomingForMe ? record.sender_id : record.receiver_id;
    const activeChat = activeChatIdRef.current;
    const isCurrentlyOpen = activeChat === contactId;

    const formattedMsg = {
      id: record.id,
      isSender: isMySentEcho,
      text: record.deleted_for_everyone ? 'This message was deleted' : (record.content || ''),
      image: record.deleted_for_everyone ? null : (record.media_type === 'image' ? record.media_url : null),
      mediaUrl: record.deleted_for_everyone ? null : record.media_url,
      mediaType: record.media_type,
      attachment: record.attachment || null,
      fileName: record.fileName || null,
      fileSize: record.fileSize || null,
      poll: record.poll || null,
      event: record.event || null,
      contactCard: record.contactCard || null,
      stickerUrl: record.stickerUrl || null,
      isSticker: Boolean(record.isSticker || record.stickerUrl),
      time: new Date(record.created_at || Date.now()).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase(),
      read: isIncomingForMe ? isCurrentlyOpen : (record.status === 'read'),
      isStarred: Boolean(record.is_starred),
      deletedForEveryone: Boolean(record.deleted_for_everyone),
    };

    if (isIncomingForMe && isCurrentlyOpen) {
      if (isValidUUID(record.id)) {
        supabase
          .from('messages')
          .update({ status: 'read' })
          .eq('id', record.id)
          .then(() => {});
      }

      realtimeChannelRef.current?.send({
        type: 'broadcast',
        event: 'message-read',
        payload: { reader_id: currentUserId, sender_id: contactId }
      });
    }

    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c.recipientId === contactId || c.id === contactId);

      if (chatIndex >= 0) {
        return prevChats.map((c, idx) => {
          if (idx === chatIndex) {
            const alreadyHas = c.messages.some((m) => m.id === formattedMsg.id);
            if (alreadyHas) {
              return {
                ...c,
                messages: c.messages.map((m) => (m.id === formattedMsg.id ? { ...m, ...formattedMsg } : m))
              };
            }
            return {
              ...c,
              unreadCount: (isIncomingForMe && !isCurrentlyOpen) ? (c.unreadCount || 0) + 1 : c.unreadCount,
              messages: [...c.messages, formattedMsg]
            };
          }
          return c;
        });
      } else {
        const newChatObj = {
          id: contactId,
          recipientId: contactId,
          name: record.sender_name || 'Nexo Contact',
          handle: record.sender_username || `@user_${contactId.slice(0, 5)}`,
          avatar: record.sender_avatar || null,
          bio: 'Active on Nexo ✨',
          folder: 'all',
          online: true,
          typing: false,
          unreadCount: isIncomingForMe && !isCurrentlyOpen ? 1 : 0,
          lastSeen: 'Active now',
          messages: [formattedMsg]
        };

        if (isValidUUID(contactId)) {
          supabase.from('profiles').select('*').eq('id', contactId).single().then(({ data: prof }) => {
            if (prof) {
              setChats((current) =>
                current.map((c) =>
                  c.recipientId === contactId || c.id === contactId
                    ? {
                        ...c,
                        name: prof.full_name || c.name,
                        handle: prof.username || c.handle,
                        avatar: prof.avatar_url || c.avatar,
                        bio: prof.mood || c.bio
                      }
                    : c
                )
              );
            }
          });
        }

        return [prevChats[0], newChatObj, ...prevChats.slice(1)];
      }
    });
  }, []);

  // 5d. Handle Realtime Message Status/Deletion Updates
  const handleUpdatedMessageRecord = useCallback((record) => {
    if (!record || !record.id) return;
    setChats((prevChats) =>
      prevChats.map((c) => {
        const hasMsg = c.messages.some((m) => m.id === record.id);
        if (!hasMsg) return c;

        return {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id !== record.id) return m;
            return {
              ...m,
              read: record.status === 'read' ? true : m.read,
              deletedForEveryone: Boolean(record.deleted_for_everyone),
              text: record.deleted_for_everyone ? 'This message was deleted' : (record.content || m.text),
              image: record.deleted_for_everyone ? null : m.image,
              mediaUrl: record.deleted_for_everyone ? null : m.mediaUrl,
            };
          })
        };
      })
    );
  }, []);

  // 5e. Realtime Channel Subscription (PostgreSQL Changes + Broadcast 2-Way Sync)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('realtime-messages');

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const { eventType, new: newRecord } = payload;
          if (eventType === 'INSERT') {
            handleIncomingMessageRecord(newRecord);
          } else if (eventType === 'UPDATE') {
            handleUpdatedMessageRecord(newRecord);
          }
        }
      )
      .on('broadcast', { event: 'new-message' }, ({ payload }) => {
        handleIncomingMessageRecord(payload);
      })
      .on('broadcast', { event: 'message-read' }, ({ payload }) => {
        const { reader_id, sender_id } = payload;
        if (sender_id === userRef.current?.id) {
          setChats((prevChats) =>
            prevChats.map((c) => {
              if (c.recipientId === reader_id || c.id === reader_id) {
                return {
                  ...c,
                  messages: c.messages.map((m) => (m.isSender ? { ...m, read: true } : m))
                };
              }
              return c;
            })
          );
        }
      })
      .on('broadcast', { event: 'delete-for-everyone' }, ({ payload }) => {
        const { messageId, chatId } = payload;
        setChats((prevChats) =>
          prevChats.map((c) => {
            if (!chatId || c.id === chatId || c.recipientId === chatId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        text: 'This message was deleted',
                        deletedForEveryone: true,
                        image: null,
                        mediaUrl: null
                      }
                    : m
                )
              };
            }
            return c;
          })
        );
      })
      .on('broadcast', { event: 'call-offer' }, ({ payload }) => {
        if (payload?.recipientId === userRef.current?.id && payload?.caller?.id !== userRef.current?.id) {
          setIncomingCall(payload);
        }
      })
      .on('broadcast', { event: 'call-ended' }, ({ payload }) => {
        if (payload?.callId === incomingCallRef.current?.callId) {
          setIncomingCall(null);
        }
      })
      .on('broadcast', { event: 'call-declined' }, ({ payload }) => {
        if (payload?.callId === incomingCallRef.current?.callId) {
          setIncomingCall(null);
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [user?.id, handleIncomingMessageRecord, handleUpdatedMessageRecord]);

  // When user logs in, initialize with Self-Chat and load Supabase message threads!
  const handleLogin = (userData) => {
    setUser(userData);
    setIsSyncingChats(true);
    if (userData.isDemo) {
      const demoChats = createDemoChats(userData);
      setChats(demoChats);
      setActiveChatId(demoChats[0].id);
    } else {
      const selfChat = createSelfChat(userData);
      setChats([selfChat]);
      setActiveChatId(selfChat.id);
      loadSupabaseMessages(userData);
    }

    // If a mobile user opened a QR link before logging in, trigger the link confirmation prompt
    try {
      const pendingToken = sessionStorage.getItem('nexo_pending_link_token');
      if (pendingToken) {
        sessionStorage.removeItem('nexo_pending_link_token');
        setLinkDevicePrompt(pendingToken);
      }
    } catch {}
  };

  // Selected chat
  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  // Aggregate all starred messages across chats
  const starredMessages = useMemo(() => {
    const list = [];
    chats.forEach((c) => {
      c.messages?.forEach((m) => {
        if (m.isStarred) {
          list.push({
            ...m,
            chatId: c.id,
            chatName: c.name,
            chatAvatar: c.avatar
          });
        }
      });
    });
    return list;
  }, [chats]);

  // Unread badge count
  const totalUnreadCount = useMemo(() => {
    return chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [chats]);

  // Filtered and pinned chats sorting
  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return chats
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(q) ||
          (c.handle && c.handle.toLowerCase().includes(q)) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q));

        if (!matchesSearch) return false;
        if (activeFolder === 'all') return c.status !== 'pending';
        if (activeFolder === 'unread') return c.unreadCount > 0 && c.status !== 'pending';
        if (activeFolder === 'requests') return c.status === 'pending';
        if (activeFolder === 'favourites') return Boolean(c.pinned) && c.status !== 'pending';
        if (activeFolder === 'groups') return Boolean(c.isGroup) && c.status !== 'pending';
        return c.folder === activeFolder;
      })
      .sort((a, b) => {
        if (a.isSelfChat) return -1;
        if (b.isSelfChat) return 1;
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      });
  }, [chats, searchQuery, activeFolder]);

  // Request actions: Accept and Decline
  const handleAcceptRequest = (chatId) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, status: 'accepted' } : c))
    );
    showToast('Chat request accepted!');
  };

  const handleDeclineRequest = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) setActiveChatId('self_vault');
    showToast('Chat request declined.');
  };

  // Incoming Call actions: Accept and Decline
  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      id: incomingCall.callId,
      caller: incomingCall.caller,
      recipient: user,
      type: incomingCall.type,
      isIncoming: true,
      offer: incomingCall.offer
    });
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    try {
      const callChannel = supabase.channel(`call-signaling-${incomingCall.callId}`);
      callChannel.send({
        type: 'broadcast',
        event: 'call-declined',
        payload: { callId: incomingCall.callId }
      });
    } catch {}
    setIncomingCall(null);
  };

  // Start new chat with contact or group
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
      bio: contactData.bio || 'Nexo contact',
      folder: 'all',
      status,
      isGroup: Boolean(contactData.isGroup),
      online: true,
      typing: false,
      unreadCount: 0,
      lastSeen: 'Active now',
      messages: contactData.initialMessage ? [
        {
          id: `m_${Date.now()}`,
          isSender: true,
          text: contactData.initialMessage,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
          read: false,
        }
      ] : []
    };

    setChats((prevChats) => [prevChats[0] || createSelfChat(user), newChatObj, ...prevChats.slice(1)]);
    setActiveChatId(newChatObj.id);
    setActiveNavTab('chats');
    setIsSettingsOpen(false);
  };

  // Chat Actions
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
      showToast('📌 Self-Chat cannot be deleted. You can clear messages instead.');
      return;
    }
    setChats(chats.filter((c) => c.id !== id));
    setArchivedChats(archivedChats.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId('self_vault');
    if (selectedContactForDetails?.id === id) setSelectedContactForDetails(null);
  };

  const handleClearChat = (id) => {
    setChats(chats.map((c) => (c.id === id ? { ...c, messages: [] } : c)));
  };

  // Mark all as read
  const handleReadAll = () => {
    setChats(
      chats.map((c) => ({
        ...c,
        unreadCount: 0,
        messages: c.messages.map((m) => ({ ...m, read: true }))
      }))
    );
  };

  // Star / Unstar Message
  const handleToggleStarMessage = (chatId, messageId) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
            )
          };
        }
        return c;
      })
    );
  };

  // Message Deletion: Delete for Everyone / Delete for Me
  const handleDeleteForEveryone = async (messageId) => {
    if (!deletePrompt) return;
    const { chatId } = deletePrompt;

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    text: 'This message was deleted',
                    deletedForEveryone: true,
                    image: null,
                    mediaUrl: null
                  }
                : m
            )
          };
        }
        return c;
      })
    );

    // Sync deletion to Supabase
    if (isValidUUID(messageId)) {
      try {
        await supabase
          .from('messages')
          .update({
            deleted_for_everyone: true,
            content: 'This message was deleted',
            media_url: null
          })
          .eq('id', messageId);
      } catch (delErr) {
        console.warn('Delete for everyone Supabase error:', delErr);
      }
    }

    // Broadcast across realtime channel
    realtimeChannelRef.current?.send({
      type: 'broadcast',
      event: 'delete-for-everyone',
      payload: {
        messageId,
        chatId
      }
    });
  };

  const handleDeleteForMe = (messageId) => {
    if (!deletePrompt) return;
    const { chatId } = deletePrompt;

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: c.messages.filter((m) => m.id !== messageId)
          };
        }
        return c;
      })
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
      poll: scheduleData.poll || null,
      event: scheduleData.event || null,
      contactCard: scheduleData.contactCard || null,
      stickerUrl: scheduleData.stickerUrl || null,
      isSticker: Boolean(scheduleData.isSticker || scheduleData.stickerUrl),
      scheduledFor: scheduleData.scheduledFor,
      scheduledAt: scheduleData.scheduledAt || Date.now() + 60000,
      recipientName: scheduleData.recipientName || activeChat?.name || 'Self-Chat',
      targetChatId: activeChatId || 'self_vault'
    };
    setScheduledQueue((prev) => [queueItem, ...prev]);
    showToast(`⏰ Message scheduled for ${scheduleData.scheduledFor}! Saved to Scheduled Queue.`);
  };

  const handleCancelScheduled = (id) => {
    setScheduledQueue(scheduledQueue.filter((item) => item.id !== id));
  };

  const handleSendNowScheduled = (item) => {
    handleSendMessage(item);
    handleCancelScheduled(item.id);
  };

  // Update Profile (Name, @username, Photo, Mood)
  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('nexo_user', JSON.stringify(updatedUser));
    } catch {}

    // Synchronize pinned Self-Chat with new name, handle, and avatar
    setChats((prevChats) =>
      prevChats.map((c) => {
        if (c.isSelfChat) {
          return {
            ...c,
            name: `${updatedUser.name} (You)`,
            handle: `${updatedUser.username} (You)`,
            avatar: updatedUser.avatar,
          };
        }
        return c;
      })
    );
  };

  // Send Message
  const handleSendMessage = async (payload) => {
    if (!activeChatId) return;

    const isString = typeof payload === 'string';
    const text = isString ? payload : (payload.text || '');
    const image = !isString ? (payload.image || payload.mediaUrl || null) : null;
    const quote = !isString ? (payload.quote || null) : null;
    const attachment = !isString ? (payload.attachment || null) : null;
    const mediaType = !isString ? (payload.mediaType || (image ? 'image' : null)) : null;
    const fileName = !isString ? (payload.fileName || null) : null;
    const fileSize = !isString ? (payload.fileSize || null) : null;
    const poll = !isString ? (payload.poll || null) : null;
    const event = !isString ? (payload.event || null) : null;
    const contactCard = !isString ? (payload.contactCard || null) : null;
    const stickerUrl = !isString ? (payload.stickerUrl || null) : null;
    const isSticker = !isString ? Boolean(payload.isSticker || stickerUrl) : false;

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
      poll,
      event,
      contactCard,
      stickerUrl,
      isSticker,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
      read: false,
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    // If chatting with a contact, sync to Supabase and broadcast
    const targetChat = chats.find((c) => c.id === activeChatId);
    const targetRecipientId =
      targetChat?.recipientId ||
      (!targetChat?.isSelfChat && targetChat?.id !== 'self_vault' && isValidUUID(targetChat?.id)
        ? targetChat.id
        : null);

    if (user?.id && targetRecipientId && !targetChat?.isSelfChat) {
      try {
        const { data: insertedRecord } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: targetRecipientId,
            content: text || (fileName ? `Sent a file: ${fileName}` : ''),
            media_url: image || attachment || stickerUrl || null,
            media_type: mediaType || (image ? 'image' : (attachment ? 'document' : null)),
            status: 'sent',
            deleted_for_everyone: false
          })
          .select()
          .single();

        if (insertedRecord) {
          // Replace local temp ID with Supabase UUID
          setChats((current) =>
            current.map((c) => {
              if (c.id === activeChatId) {
                return {
                  ...c,
                  messages: c.messages.map((m) => (m.id === newMsg.id ? { ...m, id: insertedRecord.id } : m))
                };
              }
              return c;
            })
          );

          // Broadcast to receiver
          realtimeChannelRef.current?.send({
            type: 'broadcast',
            event: 'new-message',
            payload: {
              id: insertedRecord.id,
              sender_id: user.id,
              receiver_id: targetRecipientId,
              content: text || '',
              media_url: image || attachment || stickerUrl || null,
              media_type: mediaType || (image ? 'image' : null),
              attachment,
              fileName,
              fileSize,
              poll,
              event,
              contactCard,
              stickerUrl,
              isSticker,
              status: 'sent',
              deleted_for_everyone: false,
              created_at: insertedRecord.created_at,
              sender_name: user.name,
              sender_username: user.username,
              sender_avatar: user.avatar
            }
          });
        }
      } catch (msgErr) {
        console.warn('Failed to insert Supabase message:', msgErr);
      }
    }

    // If Focus Mode is enabled and chatting with someone else, simulate auto-reply
    if (focusMode && activeChat && !activeChat.isSelfChat) {
      setTimeout(async () => {
        const autoReplyText = await requestAI({
          mode: 'auto_reply',
          messages: [...activeChat.messages, newMsg],
          userStatus: 'Focus Mode Active',
        });

        const replyMsg = {
          id: `m_reply_${Date.now()}`,
          isSender: false,
          text: `[Focus Mode Auto-Reply] ${autoReplyText}`,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
          read: true,
        };

        setChats((current) =>
          current.map((c) => (c.id === activeChatId ? { ...c, messages: [...c.messages, replyMsg] } : c))
        );
      }, 1500);
    }
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            unreadCount: 0,
            messages: c.messages.map((m) => ({ ...m, read: true })),
          };
        }
        return c;
      })
    );

    const targetChat = chats.find((c) => c.id === id);
    const targetRecipientId =
      targetChat?.recipientId ||
      (!targetChat?.isSelfChat && targetChat?.id !== 'self_vault' && isValidUUID(targetChat?.id)
        ? targetChat.id
        : null);

    if (user?.id && targetRecipientId && isValidUUID(user.id) && isValidUUID(targetRecipientId)) {
      supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('receiver_id', user.id)
        .eq('sender_id', targetRecipientId)
        .eq('status', 'sent')
        .then(() => {});

      realtimeChannelRef.current?.send({
        type: 'broadcast',
        event: 'message-read',
        payload: {
          reader_id: user.id,
          sender_id: targetRecipientId
        }
      });
    }
  };

  // Not logged in -> Render Wide 2-Card WhatsApp Web-Style Login Screen
  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Post-Login 1.5-second WhatsApp-Style "Loading your chats" sync animation
  if (isSyncingChats) {
    return (
      <SyncLoadingScreen
        onFinished={() => setIsSyncingChats(false)}
        onLogout={() => {
          setUser(null);
          setIsSyncingChats(false);
          setChats([]);
          setActiveChatId(null);
        }}
      />
    );
  }

  // App Lock Passcode Screen (when locked)
  if (user && isAppLocked) {
    const savedPin = localStorage.getItem('nexo_app_lock_pin') || '1234';
    return (
      <AppLockScreen
        correctPin={savedPin}
        onUnlock={() => setIsAppLocked(false)}
      />
    );
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-x-hidden overflow-y-hidden bg-[#f0f2f5] dark:bg-[#0c1317] text-[#111b21] dark:text-[#e9edef] font-sans pb-[env(safe-area-inset-bottom)]">
      {/* 1. Laptop / Desktop Far-Left Navigation Rail (>= 768px) */}
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
              onLogout={() => {
                if (realtimeChannelRef.current) {
                  supabase.removeChannel(realtimeChannelRef.current);
                  realtimeChannelRef.current = null;
                }
                setUser(null);
                setIsSettingsOpen(false);
                setChats([]);
                setActiveChatId(null);
              }}
              onOpenConnectedDevices={() => setIsConnectedDevicesOpen(true)}
              onTriggerAppLock={() => setIsAppLocked(true)}
            />
          </div>
          <div className="hidden md:flex flex-1 h-full items-center justify-center bg-[#efeae2]/40 dark:bg-[#0b141a] p-8 text-center text-[#8696a0]">
            <p className="text-[14.5px]">Manage your Nexo bio, connected devices, and account settings.</p>
          </div>
        </div>
      ) : activeNavTab === 'updates' ? (
        <StatusView user={user} />
      ) : activeNavTab === 'communities' ? (
        <CommunitiesView
          onSelectCommunityGroup={(groupName) => {
            handleStartChatWith({
              name: groupName,
              handle: `@${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              bio: 'Community discussion channel',
              isGroup: true
            });
          }}
        />
      ) : activeNavTab === 'calls' ? (
        <CallsView
          user={user}
          onStartCall={(callData) => setActiveCall(callData)}
        />
      ) : (
        /* CHATS INBOX VIEW (Laptop split-pane & Mobile single-pane) */
        <div className="flex-1 h-full flex overflow-hidden relative">
          {/* Middle Pane: Chat List (Visible on Laptop, or on Mobile when NO chat is open) */}
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
              scheduledCount={scheduledQueue.length}
              onOpenScheduledQueue={() => setIsScheduledQueueOpen(true)}
              onOpenConnectedDevices={() => setIsConnectedDevicesOpen(true)}
              onOpenStarredMessages={() => setIsStarredOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onNewCommunity={() => setActiveNavTab('communities')}
              onReadAll={handleReadAll}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
            />
          </div>

          {/* Floating Action Button (Bright WhatsApp-green rounded square +) on Mobile at bottom: 76px; right: 16px */}
          {!activeChatId && (
            <button
              onClick={() => setIsNewChatOpen(true)}
              title="New chat by @username or phone"
              className="md:hidden fixed bottom-[76px] right-4 z-40 w-13 h-13 rounded-2xl bg-[#25d366] hover:bg-[#20ba5a] text-[#111b21] shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          {/* Right Pane: Active Chat Window (Visible on Laptop, or on Mobile when chat is selected) */}
          <div className={`flex-1 h-full ${
            !activeChatId ? 'hidden md:flex' : 'flex'
          }`}>
            <ChatWindow
              chat={activeChat}
              onSendMessage={handleSendMessage}
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
            />
          </div>

          {/* Contact Details Drawer */}
          {selectedContactForDetails && (
            <ContactDetailsDrawer
              contact={selectedContactForDetails}
              onClose={() => setSelectedContactForDetails(null)}
              onClearChat={handleClearChat}
              onDeleteChat={handleDeleteChat}
            />
          )}
        </div>
      )}

      {/* 3. Mobile Bottom Navigation Bar (< 768px, visible when not inside active chat) */}
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
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onStartChat={handleStartChatWith}
        currentUser={user}
      />

      {/* Scheduled Messages Queue Modal */}
      <ScheduledQueueModal
        isOpen={isScheduledQueueOpen}
        onClose={() => setIsScheduledQueueOpen(false)}
        queue={scheduledQueue}
        onCancelScheduled={handleCancelScheduled}
        onSendNow={handleSendNowScheduled}
      />

      {/* Starred Messages Modal */}
      <StarredMessagesModal
        isOpen={isStarredOpen}
        onClose={() => setIsStarredOpen(false)}
        starredMessages={starredMessages}
        onUnstarMessage={(cId, mId) => handleToggleStarMessage(cId, mId)}
        onSelectChat={(cId) => {
          setActiveChatId(cId);
          setActiveNavTab('chats');
        }}
      />

      {/* Connected Devices Modal */}
      <ConnectedDevicesModal
        isOpen={isConnectedDevicesOpen}
        onClose={() => setIsConnectedDevicesOpen(false)}
        user={user}
      />

      {/* Message Deletion Modal */}
      <DeleteMessageModal
        isOpen={Boolean(deletePrompt)}
        message={deletePrompt?.msg}
        onClose={() => setDeletePrompt(null)}
        onDeleteForEveryone={handleDeleteForEveryone}
        onDeleteForMe={handleDeleteForMe}
      />

      {/* Incoming Call Notification Popover */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#111b21] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <AvatarIcon
                size="xl"
                name={incomingCall.caller?.name || 'Nexo Contact'}
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00a884] rounded-full ring-2 ring-white dark:ring-[#111b21] animate-ping" />
            </div>

            <h3 className="text-[19px] font-bold text-[#111b21] dark:text-white">
              {incomingCall.caller?.name || 'Nexo User'}
            </h3>
            <p className="text-[13px] text-[#00a884] font-semibold mt-0.5">
              {incomingCall.caller?.username || '@contact'}
            </p>
            <p className="text-[13.5px] text-[#667781] dark:text-[#8696a0] mt-2 font-medium">
              Incoming Nexo {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call...
            </p>

            <div className="flex items-center gap-6 mt-6">
              <button
                onClick={handleDeclineIncomingCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform"
                title="Decline"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={handleAcceptIncomingCall}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform"
                title="Accept"
              >
                {incomingCall.type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Call Overlay Modal */}
      {activeCall && (
        <CallModal
          call={activeCall}
          currentUser={user}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* Summarize Unread AI Modal */}
      {showSummarizeModal && activeChat && (
        <SummarizeModal
          chat={activeChat}
          onClose={() => setShowSummarizeModal(false)}
        />
      )}

      {/* Mobile QR Confirmation Prompt Modal */}
      {linkDevicePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#111b21] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#00a884]/15 text-[#00a884] flex items-center justify-center mb-3">
              <Laptop className="w-7 h-7" />
            </div>
            <h3 className="text-[18px] font-bold text-[#111b21] dark:text-white">
              Link a Device
            </h3>
            <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-1.5 leading-relaxed">
              A desktop browser is requesting to link to your Nexo account (<span className="text-[#00a884] font-semibold">{user?.username || user?.name}</span>).
            </p>

            <div className="flex items-center gap-3 w-full mt-6">
              <button
                onClick={() => {
                  setLinkDevicePrompt(null);
                  window.history.replaceState({}, document.title, window.location.pathname);
                  showToast('Device linking cancelled.');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-[13.5px] font-semibold text-[#54656f] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmLinkDevice(linkDevicePrompt)}
                className="flex-1 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-[13.5px] font-bold shadow-md shadow-[#00a884]/20 cursor-pointer active:scale-95 transition-transform"
              >
                Confirm Linking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Linked Confirmation Banner */}
      {pairSuccessBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="text-[13.5px]">
            <span className="font-bold block">Device linked!</span>
            <span>You can now return to your computer.</span>
          </div>
          <button
            onClick={() => setPairSuccessBanner(false)}
            className="p-1 hover:bg-white/20 rounded-lg cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating App Notification Toast */}
      {appToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#111b21] dark:bg-white text-white dark:text-[#111b21] text-[13.5px] font-medium shadow-2xl animate-fadeIn flex items-center gap-2 border border-white/10 dark:border-black/10 pointer-events-none">
          <span>{appToast}</span>
        </div>
      )}
    </div>
  );
}
