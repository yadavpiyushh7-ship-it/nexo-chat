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
  Bot, 
  Clock, 
  ChevronDown,
  Users,
  Megaphone,
  Laptop,
  Star,
  CheckCheck as ReadAllIcon,
  Settings
} from 'lucide-react';

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
  scheduledCount = 0,
  onOpenScheduledQueue,
  // 3-dots menu actions
  onOpenConnectedDevices,
  onOpenStarredMessages,
  onOpenSettings,
  onNewCommunity,
  onReadAll
}) {
  const [viewingArchived, setViewingArchived] = useState(false);
  const [openMenuChatId, setOpenMenuChatId] = useState(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const headerMenuRef = useRef(null);

  // Close dropdown on click outside
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

  return (
    <aside className="w-full md:w-[360px] lg:w-[390px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#2a3942] select-none flex-shrink-0 transition-colors font-sans">
      {/* 1. Header: Bold "Nexo" + Compose Icon + 3-dots Menu (⋮) */}
      <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 bg-[#f0f2f5] dark:bg-[#202c33] flex-shrink-0">
        {viewingArchived ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewingArchived(false)}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] transition-colors cursor-pointer"
              title="Back to inbox"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-[17px] font-bold text-[#111b21] dark:text-white">
              Archived ({archivedChats.length})
            </h2>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Bold Nexo header wordmark */}
            <h1 className="text-[21px] font-bold text-[#111b21] dark:text-white tracking-tight">
              Nexo
            </h1>
          </div>
        )}

        <div className="flex items-center gap-1 text-[#54656f] dark:text-[#aebac1]">
          {/* New Chat compose button */}
          <button
            onClick={onNewChat}
            title="New Chat by @username"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#0044ff] dark:text-[#0055ff] transition-colors cursor-pointer"
          >
            <SquarePen className="w-5 h-5" />
          </button>

          {/* Top-Right 3-Dots Menu (⋮) */}
          <div className="relative" ref={headerMenuRef}>
            <button
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              title="Menu"
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* 3-Dots Menu Dropdown */}
            {headerMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-56 bg-white dark:bg-[#202c33] rounded-2xl shadow-dropdown border border-[#d1d7db]/80 dark:border-white/10 py-1.5 text-[13.5px] animate-fadeIn">
                <button
                  onClick={() => {
                    onNewChat();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#8696a0]" />
                  <span>New group</span>
                </button>

                <button
                  onClick={() => {
                    onNewCommunity();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#8696a0]" />
                  <span>New community</span>
                </button>

                <button
                  onClick={() => {
                    onOpenSettings();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Megaphone className="w-4 h-4 text-[#8696a0]" />
                  <span>Broadcast lists</span>
                </button>

                <button
                  onClick={() => {
                    onOpenConnectedDevices();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-[#0044ff]" />
                  <span>Connected devices</span>
                </button>

                <button
                  onClick={() => {
                    onOpenStarredMessages();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Starred</span>
                </button>

                <button
                  onClick={() => {
                    onReadAll();
                    setHeaderMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-left cursor-pointer"
                >
                  <ReadAllIcon className="w-4 h-4 text-[#53bdeb]" />
                  <span>Read all</span>
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
                  <span>Settings</span>
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
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#0044ff] transition-all"
          />
        </div>
      </div>

      {/* 3. Smart Mode Strip */}
      {!viewingArchived && (
        <div className="px-3 py-2 border-b border-[#d1d7db]/50 dark:border-[#2a3942]/50 flex items-center gap-2 bg-[#fcf5eb]/40 dark:bg-[#182229]/40">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`flex-1 py-1.5 px-3 rounded-full text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              focusMode
                ? 'bg-gradient-to-r from-[#0055ff] to-[#7b2cbf] text-white shadow-sm'
                : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Focus Mode: {focusMode ? 'AUTO-REPLY ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onOpenScheduledQueue}
            className="py-1.5 px-3 rounded-full text-[12px] font-semibold bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#e9edef] dark:hover:bg-[#2a3942] text-[#54656f] dark:text-[#aebac1] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="View scheduled messages"
          >
            <Clock className="w-3.5 h-3.5 text-[#0044ff]" />
            <span>Scheduled: <strong className="text-[#0044ff]">{scheduledCount}</strong></span>
          </button>
        </div>
      )}

      {/* 4. Filter Pills */}
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
                    ? 'bg-[#0044ff] text-white shadow-sm'
                    : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
                }`}
              >
                {folder.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Clickable Archived Row (HIDDEN when 0, shown ONLY when > 0!) */}
      {!viewingArchived && archivedChats.length > 0 && (
        <div
          onClick={() => setViewingArchived(true)}
          className="flex items-center justify-between px-4 py-3 border-b border-[#d1d7db]/40 dark:border-[#2a3942]/40 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] text-[#0044ff]">
              <Archive className="w-5 h-5" />
            </div>
            <span className="text-[15px] font-semibold text-[#111b21] dark:text-[#e9edef]">
              Archived
            </span>
          </div>
          <span className="text-[12px] font-bold text-[#0044ff]">
            {archivedChats.length}
          </span>
        </div>
      )}

      {/* 6. Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/20 dark:divide-[#2a3942]/30 relative pb-16 md:pb-0">
        {displayChats.length === 0 ? (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#0044ff]/10 text-[#0044ff] flex items-center justify-center mb-3">
              <MessageSquareDashed className="w-8 h-8" />
            </div>
            <h4 className="text-[16px] font-bold text-[#111b21] dark:text-white">
              {viewingArchived ? 'No archived chats' : 'No conversations yet'}
            </h4>
            <p className="text-[13px] text-[#667781] dark:text-[#8696a0] max-w-xs mt-1.5 leading-relaxed">
              {viewingArchived
                ? 'Chats you archive will appear here.'
                : 'Search a @username or click New Chat to start messaging.'}
            </p>
            {!viewingArchived && (
              <button
                onClick={onNewChat}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0044ff] hover:bg-[#0038d1] text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <SquarePen className="w-4 h-4" />
                <span>Start New Chat</span>
              </button>
            )}
          </div>
        ) : (
          displayChats.map((chat) => {
            const isSelected = activeChatId === chat.id;
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isMenuOpen = openMenuChatId === chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/50'
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#111b21]" />
                  )}
                </div>

                {/* Contact Details (16px name, 14px preview) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className="text-[16px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate">
                        {chat.name}
                      </h3>
                      {chat.pinned && (
                        <Pin className="w-3.5 h-3.5 text-[#0044ff] fill-[#0044ff] inline" />
                      )}
                    </div>
                    <span className={`text-[12px] ${
                      chat.unreadCount > 0 ? 'text-[#0044ff] font-semibold' : 'text-[#667781] dark:text-[#8696a0]'
                    }`}>
                      {lastMsg?.time || ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 truncate text-[14px]">
                      {lastMsg?.isSender && !chat.isSelfChat && !lastMsg.deletedForEveryone && (
                        <span className="flex-shrink-0">
                          {lastMsg.read ? (
                            <CheckCheck className="w-4 h-4 text-[#53bdeb] inline" />
                          ) : (
                            <Check className="w-4 h-4 text-[#8696a0] inline" />
                          )}
                        </span>
                      )}
                      <p className={`truncate max-w-[210px] ${
                        chat.isSelfChat
                          ? 'text-[#667781] dark:text-[#8696a0] font-normal italic'
                          : lastMsg?.deletedForEveryone
                          ? 'text-[#8696a0] italic'
                          : chat.typing
                          ? 'text-[#0044ff] font-medium italic'
                          : chat.unreadCount > 0
                          ? 'text-[#111b21] dark:text-white font-medium'
                          : 'text-[#667781] dark:text-[#8696a0]'
                      }`}>
                        {chat.isSelfChat ? chat.subtitle : lastMsg?.deletedForEveryone ? 'This message was deleted' : (chat.typing ? 'Typing...' : lastMsg?.text || 'No messages')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {chat.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-[#0044ff] text-white min-w-[20px] text-center shadow-sm flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}

                      {/* WhatsApp-Style Hover Chevron Button (⌄) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuChatId(isMenuOpen ? null : chat.id);
                        }}
                        className={`p-1 rounded-full text-[#8696a0] hover:text-[#111b21] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-opacity cursor-pointer ${
                          isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Chat options"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* WhatsApp-Style Chevron Dropdown Menu */}
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
                      <Info className="w-4 h-4 text-[#0044ff]" />
                      <span>Show Contact Details</span>
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
                          <ArchiveRestore className="w-4 h-4 text-[#0044ff]" />
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
    </aside>
  );
}
