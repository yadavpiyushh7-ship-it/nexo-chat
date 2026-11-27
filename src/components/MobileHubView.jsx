import React, { useState, useEffect } from 'react';
import { Briefcase, Code2 } from 'lucide-react';
import { YouTubeLecturesIcon } from './WhatsAppIcons';
import WorkspaceHubView from './WorkspaceHubView';
import EdTechPrepView from './EdTechPrepView';
import YouTubeHubView from './YouTubeHubView';

export default function MobileHubView({
  user = null,
  chats = [],
  onSendMessageToChat,
  onSaveToVault,
  onShowToast,
  initialSubTab = 'workspace',
  workspaceInitialTab = 'gmail',
}) {
  const [subTab, setSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <div className="flex-1 h-full flex flex-col bg-white dark:bg-[#0b141a] overflow-hidden pb-16 md:pb-0">
      {/* Segmented Hub Switcher (Workspace, Prep Hub, Lectures) */}
      <div className="px-3 py-2.5 bg-white dark:bg-[#111b21] border-b border-[#e9edef] dark:border-[#222e35] flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0 select-none">
        {[
          { id: 'workspace', label: 'Workspace', icon: Briefcase },
          { id: 'prep', label: 'Prep Hub', icon: Code2 },
          { id: 'lectures', label: 'Lectures', icon: YouTubeLecturesIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 justify-center px-3 py-2 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all duration-150 ${
                active
                  ? 'bg-[#00a884] text-white shadow-xs'
                  : 'bg-white dark:bg-[#111b21] text-[#54656f] dark:text-[#aebac1] border border-black/5 dark:border-[#222e35]'
              }`}
            >
              <Icon className="w-4 h-4" active={tab.id === 'lectures' ? active : undefined} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {subTab === 'workspace' ? (
          <WorkspaceHubView
            user={user}
            chats={chats}
            onSendMessageToChat={onSendMessageToChat}
            onSaveToVault={onSaveToVault}
            onShowToast={onShowToast}
            initialTab={workspaceInitialTab}
          />
        ) : subTab === 'prep' ? (
          <EdTechPrepView
            chats={chats}
            onSendMessageToChat={onSendMessageToChat}
            onSaveToVault={onSaveToVault}
            onShowToast={onShowToast}
          />
        ) : (
          <YouTubeHubView
            chats={chats}
            onSendMessageToChat={onSendMessageToChat}
            onSaveToVault={onSaveToVault}
            onShowToast={onShowToast}
          />
        )}
      </div>
    </div>
  );
}
