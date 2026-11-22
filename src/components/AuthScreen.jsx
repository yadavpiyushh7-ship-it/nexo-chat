import React, { useState } from 'react';
import { Mail, Lock, AtSign, ShieldCheck, ArrowRight, CheckSquare, Square, Zap, Smartphone, QrCode, Copy, Check, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import NexoLogo from './NexoLogo';
import { supabase } from '../lib/supabase';

export default function AuthScreen({ onLogin }) {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('alex_m');
  const [email, setEmail] = useState('alex@nexo.chat');
  const [password, setPassword] = useState('••••••••');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  // Real HTTP/HTTPS session pairing URL that never fails on phone cameras
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 10));
  const baseOrigin = typeof window !== 'undefined'
    ? (import.meta.env.VITE_PUBLIC_URL || (window.location.hostname === 'localhost' ? 'https://nexo-web.vercel.app' : window.location.origin))
    : 'https://nexo-web.vercel.app';
  const pairUrl = `${baseOrigin}/?pair_session=${sessionId}`;

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(pairUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {}
  };

  const handleSimulateScan = () => {
    try {
      localStorage.setItem('nexo_pair_event', JSON.stringify({
        type: 'PAIR_SUCCESS',
        sessionId,
        device: 'Android (Galaxy S24)',
        timestamp: Date.now()
      }));
    } catch {}
    handleDemoLogin();
  };

  // Listen for pairing event from phone tab via BroadcastChannel or storage event
  React.useEffect(() => {
    let channel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('nexo_pair_channel');
        channel.onmessage = (e) => {
          if (e.data && (e.data.type === 'PAIR_SUCCESS' || e.data.sessionId === sessionId)) {
            handleDemoLogin();
          }
        };
      }
    } catch {}

    const handleStorage = (e) => {
      if (e.key === 'nexo_pair_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data && (data.sessionId === sessionId || data.type === 'PAIR_SUCCESS')) {
            handleDemoLogin();
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [sessionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthMessage('');

    const cleanHandle = username.startsWith('@') ? username : `@${username}`;
    const displayName = isSignUp ? username.replace(/^@/, '') : (username || 'Alex Morgan');

    try {
      if (isSignUp) {
        // Real Supabase Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: cleanHandle,
              full_name: displayName,
            }
          }
        });

        if (error) {
          throw error;
        }

        const newUser = data.user;
        if (newUser) {
          // Upsert into profiles table
          try {
            await supabase.from('profiles').upsert({
              id: newUser.id,
              username: cleanHandle,
              full_name: displayName,
              avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
              mood: 'Available ✨',
              updated_at: new Date().toISOString()
            });
          } catch (profileErr) {
            console.warn('Profile upsert warning:', profileErr);
          }

          if (data.session) {
            onLogin({
              id: newUser.id,
              name: displayName,
              username: cleanHandle,
              email: newUser.email,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
              mood: 'Available ✨'
            });
          } else {
            setAuthMessage('Account created successfully! You can now log in with your credentials.');
            setIsSignUp(false);
          }
        }
      } else {
        // Real Supabase Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          throw error;
        }

        const authUser = data.user;
        if (authUser) {
          // Fetch user profile from Supabase profiles table
          let profile = null;
          try {
            const { data: pData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUser.id)
              .single();
            profile = pData;
          } catch {}

          if (!profile) {
            // Upsert default profile if none exists
            const fallbackHandle = `@${authUser.email.split('@')[0]}`;
            const fallbackName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
            try {
              const { data: upserted } = await supabase
                .from('profiles')
                .upsert({
                  id: authUser.id,
                  username: fallbackHandle,
                  full_name: fallbackName,
                  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                  mood: 'Available ✨',
                  updated_at: new Date().toISOString()
                })
                .select()
                .single();
              profile = upserted;
            } catch {}
          }

          onLogin({
            id: authUser.id,
            name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            username: profile?.username || authUser.user_metadata?.username || `@${authUser.email.split('@')[0]}`,
            email: authUser.email,
            avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
            mood: profile?.mood || 'Available ✨'
          });
        }
      }
    } catch (err) {
      console.warn('Supabase auth attempt:', err.message);
      setAuthError(err.message || 'Authentication error. Please check credentials or use Quick Demo Login.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    setAuthError('');

    // Query seeded demo profile in Supabase
    try {
      const demoId = '931b3575-fe28-461b-8a44-830215a52eb4';
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', demoId)
        .single();

      if (profile) {
        onLogin({
          id: profile.id,
          name: profile.full_name || 'Alex Morgan',
          username: profile.username || '@alex_m',
          email: 'alex@nexo.chat',
          avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          mood: profile.mood || 'Available ✨'
        });
        setAuthLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Demo profile query fallback:', e);
    }

    // Instant fallback
    onLogin({
      id: '931b3575-fe28-461b-8a44-830215a52eb4',
      name: 'Alex Morgan',
      username: '@alex_m',
      email: 'alex@nexo.chat',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      mood: 'Available ✨'
    });
    setAuthLoading(false);
  };

  const qrPayload = `nexo://auth?session=sess_${Date.now()}&client=web`;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 md:p-10 bg-[#fcf5eb] dark:bg-[#0b141a] text-[#111b21] dark:text-[#e9edef] transition-colors selection:bg-[#0044ff] selection:text-white font-sans">
      {/* Top Header: Logo + Nexo Wordmark */}
      <div className="w-full max-w-[880px] mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <NexoLogo size={44} />
          <span className="text-[24px] font-bold tracking-tight text-[#111b21] dark:text-white">
            Nexo
          </span>
        </div>

        <button
          onClick={handleDemoLogin}
          className="text-[13px] font-semibold text-[#0044ff] dark:text-[#0055ff] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Quick Demo Login</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[880px] mx-auto my-auto space-y-4">
        {/* Top Rounded Banner Card: Feature Highlight + Quick Demo Button */}
        <div className="w-full rounded-2xl bg-white dark:bg-[#111b21] border border-[#e2d9cd] dark:border-[#202c33] px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <p className="text-[13.5px] font-medium text-[#111b21] dark:text-[#e9edef] text-center sm:text-left">
              <span className="font-bold text-[#0044ff] dark:text-[#0055ff]">Nexo for Web</span> — Schedule messages, AI Focus Auto-Reply & Unread Summaries.
            </p>
          </div>
          <button
            onClick={handleDemoLogin}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0055ff] to-[#7b2cbf] hover:opacity-90 text-white text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer transition-transform active:scale-95"
          >
            <span>Quick Demo Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Wide 2-Column Bordered Card (border-radius: 24px) */}
        <div className="w-full rounded-[24px] bg-white dark:bg-[#111b21] border border-[#e2d9cd] dark:border-[#202c33] shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
          {/* Left Column (60%): Scan Steps OR Email Login Form */}
          <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#e2d9cd] dark:border-[#202c33]">
            {!showEmailLogin ? (
              /* WhatsApp Web Exact "Scan to log in" Numbered Steps */
              <div className="space-y-6">
                <div>
                  <h2 className="text-[25px] font-bold text-[#111b21] dark:text-white tracking-tight">
                    Scan to log in
                  </h2>
                  <p className="text-[14px] text-[#667781] dark:text-[#8696a0] mt-1">
                    To use Nexo on your computer:
                  </p>
                </div>

                <ol className="space-y-4 text-[14.5px] text-[#111b21] dark:text-[#e9edef] list-none p-0">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] text-[#00a884] dark:text-[#25d366] text-[13px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Open <strong>Nexo</strong> on your phone</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] text-[#00a884] dark:text-[#25d366] text-[13px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Tap <strong>Menu ⋮</strong> on Android, or <strong>Settings</strong> on iPhone → <strong>Connected devices</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] text-[#00a884] dark:text-[#25d366] text-[13px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Point your phone at this screen to scan the QR code</span>
                  </li>
                </ol>

                <div className="pt-2 space-y-3">
                  {/* Stay logged in checkbox */}
                  <label
                    onClick={() => setStayLoggedIn(!stayLoggedIn)}
                    className="flex items-center gap-2.5 cursor-pointer select-none text-[13.5px] text-[#667781] dark:text-[#aebac1]"
                  >
                    {stayLoggedIn ? (
                      <CheckSquare className="w-4 h-4 text-[#00a884]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#8696a0]" />
                    )}
                    <span>Stay logged in on this browser</span>
                  </label>

                  {/* Toggle to Email/Password form */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowEmailLogin(true)}
                      className="text-[13.5px] font-semibold text-[#0044ff] dark:text-[#0055ff] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Log in with email & password &gt;</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Alternative Email / Password Form */
              <div>
                <h2 className="text-[25px] font-bold text-[#111b21] dark:text-white tracking-tight">
                  {isSignUp ? 'Create your Nexo account' : 'Log in with email'}
                </h2>
                <p className="text-[13.5px] text-[#667781] dark:text-[#8696a0] mt-1 mb-5">
                  {isSignUp
                    ? 'Connect with friends and boost productivity with Gemini AI.'
                    : 'Enter your account email and password.'}
                </p>

                {/* Error & Success Feedback Banners */}
                {authError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-[13px] flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[13px] flex items-start gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{authMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {isSignUp && (
                    <div>
                      <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                        Username Handle
                      </label>
                      <div className="relative">
                        <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="username"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#0044ff] focus:bg-white dark:focus:bg-[#111b21] text-[#111b21] dark:text-white placeholder-[#8696a0] text-[14px] focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#0044ff] focus:bg-white dark:focus:bg-[#111b21] text-[#111b21] dark:text-white placeholder-[#8696a0] text-[14px] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#0044ff] focus:bg-white dark:focus:bg-[#111b21] text-[#111b21] dark:text-white placeholder-[#8696a0] text-[14px] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label
                      onClick={() => setStayLoggedIn(!stayLoggedIn)}
                      className="flex items-center gap-2 cursor-pointer select-none text-[13px] text-[#667781] dark:text-[#aebac1]"
                    >
                      {stayLoggedIn ? (
                        <CheckSquare className="w-4 h-4 text-[#0044ff]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#8696a0]" />
                      )}
                      <span>Stay logged in</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowEmailLogin(false)}
                      className="text-[12.5px] text-[#0044ff] dark:text-[#0055ff] hover:underline cursor-pointer"
                    >
                      &lt; Back to QR scan
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0044ff] hover:bg-[#0038d1] disabled:opacity-60 text-white font-semibold text-[14.5px] shadow-md shadow-[#0044ff]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connecting to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column (40%): Real Instant Scannable QR Code using QRCodeSVG with Nexo logo */}
          <div className="md:col-span-5 p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-[#faf6f0]/60 dark:bg-[#182229]/40">
            <div
              onClick={handleDemoLogin}
              title="Click or scan QR code with phone camera to log in directly"
              className="p-5 rounded-2xl bg-white shadow-lg border border-[#e2d9cd] dark:border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:shadow-xl transition-all"
            >
              <QRCodeSVG
                value={pairUrl}
                size={210}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: '/logo.png',
                  x: undefined,
                  y: undefined,
                  height: 44,
                  width: 44,
                  excavate: true,
                }}
              />
            </div>

            {/* Instant Actions & Testing Helpers */}
            <div className="mt-3 flex flex-col items-center gap-2 w-full max-w-[240px]">
              <button
                type="button"
                onClick={handleSimulateScan}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#0055ff] to-[#7b2cbf] hover:opacity-95 active:scale-95 text-white text-[12.5px] font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simulate Mobile Scan</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-1.5 px-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#111b21] dark:text-[#e9edef] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Pairing Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8696a0]" />
                    <span>Copy Pairing Link</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11.5px] text-[#667781] dark:text-[#8696a0] mt-2 max-w-[220px]">
              Scan with phone camera or use quick buttons above to link instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-[880px] mx-auto py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#667781] dark:text-[#8696a0] border-t border-[#e2d9cd]/80 dark:border-white/10 mt-6">
        <div>
          <span>{isSignUp ? 'Already have a Nexo account?' : "Don't have a Nexo account?"} </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setShowEmailLogin(true);
            }}
            className="text-[#0044ff] dark:text-[#0055ff] font-bold hover:underline cursor-pointer ml-1"
          >
            {isSignUp ? 'Sign In ↗' : 'Get started ↗'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-[#8696a0]">
          <ShieldCheck className="w-4 h-4 text-[#00a884]" />
          <span>Your personal messages are end-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}
