import React, { useState } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';
import NexoLogo from './NexoLogo';

export default function AppLockScreen({ correctPin, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const next = pin + num;
      setPin(next);
      setError(false);
      if (next.length === 4) {
        if (next === correctPin) {
          setTimeout(() => onUnlock(), 150);
        } else {
          setTimeout(() => {
            setError(true);
            setPin('');
          }, 300);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#fcf5eb] dark:bg-[#0b141a] text-[#111b21] dark:text-[#e9edef] select-none animate-fadeIn font-sans">
      <div className="w-full flex justify-end" />

      <div className="flex flex-col items-center justify-center text-center max-w-xs w-full space-y-6">
        <NexoLogo size={64} />

        <div className="space-y-1">
          <h2 className="text-[22px] font-bold text-[#111b21] dark:text-white tracking-tight">
            Nexo is Locked
          </h2>
          <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">
            Enter your 4-digit PIN to unlock
          </p>
        </div>

        {/* 4 PIN Dots */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((i) => {
            const isFilled = i < pin.length;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 ring-2 ring-rose-500'
                    : isFilled
                    ? 'bg-[#00a884] scale-110'
                    : 'bg-slate-300 dark:bg-white/20'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-[12.5px] font-semibold text-rose-500 animate-shake">
            Incorrect PIN. Try again.
          </p>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] pt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(String(n))}
              className="w-16 h-16 rounded-full bg-white dark:bg-[#202c33] hover:bg-slate-100 dark:hover:bg-[#2a3942] text-[20px] font-bold text-[#111b21] dark:text-white shadow-sm flex items-center justify-center cursor-pointer transition-transform active:scale-90"
            >
              {n}
            </button>
          ))}
          <div className="w-16 h-16" />
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-white dark:bg-[#202c33] hover:bg-slate-100 dark:hover:bg-[#2a3942] text-[20px] font-bold text-[#111b21] dark:text-white shadow-sm flex items-center justify-center cursor-pointer transition-transform active:scale-90"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] flex items-center justify-center cursor-pointer transition-transform active:scale-90"
            title="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="text-center text-[12px] text-[#8696a0]">
        <span>Nexo App Lock • Protected</span>
      </div>
    </div>
  );
}
