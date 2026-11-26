import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Trash2, 
  Image as ImageIcon, 
  FileText,
  Lock,
  Palette
} from 'lucide-react';
import AvatarIcon from './AvatarIcon';
import { BUBBLE_ACCENTS, CHAT_WALLPAPERS } from '../lib/themeUtils';

export default function ContactDetailsDrawer({
  contact,
  onClose,
  onClearChat,
  onDeleteChat,
  bubbleAccent,
  chatWallpaper,
  onChangeTheme
}) {
  const [activeMediaTab, setActiveMediaTab] = useState('docs');
  const [isMuted, setIsMuted] = useState(false);

  if (!contact) return null;

  return (
    <aside className="w-full sm:w-[360px] md:w-[380px] h-full bg-white dark:bg-[#111b21] border-l border-[#d1d7db] dark:border-[#222e35] flex flex-col z-20 flex-shrink-0 animate-fadeIn select-none font-sans">
      {/* Header */}
      <div className="h-[60px] px-4 bg-[#f0f2f5] dark:bg-[#111b21] border-b border-[#d1d7db]/80 dark:border-[#222e35] flex items-center justify-between flex-shrink-0">
        <h3 className="text-[16px] font-bold text-[#111b21] dark:text-[#e9edef]">
          Chat Info & Theme
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
            <AvatarIcon
              size="xl"
              isGroup={contact.isGroup}
              name={contact.name}
              showOnline={contact.online}
              online={contact.online}
            />
          </div>
          <h2 className="text-[19px] font-bold text-[#111b21] dark:text-white">
            {contact.name}
          </h2>
          <p className="text-[13px] text-[#0055ff] dark:text-sky-400 font-semibold mt-0.5">
            {contact.handle || '@contact'}
          </p>
          <p className="text-[12px] text-[#667781] dark:text-[#8696a0] mt-1">
            {contact.online ? 'Active now' : contact.lastSeen || 'Offline'}
          </p>
        </div>

        {/* Bio / About */}
        <div className="p-4 space-y-1">
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0]">
            About / Role
          </span>
          <p className="text-[14px] text-[#111b21] dark:text-[#e9edef] leading-relaxed">
            {contact.bio || 'B.Tech CSE Placement Hub'}
          </p>
        </div>

        {/* Custom Chat Themes & Wallpapers */}
        {onChangeTheme && (
          <div className="p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#0055ff]" />
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0]">
                Bubble Accent Color
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {BUBBLE_ACCENTS.map((acc) => {
                const isSelected = bubbleAccent === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => onChangeTheme(acc.id, chatWallpaper)}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0055ff] bg-[#0055ff]/10 ring-1 ring-[#0055ff]'
                        : 'border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: acc.swatch }}
                    />
                    <span className="text-[12px] font-semibold text-[#111b21] dark:text-white truncate">
                      {acc.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div>
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] block mb-2">
                Chat Wallpaper
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CHAT_WALLPAPERS.map((wp) => {
                  const isSelected = chatWallpaper === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => onChangeTheme(bubbleAccent, wp.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#0055ff] text-white'
                          : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] hover:bg-black/10'
                      }`}
                    >
                      {wp.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Shared Media Tabs */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0]">
              Shared Code, Links & Files
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#f0f2f5] dark:bg-[#202c33] p-1 rounded-xl">
            {['media', 'links', 'docs'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveMediaTab(t)}
                className={`flex-1 py-1 text-[12px] font-medium rounded-lg capitalize transition-all ${
                  activeMediaTab === t
                    ? 'bg-white dark:bg-[#111b21] text-[#0055ff] shadow-sm'
                    : 'text-[#667781] dark:text-[#8696a0]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {activeMediaTab === 'media' && (
            <div className="p-4 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-center text-[#8696a0] text-[12.5px]">
              <ImageIcon className="w-6 h-6 mx-auto mb-1 text-[#0055ff]" />
              <span>Full-resolution media shared in this chat appears here</span>
            </div>
          )}

          {activeMediaTab === 'links' && (
            <div className="space-y-2 text-[12px] pt-1">
              <div className="p-2.5 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] truncate">
                <span className="font-semibold block text-[#0055ff] dark:text-sky-400">placements.jecrc.edu/drives/2027-sde</span>
                <span className="text-[#8696a0] truncate">2027 Batch SDE Drive Registration</span>
              </div>
            </div>
          )}

          {activeMediaTab === 'docs' && (
            <div className="space-y-2 text-[12px] pt-1">
              <div className="p-2.5 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0055ff]" />
                <span className="text-[#111b21] dark:text-white truncate">Striver_SDE_Sheet_Notes.pdf</span>
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
            <span>Phone numbers hidden • Verified @username encryption.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => onClearChat(contact.id)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#202c33] dark:hover:bg-[#2a3942] text-rose-600 dark:text-rose-400 text-[13.5px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Chat History (Keeps Bookmarks)</span>
          </button>

          {!contact.isSelfChat && (
            <button
              onClick={() => {
                onDeleteChat(contact.id);
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[13.5px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Delete Chat</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
