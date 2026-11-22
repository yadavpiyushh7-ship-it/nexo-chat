import React from 'react';
import { Settings } from 'lucide-react';
import NexoLogo from './NexoLogo';
import { ChatsIcon, UpdatesIcon, CommunitiesIcon, CallsIcon } from './WhatsAppIcons';

export default function NavigationRail({
  activeTab,
  setActiveTab,
  unreadTotal = 0,
  user,
  onOpenSettings,
  isSettingsOpen
}) {
  const navItems = [
    { id: 'chats', label: 'Chats', icon: ChatsIcon, badge: unreadTotal },
    { id: 'updates', label: 'Updates', icon: UpdatesIcon },
    { id: 'communities', label: 'Communities', icon: CommunitiesIcon },
    { id: 'calls', label: 'Calls', icon: CallsIcon },
  ];

  return (
    <nav className="w-[68px] h-full flex flex-col items-center py-3.5 bg-[#f0f2f5] dark:bg-[#202c33] border-r border-[#d1d7db] dark:border-[#2a3942] select-none flex-shrink-0 z-20 transition-colors">
      {/* Top: Nexo Logo */}
      <div className="mb-4">
        <button
          onClick={() => setActiveTab('chats')}
          title="Nexo Home"
          className="p-1 rounded-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <NexoLogo size={36} />
        </button>
      </div>

      {/* Main Navigation Items with Authentic WhatsApp Icons */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isSettingsOpen;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group relative w-[54px] py-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'text-[#00a884] dark:text-[#25d366]'
                  : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef]/70 dark:hover:bg-[#374248]/50 hover:text-[#111b21] dark:hover:text-white'
              }`}
            >
              {/* WhatsApp Active Pill Container */}
              <div className={`relative px-3 py-1 rounded-full transition-all ${
                isActive ? 'bg-[#d9fdd3] dark:bg-[#103629] text-[#00a884] dark:text-[#25d366]' : ''
              }`}>
                <Icon className="w-[23px] h-[23px]" active={isActive} />

                {/* Unread badge */}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-[16px] text-[10px] font-bold rounded-full bg-[#25d366] text-[#111b21] flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              {/* Section label in clean regular/medium weight (NOT bold!) */}
              <span className={`text-[11px] font-medium mt-1 tracking-tight ${
                isActive ? 'text-[#111b21] dark:text-white font-semibold' : 'text-[#54656f] dark:text-[#aebac1]'
              }`}>
                {item.label}
              </span>

              {/* Floating Tooltip */}
              <div className="absolute left-[72px] px-2.5 py-1 bg-[#111b21] dark:bg-white text-white dark:text-[#111b21] text-[11.5px] font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pinned strictly at the bottom left: Settings Gear above Profile Photo */}
      <div className="mt-auto flex flex-col items-center gap-2 w-full pb-1">
        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className={`group relative w-[54px] py-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            isSettingsOpen
              ? 'text-[#00a884] dark:text-[#25d366]'
              : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef]/70 dark:hover:bg-[#374248]/50 hover:text-[#111b21] dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-full ${isSettingsOpen ? 'bg-[#d9fdd3] dark:bg-[#103629]' : ''}`}>
            <Settings className="w-[22px] h-[22px]" strokeWidth={1.8} />
          </div>
          <span className={`text-[11px] font-medium mt-1 ${
            isSettingsOpen ? 'text-[#111b21] dark:text-white font-semibold' : 'text-[#54656f] dark:text-[#aebac1]'
          }`}>
            Settings
          </span>

          <div className="absolute left-[72px] px-2.5 py-1 bg-[#111b21] dark:bg-white text-white dark:text-[#111b21] text-[11.5px] font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Settings & Profile
          </div>
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenSettings}
          className="group relative p-0.5 rounded-full ring-2 ring-transparent hover:ring-[#25d366] transition-all cursor-pointer"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={user?.name || 'Profile'}
            className="w-9 h-9 rounded-full object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] rounded-full ring-2 ring-[#f0f2f5] dark:ring-[#202c33]" />

          <div className="absolute left-[72px] px-2.5 py-1 bg-[#111b21] dark:bg-white text-white dark:text-[#111b21] text-[11.5px] font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {user?.name || 'Profile'} ({user?.username || '@username'})
          </div>
        </button>
      </div>
    </nav>
  );
}
