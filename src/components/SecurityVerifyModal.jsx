import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, X, CheckCircle2, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { computeSafetyNumber } from '../lib/e2ee';

export default function SecurityVerifyModal({ isOpen, onClose, chat, myPublicJwk }) {
  const [safetyData, setSafetyData] = useState({ formatted: '', blocks: [], raw: '' });
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !chat) return;
    let mounted = true;
    computeSafetyNumber(myPublicJwk, chat.publicKeyJwk || chat.handle || chat.id).then((res) => {
      if (mounted) setSafetyData(res);
    });
    try {
      const saved = localStorage.getItem(`nexo_verified_${chat.id}`) === 'true';
      setVerified(saved);
    } catch {}
    return () => {
      mounted = false;
    };
  }, [isOpen, chat, myPublicJwk]);

  if (!isOpen || !chat) return null;

  const handleToggleVerified = () => {
    const next = !verified;
    setVerified(next);
    try {
      localStorage.setItem(`nexo_verified_${chat.id}`, String(next));
    } catch {}
  };

  const handleCopy = () => {
    if (!safetyData.formatted) return;
    navigator.clipboard?.writeText(safetyData.formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#111b21] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                Verify Security Code
              </h3>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                {chat.name} ({chat.handle || '@peer'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-center">
          {/* QR Fingerprint */}
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-white shadow-md border border-slate-200 inline-flex flex-col items-center">
              <QRCodeSVG
                value={`nexo-e2ee://verify?peer=${encodeURIComponent(chat.handle || chat.id)}&fp=${safetyData.raw.slice(0, 32)}`}
                size={164}
                level="M"
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11.5px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ECDH P-256 • AES-GCM 256-Bit</span>
            </div>
            <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] leading-relaxed max-w-sm mx-auto pt-1">
              To verify that messages and calls with <strong>{chat.name}</strong> are end-to-end encrypted, compare this 60-digit safety number on their device.
            </p>
          </div>

          {/* 60-Digit Safety Number Grid */}
          <div className="p-3.5 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] border border-black/5 dark:border-white/5">
            <div className="grid grid-cols-4 gap-y-2 gap-x-2 font-mono text-[13.5px] font-bold text-[#111b21] dark:text-[#e9edef] tracking-wider">
              {safetyData.blocks.map((blk, i) => (
                <span key={i} className="py-1 rounded-lg bg-white/70 dark:bg-[#111b21]/70">
                  {blk}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 text-[12px] font-semibold text-[#0055ff] dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Safety Number Copied' : 'Copy 60-Digit Safety Number'}</span>
            </button>
          </div>

          {/* Mark Verified Button */}
          <button
            type="button"
            onClick={handleToggleVerified}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
              verified
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-[#0055ff] hover:bg-[#0044cc] text-white shadow-md shadow-[#0055ff]/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{verified ? 'Verified Contact Fingerprint ✓' : 'Mark Security Code as Verified'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
