import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Video, 
  ShieldCheck, 
  Bell, 
  Trash2, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileText,
  Lock
} from 'lucide-react';

export default function ContactDetailsDrawer({ contact, onClose, onClearChat, onDeleteChat }) {
  const [activeMediaTab, setActiveMediaTab] = useState('media');
  const [isMuted, setIsMuted] = useState(false);

  if (!contact) return null;

  return (
    <aside className="w-full sm:w-[360px] md:w-[380px] h-full bg-white dark:bg-[#111b21] border-l border-[#d1d7db] dark:border-[#2a3942] flex flex-col z-20 flex-shrink-0 animate-fadeIn select-none font-sans">
      {/* Header */}
      <div className="h-[60px] px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between flex-shrink-0">
        <h3 className="text-[16px] font-bold text-[#111b21] dark:text-[#e9edef]">
          Contact Info
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/40 dark:divide-[#2a3942]/50">
        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-[#00a884]/20 shadow-md"
            />
            {contact.online && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#00a884] rounded-full ring-2 ring-white dark:ring-[#111b21]" />
            )}
          </div>
          <h2 className="text-[19px] font-bold text-[#111b21] dark:text-white">
            {contact.name}
          </h2>
          <p className="text-[13px] text-[#00a884] dark:text-[#00c298] font-semibold mt-0.5">
            {contact.handle || '@contact'}
          </p>
          <p className="text-[12px] text-[#667781] dark:text-[#8696a0] mt-1">
            {contact.online ? 'Active now' : contact.lastSeen || 'Offline'}
          </p>
        </div>

        {/* Bio / About */}
        <div className="p-4 space-y-1">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0]">
            About / Bio
          </span>
          <p className="text-[14px] text-[#111b21] dark:text-[#e9edef] leading-relaxed">
            {contact.bio || 'Available on Nexo.'}
          </p>
        </div>

        {/* Shared Media Tabs */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0]">
              Media, Links & Docs
            </span>
            <span className="text-[12px] text-[#00a884] font-medium">12 items</span>
          </div>

          <div className="flex items-center gap-1 bg-[#f0f2f5] dark:bg-[#202c33] p-1 rounded-xl">
            <button
              onClick={() => setActiveMediaTab('media')}
              className={`flex-1 py-1 text-[12px] font-medium rounded-lg transition-all ${
                activeMediaTab === 'media'
                  ? 'bg-white dark:bg-[#111b21] text-[#00a884] shadow-sm'
                  : 'text-[#667781] dark:text-[#8696a0]'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveMediaTab('links')}
              className={`flex-1 py-1 text-[12px] font-medium rounded-lg transition-all ${
                activeMediaTab === 'links'
                  ? 'bg-white dark:bg-[#111b21] text-[#00a884] shadow-sm'
                  : 'text-[#667781] dark:text-[#8696a0]'
              }`}
            >
              Links
            </button>
            <button
              onClick={() => setActiveMediaTab('docs')}
              className={`flex-1 py-1 text-[12px] font-medium rounded-lg transition-all ${
                activeMediaTab === 'docs'
                  ? 'bg-white dark:bg-[#111b21] text-[#00a884] shadow-sm'
                  : 'text-[#667781] dark:text-[#8696a0]'
              }`}
            >
              Docs
            </button>
          </div>

          {activeMediaTab === 'media' && (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100" className="w-full h-18 object-cover rounded-lg" alt="shared" />
              <img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=100" className="w-full h-18 object-cover rounded-lg" alt="shared" />
              <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100" className="w-full h-18 object-cover rounded-lg" alt="shared" />
            </div>
          )}

          {activeMediaTab === 'links' && (
            <div className="space-y-2 text-[12px] pt-1">
              <div className="p-2 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] truncate">
                <span className="font-semibold block text-[#00a884]">figma.com/file/...</span>
                <span className="text-[#8696a0] truncate">Nexo Design Tokens v2</span>
              </div>
            </div>
          )}

          {activeMediaTab === 'docs' && (
            <div className="space-y-2 text-[12px] pt-1">
              <div className="p-2 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00a884]" />
                <span className="text-[#111b21] dark:text-white truncate">Capstone_Specification.pdf</span>
              </div>
            </div>
          )}
        </div>

        {/* Security & Notification Settings */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
              <span className="text-[14px] text-[#111b21] dark:text-[#e9edef]">
                Mute Notifications
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMuted}
                onChange={(e) => setIsMuted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00a884]"></div>
            </label>
          </div>

          <div className="flex items-center gap-3 text-[13px] text-[#667781] dark:text-[#8696a0] pt-1">
            <Lock className="w-4 h-4 text-[#00a884]" />
            <span>Messages and calls are end-to-end encrypted.</span>
          </div>
        </div>

        {/* Actions: Clear Chat & Delete Chat */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear this chat history?')) {
                onClearChat(contact.id);
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#202c33] dark:hover:bg-[#2a3942] text-rose-600 dark:text-rose-400 text-[13.5px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Chat History</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Delete this chat entirely?')) {
                onDeleteChat(contact.id);
                onClose();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Delete Chat</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
