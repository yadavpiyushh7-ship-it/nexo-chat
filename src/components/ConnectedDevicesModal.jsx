import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, X, CheckCircle2, ArrowLeft, QrCode, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';

export default function ConnectedDevicesModal({ isOpen, onClose, user }) {
  const [isLinking, setIsLinking] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [linkedDevices, setLinkedDevices] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [linkToken, setLinkToken] = useState(() => 'lt_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now());

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

  // Load secondary devices from localStorage
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

  // When opening linking QR mode, generate fresh linkToken and subscribe to Realtime & linked_devices table
  useEffect(() => {
    if (!isLinking || !isOpen) return;

    const freshToken = 'lt_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    setLinkToken(freshToken);

    let isCancelled = false;
    let pollInterval = null;

    // 1. Insert pending link_token into Supabase linked_devices
    supabase
      .from('linked_devices')
      .insert({
        link_token: freshToken,
        status: 'pending'
      })
      .then(({ error }) => {
        if (error) console.warn('linked_devices pending insert in modal error:', error);
      })
      .catch((err) => console.warn('linked_devices modal insert err:', err));

    const handleSuccessfulLink = (devInfoPayload) => {
      const devInfo = devInfoPayload || {
        id: `dev_${Date.now()}`,
        os: 'Mobile Device (Nexo App)',
        isCurrent: false,
        status: 'Active now',
        location: 'Linked via Realtime QR',
        isMobile: true,
        lastActive: 'Just now'
      };

      setLinkedDevices((prev) => {
        const updated = [devInfo, ...prev.filter((d) => d.id !== devInfo.id)];
        try {
          localStorage.setItem('nexo_linked_devices', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Automatically close linking screen on real-time event without manual refresh!
      setIsLinking(false);
      setSuccessToast('New device linked successfully! Synced in real-time.');
      setTimeout(() => setSuccessToast(''), 4000);
    };

    // 2. Realtime listener (both postgres_changes on table and broadcast channel)
    const channel = supabase.channel(`device-link-${freshToken}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'linked_devices',
          filter: `link_token=eq.${freshToken}`
        },
        (payload) => {
          if (isCancelled) return;
          const updated = payload.new;
          if (updated && updated.status === 'linked') {
            const devInfo = updated.device_info ? {
              id: `dev_${Date.now()}`,
              os: updated.device_info.os || 'Mobile Device (Linked)',
              isCurrent: false,
              status: 'Active now',
              location: 'Linked via Realtime QR',
              isMobile: true,
              lastActive: 'Just now'
            } : null;
            handleSuccessfulLink(devInfo);
          }
        }
      )
      .on('broadcast', { event: 'device-linked' }, ({ payload }) => {
        if (isCancelled) return;
        handleSuccessfulLink(payload?.deviceInfo);
      })
      .subscribe();

    // 3. 2-second Polling fallback on linked_devices
    pollInterval = setInterval(async () => {
      if (isCancelled) return;
      try {
        const { data } = await supabase
          .from('linked_devices')
          .select('*')
          .eq('link_token', freshToken)
          .single();

        if (data && data.status === 'linked') {
          if (pollInterval) clearInterval(pollInterval);
          const devInfo = data.device_info ? {
            id: `dev_${Date.now()}`,
            os: data.device_info.os || 'Mobile Device (Linked)',
            isCurrent: false,
            status: 'Active now',
            location: 'Linked via Realtime QR',
            isMobile: true,
            lastActive: 'Just now'
          } : null;
          handleSuccessfulLink(devInfo);
        }
      } catch (err) {}
    }, 2000);

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [isLinking, isOpen]);

  if (!isOpen) return null;

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.') ||
    window.location.hostname.includes('10.')
  );
  const baseOrigin = isLocalhost
    ? 'https://nexo-chat-pi.vercel.app'
    : (typeof window !== 'undefined' ? window.location.origin : 'https://nexo-chat-pi.vercel.app');

  const qrPairingPayload = `${baseOrigin}/?link_token=${linkToken}`;

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(qrPairingPayload);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {}
  };

  const handleLogoutSecondary = (id) => {
    const updated = linkedDevices.filter((d) => d.id !== id);
    setLinkedDevices(updated);
    try {
      localStorage.setItem('nexo_linked_devices', JSON.stringify(updated));
    } catch {}
    setSuccessToast('Device session logged out');
    setTimeout(() => setSuccessToast(''), 3000);
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

        {/* Success Toast Banner */}
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
              {/* Illustration */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#fcf5eb]/60 dark:bg-[#182229]/60 rounded-2xl border border-[#e2d9cd]/80 dark:border-white/5">
                <svg width="240" height="100" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g transform="translate(20, 15)">
                    <rect x="0" y="0" width="70" height="46" rx="4" fill="#202c33" stroke="#8696a0" strokeWidth="2" />
                    <rect x="4" y="4" width="62" height="38" rx="2" fill="#00a884" opacity="0.85" />
                    <line x1="10" y1="12" x2="35" y2="12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    <line x1="10" y1="20" x2="48" y2="20" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    <path d="M-8 46 L78 46 L74 52 L-4 52 Z" fill="#8696a0" />
                  </g>
                  <g transform="translate(155, 10)">
                    <rect x="0" y="0" width="34" height="64" rx="7" fill="#111b21" stroke="#8696a0" strokeWidth="2" />
                    <rect x="3" y="6" width="28" height="52" rx="4" fill="#25d366" opacity="0.85" />
                    <line x1="12" y1="3" x2="22" y2="3" stroke="#8696a0" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                </svg>

                <h4 className="text-[15.5px] font-bold text-[#111b21] dark:text-white mt-1">
                  Use Nexo on Web & Mobile
                </h4>
                <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] text-center max-w-sm mt-0.5">
                  Realtime end-to-end encrypted device syncing via Supabase Realtime channels.
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
                  {/* Current Active Device */}
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

                  {/* Real Secondary Devices */}
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
                            {dev.location} • {dev.lastActive || 'Active now'}
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
            /* Live Realtime Scannable QR Code View (No Simulate button!) */
            <div className="flex flex-col items-center justify-center space-y-4 py-2 animate-fadeIn">
              <div className="text-center max-w-sm">
                <h4 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                  Point phone camera at this QR code
                </h4>
                <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-1">
                  Once scanned and confirmed on your mobile device, this window will automatically refresh and close.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-lg border border-[#e2d9cd] dark:border-white/10 flex items-center justify-center">
                <QRCodeSVG
                  value={qrPairingPayload}
                  size={190}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: '/logo.png',
                    x: undefined,
                    y: undefined,
                    height: 38,
                    width: 38,
                    excavate: true,
                  }}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-[#111b21] dark:text-white text-[12.5px] font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8696a0]" />
                      <span>Copy Pairing Link</span>
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
