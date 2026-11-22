import React, { useEffect, useState } from 'react';
import { Lock, LogOut } from 'lucide-react';
import NexoLogo from './NexoLogo';

export default function SyncLoadingScreen({ onFinished, onLogout }) {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(45), 250);
    const timer2 = setTimeout(() => setProgress(80), 700);
    const timer3 = setTimeout(() => setProgress(100), 1250);
    const timerDone = setTimeout(() => {
      if (onFinished) onFinished();
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerDone);
    };
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#fcf5eb] dark:bg-[#0b141a] text-[#111b21] dark:text-[#e9edef] select-none animate-fadeIn font-sans">
      <div className="w-full flex justify-end">
        {/* Optional top spacer */}
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center justify-center text-center max-w-sm w-full space-y-6">
        {/* Exact Nexo Logo */}
        <div className="relative p-2 flex items-center justify-center animate-pulse">
          <NexoLogo size={80} />
        </div>

        {/* WhatsApp-Style Loading Progress Bar */}
        <div className="w-full max-w-[280px] h-[3px] bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00a884] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-[20px] font-bold text-[#111b21] dark:text-white tracking-tight">
            Loading your chats
          </h2>
          <p className="text-[13px] text-[#667781] dark:text-[#8696a0] flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#00a884]" />
            <span>End-to-end encrypted • Synced with your account</span>
          </p>
        </div>

        {/* Log Out Pill Button */}
        <button
          onClick={onLogout}
          className="mt-4 px-4 py-1.5 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-[#54656f] dark:text-[#aebac1] text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>

      {/* Bottom Security Note */}
      <div className="text-center">
        <p className="text-[12px] text-[#8696a0] tracking-wide">
          Nexo for Web • End-to-end encrypted
        </p>
      </div>
    </div>
  );
}
