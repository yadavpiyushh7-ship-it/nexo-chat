import React, { useRef, useEffect, useState } from 'react';
import { 
  Sparkles, 
  Phone, 
  Video, 
  Search, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  CornerUpLeft, 
  ChevronDown, 
  Info, 
  SquarePen, 
  MessageSquareDashed, 
  Star, 
  Trash2, 
  Ban, 
  ArrowLeft,
  FileText,
  Download,
  Play,
  BarChart2,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Pencil,
  History,
  X,
  Wand2,
  ShieldAlert,
  Lock,
  Youtube as YoutubeIcon,
  Languages,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import Composer from './Composer';
import AvatarIcon from './AvatarIcon';
import CodeBlock, { parseMessageSegments, renderFormattedInlineText } from './CodeBlock';
import AiToneModal from './AiToneModal';
import SecurityVerifyModal from './SecurityVerifyModal';
import { getWallpaperClass } from '../lib/themeUtils';
import { useLanguage } from '../contexts/LanguageContext';

function AudioPlayerBubble({ src, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * totalDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const fmt = (s) => {
    if (!s || isNaN(s) || s === Infinity) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="mb-2 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 flex items-center gap-3 min-w-[210px] max-w-sm">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-xs flex-shrink-0 cursor-pointer transition-transform active:scale-95"
      >
        {isPlaying ? (
          <span className="text-[12px] font-bold">❚❚</span>
        ) : (
          <Play className="w-4 h-4 ml-0.5 fill-current" />
        )}
      </button>

      <div className="flex-1 space-y-1.5 min-w-0">
        <div
          onClick={handleSeek}
          className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
        >
          <div
            className="h-full bg-[#00a884] rounded-full transition-all"
            style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10.5px] text-[#667781] dark:text-[#8696a0] font-numeric">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}

function getExtBadgeColor(ext) {
  const e = (ext || '').toUpperCase();
  if (e === 'CPP' || e === 'C' || e === 'H') return 'bg-sky-600';
  if (e === 'PY') return 'bg-amber-500';
  if (e === 'JS' || e === 'TS') return 'bg-yellow-500';
  if (e === 'SQL') return 'bg-indigo-600';
  if (e === 'PDF') return 'bg-rose-600';
  if (e === 'ZIP' || e === 'RAR') return 'bg-emerald-600';
  return 'bg-[#7f66ff]';
}

export default function ChatWindow({
  chat,
  onSendMessage,
  onEditMessage,
  onOpenSummarize,
  replyingTo,
  setReplyingTo,
  focusMode,
  onStartCall,
  onShowContactDetails,
  onNewChat,
  onScheduleMessage,
  onBackToList,
  onPromptDeleteMessage,
  onToggleStarMessage,
  chatWallpaper = 'default',
  myPublicJwk = null,
  onOpenMeetAndMoM
}) {
  const {
    t,
    language,
    currentLanguageObj,
    localizeChat,
    localizeMessageText,
    translateMessageText
  } = useLanguage();
  const [callDropdownOpen, setCallDropdownOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [pollVotes, setPollVotes] = useState({});
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [playingChatVideo, setPlayingChatVideo] = useState(null);
  const [translatedMap, setTranslatedMap] = useState({});
  const [translatingMsgId, setTranslatingMsgId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isLightboxDragging, setIsLightboxDragging] = useState(false);
  const lightboxDragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    setTranslatedMap({});
  }, [language]);

  const handleToggleTranslate = async (msg) => {
    const rawText = localizeMessageText(msg);
    if (!rawText) return;

    const existing = translatedMap[msg.id];
    if (existing && existing.lang === language) {
      setTranslatedMap((prev) => ({
        ...prev,
        [msg.id]: { ...existing, showTranslated: !existing.showTranslated },
      }));
      return;
    }

    setTranslatingMsgId(msg.id);
    try {
      const translated = await translateMessageText(rawText);
      setTranslatedMap((prev) => ({
        ...prev,
        [msg.id]: { lang: language, translatedText: translated, showTranslated: true },
      }));
    } finally {
      setTranslatingMsgId(null);
    }
  };

  // Edit Sent Message Anytime + Edit History Modal
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [historyModalMsg, setHistoryModalMsg] = useState(null);

  // AI Placement Assistant triggered from a specific message/code block
  const [aiMessageContext, setAiMessageContext] = useState(null); // { text, mode }

  // Star Category Picker Popover
  const [tagPickerMsgId, setTagPickerMsgId] = useState(null);

  const callMenuRef = useRef(null);
  const headerMenuRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleVotePoll = (msgId, optId, allowMultiple) => {
    setPollVotes((prev) => {
      const current = prev[msgId] || [];
      if (allowMultiple) {
        const next = current.includes(optId) ? current.filter((id) => id !== optId) : [...current, optId];
        return { ...prev, [msgId]: next };
      } else {
        return { ...prev, [msgId]: [optId] };
      }
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages?.length]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (callMenuRef.current && !callMenuRef.current.contains(e.target)) {
        setCallDropdownOpen(false);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSaveEdit = (msg) => {
    const trimmed = editDraft.trim();
    if (!trimmed || trimmed === msg.text) {
      setEditingMsgId(null);
      setEditDraft('');
      return;
    }
    onEditMessage?.(chat.id, msg.id, trimmed);
    setEditingMsgId(null);
    setEditDraft('');
  };

  const wallpaperBgClass = getWallpaperClass(chatWallpaper);
  const displayChat = localizeChat(chat);

  if (!displayChat) {
    return (
      <div className="hidden md:flex flex-1 h-full flex-col items-center justify-center p-8 bg-white dark:bg-[#0b141a] text-center select-none font-sans">
        <div className="w-16 h-16 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] text-[#00a884] flex items-center justify-center mb-4 border border-[#e9edef] dark:border-[#222e35]">
          <MessageSquareDashed className="w-8 h-8" />
        </div>
        <h2 className="text-[20px] font-semibold text-[#111b21] dark:text-[#e9edef]">
          Nexo Workspace & Messaging
        </h2>
        <p className="text-[13.5px] text-[#667781] dark:text-[#8696a0] max-w-sm mt-1.5 leading-relaxed">
          Select a conversation to send end-to-end encrypted messages, code blocks, HD photos, and voice notes.
        </p>
        <button
          onClick={onNewChat}
          className="mt-5 px-5 py-2.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-[13.5px] font-medium flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <SquarePen className="w-4 h-4" />
          <span>Message peer by @username</span>
        </button>
      </div>
    );
  }

  return (
    <main className={`flex-1 w-full max-w-full h-full flex flex-col relative transition-colors overflow-hidden overflow-x-hidden ${wallpaperBgClass}`}>
      {/* 1. Header */}
      <header className="h-[60px] px-3 sm:px-4 bg-white dark:bg-[#111b21] border-b border-[#e9edef] dark:border-[#222e35] flex items-center justify-between z-10 flex-shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer"
              title="Back to Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => onShowContactDetails(chat)}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="relative flex-shrink-0">
              <AvatarIcon
                size="md"
                isGroup={chat.isGroup}
                name={chat.name}
                showOnline={chat.online}
                online={chat.online}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[15.5px] sm:text-[16px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate leading-tight group-hover:text-[#0055ff] transition-colors">
                  {displayChat.name}
                </h2>
                {displayChat.isSelfChat && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#0055ff]/15 text-[#0055ff] dark:text-sky-400">
                    YOU
                  </span>
                )}
                {displayChat.isPlacementAlert && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <ShieldAlert className="w-3 h-3" />
                    PRIORITY
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] truncate">
                <span className="text-[#0055ff] dark:text-sky-400 font-medium">
                  {displayChat.handle || '@contact'}
                </span>
                <span className="text-[#667781] dark:text-[#8696a0]">•</span>
                <span className="text-[#667781] dark:text-[#8696a0] truncate">
                  {displayChat.isSelfChat
                    ? t('notesAndStudyVault')
                    : focusMode && !displayChat.isPlacementAlert
                    ? t('mutedInStudyMode')
                    : displayChat.online
                    ? (displayChat.id === 'chat_placement_bot' ? t('alwaysOnline') : t('activeNow'))
                    : displayChat.lastSeen || t('offline')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Header Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Summarize Lecture / Thread AI Button */}
          <button
            onClick={onOpenSummarize}
            className="px-2.5 sm:px-3 py-1.5 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#e9edef] dark:hover:bg-[#2a3942] border border-[#e9edef] dark:border-[#222e35] text-[#00a884] text-[11.5px] sm:text-[12px] font-medium flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Summarize Lecture / Thread with Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {chat.isSelfChat ? 'Summarize Notes' : t('summarizeThread')}
            </span>
          </button>

          {/* Unified Video, Google Meet & Voice Call Toggle */}
          {!chat.isSelfChat && (
            <div className="relative" ref={callMenuRef}>
              <button
                type="button"
                onClick={() => setCallDropdownOpen(!callDropdownOpen)}
                className="px-2 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] hover:text-[#0055ff] flex items-center gap-0.5 transition-colors cursor-pointer"
                title="Voice Call, Video Call or Google Meet"
              >
                <Video className="w-5 h-5" />
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {callDropdownOpen && (
                <div className="absolute right-0 top-11 z-50 w-64 bg-white dark:bg-[#202c33] rounded-2xl shadow-dropdown border border-[#d1d7db]/80 dark:border-white/10 py-1.5 text-[13.5px] animate-fadeIn">
                  <button
                    onClick={() => {
                      onStartCall({ contact: chat, type: 'voice' });
                      setCallDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#0055ff]/15 text-[#0055ff]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block">Voice Call</span>
                      <span className="text-[11px] text-[#8696a0]">HD encrypted audio</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onStartCall({ contact: chat, type: 'video' });
                      setCallDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#7b2cbf]/15 text-[#7b2cbf]">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block">Nexo Direct Video Call</span>
                      <span className="text-[11px] text-[#8696a0]">Mock interview stream</span>
                    </div>
                  </button>

                  <div className="border-t border-[#d1d7db]/40 dark:border-white/10 my-1" />

                  <button
                    onClick={() => {
                      window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
                      onSendMessage?.('📹 **Google Meet Started!**\n🔗 Join Instant Meet: https://meet.google.com/new\n📝 Open Workspace → Meet & MoM to auto-generate Minutes of Meeting.');
                      onOpenMeetAndMoM?.();
                      setCallDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block">Start Google Meet + Auto MoM</span>
                      <span className="text-[11px] text-[#00a884]">Launch Meet & generate MoM</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* More Menu */}
          <div className="relative" ref={headerMenuRef}>
            <button
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              title="More options"
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-[#54656f] dark:text-[#aebac1] transition-colors cursor-pointer"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {headerMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-52 bg-white dark:bg-[#202c33] rounded-2xl shadow-dropdown border border-[#d1d7db]/80 dark:border-white/10 py-1.5 text-[13.5px] animate-fadeIn">
                <button
                  onClick={() => {
                    onShowContactDetails(chat);
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-2.5 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Info className="w-4 h-4 text-[#0055ff]" />
                  <span>Chat Info & Theme</span>
                </button>
                <button
                  onClick={() => {
                    setAiMessageContext({
                      text: chat.messages.slice(-1)[0]?.text || '',
                      mode: 'interview_answer',
                    });
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-2.5 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Wand2 className="w-4 h-4 text-[#7b2cbf]" />
                  <span>AI Placement Assistant</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Message History Area */}
      <div className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden px-3 sm:px-6 md:px-8 py-4 space-y-2 pb-20 md:pb-4">
        <div className="flex justify-center my-2">
          <button
            type="button"
            onClick={() => setShowSecurityModal(true)}
            className="max-w-md px-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#182229] border border-[#e9edef] dark:border-[#222e35] text-[11.5px] text-[#54656f] dark:text-[#8696a0] font-medium flex items-center gap-2 hover:opacity-90 cursor-pointer text-center"
          >
            <Lock className="w-3.5 h-3.5 flex-shrink-0 text-[#00a884]" />
            <span>{t('e2eeBanner')}</span>
          </button>
        </div>

        <div className="flex justify-center my-3 select-none">
          <span className="px-3 py-1 rounded-lg bg-[#f0f2f5] dark:bg-[#182229] border border-[#e9edef] dark:border-[#222e35] text-[12px] font-medium text-[#54656f] dark:text-[#8696a0]">
            {t('today')}
          </span>
        </div>

        {chat.messages.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] text-[13.5px]">
            {chat.isSelfChat
              ? 'Message yourself — save notes, links, or code snippets.'
              : `No messages yet. Say hello to ${displayChat.name}! 👋`}
          </div>
        ) : (
          chat.messages.map((msg) => {
            if (msg.isCallLog) {
              return (
                <div key={msg.id} className="flex justify-center my-2.5 select-none">
                  <div className="px-4 py-2 rounded-2xl bg-white/95 dark:bg-[#182229] border border-slate-200 dark:border-[#222e35] shadow-sm flex items-center gap-3 text-[12.5px] text-[#54656f] dark:text-[#e9edef]">
                    <div className="w-8 h-8 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center flex-shrink-0">
                      {msg.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>{msg.callType === 'video' ? 'Video call' : 'Voice call'}</span>
                        <span className="text-[#8696a0]">•</span>
                        <span className="font-numeric text-[#00a884]">{msg.callDurationText || '00:00'}</span>
                      </div>
                      <div className="text-[11px] text-[#8696a0] font-numeric">{msg.time}</div>
                    </div>
                    {!chat.isSelfChat && (
                      <button
                        type="button"
                        onClick={() => onStartCall?.({ contact: chat, type: msg.callType || 'voice' })}
                        className="ml-1 px-2.5 py-1 rounded-full bg-[#00a884]/15 hover:bg-[#00a884] text-[#00a884] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Call again
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            const isMe = msg.isSender;
            const isDeletedForEveryone = msg.deletedForEveryone;
            const isEditing = editingMsgId === msg.id;
            const localizedRawText = localizeMessageText(msg) || msg.content || '';
            const transState = translatedMap[msg.id];
            const activeDisplayText = transState?.showTranslated ? transState.translatedText : localizedRawText;
            const segments = parseMessageSegments(activeDisplayText || '');
            const fileExt = msg.fileExt || (msg.fileName && msg.fileName.includes('.') ? msg.fileName.split('.').pop().toUpperCase() : null);

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} my-1 relative`}
              >
                {/* Optional Quote Card */}
                {msg.quote && !isDeletedForEveryone && (
                  <div className="text-[12px] px-2.5 py-1 mb-0.5 rounded-t-xl border-l-4 border-[#0055ff] bg-black/5 dark:bg-white/5 max-w-[78%] md:max-w-[62%] truncate text-[#54656f] dark:text-[#8696a0]">
                    <span className="font-semibold text-[#0055ff] mr-1.5">
                      {msg.quote.sender}:
                    </span>
                    {msg.quote.text}
                  </div>
                )}

                {/* Compact Message Bubble (fit-content, max-w 62% desktop / 78% mobile, 8px 12px padding) */}
                <div
                  className={`relative w-fit max-w-[78%] md:max-w-[62%] min-w-0 break-words px-[12px] py-[8px] shadow-bubble transition-all ${
                    isDeletedForEveryone
                      ? 'bg-slate-100 dark:bg-[#182229] text-[#8696a0] rounded-2xl border border-dashed border-slate-300 dark:border-white/10'
                      : isMe
                      ? 'rounded-2xl rounded-tr-none'
                      : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tl-none border border-[#e9edef] dark:border-[#222e35]'
                  }`}
                  style={isMe && !isDeletedForEveryone ? {
                    background: 'var(--outgoing-bubble-bg, #005c4b)',
                    color: 'var(--outgoing-bubble-text, #e9edef)'
                  } : undefined}
                >
                  {/* Sender Name Badge inside Incoming / Group Bubbles */}
                  {!isMe && (chat.isGroup || msg.senderName) && !isDeletedForEveryone && (
                    <span className="block text-[11px] font-bold text-[#00a884] dark:text-[#00a884] mb-0.5 leading-tight">
                      {msg.senderName || displayChat.name}
                    </span>
                  )}

                  {isDeletedForEveryone ? (
                    <div className="flex items-center gap-1.5 italic text-[13.5px] text-[#8696a0]">
                      <Ban className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{t('deletedMessage')}</span>
                      <span className="inline-block text-[10.5px] not-italic ml-2 text-[#8696a0] self-end font-numeric">
                        {msg.time}
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Optional Full-Resolution / HD Image with Zoomable Lightbox */}
                      {msg.image && (
                        <div className="mb-1.5">
                          <div
                            onClick={() => {
                              setLightboxImage({
                                src: msg.image,
                                fileName: msg.fileName || 'Nexo_Image.jpg',
                                isHd: Boolean(msg.is_hd),
                              });
                              setLightboxZoom(1);
                              setLightboxPan({ x: 0, y: 0 });
                            }}
                            className="relative group/img cursor-zoom-in overflow-hidden rounded-xl"
                          >
                            <img
                              src={msg.image}
                              alt="Attachment"
                              className="rounded-xl max-h-72 w-full object-cover transition-transform duration-200 group-hover/img:scale-[1.01]"
                            />
                            {msg.is_hd && (
                              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[#00a884] border border-[#00a884]/60 text-[10px] font-bold tracking-wider backdrop-blur-xs">
                                HD
                              </span>
                            )}
                          </div>
                          {(msg.fileName || msg.fileSize) && (
                            <div className="mt-1 flex items-center justify-between text-[11px] opacity-80 px-0.5">
                              <span className="truncate font-medium">{msg.fileName || (msg.is_hd ? 'HD Image' : 'Image')}</span>
                              {msg.fileSize && (
                                <span className="font-numeric ml-2 flex-shrink-0">
                                  {fileExt ? `${fileExt} • ` : ''}{msg.fileSize}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Optional Sticker */}
                      {msg.stickerUrl && (
                        <div className="my-1">
                          <img
                            src={msg.stickerUrl}
                            alt="Sticker"
                            className="w-28 h-28 object-contain hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      {/* Uncompressed Document / Code Attachment Card */}
                      {!msg.image && !(msg.mediaType === 'audio' || msg.audio_url) && (msg.attachment || msg.mediaType === 'document' || msg.fileName) && (
                        <div className="mb-2 p-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center justify-between gap-3 max-w-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`px-2 py-1.5 min-w-[38px] rounded-xl ${getExtBadgeColor(fileExt)} text-white flex items-center justify-center flex-shrink-0 shadow-xs text-[10.5px] font-bold tracking-wider`}>
                              {fileExt || <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 text-left">
                              <span className="text-[13px] font-semibold block truncate">
                                {msg.fileName || 'Attachment'}
                              </span>
                              {msg.fileSize && (
                                <span className="text-[11px] opacity-75 font-mono block">
                                  {msg.fileSize} • Uncompressed
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={msg.attachment || msg.mediaUrl || '#'}
                            download={msg.fileName || 'download'}
                            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex-shrink-0 cursor-pointer"
                            title="Download uncompressed file"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      {/* Real Audio Player */}
                      {(msg.mediaType === 'audio' || Boolean(msg.audio_url) || (msg.text && msg.text.startsWith('🎙️'))) && (
                        <AudioPlayerBubble
                          src={msg.audio_url || msg.mediaUrl || msg.attachment}
                          duration={msg.audio_duration || msg.duration}
                        />
                      )}

                      {/* Playable YouTube Video Card */}
                      {msg.youtubeVideo && (
                        <div
                          onClick={() => setPlayingChatVideo(msg.youtubeVideo)}
                          className="mb-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#111b21] max-w-xs cursor-pointer group hover:border-rose-500/50 transition-all text-left"
                        >
                          <div className="relative aspect-video bg-black">
                            <img
                              src={msg.youtubeVideo.thumbnail || `https://i.ytimg.com/vi/${msg.youtubeVideo.videoId}/hqdefault.jpg`}
                              alt={msg.youtubeVideo.title}
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                              <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="p-2.5">
                            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">
                              <YoutubeIcon className="w-3.5 h-3.5" />
                              <span>YouTube Study Video • Tap to play</span>
                            </div>
                            <h5 className="text-[13px] font-bold leading-snug line-clamp-2">
                              {msg.youtubeVideo.title}
                            </h5>
                            {msg.youtubeVideo.channelTitle && (
                              <p className="text-[11px] opacity-70 mt-0.5 truncate">
                                {msg.youtubeVideo.channelTitle}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Card (Privacy-first @username) */}
                      {msg.contactCard && (
                        <div className="mb-2 p-3 rounded-xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center justify-between gap-3 w-full max-w-full sm:min-w-[220px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#029eb4] text-white flex items-center justify-center font-bold text-[15px] flex-shrink-0">
                              {msg.contactCard.name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0 text-left">
                              <span className="text-[14px] font-semibold block truncate">
                                {msg.contactCard.name}
                              </span>
                              <span className="text-[12px] text-[#029eb4] dark:text-sky-400 font-medium block truncate">
                                {msg.contactCard.phoneOrHandle}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onNewChat && onNewChat()}
                            className="px-2.5 py-1 rounded-lg bg-[#029eb4]/20 hover:bg-[#029eb4]/30 text-[#029eb4] dark:text-sky-300 text-[11.5px] font-bold cursor-pointer transition-colors flex-shrink-0"
                          >
                            Message
                          </button>
                        </div>
                      )}

                      {/* Interactive Poll Card */}
                      {msg.poll && (
                        <div className="mb-2 p-3.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 space-y-2.5 w-full max-w-sm sm:min-w-[240px] text-left">
                          <div className="flex items-start gap-2">
                            <BarChart2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-[14.5px] font-bold">{msg.poll.question}</h4>
                              <p className="text-[11px] opacity-75">
                                {msg.poll.allowMultiple ? 'Select one or more' : 'Select one'}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {msg.poll.options?.map((opt) => {
                              const votedList = pollVotes[msg.id] || [];
                              const isVoted = votedList.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleVotePoll(msg.id, opt.id, msg.poll.allowMultiple)}
                                  className={`w-full p-2.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                                    isVoted ? 'border-amber-500 bg-amber-500/15' : 'border-black/10 dark:border-white/10'
                                  }`}
                                >
                                  <div className="relative z-10 flex items-center justify-between text-[13px]">
                                    <span className="font-medium">{opt.text}</span>
                                    <span className="text-[11.5px] opacity-80">{isVoted ? '✓ 1 vote' : '0'}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Event Card */}
                      {msg.event && (
                        <div className="mb-2 p-3.5 rounded-xl bg-black/5 dark:bg-white/10 border border-purple-500/30 space-y-2 w-full max-w-sm sm:min-w-[240px] text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-purple-600 text-white flex-shrink-0">
                              <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[14.5px] font-bold truncate">{msg.event.title}</h4>
                              <p className="text-[12px] text-purple-600 dark:text-purple-300 font-semibold">
                                📅 {msg.event.date} at {msg.event.time}
                              </p>
                            </div>
                          </div>
                          {msg.event.location && (
                            <div className="flex items-center gap-1.5 text-[12px] opacity-80">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{msg.event.location}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Scheduled Delivery Tag */}
                      {msg.isScheduledDelivery && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold opacity-80 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>Scheduled Delivery</span>
                        </div>
                      )}

                      {/* Inline Message Editor OR Rendered Text & Code Blocks */}
                      {isEditing ? (
                        <div className="min-w-[240px] sm:min-w-[320px] space-y-2 py-1">
                          <textarea
                            rows={3}
                            autoFocus
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit(msg);
                              } else if (e.key === 'Escape') {
                                setEditingMsgId(null);
                              }
                            }}
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-[#111b21] text-[#111b21] dark:text-white text-[13.5px] border border-[#0055ff] focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingMsgId(null)}
                              className="px-2.5 py-1 rounded-lg bg-black/10 text-[12px] font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg)}
                              className="px-3 py-1 rounded-lg bg-[#00a884] text-white text-[12px] font-bold cursor-pointer"
                            >
                              Save Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {activeDisplayText && (
                            <div className="text-[14px] leading-[1.38] break-words space-y-1">
                              {segments.map((seg, idx) =>
                                seg.type === 'code' ? (
                                  <CodeBlock
                                    key={idx}
                                    language={seg.language}
                                    code={seg.code}
                                    onExplainCode={(codeStr) =>
                                      setAiMessageContext({ text: codeStr, mode: 'explain_code' })
                                    }
                                  />
                                ) : (
                                  <span key={idx} className="whitespace-pre-wrap">
                                    {renderFormattedInlineText(seg.content)}
                                  </span>
                                )
                              )}
                            </div>
                          )}

                          {/* Translation Tag + Compact Bottom-Right Metadata (Translate icon + Timestamp + Blue Double-Tick) */}
                          <div className="flex items-center justify-end gap-1.5 text-[10.5px] opacity-80 select-none mt-1 flex-wrap">
                            {transState && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTranslate(msg);
                                }}
                                className="text-[10px] font-semibold text-[#0055ff] dark:text-sky-400 underline mr-auto cursor-pointer"
                              >
                                {transState.showTranslated
                                  ? `${t('translatedLabel')} (${currentLanguageObj?.native || language}) • ${t('showOriginal')}`
                                  : t('translate')}
                              </button>
                            )}

                            {localizedRawText && !transState && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTranslate(msg);
                                }}
                                disabled={translatingMsgId === msg.id}
                                title={`${t('translate')} → ${currentLanguageObj?.name || 'App Language'}`}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold opacity-70 hover:opacity-100 hover:text-[#0055ff] dark:hover:text-sky-400 cursor-pointer transition-opacity mr-1"
                              >
                                {translatingMsgId === msg.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Languages className="w-3 h-3" />
                                )}
                                <span className="hidden sm:inline">{t('translate')}</span>
                              </button>
                            )}

                            {msg.isEdited && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryModalMsg(msg);
                                }}
                                className="italic underline decoration-dotted hover:opacity-100 cursor-pointer mr-0.5"
                                title="View edit history"
                              >
                                edited
                              </button>
                            )}
                            {msg.isStarred && (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-amber-500">
                                <Star className="w-3 h-3 fill-amber-500 inline" />
                                {msg.bookmarkCategory && (
                                  <span className="text-[10px]">{msg.bookmarkCategory}</span>
                                )}
                              </span>
                            )}
                            <span className="font-numeric">{msg.time}</span>
                            {isMe && !chat.isSelfChat && (
                              <span>
                                {msg.read ? (
                                  <CheckCheck className="w-[14px] h-[14px] text-[#53bdeb] inline" />
                                ) : (
                                  <Check className="w-[14px] h-[14px] opacity-70 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Bubble Actions on Hover (Star + Tag, Edit Anytime, AI Explain/Interview, Reply, Delete) */}
                  {!isDeletedForEveryone && !isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-3.5 right-2 flex items-center gap-0.5 p-0.5 rounded-full bg-white dark:bg-[#374248] shadow border border-slate-200 dark:border-white/10 text-[#54656f] dark:text-[#aebac1] transition-opacity z-10">
                      {/* Star / Bookmark with Category */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (msg.isStarred) {
                              onToggleStarMessage(chat.id, msg.id);
                            } else {
                              setTagPickerMsgId(tagPickerMsgId === msg.id ? null : msg.id);
                            }
                          }}
                          className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer ${
                            msg.isStarred ? 'text-amber-500' : 'hover:text-amber-500'
                          }`}
                          title={msg.isStarred ? 'Remove bookmark' : 'Bookmark to Resource Vault'}
                        >
                          <Star className={`w-3.5 h-3.5 ${msg.isStarred ? 'fill-amber-500' : ''}`} />
                        </button>

                        {tagPickerMsgId === msg.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-7 z-50 bg-white dark:bg-[#202c33] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 p-1.5 flex items-center gap-1 whitespace-nowrap animate-fadeIn"
                          >
                            {['#DSA', '#Placement', '#Notes', '#Important'].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  onToggleStarMessage(chat.id, msg.id, tag);
                                  setTagPickerMsgId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-[#f0f2f5] dark:bg-[#111b21] hover:bg-[#0055ff] hover:text-white text-[11px] font-semibold cursor-pointer transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Edit Sent Message Anytime (No 15-min limit) */}
                      {isMe && msg.text && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMsgId(msg.id);
                            setEditDraft(msg.text);
                          }}
                          className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0055ff] cursor-pointer"
                          title="Edit message (no time limit)"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* AI Placement Assistant (Interview Answer / Explain Logic) */}
                      {msg.text && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const hasCode = msg.text.includes('```');
                            setAiMessageContext({
                              text: msg.text,
                              mode: hasCode ? 'explain_code' : 'interview_answer',
                            });
                          }}
                          className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#7b2cbf] cursor-pointer"
                          title="AI: Explain Logic / Convert to Interview Answer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* One-Click Translate Message */}
                      {localizedRawText && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTranslate(msg);
                          }}
                          className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00a884] cursor-pointer ${
                            transState?.showTranslated ? 'text-[#00a884]' : ''
                          }`}
                          title={`${t('translate')} (${currentLanguageObj?.name || language})`}
                        >
                          {translatingMsgId === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Languages className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Reply */}
                      <button
                        onClick={() => setReplyingTo({ id: msg.id, sender: isMe ? 'You' : (msg.senderName || chat.name), text: msg.text })}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00a884] cursor-pointer"
                        title="Reply"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onPromptDeleteMessage(msg, chat.id)}
                        className="p-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-500 cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Composer */}
      <Composer
        onSendMessage={onSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        chat={chat}
        focusMode={focusMode}
        onScheduleMessage={onScheduleMessage}
      />

      {/* Edit History Modal */}
      {historyModalMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#0055ff]" />
                <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                  Message Edit History
                </h3>
              </div>
              <button
                onClick={() => setHistoryModalMsg(null)}
                className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto space-y-2.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <span className="text-[10.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block mb-1 font-numeric">
                  Current Version • {historyModalMsg.time}
                </span>
                <p className="text-[13.5px] text-[#111b21] dark:text-white whitespace-pre-wrap">
                  {historyModalMsg.text}
                </p>
              </div>

              {(historyModalMsg.editHistory || []).slice().reverse().map((rev, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] border border-black/5 dark:border-white/5">
                  <span className="text-[10.5px] font-semibold text-[#8696a0] block mb-1">
                    Previous Version • Edited at {rev.editedAt}
                  </span>
                  <p className="text-[13px] text-[#54656f] dark:text-[#aebac1] whitespace-pre-wrap">
                    {rev.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contextual AI Placement Assistant Modal */}
      {aiMessageContext && (
        <AiToneModal
          initialText={aiMessageContext.text}
          initialMode={aiMessageContext.mode}
          onClose={() => setAiMessageContext(null)}
        />
      )}

      {/* 60-Digit Safety Number & E2EE Verification Modal */}
      <SecurityVerifyModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        chat={chat}
        myPublicJwk={myPublicJwk}
      />

      {/* Zoomable Image Lightbox Overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fadeIn select-none"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="px-4 py-3 flex items-center justify-between bg-black/70 border-b border-white/10 text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[14px] font-semibold truncate">{lightboxImage.fileName}</span>
              {lightboxImage.isHd && (
                <span className="px-1.5 py-0.5 rounded bg-[#00a884]/25 text-[#00a884] text-[10px] font-bold border border-[#00a884]/50">
                  HD
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(1, +(z - 0.5).toFixed(2)))}
                className="p-2 rounded-full hover:bg-white/15 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[12px] font-numeric min-w-[44px] text-center">
                {Math.round(lightboxZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(4, +(z + 0.5).toFixed(2)))}
                className="p-2 rounded-full hover:bg-white/15 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1);
                  setLightboxPan({ x: 0, y: 0 });
                }}
                className="p-2 rounded-full hover:bg-white/15 cursor-pointer"
                title="Reset 100%"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <a
                href={lightboxImage.src}
                download={lightboxImage.fileName}
                className="p-2 rounded-full hover:bg-white/15 cursor-pointer"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-full hover:bg-rose-500/30 text-white cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center overflow-hidden p-4"
            onMouseDown={(e) => {
              if (lightboxZoom <= 1) return;
              e.stopPropagation();
              setIsLightboxDragging(true);
              lightboxDragStartRef.current = { x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y };
            }}
            onMouseMove={(e) => {
              if (!isLightboxDragging) return;
              setLightboxPan({
                x: e.clientX - lightboxDragStartRef.current.x,
                y: e.clientY - lightboxDragStartRef.current.y,
              });
            }}
            onMouseUp={() => setIsLightboxDragging(false)}
            onMouseLeave={() => setIsLightboxDragging(false)}
          >
            <img
              src={lightboxImage.src}
              alt={lightboxImage.fileName}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (lightboxZoom > 1) {
                  setLightboxZoom(1);
                  setLightboxPan({ x: 0, y: 0 });
                } else {
                  setLightboxZoom(2.5);
                }
              }}
              draggable={false}
              style={{
                transform: `translate3d(${lightboxPan.x}px, ${lightboxPan.y}px, 0) scale(${lightboxZoom})`,
                cursor: lightboxZoom > 1 ? (isLightboxDragging ? 'grabbing' : 'grab') : 'zoom-in',
              }}
              className="max-h-[85vh] max-w-[92vw] object-contain rounded-lg transition-transform duration-150 select-none"
            />
          </div>
        </div>
      )}

      {/* Playable Shared YouTube Video Modal */}
      {playingChatVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <div className="px-5 py-3.5 bg-[#202c33] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-[15px] font-bold text-white truncate">{playingChatVideo.title}</h4>
                <p className="text-[12px] text-[#8696a0] truncate">{playingChatVideo.channelTitle || 'YouTube Study Video'}</p>
              </div>
              <button
                onClick={() => setPlayingChatVideo(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-[#aebac1] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${playingChatVideo.videoId}?autoplay=1`}
                title={playingChatVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
