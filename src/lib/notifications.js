/**
 * Web Notifications + Subtle Web Audio Message Chime & Incoming Call Ringtone
 */

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }
  return Notification.permission;
}

export function playMessageChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(660, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.11);
    gain1.gain.setValueAtTime(0.06, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.24);
    setTimeout(() => {
      try { ctx.close(); } catch {}
    }, 300);
  } catch {}
}

export function startIncomingRingtone() {
  let active = true;
  let timerId = null;

  const playRingBurst = () => {
    if (!active) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      [0, 0.24].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now + offset);
        osc.frequency.setValueAtTime(659.25, now + offset + 0.1);
        gain.gain.setValueAtTime(0.09, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.21);
      });

      setTimeout(() => {
        try { ctx.close(); } catch {}
      }, 650);
    } catch {}
  };

  playRingBurst();
  timerId = setInterval(playRingBurst, 1800);

  return () => {
    active = false;
    if (timerId) clearInterval(timerId);
  };
}

export function triggerIncomingBrowserNotification({ senderName, previewText, onClick }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const n = new Notification(senderName || 'New message on Nexo', {
      body: (previewText || 'New encrypted message').slice(0, 120),
      icon: '/logo.png?v=2',
      tag: `nexo_${senderName || 'msg'}`,
    });
    n.onclick = () => {
      try { window.focus(); } catch {}
      onClick?.();
      n.close();
    };
  } catch {}
}
