import React, { useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Link, Plus, Check } from 'lucide-react';
import AvatarIcon from './AvatarIcon';

export default function CallsView({ onStartCall }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [callLogs, setCallLogs] = useState([
    {
      id: 'c1',
      name: 'Jordan Lee',
      handle: '@jordan_l',
      type: 'video',
      direction: 'incoming',
      time: 'Yesterday, 8:45 pm',
      missed: false
    },
    {
      id: 'c2',
      name: 'Marcus Vance',
      handle: '@marcus_v',
      type: 'voice',
      direction: 'outgoing',
      time: 'Wednesday, 2:10 pm',
      missed: false
    },
    {
      id: 'c3',
      name: 'Elena Rostova',
      handle: '@elena_r',
      type: 'video',
      direction: 'incoming',
      time: '18 Nov, 11:20 am',
      missed: true
    }
  ]);

  const handleCreateCallLink = () => {
    const link = `https://nexo.chat/call/${Math.random().toString(36).substring(7)}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="flex-1 h-full flex bg-[#f0f2f5] dark:bg-[#0c1317] select-none font-sans overflow-hidden">
      {/* Left Calls List Pane */}
      <div className="w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#2a3942] flex-shrink-0">
        <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 bg-[#f0f2f5] dark:bg-[#202c33] flex-shrink-0">
          <h2 className="text-[17px] font-medium text-[#111b21] dark:text-white">
            Calls
          </h2>
          <button
            onClick={() => {
              onStartCall({
                contact: {
                  name: 'Jordan Lee',
                  handle: '@jordan_l'
                },
                type: 'voice'
              });
            }}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#00a884] cursor-pointer"
            title="Start new call"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/20 dark:divide-[#2a3942]/30">
          {/* Create Call Link Row */}
          <div
            onClick={handleCreateCallLink}
            className="flex items-center gap-3.5 p-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/50 cursor-pointer transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#00a884] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              {copiedLink ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15.5px] font-semibold text-[#111b21] dark:text-white">
                {copiedLink ? 'Link copied to clipboard!' : 'Create call link'}
              </h4>
              <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">
                {copiedLink ? 'Share with anyone to join your Nexo call' : 'Share a link for your Nexo call'}
              </p>
            </div>
          </div>

          {/* Recent Calls Section */}
          <div className="p-3">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] px-1 block mb-2">
              Recent
            </span>

            <div className="space-y-1">
              {callLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarIcon size="md" name={log.name} />
                    <div className="min-w-0">
                      <h4 className={`text-[15px] font-semibold truncate ${
                        log.missed ? 'text-rose-500' : 'text-[#111b21] dark:text-[#e9edef]'
                      }`}>
                        {log.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[12px] text-[#667781] dark:text-[#8696a0]">
                        {log.missed ? (
                          <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
                        ) : log.direction === 'incoming' ? (
                          <PhoneIncoming className="w-3.5 h-3.5 text-[#00a884]" />
                        ) : (
                          <PhoneOutgoing className="w-3.5 h-3.5 text-[#00a884]" />
                        )}
                        <span>{log.time}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartCall({
                      contact: { name: log.name, handle: log.handle },
                      type: log.type
                    })}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#00a884] cursor-pointer"
                    title={`Call ${log.name}`}
                  >
                    {log.type === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Stage for Desktop */}
      <div className="hidden md:flex flex-1 h-full items-center justify-center p-8 bg-[#efeae2]/30 dark:bg-[#0b141a] text-center text-[#8696a0]">
        <div>
          <div className="w-16 h-16 rounded-full bg-[#00a884]/15 text-[#00a884] flex items-center justify-center mx-auto mb-3">
            <Phone className="w-8 h-8" />
          </div>
          <h3 className="text-[18px] font-bold text-[#111b21] dark:text-white">
            Nexo Calls
          </h3>
          <p className="text-[13.5px] max-w-xs mx-auto mt-1">
            Make high-definition encrypted voice and video calls with anyone on Nexo.
          </p>
        </div>
      </div>
    </div>
  );
}
