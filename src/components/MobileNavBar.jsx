import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { ChatsIcon, CommunitiesIcon, CallsIcon } from './WhatsAppIcons';
import { useLanguage } from '../contexts/LanguageContext';

export default function MobileNavBar({ activeTab, setActiveTab, unreadTotal = 0 }) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'chats', label: t('chats'), icon: ChatsIcon, badge: unreadTotal },
    { id: 'communities', label: t('communities'), icon: CommunitiesIcon },
    { id: 'calls', label: t('calls'), icon: CallsIcon },
    { id: 'hub', label: 'Hub', icon: LayoutGrid },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-white/95 dark:bg-[#111b21]/95 backdrop-blur-md border-t border-[#d1d7db]/80 dark:border-[#222e35] flex items-center justify-around z-30 select-none px-2 transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer min-w-0"
          >
            <div className={`relative px-4 py-1 rounded-full transition-all ${
              isActive ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#00a884] dark:text-[#25d366]' : 'text-[#54656f] dark:text-[#8696a0]'
            }`}>
              <Icon className="w-[21px] h-[21px]" active={isActive} />

              {tab.badge && tab.badge > 0 ? (
                <span className="font-numeric absolute -top-0.5 right-0.5 px-1.5 min-w-[16px] h-[16px] text-[10px] font-bold rounded-full bg-[#00a884] text-white flex items-center justify-center shadow">
                  {tab.badge}
                </span>
              ) : null}
            </div>

            <span className={`text-[11px] font-medium mt-0.5 truncate max-w-full px-1 ${
              isActive ? 'text-[#111b21] dark:text-white font-bold' : 'text-[#54656f] dark:text-[#8696a0]'
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
