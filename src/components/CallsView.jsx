import React, { useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Link, Plus, Check, ExternalLink, FileText } from 'lucide-react';
import AvatarIcon from './AvatarIcon';
import { useGoogleAuth, launchInstantGoogleMeet } from '../lib/googleApis';

export default function CallsView({ user, onStartCall, onOpenMeetAndMoM }) {
  const { token: googleToken } = useGoogleAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [meetNotice, setMeetNotice] = useState('');
  const [callLogs] = useState([
    {
      id: 'c_bot',
      name: 'Placement Bot',
      handle: '@placement_bot',
      type: 'video',
      direction: 'outgoing',
      time: 'Mock HR & DSA Practice Ready',
      missed: false
    },
    {
      id: 'c_dsa',
      name: 'DSA & Coding Prep Squad',
      handle: '@dsa_prep_2027',
      type: 'video',
      direction: 'incoming',
      time: 'Live Study Room',
      missed: false
    }
  ]);

  const handleCreateCallLink = () => {
    const handle = user?.username || '@piyush_dev';
    const link = `https://nexo-chat-pi.vercel.app/?connect=${encodeURIComponent(handle)}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="flex-1 h-full flex bg-white dark:bg-[#0b141a] font-sans overflow-hidden">
      <div className="w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#e9edef] dark:border-[#222e35] flex-shrink-0">
        <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#e9edef] dark:border-[#222e35] bg-white dark:bg-[#111b21] flex-shrink-0 select-none">
          <h2 className="text-[17px] font-medium text-[#111b21] dark:text-white">
            Mock Interview & Peer Calls
          </h2>
          <button
            onClick={() => {
              onStartCall({
                contact: {
                  name: 'Placement Bot',
                  handle: '@placement_bot'
                },
                type: 'video'
              });
            }}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#0055ff] cursor-pointer"
            title="Start mock interview call"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/20 dark:divide-[#2a3942]/30 pb-20 md:pb-4">
          {/* Prominent Google Meet & AI MoM Top Banner */}
          <div className="p-3.5 bg-gradient-to-r from-[#0055ff]/10 via-[#00a884]/10 to-emerald-500/10 border-b border-[#0055ff]/20 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Video className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[14px] font-bold text-[#111b21] dark:text-white leading-tight">
                  Start / Schedule Google Meet & AI MoM
                </h4>
                <p className="text-[11.5px] text-[#667781] dark:text-[#8696a0]">
                  Instant meeting link & automated Minutes of Meeting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setMeetNotice('');
                  const res = await launchInstantGoogleMeet({
                    accessToken: googleToken,
                    onErrorToast: (msg) => setMeetNotice(msg),
                  });
                  if (res?.createdViaMeetApi && res.meetingUri) {
                    setMeetNotice(`Created Meet: ${res.meetingUri}`);
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Create Instant Meet</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenMeetAndMoM?.()}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Meet & AI MoM</span>
              </button>
            </div>
            {meetNotice && (
              <p className="text-[11.5px] font-medium text-[#00a884] dark:text-amber-300 select-text cursor-text">
                {meetNotice}
              </p>
            )}
          </div>

          <div
            onClick={handleCreateCallLink}
            className="flex items-center gap-3.5 p-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/50 cursor-pointer transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#0055ff] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              {copiedLink ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15.5px] font-semibold text-[#111b21] dark:text-white">
                {copiedLink ? 'Mock call link copied!' : 'Create mock interview link'}
              </h4>
              <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">
                {copiedLink ? 'Share with peers via @username' : 'Invite CSE peers for pair coding or HR practice'}
              </p>
            </div>
          </div>

          <div className="p-3">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] px-1 block mb-2">
              Recent Peer Calls
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
                        {log.name} <span className="text-[12px] font-normal text-[#0055ff]">{log.handle}</span>
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
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#0055ff] cursor-pointer"
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

      <div className="hidden md:flex flex-1 h-full items-center justify-center p-8 bg-[#efeae2]/30 dark:bg-[#0b141a] text-center text-[#8696a0]">
        <div>
          <div className="w-16 h-16 rounded-full bg-[#0055ff]/15 text-[#0055ff] flex items-center justify-center mx-auto mb-3">
            <Phone className="w-8 h-8" />
          </div>
          <h3 className="text-[18px] font-bold text-[#111b21] dark:text-white">
            Peer Coding & Mock Interviews
          </h3>
          <p className="text-[13.5px] max-w-xs mx-auto mt-1">
            Encrypted HD audio and video calls via @username without exposing personal phone numbers.
          </p>
        </div>
      </div>
    </div>
  );
}
