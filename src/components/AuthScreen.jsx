import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail,
  Phone, 
  Lock, 
  AtSign, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  CheckSquare, 
  Square, 
  Check, 
  Loader2, 
  AlertCircle,
  RotateCcw,
  Smartphone,
  Copy,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import NexoLogo from './NexoLogo';
import { supabase } from '../lib/supabase';
import { DEMO_USER } from '../mockData';

/**
 * Validates genuine Indian mobile numbers (+91):
 * - Strips +91, 91, or leading 0
 * - Must be 10 digits starting with 6, 7, 8, or 9
 * - Rejects obvious dummy patterns (all 10 digits identical) and sequential numbers
 */
export function validateIndianMobile(raw) {
  if (!raw) return null;
  let str = String(raw).trim().replace(/[\s\-\(\)]/g, '');

  if (str.startsWith('+91')) {
    str = str.slice(3);
  } else if (str.startsWith('91') && str.length === 12) {
    str = str.slice(2);
  } else if (str.startsWith('0') && str.length === 11) {
    str = str.slice(1);
  }

  const digits = str.replace(/\D/g, '');

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return null;
  }

  if (/^(\d)\1{9}$/.test(digits)) {
    return null;
  }

  const exactSequential = ['9876543210', '6789012345', '1234567890'];
  if (exactSequential.includes(digits)) {
    return null;
  }

  return digits;
}

export function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

/**
 * Parses user information stored in Supabase profiles (handling packed phone & email in mood if needed)
 */
export function parseProfileInfo(profile) {
  if (!profile) return { name: '', handle: '', phone: '', email: '', bio: 'Available ✨' };
  let bio = profile.mood || 'Available ✨';
  let phone = profile.phone || '';
  let email = profile.email || '';

  if (profile.mood && profile.mood.includes(' | ')) {
    const parts = profile.mood.split(' | ');
    bio = parts[0] || 'Available ✨';
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].startsWith('phone:')) phone = parts[i].replace('phone:', '').trim();
      if (parts[i].startsWith('email:')) email = parts[i].replace('email:', '').trim();
    }
  }

  return {
    id: profile.id,
    name: profile.full_name || 'Nexo User',
    handle: profile.username || '@user',
    bio,
    phone,
    email
  };
}

/**
 * Resolves an email address from an identifier (Email, @username, or registered Mobile)
 */
export async function resolveEmailFromIdentifier(rawInput) {
  const str = String(rawInput || '').trim();
  if (!str) return null;

  // 1. Direct email entered
  if (validateEmail(str)) {
    return { email: str.toLowerCase() };
  }

  // 2. Lookup by username
  const cleanHandle = str.startsWith('@') ? str : `@${str}`;
  try {
    const { data: byUser } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', cleanHandle)
      .limit(1);

    if (byUser && byUser.length > 0) {
      const info = parseProfileInfo(byUser[0]);
      if (info.email) return { email: info.email, profile: info };
    }
  } catch (err) {
    console.warn('Lookup by username error:', err);
  }

  // 3. Lookup by registered Indian mobile number
  const validDigits = validateIndianMobile(str);
  if (validDigits) {
    try {
      const { data: byPhone } = await supabase
        .from('profiles')
        .select('*')
        .ilike('mood', `%phone:+91${validDigits}%`)
        .limit(1);

      if (byPhone && byPhone.length > 0) {
        const info = parseProfileInfo(byPhone[0]);
        if (info.email) return { email: info.email, profile: info };
      }
    } catch (err) {
      console.warn('Lookup by phone error:', err);
    }
  }

  return null;
}

export default function AuthScreen({ onLogin }) {
  // Show Sign Up by default before Sign In
  const [isSignUp, setIsSignUp] = useState(true);
  const [authStep, setAuthStep] = useState('details'); // 'details' | 'otp'
  
  // Sign Up Inputs
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Sign In Input (Email, @username, or registered mobile)
  const [loginIdentifier, setLoginIdentifier] = useState('');

  // OTP Verification
  const [targetEmail, setTargetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  // Status & Feedback
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Unique QR Device Linking Token
  const [linkToken] = useState(() => 'lt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
  const [copiedLink, setCopiedLink] = useState(false);

  // Encode QR code URL using https://nexo-chat-pi.vercel.app/?link_token=<token> when running on localhost
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.') ||
    window.location.hostname.includes('10.')
  );
  const baseOrigin = isLocalhost
    ? 'https://nexo-chat-pi.vercel.app'
    : (typeof window !== 'undefined' ? window.location.origin : 'https://nexo-chat-pi.vercel.app');
  const qrPairUrl = `${baseOrigin}/?link_token=${linkToken}`;

  // Log in user from linked device record
  const handleDeviceLinkedLogin = (recordOrUser) => {
    let sessionUser;
    if (recordOrUser.status === 'linked') {
      sessionUser = {
        id: recordOrUser.user_id || `u_${recordOrUser.phone || Date.now()}`,
        name: recordOrUser.display_name || recordOrUser.username || 'Nexo User',
        username: recordOrUser.username ? (recordOrUser.username.startsWith('@') ? recordOrUser.username : `@${recordOrUser.username}`) : '@user',
        phone: recordOrUser.phone || '',
        email: recordOrUser.email || '',
        avatar: null,
        mood: 'Available ✨'
      };
    } else {
      sessionUser = recordOrUser;
    }

    try {
      localStorage.setItem('nexo_user', JSON.stringify(sessionUser));
    } catch {}
    onLogin(sessionUser);
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Insert link_token into linked_devices, subscribe via Supabase Realtime + Polling fallback
  useEffect(() => {
    let isCancelled = false;
    let pollInterval = null;

    // 1. Insert pending record into Supabase linked_devices
    supabase
      .from('linked_devices')
      .insert({
        link_token: linkToken,
        status: 'pending'
      })
      .then(({ error }) => {
        if (error) console.warn('linked_devices pending insert:', error);
      })
      .catch((err) => console.warn('linked_devices insert err:', err));

    // 2. Subscribe via Supabase Realtime (postgres_changes on linked_devices)
    const channel = supabase.channel(`qr-login-${linkToken}`);
    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'linked_devices',
          filter: `link_token=eq.${linkToken}`
        },
        (payload) => {
          if (isCancelled) return;
          const updated = payload.new;
          if (updated && updated.status === 'linked' && (updated.user_id || updated.phone)) {
            handleDeviceLinkedLogin(updated);
          }
        }
      )
      .on('broadcast', { event: 'device-linked' }, ({ payload }) => {
        if (isCancelled) return;
        if (payload?.user) {
          handleDeviceLinkedLogin(payload.user);
        }
      })
      .subscribe();

    // 3. 2-second Polling Fallback
    pollInterval = setInterval(async () => {
      if (isCancelled) return;
      try {
        const { data } = await supabase
          .from('linked_devices')
          .select('*')
          .eq('link_token', linkToken)
          .single();

        if (data && data.status === 'linked' && (data.user_id || data.phone)) {
          if (pollInterval) clearInterval(pollInterval);
          handleDeviceLinkedLogin(data);
        }
      } catch (err) {
        // Polling error ignored
      }
    }, 2000);

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [linkToken]);

  // Step 1: Send Real-Time Supabase Email OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthMessage('');

    let emailToSend = '';

    if (isSignUp) {
      // Validate full name
      if (!fullName.trim()) {
        setAuthLoading(false);
        setAuthError('Please enter your full name');
        return;
      }

      // Validate username
      if (!username.trim()) {
        setAuthLoading(false);
        setAuthError('Please enter a username');
        return;
      }

      // Validate Genuine Indian Mobile (+91)
      const validPhone = validateIndianMobile(phoneNumber);
      if (!validPhone) {
        setAuthLoading(false);
        setAuthError('Please enter genuine number');
        return;
      }

      // Validate Email
      if (!validateEmail(email)) {
        setAuthLoading(false);
        setAuthError('Please enter a valid email address');
        return;
      }

      emailToSend = email.trim().toLowerCase();
    } else {
      // Sign In: User can enter Email, @username, or registered Indian mobile number
      const trimmedId = loginIdentifier.trim();
      if (!trimmedId) {
        setAuthLoading(false);
        setAuthError('Please enter your Email, @username, or Mobile number');
        return;
      }

      const resolved = await resolveEmailFromIdentifier(trimmedId);
      if (!resolved || !resolved.email) {
        setAuthLoading(false);
        setAuthError('No account found for this Email, @username, or Mobile number. Please Sign Up.');
        return;
      }
      emailToSend = resolved.email;
    }

    setTargetEmail(emailToSend);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailToSend,
        options: {
          shouldCreateUser: isSignUp
        }
      });

      if (error) {
        if (error.message?.includes('Signups not allowed') || error.message?.includes('User not found')) {
          setAuthError('Account not found. Please click Sign Up to register.');
        } else {
          setAuthError(error.message || 'Failed to send verification code. Please try again.');
        }
        return;
      }

      setAuthStep('otp');
      setCountdown(60);
      setAuthMessage(`6-digit verification code sent to ${emailToSend}. Please check your inbox or spam folder.`);
    } catch (err) {
      console.warn('Supabase Email OTP send error:', err);
      setAuthError(err?.message || 'Failed to send OTP code');
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2: Verify 6-Digit Email OTP & Upsert Supabase Profile
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!targetEmail) {
      setAuthError('Please enter your email or identifier first');
      return;
    }

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setAuthError('Please enter the 6-digit OTP code');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: cleanOtp,
        type: 'email'
      });

      if (error) {
        setAuthError(error.message || 'Invalid or expired OTP code. Please enter the correct 6-digit code.');
        return;
      }

      const authUser = data.user;
      if (!authUser) {
        throw new Error('Authentication succeeded but user profile was not returned');
      }

      const validPhone = isSignUp ? validateIndianMobile(phoneNumber) : '';
      const formattedPhone = validPhone ? `+91${validPhone}` : '';

      // Check existing profile in Supabase profiles
      let existingProfile = null;
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        existingProfile = existing;
      } catch {}

      const parsedExisting = existingProfile ? parseProfileInfo(existingProfile) : null;

      const finalName = isSignUp 
        ? (fullName.trim() || 'Nexo User')
        : (parsedExisting?.name || authUser.user_metadata?.full_name || 'Nexo User');

      const rawHandle = isSignUp 
        ? username.trim()
        : (parsedExisting?.handle || authUser.user_metadata?.username || `@user_${authUser.id.slice(0, 5)}`);
      const finalHandle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;

      const finalPhone = isSignUp
        ? formattedPhone
        : (parsedExisting?.phone || authUser.user_metadata?.phone || '');

      const finalMood = parsedExisting?.bio || 'Available ✨';
      const packedMood = `${finalMood} | phone:${finalPhone} | email:${targetEmail}`;

      // Update Supabase Auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: finalName,
            username: finalHandle,
            phone: finalPhone
          }
        });
      } catch (metaErr) {
        console.warn('Metadata update error:', metaErr);
      }

      // Upsert into Supabase profiles
      const profileData = {
        id: authUser.id,
        username: finalHandle,
        full_name: finalName,
        phone: finalPhone,
        email: targetEmail,
        avatar_url: null, // Strictly NO stock profile photo!
        mood: packedMood,
        updated_at: new Date().toISOString()
      };

      try {
        let { error: upsertErr } = await supabase.from('profiles').upsert(profileData);
        if (upsertErr && upsertErr.message?.includes('column')) {
          delete profileData.phone;
          delete profileData.email;
          await supabase.from('profiles').upsert(profileData);
        }
      } catch (upsertErr) {
        console.warn('Profile upsert warning:', upsertErr);
      }

      const sessionUser = {
        id: authUser.id,
        name: finalName,
        username: finalHandle,
        phone: finalPhone,
        email: targetEmail,
        avatar: null, // Strictly NO profile photo!
        mood: finalMood
      };

      try {
        localStorage.setItem('nexo_user', JSON.stringify(sessionUser));
      } catch {}

      onLogin(sessionUser);
    } catch (err) {
      console.warn('Supabase OTP verification error:', err);
      setAuthError(err?.message || 'Verification failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-between p-4 sm:p-6 md:p-10 bg-[#fcf5eb] dark:bg-[#0b141a] text-[#111b21] dark:text-[#e9edef] transition-colors selection:bg-[#00a884] selection:text-white font-sans overflow-x-hidden">
      {/* Top Header: Logo + Nexo Wordmark */}
      <div className="w-full max-w-[880px] mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <NexoLogo size={42} />
          <span className="text-[24px] font-bold tracking-tight text-[#111b21] dark:text-white">
            Nexo
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem('nexo_user', JSON.stringify(DEMO_USER));
              } catch {}
              onLogin(DEMO_USER);
            }}
            className="flex items-center gap-1.5 text-[12.5px] text-[#00a884] dark:text-[#25d366] font-semibold bg-[#00a884]/10 dark:bg-[#00a884]/20 hover:bg-[#00a884]/20 active:scale-95 px-3 py-1 rounded-full cursor-pointer transition-all border border-[#00a884]/25 shadow-xs"
            title="Instant Demo Login (Examiner Preview)"
          >
            <span>⚡ Demo Mode</span>
          </button>
        </div>
      </div>

      {/* Main Wide 2-Card Container */}
      <div className="w-full max-w-[880px] mx-auto my-auto space-y-4">
        <div className="w-full rounded-[24px] bg-white dark:bg-[#111b21] border border-[#e2d9cd] dark:border-[#202c33] shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
          
          {/* Left Column: Auth Form (Full width on mobile, 7 cols on desktop) */}
          <div className="w-full md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b-0 md:border-r border-[#e2d9cd] dark:border-[#202c33]">
            <div>
              {/* Sign Up / Sign In Toggle Header */}
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setAuthStep('details');
                    setAuthError('');
                    setAuthMessage('');
                  }}
                  className={`text-[17px] font-bold pb-1 cursor-pointer transition-colors relative ${
                    isSignUp
                      ? 'text-[#00a884] dark:text-[#25d366]'
                      : 'text-[#667781] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white'
                  }`}
                >
                  Sign Up
                  {isSignUp && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00a884] dark:bg-[#25d366] rounded-full" />
                  )}
                </button>

                <span className="text-slate-300 dark:text-slate-700">|</span>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setAuthStep('details');
                    setAuthError('');
                    setAuthMessage('');
                  }}
                  className={`text-[17px] font-bold pb-1 cursor-pointer transition-colors relative ${
                    !isSignUp
                      ? 'text-[#00a884] dark:text-[#25d366]'
                      : 'text-[#667781] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white'
                  }`}
                >
                  Sign In
                  {!isSignUp && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00a884] dark:bg-[#25d366] rounded-full" />
                  )}
                </button>
              </div>

              {/* Title & Description */}
              <h2 className="text-[23px] sm:text-[25px] font-bold text-[#111b21] dark:text-white tracking-tight">
                {authStep === 'otp'
                  ? 'Enter 6-Digit Verification Code'
                  : isSignUp
                  ? 'Create your Nexo account'
                  : 'Welcome back to Nexo'}
              </h2>
              <p className="text-[13.5px] text-[#667781] dark:text-[#8696a0] mt-1 mb-5 leading-relaxed">
                {authStep === 'otp'
                  ? `Enter the 6-digit OTP code sent to ${targetEmail}`
                  : isSignUp
                  ? 'Register with your genuine Indian mobile number (+91) and email for instant free OTP.'
                  : 'Sign in with your Email, @username, or registered Mobile (+91).'}
              </p>

              {/* Error Banner */}
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-[13.5px] font-medium flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Success Info Banner */}
              {authMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[13px] flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{authMessage}</span>
                </div>
              )}

              {/* STEP 1: Details Input */}
              {authStep === 'details' ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  {isSignUp ? (
                    <>
                      {/* Full Name */}
                      <div>
                        <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Alex Morgan"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] text-[#111b21] dark:text-white placeholder-[#8696a0] text-[14px] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Unique Username (@username) */}
                      <div>
                        <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                          Unique Username (@username)
                        </label>
                        <div className="relative">
                          <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. alex_m"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] text-[#111b21] dark:text-white placeholder-[#8696a0] text-[14px] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Genuine Indian Mobile (+91) */}
                      <div>
                        <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                          Genuine Indian Mobile Number (+91)
                        </label>
                        <div className="flex items-center rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus-within:border-[#00a884] focus-within:bg-white dark:focus-within:bg-[#111b21] transition-all overflow-hidden">
                          <div className="px-3 py-2.5 bg-black/5 dark:bg-white/5 border-r border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-[14px] font-semibold text-[#111b21] dark:text-white select-none">
                            <span>🇮🇳</span>
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={phoneNumber}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\D/g, '');
                              setPhoneNumber(digitsOnly);
                            }}
                            placeholder="10-digit mobile number"
                            className="flex-1 px-3 py-2.5 bg-transparent text-[#111b21] dark:text-white placeholder-[#8696a0] text-[14.5px] font-medium tracking-wide focus:outline-none"
                          />
                        </div>
                        <span className="text-[11px] text-[#8696a0] mt-1 block">
                          Must start with 6, 7, 8, or 9. Reject dummy/sequential numbers.
                        </span>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                          Email Address (for free 6-digit OTP code)
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. alex@gmail.com"
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] text-[#111b21] dark:text-white placeholder-[#8696a0] text-[14px] focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Sign In Input */
                    <div>
                      <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                        Email, @username, or Registered Mobile (+91)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                        <input
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="e.g. alex@gmail.com, @alex_m, or 9876543210"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] text-[#111b21] dark:text-white placeholder-[#8696a0] text-[14px] focus:outline-none transition-all"
                        />
                      </div>
                      <span className="text-[11px] text-[#8696a0] mt-1 block">
                        Enter your registered email, username, or Indian mobile number.
                      </span>
                    </div>
                  )}

                  <div className="pt-2 space-y-2.5">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#00a884] hover:bg-[#008f6f] active:scale-98 disabled:opacity-60 text-white font-semibold text-[14.5px] shadow-md shadow-[#00a884]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Free OTP Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send 6-Digit OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                      <span className="flex-shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-[#8696a0]">
                        or evaluation preview
                      </span>
                      <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('nexo_user', JSON.stringify(DEMO_USER));
                        } catch {}
                        onLogin(DEMO_USER);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#00a884]/35 dark:border-[#25d366]/35 bg-[#00a884]/5 dark:bg-[#00a884]/10 hover:bg-[#00a884]/15 text-[#00a884] dark:text-[#25d366] font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                    >
                      <span>⚡ Quick Demo Login (Examiner Preview)</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: 6-Digit OTP Verification Form */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#667781] dark:text-[#aebac1] mb-1">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-[22px] font-bold rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] text-[#111b21] dark:text-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[13px] pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('details');
                        setOtpCode('');
                        setAuthError('');
                      }}
                      className="text-[#00a884] hover:underline cursor-pointer"
                    >
                      ← Change account or email
                    </button>

                    {countdown > 0 ? (
                      <span className="text-[#8696a0]">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#00a884] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || otpCode.length !== 6}
                    className="w-full py-3 px-4 rounded-xl bg-[#00a884] hover:bg-[#008f6f] active:scale-98 disabled:opacity-60 text-white font-semibold text-[14.5px] shadow-md shadow-[#00a884]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Code & Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Enter Nexo</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.setItem('nexo_user', JSON.stringify(DEMO_USER));
                      } catch {}
                      onLogin(DEMO_USER);
                    }}
                    className="w-full py-2 px-4 rounded-xl text-[#00a884] dark:text-[#25d366] text-[12.5px] font-semibold hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>⚡ Skip and enter with Demo Mode</span>
                  </button>
                </form>
              )}
            </div>

            {/* Stay logged in checkbox */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 mt-6">
              <label
                onClick={() => setStayLoggedIn(!stayLoggedIn)}
                className="flex items-center gap-2.5 cursor-pointer select-none text-[13px] text-[#667781] dark:text-[#aebac1]"
              >
                {stayLoggedIn ? (
                  <CheckSquare className="w-4 h-4 text-[#00a884]" />
                ) : (
                  <Square className="w-4 h-4 text-[#8696a0]" />
                )}
                <span>Stay logged in on this browser session</span>
              </label>
            </div>
          </div>

          {/* Right Column (40%): Live Realtime QR Device Linking with Auto-Refresh (Desktop Only >= 768px) */}
          <div className="hidden md:flex md:col-span-5 p-6 sm:p-8 flex-col items-center justify-center text-center bg-[#faf6f0]/60 dark:bg-[#182229]/40 border-t md:border-t-0">
            <div className="p-4 rounded-2xl bg-white shadow-md border border-[#e2d9cd] dark:border-white/10 flex flex-col items-center justify-center">
              <QRCodeSVG
                value={qrPairUrl}
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

            <div className="mt-3.5 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[13.5px] font-bold text-[#111b21] dark:text-white">
                <Smartphone className="w-4 h-4 text-[#00a884]" />
                <span>Scan with phone to link</span>
              </div>
              <p className="text-[12px] text-[#667781] dark:text-[#8696a0] max-w-[210px] leading-tight">
                Scan with your phone camera or Nexo mobile app. Desktop links and auto-refreshes in real time.
              </p>
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(qrPairUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  } catch {}
                }}
                className="mt-2 text-[12px] font-semibold text-[#00a884] dark:text-[#25d366] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link copied to clipboard!' : 'Copy Pairing Link'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-[880px] mx-auto py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12.5px] text-[#667781] dark:text-[#8696a0] border-t border-[#e2d9cd]/80 dark:border-white/10 mt-6">
        <div>
          <span>{isSignUp ? 'Already registered on Nexo?' : "New to Nexo?"} </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthStep('details');
              setAuthError('');
              setAuthMessage('');
            }}
            className="text-[#00a884] dark:text-[#25d366] font-bold hover:underline cursor-pointer ml-1"
          >
            {isSignUp ? 'Sign In ↗' : 'Sign Up ↗'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-[#8696a0]">
          <ShieldCheck className="w-4 h-4 text-[#00a884]" />
          <span>Real-time Supabase Auth • End-to-end encrypted messaging</span>
        </div>
      </div>
    </div>
  );
}
