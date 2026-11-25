import React from 'react';
import { Settings, Briefcase, Code2, Youtube } from 'lucide-react';
import NexoLogo from './NexoLogo';
import AvatarIcon from './AvatarIcon';
import { ChatsIcon, UpdatesIcon, CommunitiesIcon, CallsIcon } from './WhatsAppIcons';
import { useLanguage } from '../contexts/LanguageContext';

export default function NavigationRail({
  activeTab,
  setActiveTab,
  unreadTotal = 0,
  user,
  onOpenSettings,
  isSettingsOpen
}) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'chats', label: t('chats'), icon: ChatsIcon, badge: unreadTotal },
    { id: 'workspace', label: t('workspace'), icon: Briefcase },
    { id: 'prep', label: t('prep'), icon: Code2 },
    { id: 'youtube', label: t('youtube'), icon: Youtube },
    { id: 'updates', label: t('updates'), icon: UpdatesIcon },
    { id: 'communities', label: t('communities'), icon: CommunitiesIcon },
    { id: 'calls', label: t('calls'), icon: CallsIcon },
  ];

  return (
    <nav className="w-[72px] h-full flex flex-col items-center py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-r border-[#d1d7db] dark:border-[#2a3942] select-none flex-shrink-0 z-20 transition-colors overflow-y-auto no-scrollbar">
      {/* Top: Nexo Logo */}
      <div className="mb-3 flex-shrink-0">
        <button
          onClick={() => setActiveTab('chats')}
          title="Nexo"
          className="p-1 rounded-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <NexoLogo size={36} />
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isSettingsOpen;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group relative w-[60px] py-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'text-[#00a884] dark:text-[#25d366]'
                  : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef]/70 dark:hover:bg-[#374248]/50 hover:text-[#111b21] dark:hover:text-white'
              }`}
            >
              <div className={`relative px-3 py-1 rounded-full transition-all ${
                isActive ? 'bg-[#d9fdd3] dark:bg-[#103629] text-[#00a884] dark:text-[#25d366]' : ''
              }`}>
                <Icon className="w-[21px] h-[21px]" active={isActive} />

                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-[16px] text-[10px] font-bold rounded-full bg-[#25d366] text-[#111b21] flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              <span className={`text-[10.5px] font-medium mt-0.5 tracking-tight truncate max-w-[60px] ${
                isActive ? 'text-[#111b21] dark:text-white font-semibold' : 'text-[#54656f] dark:text-[#aebac1]'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom: Settings + Profile */}
      <div className="mt-auto flex flex-col items-center gap-2 w-full pt-3 pb-1 flex-shrink-0">
        <button
          onClick={onOpenSettings}
          className={`group relative w-[60px] py-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            isSettingsOpen
              ? 'text-[#00a884] dark:text-[#25d366]'
              : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef]/70 dark:hover:bg-[#374248]/50 hover:text-[#111b21] dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-full ${isSettingsOpen ? 'bg-[#d9fdd3] dark:bg-[#103629]' : ''}`}>
            <Settings className="w-[21px] h-[21px]" strokeWidth={1.8} />
          </div>
          <span className={`text-[10.5px] font-medium mt-0.5 truncate max-w-[60px] ${
            isSettingsOpen ? 'text-[#111b21] dark:text-white font-semibold' : 'text-[#54656f] dark:text-[#aebac1]'
          }`}>
            {t('settings')}
          </span>
        </button>

        <button
          onClick={onOpenSettings}
          className="group relative p-0.5 rounded-full ring-2 ring-transparent hover:ring-[#25d366] transition-all cursor-pointer"
          title={`${user?.name || 'Profile'} (${user?.username || '@piyush_dev'})`}
        >
          <AvatarIcon size="sm" name={user?.name || 'Piyush Yadav'} showOnline online />
        </button>
      </div>
    </nav>
  );
}
