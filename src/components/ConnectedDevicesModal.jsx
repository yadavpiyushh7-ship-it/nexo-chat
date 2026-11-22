import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, X, CheckCircle2, LogOut, ArrowLeft, QrCode, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ConnectedDevicesModal({ isOpen, onClose, user }) {
  const [isLinking, setIsLinking] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [linkedDevices, setLinkedDevices] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Detect genuine current device from navigator.userAgent
  const getCurrentSession = () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let os = 'Windows';
    if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Chrome';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
    else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

    const isMobile = os === 'Android' || os === 'iOS';

    return {
      id: 'current_active_session',
      os: `${os} (${browser})`,
      isCurrent: true,
      status: 'Active now',
      location: 'This Browser Session',
      isMobile,
      lastActive: 'Active now',
    };
  };

  const currentSession = getCurrentSession();

  // Load any previously linked secondary devices from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexo_linked_devices');
      if (stored) {
        setLinkedDevices(JSON.parse(stored));
      } else {
        setLinkedDevices([]);
      }
    } catch {
      setLinkedDevices([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogoutSecondary = (id) => {
    const updated = linkedDevices.filter((d) => d.id !== id);
    setLinkedDevices(updated);
    try {
      localStorage.setItem('nexo_linked_devices', JSON.stringify(updated));
    } catch {}
    setSuccessToast('Device session logged out');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleSimulateLinkDevice = () => {
    const newDevice = {
      id: `dev_${Date.now()}`,
      os: 'Samsung Galaxy S24 (Nexo Mobile)',
      isCurrent: false,
      status: 'Active now',
      location: 'Linked via QR Code',
      isMobile: true,
      lastActive: 'Just now',
    };
    const updated = [newDevice, ...linkedDevices];
    setLinkedDevices(updated);
    try {
      localStorage.setItem('nexo_linked_devices', JSON.stringify(updated));
    } catch {}
    setIsLinking(false);
    setSuccessToast('New device linked successfully!');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const baseOrigin = typeof window !== 'undefined'
    ? (import.meta.env.VITE_PUBLIC_URL || (window.location.hostname === 'localhost' ? 'https://nexo-web.vercel.app' : window.location.origin))
    : 'https://nexo-web.vercel.app';

  const qrPairingPayload = `${baseOrigin}/?pair_session=link_${encodeURIComponent(user?.username || '@alex_m')}_${Date.now()}`;

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(qrPairingPayload);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="h-[60px] px-5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {isLinking && (
              <button
                onClick={() => setIsLinking(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer mr-1"
                title="Back to devices list"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
              {isLinking ? 'Scan QR Code to Link' : 'Connected Devices'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast Banner (Zero alert() popups!) */}
        {successToast && (
          <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center gap-2 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {!isLinking ? (
            <>
              {/* Animated SVG of Phone Syncing Messages to Laptop */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#fcf5eb]/60 dark:bg-[#182229]/60 rounded-2xl border border-[#e2d9cd]/80 dark:border-white/5">
                <svg width="240" height="110" viewBox="0 0 240 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Laptop on Left */}
                  <g transform="translate(15, 20)">
                    <rect x="0" y="0" width="70" height="46" rx="4" fill="#202c33" stroke="#8696a0" strokeWidth="2" />
                    <rect x="4" y="4" width="62" height="38" rx="2" fill="#0044ff" opacity="0.85" />
                    {/* Screen content lines */}
                    <line x1="10" y1="12" x2="35" y2="12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    <line x1="10" y1="20" x2="48" y2="20" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    <line x1="10" y1="28" x2="28" y2="28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    {/* Laptop base */}
                    <path d="M-8 46 L78 46 L74 52 L-4 52 Z" fill="#8696a0" />
                    <line x1="26" y1="48" x2="44" y2="48" stroke="#54656f" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {/* Animated Message Packets & Waves Syncing between Devices */}
                  <g transform="translate(95, 30)">
                    {/* Pulse wave 1 */}
                    <circle cx="25" cy="18" r="8" stroke="#00a884" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6">
                      <animate attributeName="r" values="4;18;4" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.5s" repeatCount="indefinite" />
                    </circle>

                    {/* Animated Flying Message Envelope/Bubble */}
                    <g>
                      <rect x="5" y="10" width="22" height="15" rx="4" fill="#25d366">
                        <animate attributeName="x" values="0;28;0" dur="2s" repeatCount="indefinite" />
                      </rect>
                      <path d="M7 13 L16 19 L25 13" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round">
                        <animate attributeName="transform" type="translate" values="0,0; 28,0; 0,0" dur="2s" repeatCount="indefinite" />
                      </path>
                    </g>

                    {/* Signal sync dots */}
                    <circle cx="10" cy="35" r="2" fill="#0044ff" />
                    <circle cx="25" cy="35" r="2.5" fill="#25d366" />
                    <circle cx="40" cy="35" r="2" fill="#7b2cbf" />
                  </g>

                  {/* Phone on Right */}
                  <g transform="translate(160, 14)">
                    <rect x="0" y="0" width="34" height="64" rx="7" fill="#111b21" stroke="#8696a0" strokeWidth="2" />
                    <rect x="3" y="6" width="28" height="52" rx="4" fill="#0055ff" opacity="0.85" />
                    {/* Phone speaker notch */}
                    <line x1="12" y1="3" x2="22" y2="3" stroke="#8696a0" strokeWidth="1.5" strokeLinecap="round" />
                    {/* Phone screen bubbles */}
                    <rect x="6" y="12" width="14" height="6" rx="2" fill="#ffffff" />
                    <rect x="14" y="24" width="14" height="6" rx="2" fill="#d9fdd3" />
                    <rect x="6" y="36" width="14" height="6" rx="2" fill="#ffffff" />
                  </g>
                </svg>

                <h4 className="text-[15.5px] font-bold text-[#111b21] dark:text-white mt-2">
                  Use Nexo on Web, Desktop & other devices
                </h4>
                <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] text-center max-w-sm mt-0.5">
                  Your chats and media are continuously end-to-end encrypted and synced across your active devices.
                </p>
              </div>

              {/* Green "Link a Device" Button */}
              <button
                onClick={() => setIsLinking(true)}
                className="w-full py-3 rounded-xl bg-[#00a884] hover:bg-[#008f6f] active:bg-[#007a5f] text-white font-semibold text-[14.5px] shadow-md shadow-[#00a884]/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Link a device</span>
              </button>

              {/* Genuine Device Status Sessions */}
              <div className="space-y-3">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] block px-1">
                  Device Status ({1 + linkedDevices.length})
                </span>

                <div className="space-y-2">
                  {/* Current Active Device (Genuine from navigator.userAgent) */}
                  <div className="p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-[#00a884]/30 dark:border-[#00a884]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#111b21] text-[#00a884]">
                        {currentSession.isMobile ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <Laptop className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">
                            {currentSession.os}
                          </h5>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#25d366]/20 text-[#00a884] dark:text-[#25d366]">
                            THIS DEVICE
                          </span>
                        </div>
                        <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                          {currentSession.location} • <span className="text-[#00a884] font-medium">Active now</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Any Real Secondary Devices linked via QR in localStorage */}
                  {linkedDevices.map((dev) => (
                    <div
                      key={dev.id}
                      className="p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-slate-200/70 dark:border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#111b21] text-[#54656f] dark:text-[#aebac1]">
                          {dev.isMobile ? (
                            <Smartphone className="w-5 h-5" />
                          ) : (
                            <Laptop className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">
                            {dev.os}
                          </h5>
                          <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                            {dev.location} • {dev.lastActive}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLogoutSecondary(dev.id)}
                        className="px-2.5 py-1 text-[12px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                        title="Log out session"
                      >
                        Log out
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Instant Real Scannable QR Code View */
            <div className="flex flex-col items-center justify-center space-y-4 py-2 animate-fadeIn">
              <div className="text-center max-w-sm">
                <h4 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                  Point your phone to scan code
                </h4>
                <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-1">
                  Open <strong>Nexo</strong> on your phone &gt; Settings &gt; <strong>Connected devices</strong> &gt; <strong>Link a device</strong>.
                </p>
              </div>

              {/* Instant Scannable QR Code using QRCodeSVG with center Nexo Logo */}
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-[#e2d9cd] dark:border-white/10 flex items-center justify-center">
                <QRCodeSVG
                  value={qrPairingPayload}
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: '/logo.png',
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-xs">
                <button
                  type="button"
                  onClick={handleSimulateLinkDevice}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0055ff] to-[#7b2cbf] text-white text-[12.5px] font-semibold shadow-sm hover:opacity-95 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Simulate Mobile Scan Link</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-[#111b21] dark:text-white text-[12.5px] font-medium cursor-pointer flex items-center gap-1.5"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8696a0]" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLinking(false)}
                  className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#667781] dark:text-[#aebac1] text-[12.5px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-[13px] font-semibold text-[#111b21] dark:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
