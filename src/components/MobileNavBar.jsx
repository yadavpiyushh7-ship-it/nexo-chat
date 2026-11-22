import React from 'react';
import { ChatsIcon, UpdatesIcon, CommunitiesIcon, CallsIcon } from './WhatsAppIcons';

export default function MobileNavBar({ activeTab, setActiveTab, unreadTotal = 0 }) {
  const tabs = [
    { id: 'chats', label: 'Chats', icon: ChatsIcon, badge: unreadTotal },
    { id: 'updates', label: 'Updates', icon: UpdatesIcon },
    { id: 'communities', label: 'Communities', icon: CommunitiesIcon },
    { id: 'calls', label: 'Calls', icon: CallsIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[62px] bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-around z-30 select-none px-2 transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer"
          >
            <div className={`relative px-4 py-0.5 rounded-full transition-all ${
              isActive ? 'bg-[#d9fdd3] dark:bg-[#103629] text-[#00a884] dark:text-[#25d366]' : 'text-[#54656f] dark:text-[#8696a0]'
            }`}>
              <Icon className="w-[22px] h-[22px]" active={isActive} />

              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-0.5 px-1 min-w-[15px] h-[15px] text-[9.5px] font-bold rounded-full bg-[#25d366] text-[#111b21] flex items-center justify-center shadow">
                  {tab.badge}
                </span>
              ) : null}
            </div>

            <span className={`text-[11px] font-medium mt-0.5 ${
              isActive ? 'text-[#111b21] dark:text-white font-semibold' : 'text-[#54656f] dark:text-[#8696a0]'
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
