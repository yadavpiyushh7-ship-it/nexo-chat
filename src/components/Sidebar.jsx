import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  SquarePen, 
  MoreVertical, 
  Archive, 
  ArrowLeft, 
  CheckCheck, 
  Check, 
  Pin, 
  Trash2, 
  Info, 
  ArchiveRestore, 
  MessageSquareDashed, 
  Clock, 
  ChevronDown,
  Users,
  Laptop,
  Star,
  CheckCheck as ReadAllIcon,
  Settings,
  GraduationCap,
  BellOff,
  SlidersHorizontal,
  Camera
} from 'lucide-react';
import AvatarIcon from './AvatarIcon';
import NexoLogo from './NexoLogo';
import CameraCaptureModal from './CameraCaptureModal';
import { useLanguage } from '../contexts/LanguageContext';

export default function Sidebar({
  user,
  searchQuery,
  setSearchQuery,
  folders,
  activeFolder,
  setActiveFolder,
  chats,
  archivedChats = [],
  activeChatId,
  onSelectChat,
  onNewChat,
  onArchiveChat,
  onUnarchiveChat,
  onPinChat,
  onDeleteChat,
  onShowContactDetails,
  focusMode,
  setFocusMode,
  studyStatus,
  setStudyStatus,
  scheduledCount = 0,
  onOpenScheduledQueue,
  onAcceptRequest,
  onDeclineRequest,
  onOpenConnectedDevices,
  onOpenStarredMessages,
  onOpenSettings,
  onNewCommunity,
  onNewUpdates,
  onOpenWorkspace,
  onOpenPrep,
  onOpenYouTube,
  onQuickCameraCapture,
  onReadAll
}) {
  const { t, localizeChat, localizeMessageText } = useLanguage();
  const [viewingArchived, setViewingArchived] = useState(false);
  const [openMenuChatId, setOpenMenuChatId] = useState(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showStudyStatusPopover, setShowStudyStatusPopover] = useState(false);
  const [showHeaderCameraModal, setShowHeaderCameraModal] = useState(false);
  const [statusDraft, setStatusDraft] = useState(studyStatus || 'Studying for DSA & Exams 📚');
  const menuRef = useRef(null);
  const headerMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuChatId(null);
      }
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayChats = viewingArchived ? archivedChats : chats;

  const folderLabelMap = {
    all: t('all'),
    unread: t('unread'),
    favourites: t('favourites'),
    groups: t('groups'),
    friends: t('friends'),
    requests: t('requests'),
  };

  return (
    <aside className="w-full md:w-[360px] lg:w-[390px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#2a3942] select-none flex-shrink-0 transition-colors font-sans">
      {/* 1. Top Header: Official Nexo Logo on Mobile (< 768px), Branding on Desktop */}
      <div className="h-[60px] px-3.5 sm:px-4 flex items-center justify-between border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 bg-[#f0f2f5] dark:bg-[#202c33] flex-shrink-0 relative">
        {viewingArchived ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewingArchived(false)}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] transition-colors cursor-pointer"
              title={t('back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-[17px] font-bold text-[#111b21] dark:text-white">
              Archived ({archivedChats.length})
            </h2>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Mobile (< 768px): Official Nexo bubble logo icon replacing text title */}
            <div className="flex md:hidden items-center">
              <NexoLogo size={32} />
            </div>
            {/* Desktop (>= 768px) */}
            <div className="hidden md:flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-[#111b21] dark:text-white tracking-tight">
                Nexo
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#0055ff]/10 text-[#0055ff] dark:text-sky-400 text-[10.5px] font-bold">
                JECRC CSE
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-0.5 sm:gap-1 text-[#54656f] dark:text-[#aebac1]">
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            title="Exam / Study Focus Mode"
            className={`hidden sm:flex px-2.5 py-1.5 rounded-full text-[11.5px] font-bold items-center gap-1.5 transition-all cursor-pointer ${
              focusMode
                ? 'bg-[#0055ff] text-white shadow-sm'
                : 'bg-white/70 dark:bg-[#111b21]/60 text-[#54656f] dark:text-[#aebac1] hover:bg-white dark:hover:bg-[#111b21]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{focusMode ? t('studyModeOn') : t('studyFocus')}</span>
          </button>

          {/* Mobile Search focus icon */}
          <button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            title={t('searchPlaceholder')}
            className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Quick Camera Capture icon (matches clean mobile header) */}
          <button
            type="button"
            onClick={() => setShowHeaderCameraModal(true)}
            title="Camera"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] hover:text-[#00a884] transition-colors cursor-pointer"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            onClick={onNewChat}
            title={t('newChatTitle')}
            className="hidden md:flex p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] hover:text-[#0055ff] transition-colors cursor-pointer"
          >
            <SquarePen className="w-4.5 h-4.5" />
          </button>

          <div className="relative" ref={headerMenuRef}>
            <button
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              title="Menu"
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {headerMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-64 bg-white dark:bg-[#202c33] rounded-2xl shadow-dropdown border border-[#d1d7db]/80 dark:border-white/10 py-1.5 text-[13.5px] animate-fadeIn">
                <button
                  onClick={() => {
                    onNewChat();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#0055ff]" />
                  <span>{t('newChatTitle')}</span>
                </button>

                <button
                  onClick={() => {
                    onNewUpdates?.();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer md:hidden"
                >
                  <GraduationCap className="w-4 h-4 text-[#00a884]" />
                  <span>{t('updates')}</span>
                </button>

                <button
                  onClick={() => {
                    onNewCommunity();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#8696a0]" />
                  <span>{t('communities')}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenStarredMessages();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{t('resourceVault')}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenScheduledQueue();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-[#0055ff]" />
                  <span>{t('scheduled')} ({scheduledCount})</span>
                </button>

                <button
                  onClick={() => {
                    onOpenConnectedDevices();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-[#00a884]" />
                  <span>{t('connectedDevices')}</span>
                </button>

                <button
                  onClick={() => {
                    onReadAll();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <ReadAllIcon className="w-4 h-4 text-[#53bdeb]" />
                  <span>{t('markAllRead')}</span>
                </button>

                <div className="border-t border-[#d1d7db]/40 dark:border-white/10 my-1" />

                <button
                  onClick={() => {
                    onOpenSettings();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#8696a0]" />
                  <span>{t('settingsAndThemes')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[#d1d7db]/40 dark:border-[#2a3942]/40">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#54656f] dark:text-[#8696a0]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] text-[13.5px] focus:outline-none focus:ring-1 focus:ring-[#0055ff] transition-all"
          />
        </div>
      </div>

      {/* 3. Smart Strip */}
      {!viewingArchived && (
        <div className="px-3 py-2 border-b border-[#d1d7db]/50 dark:border-[#2a3942]/50 flex items-center gap-2 bg-[#fcf5eb]/40 dark:bg-[#182229]/40">
          {focusMode ? (
            <button
              onClick={() => {
                setStatusDraft(studyStatus || '');
                setShowStudyStatusPopover(!showStudyStatusPopover);
              }}
              className="flex-1 py-1.5 px-3 rounded-full text-[11.5px] font-semibold bg-[#0055ff]/10 text-[#0055ff] dark:text-sky-400 flex items-center justify-between gap-1.5 cursor-pointer truncate"
            >
              <span className="truncate">📚 {studyStatus}</span>
              <SlidersHorizontal className="w-3 h-3 flex-shrink-0" />
            </button>
          ) : (
            <button
              onClick={onOpenStarredMessages}
              className="flex-1 py-1.5 px-3 rounded-full text-[12px] font-semibold bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#e9edef] dark:hover:bg-[#2a3942] text-[#54656f] dark:text-[#aebac1] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{t('resourceVault')}</span>
            </button>
          )}

          <button
            onClick={onOpenScheduledQueue}
            className="py-1.5 px-3 rounded-full text-[12px] font-semibold bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#e9edef] dark:hover:bg-[#2a3942] text-[#54656f] dark:text-[#aebac1] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 text-[#0055ff]" />
            <span>{t('scheduled')}: <strong className="text-[#0055ff] dark:text-sky-400">{scheduledCount}</strong></span>
          </button>
        </div>
      )}

      {showStudyStatusPopover && focusMode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (statusDraft.trim()) setStudyStatus(statusDraft.trim());
            setShowStudyStatusPopover(false);
          }}
          className="px-3 py-2.5 bg-[#0055ff]/5 border-b border-[#0055ff]/20 flex items-center gap-2 animate-fadeIn"
        >
          <input
            type="text"
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111b21] text-[12.5px] text-[#111b21] dark:text-white border border-[#0055ff]/30 focus:outline-none"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#0055ff] text-white text-[12px] font-bold cursor-pointer">
            {t('save')}
          </button>
        </form>
      )}

      {/* 4. Filter Chips */}
      {!viewingArchived && (
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#d1d7db]/40 dark:border-[#2a3942]/40">
          {folders.map((folder) => {
            const isActive = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`px-3 py-1 text-[13px] font-medium rounded-full transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#d9fdd3] dark:bg-[#103629] text-[#00a884] dark:text-[#25d366] shadow-xs font-semibold'
                    : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
                }`}
              >
                {folderLabelMap[folder.id] || folder.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Archived Row */}
      {!viewingArchived && archivedChats.length > 0 && (
        <div
          onClick={() => setViewingArchived(true)}
          className="flex items-center justify-between px-4 py-3 border-b border-[#d1d7db]/40 dark:border-[#2a3942]/40 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] text-[#0055ff]">
              <Archive className="w-5 h-5" />
            </div>
            <span className="text-[15px] font-semibold text-[#111b21] dark:text-[#e9edef]">Archived</span>
          </div>
          <span className="text-[12px] font-bold text-[#0055ff]">{archivedChats.length}</span>
        </div>
      )}

      {/* 6. Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/20 dark:divide-[#2a3942]/30 relative pb-16 md:pb-0">
        {displayChats.length === 0 ? (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#0055ff]/10 text-[#0055ff] flex items-center justify-center mb-3">
              <MessageSquareDashed className="w-8 h-8" />
            </div>
            <h4 className="text-[16px] font-bold text-[#111b21] dark:text-white">
              {viewingArchived ? 'No archived chats' : 'No conversations matching filter'}
            </h4>
            <p className="text-[13px] text-[#667781] dark:text-[#8696a0] max-w-xs mt-1.5 leading-relaxed">
              Invite a friend or search any @username to start a live E2EE chat.
            </p>
            {!viewingArchived && (
              <button
                onClick={onNewChat}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <SquarePen className="w-4 h-4" />
                <span>{t('newChatTitle')}</span>
              </button>
            )}
          </div>
        ) : (
          displayChats.map((chat) => {
            const locChat = localizeChat(chat);
            const isSelected = activeChatId === chat.id;
            const lastMsg = chat.messages[chat.messages.length - 1];
            const localizedLastText = lastMsg ? localizeMessageText(lastMsg) : '';
            const isMenuOpen = openMenuChatId === chat.id;
            const isMutedByFocus = focusMode && !chat.isSelfChat && !chat.isPlacementAlert;
            const visibleUnread = isMutedByFocus ? 0 : (chat.unreadCount || 0);

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/50'
                } ${isMutedByFocus ? 'opacity-55' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <AvatarIcon
                    size="md"
                    isGroup={chat.isGroup}
                    name={locChat.name}
                    showOnline={chat.online && !isMutedByFocus}
                    online={chat.online}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className="text-[15px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate">
                        {locChat.name}
                      </h3>
                      {chat.pinned && (
                        <Pin className="w-3.5 h-3.5 text-[#00a884] fill-[#00a884] inline flex-shrink-0" />
                      )}
                      {isMutedByFocus && (
                        <BellOff className="w-3.5 h-3.5 text-[#8696a0] inline flex-shrink-0" />
                      )}
                    </div>
                    <span className={`text-[11px] flex-shrink-0 ${
                      visibleUnread > 0 ? 'text-[#00a884] font-semibold' : 'text-[#667781] dark:text-[#8696a0]'
                    }`}>
                      {lastMsg?.time || ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 truncate text-[13px]">
                      {lastMsg?.isSender && !chat.isSelfChat && !lastMsg.deletedForEveryone && (
                        <span className="flex-shrink-0">
                          {lastMsg.read ? (
                            <CheckCheck className="w-4 h-4 text-[#53bdeb] inline" />
                          ) : (
                            <Check className="w-4 h-4 text-[#8696a0] inline" />
                          )}
                        </span>
                      )}
                      <p className={`truncate max-w-[215px] ${
                        chat.isSelfChat
                          ? 'text-[#667781] dark:text-[#8696a0] font-normal italic'
                          : lastMsg?.deletedForEveryone
                          ? 'text-[#8696a0] italic'
                          : visibleUnread > 0
                          ? 'text-[#111b21] dark:text-white font-medium'
                          : 'text-[#667781] dark:text-[#8696a0]'
                      }`}>
                        {chat.isSelfChat
                          ? locChat.subtitle
                          : lastMsg?.deletedForEveryone
                          ? t('deletedMessage')
                          : localizedLastText.replace(/```[\s\S]*?```/g, '[Code Snippet]') || (lastMsg?.fileName ? `📎 ${lastMsg.fileName}` : '🔒 E2EE Ready')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {visibleUnread > 0 && (
                        <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full min-w-[20px] text-center shadow-xs flex-shrink-0 ${
                          chat.isPlacementAlert
                            ? 'bg-[#0055ff] text-white'
                            : 'bg-[#25d366] text-[#111b21]'
                        }`}>
                          {visibleUnread}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuChatId(isMenuOpen ? null : chat.id);
                        }}
                        className={`p-1 rounded-full text-[#8696a0] hover:text-[#111b21] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-opacity cursor-pointer ${
                          isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {chat.status === 'pending' && (
                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-200/60 dark:border-white/5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onAcceptRequest?.(chat.id)}
                        className="px-3 py-1 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white text-[12px] font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onDeclineRequest?.(chat.id)}
                        className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-[12px] font-semibold cursor-pointer transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-4 top-12 z-50 w-52 bg-white dark:bg-[#202c33] rounded-2xl shadow-dropdown border border-[#d1d7db]/80 dark:border-white/10 py-1.5 text-[13.5px] animate-fadeIn"
                  >
                    <button
                      onClick={() => {
                        onShowContactDetails(chat);
                        setOpenMenuChatId(null);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                    >
                      <Info className="w-4 h-4 text-[#0055ff]" />
                      <span>Chat Info & Theme</span>
                    </button>

                    <button
                      onClick={() => {
                        onPinChat(chat.id);
                        setOpenMenuChatId(null);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                    >
                      <Pin className="w-4 h-4 text-[#8696a0]" />
                      <span>{chat.pinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                    </button>

                    {!chat.isSelfChat && (
                      viewingArchived ? (
                        <button
                          onClick={() => {
                            onUnarchiveChat(chat.id);
                            setOpenMenuChatId(null);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                        >
                          <ArchiveRestore className="w-4 h-4 text-[#0055ff]" />
                          <span>Unarchive Chat</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onArchiveChat(chat.id);
                            setOpenMenuChatId(null);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                        >
                          <Archive className="w-4 h-4 text-[#8696a0]" />
                          <span>Archive Chat</span>
                        </button>
                      )
                    )}

                    {!chat.isSelfChat && (
                      <>
                        <div className="border-t border-[#d1d7db]/40 dark:border-white/10 my-1" />
                        <button
                          onClick={() => {
                            onDeleteChat(chat.id);
                            setOpenMenuChatId(null);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left font-medium cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Chat</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <CameraCaptureModal
        isOpen={showHeaderCameraModal}
        onClose={() => setShowHeaderCameraModal(false)}
        onCapture={(dataUrl) => onQuickCameraCapture?.(dataUrl)}
      />
    </aside>
  );
}
