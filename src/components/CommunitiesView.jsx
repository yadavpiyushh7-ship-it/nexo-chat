import React, { useState } from 'react';
import { Users, Plus, ChevronRight, MessageSquare } from 'lucide-react';
import AvatarIcon from './AvatarIcon';
import { DEFAULT_COMMUNITIES } from '../mockData';

export default function CommunitiesView({ onSelectCommunityGroup }) {
  const [communities, setCommunities] = useState(DEFAULT_COMMUNITIES);
  const [selectedCommunityId, setSelectedCommunityId] = useState('com_1');
  const [isCreating, setIsCreating] = useState(false);
  const [comName, setComName] = useState('');
  const [comDesc, setComDesc] = useState('');

  const selectedCommunity = communities.find((c) => c.id === selectedCommunityId) || communities[0];

  const handleCreateCommunity = (e) => {
    e.preventDefault();
    if (!comName.trim()) return;

    const newCom = {
      id: `com_${Date.now()}`,
      name: comName.trim(),
      avatar: null,
      description: comDesc.trim() || 'New Nexo community workspace.',
      membersCount: 1,
      groups: [
        { id: `g_${Date.now()}`, name: 'General Announcements 📢', unread: 0 },
        { id: `g_${Date.now() + 1}`, name: 'Discussion 💬', unread: 0 }
      ]
    };

    setCommunities([newCom, ...communities]);
    setSelectedCommunityId(newCom.id);
    setComName('');
    setComDesc('');
    setIsCreating(false);
  };

  return (
    <div className="flex-1 h-full flex bg-white dark:bg-[#0b141a] font-sans overflow-hidden">
      {/* Left Communities List */}
      <div className="w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#e9edef] dark:border-[#222e35] flex-shrink-0">
        <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#e9edef] dark:border-[#222e35] bg-white dark:bg-[#111b21] flex-shrink-0 select-none">
          {/* Section label in clean regular/medium weight (NOT bold!) */}
          <h2 className="text-[17px] font-medium text-[#111b21] dark:text-white">
            Communities
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-[12.5px] font-semibold flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Community</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/20 dark:divide-[#2a3942]/30">
          <div className="p-3">
            <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">
              Bring members together in topic-based groups, and easily send admin announcements.
            </p>
          </div>

          {communities.map((com) => {
            const isSelected = selectedCommunityId === com.id;

            return (
              <div
                key={com.id}
                onClick={() => setSelectedCommunityId(com.id)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <AvatarIcon
                    isGroup
                    size="md"
                    name={com.name}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate">
                      {com.name}
                    </h3>
                    <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                      {com.membersCount} members • {com.groups.length} groups
                    </p>
                  </div>
                </div>
                <p className="text-[13px] text-[#667781] dark:text-[#8696a0] line-clamp-2">
                  {com.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Stage: Community Details & Sub-groups */}
      <div className="hidden md:flex flex-1 h-full flex-col bg-[#efeae2]/30 dark:bg-[#0b141a]">
        {selectedCommunity ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="h-[60px] px-6 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AvatarIcon
                  isGroup
                  size="sm"
                  name={selectedCommunity.name}
                />
                <div>
                  <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                    {selectedCommunity.name}
                  </h3>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                    {selectedCommunity.membersCount} members enrolled
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#202c33] shadow-sm border border-black/5 dark:border-white/5 space-y-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#00a884]">
                  Community Overview
                </span>
                <p className="text-[14.5px] text-[#111b21] dark:text-[#e9edef]">
                  {selectedCommunity.description}
                </p>
              </div>

              <div>
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] px-1 block mb-2">
                  Groups in this Community ({selectedCommunity.groups.length})
                </span>
                <div className="space-y-2">
                  {selectedCommunity.groups.map((grp) => (
                    <div
                      key={grp.id}
                      onClick={() => onSelectCommunityGroup && onSelectCommunityGroup(grp.name)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#202c33] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942] shadow-sm border border-black/5 dark:border-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#00a884]/10 text-[#00a884]">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="text-[15px] font-semibold text-[#111b21] dark:text-white">
                          {grp.name}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#8696a0] group-hover:text-[#00a884] transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Create Community Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
            <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white mb-3">
              Create New Community
            </h3>
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#8696a0] uppercase mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  required
                  value={comName}
                  onChange={(e) => setComName(e.target.value)}
                  placeholder="e.g. Design Systems Working Group"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] text-[#111b21] dark:text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#8696a0] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={comDesc}
                  onChange={(e) => setComDesc(e.target.value)}
                  placeholder="What is the purpose of this community?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] text-[#111b21] dark:text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-[13.5px] text-[#667781] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!comName.trim()}
                  className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white text-[13.5px] font-semibold shadow-md shadow-[#00a884]/20 cursor-pointer"
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
