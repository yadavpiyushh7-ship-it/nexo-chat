import React, { useState } from 'react';
import { Megaphone, Plus, Check, ShieldCheck, Users, Search, Bell } from 'lucide-react';
import { DEFAULT_CHANNELS } from '../mockData';

export default function ChannelsView({ user }) {
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [selectedChannelId, setSelectedChannelId] = useState('ch_1');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];

  const handleToggleFollow = (id) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isFollowing: !ch.isFollowing } : ch))
    );
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const newCh = {
      id: `ch_${Date.now()}`,
      name: newChannelName.trim(),
      handle: `@${newChannelName.trim().toLowerCase().replace(/\s+/g, '_')}`,
      avatar: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=150',
      verified: true,
      followers: '1',
      description: newChannelDesc.trim() || 'New broadcast channel on Nexo.',
      isFollowing: true,
      recentUpdate: {
        text: 'Welcome to the channel! All official announcements will be broadcast here.',
        time: 'Just now'
      }
    };

    setChannels([newCh, ...channels]);
    setSelectedChannelId(newCh.id);
    setNewChannelName('');
    setNewChannelDesc('');
    setIsCreatingChannel(false);
  };

  return (
    <div className="flex-1 h-full flex bg-[#f0f2f5] dark:bg-[#0c1317] select-none font-sans overflow-hidden">
      {/* Left Channels List Pane */}
      <div className="w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#2a3942] flex-shrink-0">
        <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 bg-[#f0f2f5] dark:bg-[#202c33] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-[19px] font-bold text-[#111b21] dark:text-white">
              Channels
            </h2>
          </div>
          <button
            onClick={() => setIsCreatingChannel(true)}
            className="px-3 py-1.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-[12.5px] font-semibold flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/20 dark:divide-[#2a3942]/30">
          <div className="p-3">
            <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">
              Stay updated on topics you care about. Find and follow channels below.
            </p>
          </div>

          {channels.map((ch) => {
            const isSelected = selectedChannelId === ch.id;

            return (
              <div
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/50'
                }`}
              >
                <img
                  src={ch.avatar}
                  alt={ch.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1 truncate">
                      <h3 className="text-[15.5px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate">
                        {ch.name}
                      </h3>
                      {ch.verified && (
                        <ShieldCheck className="w-4 h-4 text-[#00a884] flex-shrink-0 inline" />
                      )}
                    </div>
                  </div>
                  <p className="text-[13px] text-[#667781] dark:text-[#8696a0] truncate">
                    {ch.description}
                  </p>
                  <span className="text-[11.5px] text-[#8696a0] mt-0.5 block">
                    {ch.followers} followers
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFollow(ch.id);
                  }}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer flex-shrink-0 ${
                    ch.isFollowing
                      ? 'bg-slate-200 dark:bg-white/10 text-[#111b21] dark:text-white'
                      : 'bg-[#00a884] text-white hover:bg-[#008f6f]'
                  }`}
                >
                  {ch.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Stage: Selected Channel Feed */}
      <div className="flex-1 h-full flex flex-col bg-[#efeae2]/30 dark:bg-[#0b141a]">
        {selectedChannel ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Channel Banner */}
            <div className="h-[60px] px-6 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedChannel.avatar}
                  alt={selectedChannel.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                      {selectedChannel.name}
                    </h3>
                    {selectedChannel.verified && (
                      <ShieldCheck className="w-4 h-4 text-[#00a884]" />
                    )}
                  </div>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                    {selectedChannel.handle} • {selectedChannel.followers} followers
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleFollow(selectedChannel.id)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedChannel.isFollowing
                    ? 'bg-slate-200 dark:bg-white/10 text-[#111b21] dark:text-white'
                    : 'bg-[#00a884] text-white hover:bg-[#008f6f]'
                }`}
              >
                {selectedChannel.isFollowing ? 'Following' : 'Follow Channel'}
              </button>
            </div>

            {/* Broadcast Updates List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-white dark:bg-[#202c33] shadow-sm border border-black/5 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[12px] text-[#8696a0]">
                  <span className="font-semibold text-[#00a884]">Official Broadcast</span>
                  <span>{selectedChannel.recentUpdate?.time || 'Today'}</span>
                </div>
                <p className="text-[15.5px] leading-relaxed text-[#111b21] dark:text-[#e9edef]">
                  {selectedChannel.recentUpdate?.text}
                </p>
                <div className="flex items-center gap-3 pt-2 text-[12.5px] text-[#8696a0]">
                  <span>👍 142</span>
                  <span>🔥 89</span>
                  <span>💬 Broadcast only</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Create Channel Modal */}
      {isCreatingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
            <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white mb-3">
              Create a Broadcast Channel
            </h3>
            <p className="text-[12.5px] text-[#8696a0] mb-4">
              Anyone can discover your channel and read updates. Followers cannot see other followers.
            </p>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#8696a0] uppercase mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. AI Research Club"
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
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="Describe what your channel will share..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] text-[#111b21] dark:text-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingChannel(false)}
                  className="px-4 py-2 rounded-xl text-[13.5px] text-[#667781] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newChannelName.trim()}
                  className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white text-[13.5px] font-semibold shadow-md shadow-[#00a884]/20 cursor-pointer"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
