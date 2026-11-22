import React, { useState, useEffect } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  Sparkles,
  Maximize2
} from 'lucide-react';

export default function CallModal({ call, onEndCall }) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const isVideoCall = call?.type === 'video';

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-[#111b21] text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative aspect-[4/3] sm:aspect-[16/10]">
        {/* Call Header */}
        <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[13px] font-medium text-emerald-400">
              End-to-End Encrypted Call
            </span>
          </div>
          <span className="text-[14px] font-mono font-semibold text-slate-300">
            {formatTime(callDuration)}
          </span>
        </div>

        {/* Call Center Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          {isVideoCall && !isVideoOff ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
              <img
                src={call.contact?.avatar}
                alt={call.contact?.name}
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium">
                {call.contact?.name}
              </div>
              {/* Picture-in-picture user preview */}
              <div className="absolute bottom-3 right-3 w-28 h-20 rounded-xl overflow-hidden border-2 border-white/30 bg-black/80 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#00C896] via-[#00A3FF] to-[#7928CA] animate-pulse">
                  <img
                    src={call.contact?.avatar}
                    alt={call.contact?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>

              <h2 className="text-[22px] font-bold tracking-tight text-white">
                {call.contact?.name}
              </h2>
              <p className="text-[13.5px] text-[#00a884] font-medium mt-0.5">
                {call.contact?.handle || '@contact'}
              </p>
              <p className="text-[13px] text-slate-400 mt-1">
                {isVideoCall ? 'Nexo Video Call' : 'Nexo Voice Call'}
              </p>
            </div>
          )}
        </div>

        {/* Call Controls Bar */}
        <div className="p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center gap-4 z-10">
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted ? 'bg-rose-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          {isVideoCall && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Volume */}
          <button
            className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Speaker"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
