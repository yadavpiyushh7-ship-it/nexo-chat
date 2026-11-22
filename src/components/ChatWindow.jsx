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
  Headphones,
  Play,
  User as UserIcon,
  BarChart2,
  Calendar as CalendarIcon,
  MapPin,
  Clock
} from 'lucide-react';
import Composer from './Composer';

export default function ChatWindow({
  chat,
  onSendMessage,
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
  onToggleStarMessage
}) {
  const [callDropdownOpen, setCallDropdownOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [pollVotes, setPollVotes] = useState({});
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
  }, [chat?.messages]);

  // Close menus on outside click
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

  if (!chat) {
    return (
      <div className="hidden md:flex flex-1 h-full flex-col items-center justify-center p-8 bg-[#efeae2]/30 dark:bg-[#0b141a] text-center select-none font-sans">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#0055ff]/15 via-[#7b2cbf]/15 to-[#d946ef]/15 text-[#0044ff] flex items-center justify-center mb-4 shadow-sm">
          <MessageSquareDashed className="w-10 h-10" />
        </div>
        <h2 className="text-[22px] font-bold text-[#111b21] dark:text-white">
          Nexo
        </h2>
        <p className="text-[14px] text-[#667781] dark:text-[#8696a0] max-w-sm mt-1.5 leading-relaxed">
          Select a chat to begin messaging, schedule reminders, or use your pinned Self-Chat as your personal AI note vault.
        </p>
        <button
          onClick={onNewChat}
          className="mt-5 px-5 py-2.5 rounded-xl bg-[#0044ff] hover:bg-[#0038d1] text-white text-[13.5px] font-semibold flex items-center gap-2 shadow-md shadow-[#0044ff]/20 cursor-pointer transition-all active:scale-95"
        >
          <SquarePen className="w-4 h-4" />
          <span>Start a New Conversation</span>
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 h-full flex flex-col bg-[#efeae2]/40 dark:bg-[#0b141a] relative transition-colors overflow-hidden font-sans">
      {/* 1. Header: Back button on mobile + Contact Info + Unified Call Dropdown + Summarize AI */}
      <header className="h-[60px] px-3 sm:px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between z-10 flex-shrink-0 select-none">
        {/* Left side: Back arrow on Mobile + Contact Info */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile Back Arrow Button */}
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
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-[#0044ff] transition-all"
              />
              {chat.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#202c33]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[15.5px] sm:text-[16px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate leading-tight group-hover:text-[#0044ff] transition-colors">
                  {chat.name}
                </h2>
                {chat.isSelfChat && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#0044ff]/15 text-[#0044ff] dark:text-[#0055ff]">
                    VAULT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11.5px] sm:text-[12px] truncate">
                <span className="text-[#0044ff] dark:text-[#0055ff] font-medium">
                  {chat.handle || '@contact'}
                </span>
                <span className="text-[#667781] dark:text-[#8696a0]">•</span>
                <span className="text-[#667781] dark:text-[#8696a0] truncate">
                  {chat.isSelfChat
                    ? 'Notes & AI Vault'
                    : chat.typing
                    ? <span className="text-[#0044ff] font-medium">Typing...</span>
                    : chat.online
                    ? 'Active now'
                    : chat.lastSeen || 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Header Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Summarize Unread AI Button */}
          <button
            onClick={onOpenSummarize}
            className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0055ff] via-[#7b2cbf] to-[#d946ef] hover:opacity-90 text-white text-[11.5px] sm:text-[12px] font-semibold shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            title="Summarize chat with Gemini"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Summarize {chat.isSelfChat ? 'Vault' : (chat.unreadCount > 0 ? `(${chat.unreadCount})` : 'AI')}</span>
          </button>

          {/* Unified Video & Voice Call Toggle (Video icon + chevron) */}
          {!chat.isSelfChat && (
            <div className="relative" ref={callMenuRef}>
              <button
                type="button"
                onClick={() => setCallDropdownOpen(!callDropdownOpen)}
                className="px-2 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] hover:text-[#0044ff] flex items-center gap-0.5 transition-colors cursor-pointer"
                title="Voice or Video Call"
              >
                <Video className="w-5 h-5" />
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Call Dropdown Popover */}
              {callDropdownOpen && (
                <div className="absolute right-0 top-11 z-50 w-48 bg-white dark:bg-[#202c33] rounded-2xl shadow-dropdown border border-[#d1d7db]/80 dark:border-white/10 py-1.5 text-[13.5px] animate-fadeIn">
                  <button
                    onClick={() => {
                      onStartCall({ contact: chat, type: 'voice' });
                      setCallDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#0044ff]/15 text-[#0044ff]">
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
                      <span className="font-semibold block">Video Call</span>
                      <span className="text-[11px] text-[#8696a0]">HD camera stream</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search Icon */}
          <button
            title="Search in chat"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-[#54656f] dark:text-[#aebac1] transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

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
              <div className="absolute right-0 top-11 z-50 w-48 bg-white dark:bg-[#202c33] rounded-2xl shadow-dropdown border border-[#d1d7db]/80 dark:border-white/10 py-1.5 text-[13.5px] animate-fadeIn">
                <button
                  onClick={() => {
                    onShowContactDetails(chat);
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-2.5 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Info className="w-4 h-4 text-[#0044ff]" />
                  <span>Contact Info</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Message History Area with Centered "Today" Pill */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 space-y-2 pb-20 md:pb-4">
        <div className="flex justify-center my-3 select-none">
          <span className="px-3 py-1 rounded-lg bg-white/95 dark:bg-[#182229] text-[12px] font-semibold text-[#54656f] dark:text-[#8696a0] shadow-sm uppercase tracking-wider">
            Today
          </span>
        </div>

        {chat.messages.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] text-[13.5px]">
            {chat.isSelfChat
              ? 'Your personal AI Vault is ready. Save a note or link below!'
              : `No messages yet. Say hello to ${chat.name}! 👋`}
          </div>
        ) : (
          chat.messages.map((msg) => {
            const isMe = msg.isSender;
            const isDeletedForEveryone = msg.deletedForEveryone;

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} my-1 relative`}
              >
                {/* Optional Quote Card */}
                {msg.quote && !isDeletedForEveryone && (
                  <div
                    className="text-[12.5px] px-3 py-1.5 mb-0.5 rounded-t-xl border-l-4 border-[#0044ff] bg-black/5 dark:bg-white/5 max-w-sm truncate text-[#54656f] dark:text-[#8696a0]"
                  >
                    <span className="font-semibold text-[#0044ff] mr-1.5">
                      {msg.quote.sender}:
                    </span>
                    {msg.quote.text}
                  </div>
                )}

                {/* Message Bubble with INLINE Timestamp and Double-Tick */}
                <div
                  className={`relative px-3.5 py-2 max-w-[85%] sm:max-w-[70%] shadow-bubble transition-all ${
                    isDeletedForEveryone
                      ? 'bg-slate-100 dark:bg-[#182229] text-[#8696a0] rounded-2xl border border-dashed border-slate-300 dark:border-white/10'
                      : isMe
                      ? 'rounded-2xl rounded-tr-none'
                      : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-2xl rounded-tl-none border border-black/5 dark:border-white/5'
                  }`}
                  style={isMe && !isDeletedForEveryone ? {
                    background: 'var(--outgoing-bubble-bg, #d9fdd3)',
                    color: 'var(--outgoing-bubble-text, #111b21)'
                  } : undefined}
                >
                  {/* Deleted for Everyone WhatsApp Placeholder */}
                  {isDeletedForEveryone ? (
                    <div className="flex items-center gap-1.5 italic text-[14px] text-[#8696a0]">
                      <Ban className="w-4 h-4 flex-shrink-0" />
                      <span>This message was deleted</span>
                      <span className="inline-block text-[11px] not-italic ml-2.5 text-[#8696a0] self-end">
                        {msg.time}
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Optional Image */}
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="attachment"
                          className="rounded-xl mb-1.5 max-h-64 w-full object-cover"
                        />
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

                      {/* Document Attachment Card */}
                      {(msg.attachment || msg.mediaType === 'document' || msg.fileName) && (
                        <div className="mb-2 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between gap-3 max-w-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#7f66ff] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 text-left">
                              <span className="text-[13.5px] font-semibold text-[#111b21] dark:text-white block truncate">
                                {msg.fileName || 'Document.pdf'}
                              </span>
                              <span className="text-[11.5px] text-[#667781] dark:text-[#8696a0]">
                                {msg.fileSize || 'PDF Document'}
                              </span>
                            </div>
                          </div>
                          <a
                            href={msg.attachment || '#'}
                            download={msg.fileName || 'download'}
                            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#0044ff] dark:text-[#0055ff] flex-shrink-0 cursor-pointer"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      {/* Audio / Voice Note Card */}
                      {(msg.mediaType === 'audio' || (msg.text && msg.text.startsWith('🎙️'))) && (
                        <div className="mb-2 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 flex items-center gap-3 min-w-[200px]">
                          <button
                            type="button"
                            className="w-9 h-9 rounded-full bg-[#ff8000] text-white flex items-center justify-center shadow-sm hover:opacity-90 flex-shrink-0 cursor-pointer"
                          >
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                          </button>
                          <div className="flex-1 space-y-1">
                            {/* Animated waveform bars */}
                            <div className="flex items-center gap-0.5 h-4">
                              {[6, 12, 16, 8, 14, 10, 16, 6, 12, 14, 8, 16, 10, 6].map((h, i) => (
                                <span
                                  key={i}
                                  className="w-1 bg-[#ff8000] rounded-full"
                                  style={{ height: `${h}px` }}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between text-[10.5px] text-[#8696a0]">
                              <span>0:12</span>
                              <span>{msg.fileName || 'Voice note'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Contact Card */}
                      {msg.contactCard && (
                        <div className="mb-2 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between gap-3 min-w-[220px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#029eb4] text-white flex items-center justify-center font-bold text-[15px] flex-shrink-0">
                              {msg.contactCard.name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0 text-left">
                              <span className="text-[14px] font-semibold text-[#111b21] dark:text-white block truncate">
                                {msg.contactCard.name}
                              </span>
                              <span className="text-[12px] text-[#029eb4] font-medium block truncate">
                                {msg.contactCard.phoneOrHandle}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onNewChat && onNewChat()}
                            className="px-2.5 py-1 rounded-lg bg-[#029eb4]/15 hover:bg-[#029eb4]/25 text-[#029eb4] text-[11.5px] font-bold cursor-pointer transition-colors flex-shrink-0"
                          >
                            Message
                          </button>
                        </div>
                      )}

                      {/* Interactive Poll Card */}
                      {msg.poll && (
                        <div className="mb-2 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2.5 min-w-[240px] max-w-sm text-left">
                          <div className="flex items-start gap-2">
                            <BarChart2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-[14.5px] font-bold text-[#111b21] dark:text-white">
                                {msg.poll.question}
                              </h4>
                              <p className="text-[11px] text-[#8696a0]">
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
                                    isVoted
                                      ? 'border-amber-500 bg-amber-500/10'
                                      : 'border-slate-200/80 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                                  }`}
                                >
                                  {isVoted && (
                                    <div
                                      className="absolute inset-y-0 left-0 bg-amber-500/20 transition-all duration-300"
                                      style={{ width: '100%' }}
                                    />
                                  )}
                                  <div className="relative z-10 flex items-center justify-between text-[13px]">
                                    <span className="font-medium text-[#111b21] dark:text-white">
                                      {opt.text}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {isVoted && (
                                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                                          ✓
                                        </span>
                                      )}
                                      <span className="text-[11.5px] text-[#8696a0]">
                                        {isVoted ? '1 vote' : '0'}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Event Card */}
                      {msg.event && (
                        <div className="mb-2 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-purple-500/30 space-y-2 min-w-[240px] max-w-sm text-left">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-purple-600 text-white flex-shrink-0">
                              <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[14.5px] font-bold text-[#111b21] dark:text-white truncate">
                                {msg.event.title}
                              </h4>
                              <p className="text-[12px] text-purple-600 dark:text-purple-400 font-semibold">
                                📅 {msg.event.date} at {msg.event.time}
                              </p>
                            </div>
                          </div>
                          {msg.event.location && (
                            <div className="flex items-center gap-1.5 text-[12px] text-[#667781] dark:text-[#8696a0]">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{msg.event.location}</span>
                            </div>
                          )}
                          {msg.event.description && (
                            <p className="text-[12px] text-[#667781] dark:text-[#8696a0] italic">
                              "{msg.event.description}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Scheduled Delivery Tag */}
                      {msg.isScheduledDelivery && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#0044ff] dark:text-[#0055ff] mb-1">
                          <Clock className="w-3 h-3" />
                          <span>Scheduled Message</span>
                        </div>
                      )}

                      {/* Message Text with INLINE Timestamp and Read Receipt */}
                      {msg.text && (
                        <div className="text-[15.5px] leading-relaxed break-words">
                          <span>{msg.text}</span>
                          <span className="inline-flex items-center gap-1 ml-2.5 text-[11px] text-[#667781] dark:text-[#8696a0] select-none align-bottom whitespace-nowrap float-right mt-1">
                            {msg.isStarred && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline mr-0.5" />
                            )}
                            <span>{msg.time}</span>
                            {isMe && !chat.isSelfChat && (
                              <span>
                                {msg.read ? (
                                  <CheckCheck className="w-[15px] h-[15px] text-[#53bdeb] inline" />
                                ) : (
                                  <Check className="w-[15px] h-[15px] text-[#8696a0] inline" />
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Inline timestamp when only media/sticker is sent without text */}
                      {!msg.text && (
                        <div className="flex justify-end items-center gap-1 text-[11px] text-[#667781] dark:text-[#8696a0] select-none mt-1">
                          {msg.isStarred && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline mr-0.5" />
                          )}
                          <span>{msg.time}</span>
                          {isMe && !chat.isSelfChat && (
                            <span>
                              {msg.read ? (
                                <CheckCheck className="w-[15px] h-[15px] text-[#53bdeb] inline" />
                              ) : (
                                <Check className="w-[15px] h-[15px] text-[#8696a0] inline" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Bubble Actions on Hover / Touch (Reply, Star, Delete) */}
                  {!isDeletedForEveryone && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-3.5 right-2 flex items-center gap-1 p-0.5 rounded-full bg-white dark:bg-[#374248] shadow border border-slate-200 dark:border-white/10 text-[#54656f] dark:text-[#aebac1] transition-opacity z-10">
                      {/* Star Button */}
                      <button
                        onClick={() => onToggleStarMessage(chat.id, msg.id)}
                        className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${
                          msg.isStarred ? 'text-amber-500' : 'hover:text-amber-500'
                        }`}
                        title={msg.isStarred ? 'Unstar' : 'Star message'}
                      >
                        <Star className={`w-3.5 h-3.5 ${msg.isStarred ? 'fill-amber-500' : ''}`} />
                      </button>

                      {/* Reply Button */}
                      <button
                        onClick={() => setReplyingTo({ id: msg.id, sender: isMe ? 'You' : chat.name, text: msg.text })}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#0044ff]"
                        title="Reply"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Message Button */}
                      <button
                        onClick={() => onPromptDeleteMessage(msg, chat.id)}
                        className="p-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-500"
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

      {/* 3. Rounded Pill Composer */}
      <Composer
        onSendMessage={onSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        chat={chat}
        focusMode={focusMode}
        onScheduleMessage={onScheduleMessage}
      />
    </main>
  );
}
