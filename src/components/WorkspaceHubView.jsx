import React, { useState, useEffect } from 'react';
import {
  Mail,
  Video,
  Sparkles,
  Send,
  BookmarkPlus,
  ExternalLink,
  Share2,
  Check,
  Loader2,
  FileText,
  Calendar,
  Reply,
  Plus,
  Search,
  X,
  LogOut,
  AlertCircle,
  RefreshCw,
  Presentation
} from 'lucide-react';
import { requestAI } from '../lib/aiClient';
import { useGoogleAuth, exportPresentationToGoogleSlides } from '../lib/googleApis';

const SAMPLE_PLACEMENT_EMAILS = [
  {
    id: 'em_1',
    from: 'JECRC Training & Placement Cell <tpo@jecrc.edu>',
    subject: 'Shortlist & OA Link: 2027 Batch SDE Intern + PPO Drive',
    date: 'Today, 9:05 am',
    tag: 'Placement Drive',
    unread: true,
    body: 'Dear B.Tech CSE (AI & ML) Students,\n\nRegistrations are open for the upcoming SDE Intern + Full-Time PPO recruitment drive (CTC 14–18 LPA). Eligibility: CGPA >= 7.5 with zero active backlogs.\n\nOnline Assessment Date: Saturday, 10:00 AM IST on HackerRank (2 DSA Medium/Hard + 1 SQL query).\nPortal Link: https://placements.jecrc.edu/drives/2027-sde\n\nPlease verify your resume PDF before Friday 6:00 PM.',
  },
  {
    id: 'em_2',
    from: 'University Campus Recruitment <careers@techcorp.io>',
    subject: 'Technical Interview Slot Confirmation — AI & Backend Engineering',
    date: 'Yesterday, 4:30 pm',
    tag: 'Interview',
    unread: false,
    body: 'Hi Piyush,\n\nThank you for submitting your Nexo Capstone portfolio. We would like to schedule your 45-minute Technical Round covering DSA, DBMS Indexing, and System Architecture.\n\nPlease confirm availability for Thursday 3:00 PM IST via Google Meet.',
  },
  {
    id: 'em_3',
    from: 'GitHub Campus Experts <campus@github.com>',
    subject: 'Open Source & Portfolio Audit Checklist for 2027 Grads',
    date: '22 Nov',
    tag: 'Career Prep',
    unread: false,
    body: 'Make sure every pinned repository includes a clear architecture diagram, live demo URL, benchmark metrics, and reproducible setup steps before recruiter screening.',
  },
];

const INITIAL_MEET_SCHEDULES = [
  {
    id: 'mt_1',
    title: 'Pre-Placement Talk & OA Strategy (2027 Batch)',
    host: 'Placement Cell • JECRC University',
    time: 'Today, 5:00 PM – 6:00 PM',
    meetUrl: 'https://meet.google.com/new',
    type: 'Pre-Placement Talk',
  },
  {
    id: 'mt_2',
    title: 'System Design & DSA Mock Interview Session',
    host: 'DSA & Coding Prep Squad',
    time: 'Tomorrow, 7:30 PM – 8:30 PM',
    meetUrl: 'https://meet.google.com/new',
    type: 'Mock Interview',
  },
  {
    id: 'mt_3',
    title: 'AI & ML Capstone Architecture Sync',
    host: 'B.Tech CSE Study Group',
    time: 'Saturday, 11:30 AM – 12:30 PM',
    meetUrl: 'https://meet.google.com/new',
    type: 'Group Study',
  },
];

function GoogleGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-shrink-0">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

function encodeMimeEmailBase64Url({ to, subject, body }) {
  const mime = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body || '',
  ].join('\r\n');

  const base64 = btoa(unescape(encodeURIComponent(mime)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlUtf8(data) {
  if (!data) return '';
  try {
    const padded = data.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return '';
  }
}

function extractPlainTextFromPayload(payload) {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64UrlUtf8(payload.body.data);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const found = extractPlainTextFromPayload(part);
      if (found) return found;
    }
  }
  if (payload.body?.data && payload.mimeType === 'text/html') {
    return decodeBase64UrlUtf8(payload.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function ensureGisScriptLoaded() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.oauth2) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.google?.accounts?.oauth2)));
      existing.addEventListener('error', () => resolve(false));
      setTimeout(() => resolve(Boolean(window.google?.accounts?.oauth2)), 2500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean(window.google?.accounts?.oauth2));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export default function WorkspaceHubView({
  chats = [],
  onSendMessageToChat,
  onSaveToVault,
  onShowToast,
  initialTab = 'gmail',
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'gmail' | 'meet'

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Shared Google Identity Services Auth State (gmail, calendar, contacts, slides, sheets, youtube)
  const {
    token: googleToken,
    user: googleUser,
    isSignedIn,
    loading: authLoading,
    error: authError,
    clearError: clearAuthError,
    signIn: signInGoogle,
    signOut: signOutGoogle,
  } = useGoogleAuth();
  const [syncingInbox, setSyncingInbox] = useState(false);

  // Google Slides Export State
  const [exportingSlides, setExportingSlides] = useState(false);
  const [exportedSlidesUrl, setExportedSlidesUrl] = useState('');

  // Gmail State
  const [emails, setEmails] = useState(SAMPLE_PLACEMENT_EMAILS);
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(SAMPLE_PLACEMENT_EMAILS[0]);
  const [emailSummary, setEmailSummary] = useState('');
  const [summarizingEmail, setSummarizingEmail] = useState(false);

  // Reply & Compose State
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [draftingReply, setDraftingReply] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingCompose, setSendingCompose] = useState(false);
  const [composeError, setComposeError] = useState('');

  // Meet + Scheduler + MoM State
  const [targetChatId, setTargetChatId] = useState(chats[1]?.id || chats[0]?.id || 'self_vault');
  const [meetings, setMeetings] = useState(INITIAL_MEET_SCHEDULES);
  const [newMeetTitle, setNewMeetTitle] = useState('');
  const [newMeetDateTime, setNewMeetDateTime] = useState('');
  const [newMeetType, setNewMeetType] = useState('Mock Interview');

  const [momInput, setMomInput] = useState(
    'Attended by Piyush Yadav, Placement Coordinator, and CSE Study Squad. Decided to freeze PDF resumes by Friday 6 PM. Scheduled DSA mock OA for Saturday 10 AM focusing on Sliding Window, Graphs, and SQL Joins. Assigned System Design OS/CN notes sharing.'
  );
  const [momOutput, setMomOutput] = useState('');
  const [generatingMom, setGeneratingMom] = useState(false);

  const handleContinueWithGoogle = async () => {
    const res = await signInGoogle();
    if (res?.ok && res?.token) {
      onShowToast?.(`Connected to Google Workspace (${res.user?.email || 'Live'})!`);
      await fetchLiveGmailInbox(res.token);
    } else if (res?.error) {
      onShowToast?.(res.error);
    }
  };

  const handleGoogleSignOut = () => {
    signOutGoogle();
    setEmails(SAMPLE_PLACEMENT_EMAILS);
    setSelectedEmail(SAMPLE_PLACEMENT_EMAILS[0]);
    setExportedSlidesUrl('');
    onShowToast?.('Signed out from Google Workspace.');
  };

  useEffect(() => {
    if (googleToken) {
      fetchLiveGmailInbox(googleToken);
    }
  }, [googleToken]);

  const handleExportMoMToSlides = async () => {
    if (!momOutput) return;
    let activeToken = googleToken;
    if (!activeToken) {
      const res = await signInGoogle();
      if (!res?.ok || !res?.token) {
        onShowToast?.(res?.error || 'Please sign in with Google to export to Google Slides.');
        return;
      }
      activeToken = res.token;
    }

    setExportingSlides(true);
    try {
      const { url } = await exportPresentationToGoogleSlides({
        accessToken: activeToken,
        title: `Nexo Minutes of Meeting — ${new Date().toLocaleDateString()}`,
        bodyText: momOutput,
      });
      setExportedSlidesUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
      onShowToast?.('Exported MoM deck to Google Slides!');
    } catch (err) {
      onShowToast?.(err?.message || 'Google Slides export failed.');
    } finally {
      setExportingSlides(false);
    }
  };

  const fetchLiveGmailInbox = async (accessToken) => {
    setSyncingInbox(true);
    try {
      const listRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!listRes.ok) {
        throw new Error(`Gmail API error (${listRes.status})`);
      }
      const listJson = await listRes.json();
      if (!Array.isArray(listJson.messages) || listJson.messages.length === 0) {
        setEmails([]);
        setSelectedEmail(null);
        return;
      }

      const detailed = await Promise.all(
        listJson.messages.slice(0, 15).map(async (m) => {
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!r.ok) return null;
          const d = await r.json();
          const headers = d.payload?.headers || [];
          const getH = (n) => headers.find((h) => h.name?.toLowerCase() === n)?.value || '';
          const decodedBody = extractPlainTextFromPayload(d.payload);
          return {
            id: d.id,
            from: getH('from') || 'Gmail Sender',
            subject: getH('subject') || '(No Subject)',
            date: getH('date')?.slice(0, 22) || 'Recent',
            tag: d.labelIds?.includes('SENT') ? 'Sent' : 'Gmail Inbox',
            unread: d.labelIds?.includes('UNREAD') || false,
            body: decodedBody || d.snippet || 'Open email inside Gmail.',
          };
        })
      );

      const clean = detailed.filter(Boolean);
      if (clean.length > 0) {
        setEmails(clean);
        setSelectedEmail(clean[0]);
      }
    } catch (err) {
      console.warn('Gmail inbox sync error:', err);
      onShowToast?.(err?.message || 'Unable to sync Gmail inbox');
    } finally {
      setSyncingInbox(false);
    }
  };

  const handleSummarizeEmail = async () => {
    if (!selectedEmail) return;
    setSummarizingEmail(true);
    setEmailSummary('');
    try {
      const res = await requestAI({
        mode: 'summarize',
        messages: [{ senderName: selectedEmail.from, text: `${selectedEmail.subject}\n\n${selectedEmail.body}` }],
      });
      setEmailSummary(res);
    } finally {
      setSummarizingEmail(false);
    }
  };

  const handleDraftAIReply = async () => {
    if (!selectedEmail) return;
    setReplyOpen(true);
    setReplyError('');
    setDraftingReply(true);
    try {
      const res = await requestAI({
        mode: 'rewrite',
        tone: 'Professional',
        text: `Confirming receipt of "${selectedEmail.subject}". I meet the eligibility criteria and will complete the assessment/slot promptly. Regards, Piyush Yadav (B.Tech CSE AI & ML).`,
      });
      setReplyText(res);
    } finally {
      setDraftingReply(false);
    }
  };

  const sendViaGmailApi = async ({ to, subject, body }) => {
    const raw = encodeMimeEmailBase64Url({ to, subject, body });
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      let detail = `Gmail API returned HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) detail = errJson.error.message;
      } catch {}
      throw new Error(detail);
    }
    return res.json();
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;

    if (!googleToken) {
      setReplyError('Please sign in with "Continue with Google" to send via Gmail API, or use Default Mail App.');
      return;
    }

    setReplyError('');
    setSendingReply(true);
    try {
      await sendViaGmailApi({
        to: selectedEmail.from,
        subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
        body: replyText,
      });
      setReplyOpen(false);
      setReplyText('');
      onShowToast?.(`Reply delivered via Gmail API to ${selectedEmail.from.split('<')[0].trim()}!`);
    } catch (err) {
      setReplyError(err?.message || 'Failed to deliver reply via Gmail API.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendComposeEmail = async (e) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) return;

    if (!googleToken) {
      setComposeError('Sign in via "Continue with Google" first to send directly from Gmail API, or use Default Mail App below.');
      return;
    }

    setComposeError('');
    setSendingCompose(true);
    try {
      const result = await sendViaGmailApi({
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });

      const deliveredMail = {
        id: result?.id || `em_sent_${Date.now()}`,
        from: `${googleUser?.email || 'You'} -> ${composeTo.trim()}`,
        subject: composeSubject.trim(),
        date: 'Just now',
        tag: 'Sent via Gmail',
        unread: false,
        body: composeBody.trim(),
      };
      setEmails((prev) => [deliveredMail, ...prev]);
      setSelectedEmail(deliveredMail);
      setComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      onShowToast?.(`Email delivered via Gmail API to ${composeTo.trim()}!`);
    } catch (err) {
      setComposeError(err?.message || 'Gmail API send failed.');
    } finally {
      setSendingCompose(false);
    }
  };

  const buildMailtoHref = (to, subject, body) =>
    `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;

  const handleForwardEmailToChat = () => {
    if (!selectedEmail) return;
    const payload = `📧 **[Forwarded Email] ${selectedEmail.subject}**\nFrom: ${selectedEmail.from}\n\n${emailSummary || selectedEmail.body}`;
    onSendMessageToChat?.(targetChatId, { text: payload });
    onShowToast?.('Forwarded email to selected chat!');
  };

  const handleForwardToVault = () => {
    if (!selectedEmail) return;
    const payload = `📧 **[Gmail Saved] ${selectedEmail.subject}**\nFrom: ${selectedEmail.from}\n\n${emailSummary || selectedEmail.body}`;
    onSaveToVault?.(payload, '#Placement');
    onShowToast?.('Saved email (#Placement)!');
  };

  const handleCreateScheduleMeet = (e) => {
    e.preventDefault();
    if (!newMeetTitle.trim()) return;
    const created = {
      id: `mt_${Date.now()}`,
      title: newMeetTitle.trim(),
      host: googleUser?.email ? `Host: ${googleUser.email}` : 'Scheduled by You (@piyush_dev)',
      time: newMeetDateTime.trim() || 'Today • Instant Meet Link Ready',
      meetUrl: 'https://meet.google.com/new',
      type: newMeetType,
    };
    setMeetings((prev) => [created, ...prev]);
    setNewMeetTitle('');
    setNewMeetDateTime('');
    onShowToast?.('Google Meet scheduled! Ready to join or share in chat.');
  };

  const handleGenerateMoM = async () => {
    if (!momInput.trim()) return;
    setGeneratingMom(true);
    setMomOutput('');
    try {
      const res = await requestAI({
        mode: 'mom',
        text: momInput,
      });
      setMomOutput(res);
    } finally {
      setGeneratingMom(false);
    }
  };

  const handlePostMoMToChat = () => {
    if (!momOutput) return;
    onSendMessageToChat?.(targetChatId, { text: momOutput });
    onShowToast?.('Minutes of Meeting posted to chat!');
  };

  const filteredEmails = emails.filter((em) => {
    const q = emailSearch.toLowerCase();
    return (
      !q ||
      em.subject.toLowerCase().includes(q) ||
      em.from.toLowerCase().includes(q) ||
      em.body.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0c1317] select-none overflow-hidden">
      {/* Balanced Two-Column Header: Left Title/Status/Tabs | Right Aesthetic Continue with Google Bar */}
      <div className="min-h-[68px] px-4 sm:px-6 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        {/* Left Column: Title, API Status & Sub-Tab Switcher */}
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[#111b21] dark:text-white truncate">
              Google Workspace Hub
            </h2>
            <div className="flex items-center gap-1.5 text-[11.5px]">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isSignedIn ? 'bg-emerald-500 animate-pulse' : 'bg-[#8696a0]'
                }`}
              />
              <span className={isSignedIn ? 'text-emerald-600 dark:text-emerald-400 font-semibold truncate' : 'text-[#667781] dark:text-[#8696a0] truncate'}>
                {isSignedIn ? 'Connected to Gmail API' : 'Connect Google for live Gmail & Meet sync'}
              </span>
            </div>
          </div>

          <div className="flex bg-white dark:bg-[#111b21] p-1 rounded-xl border border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('gmail')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'gmail'
                  ? 'bg-[#0055ff] text-white shadow-xs'
                  : 'text-[#54656f] dark:text-[#8696a0]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail Sync</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meet')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'meet'
                  ? 'bg-[#0055ff] text-white shadow-xs'
                  : 'text-[#54656f] dark:text-[#8696a0]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Meet & MoM</span>
            </button>
          </div>
        </div>

        {/* Right Column: Apple-Inspired "Continue with Google" Auth Pill Bar */}
        <div className="flex items-center gap-2 ml-auto">
          {isSignedIn ? (
            <div className="h-[40px] pl-1.5 pr-2 rounded-full bg-white/95 dark:bg-[#111b21]/95 backdrop-blur-md border border-emerald-500/35 shadow-sm flex items-center gap-2.5 max-w-full">
              {googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name || 'Google Profile'}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#0055ff] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                  {(googleUser.email || 'G').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[12px] font-semibold text-[#111b21] dark:text-white truncate max-w-[165px]">
                  {googleUser.email}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Synced</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => fetchLiveGmailInbox(googleToken)}
                disabled={syncingInbox}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer transition-colors"
                title="Refresh Gmail Inbox"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingInbox ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleGoogleSignOut}
                className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/15 text-[#54656f] hover:text-rose-600 dark:text-[#aebac1] dark:hover:text-rose-400 cursor-pointer transition-colors"
                title="Sign out from Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleContinueWithGoogle}
              disabled={authLoading}
              className="h-[40px] px-4 rounded-full bg-white/95 dark:bg-[#111b21]/95 backdrop-blur-md border border-slate-200/90 dark:border-white/15 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#0055ff]" /> : <GoogleGIcon />}
              <span className="text-[13px] font-medium text-[#111b21] dark:text-[#e9edef] whitespace-nowrap">
                Continue with Google
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Inline OAuth Configuration / Error Strip (only when triggered) */}
      {authError && (
        <div className="px-4 sm:px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 text-[12px] text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
          <button type="button" onClick={clearAuthError} className="p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'gmail' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Pane: Gmail List + Compose + Search */}
          <div className="w-full md:w-[340px] lg:w-[380px] border-b md:border-b-0 md:border-r border-[#d1d7db] dark:border-[#2a3942] bg-white dark:bg-[#111b21] flex flex-col max-h-[42vh] md:max-h-full">
            <div className="p-3 border-b border-[#d1d7db]/40 dark:border-[#2a3942]/60 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                <input
                  type="text"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  placeholder="Search Gmail inbox..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[12.5px] text-[#111b21] dark:text-white focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setComposeError('');
                  setComposeOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#0055ff] text-white text-[12px] font-semibold flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Compose</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/30 dark:divide-[#2a3942]/40">
              {syncingInbox ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-[13px] text-[#8696a0]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0055ff]" />
                  <span>Syncing messages from Gmail API...</span>
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[#8696a0]">
                  No emails found.
                </div>
              ) : (
                filteredEmails.map((em) => {
                  const isSelected = selectedEmail?.id === em.id;
                  return (
                    <div
                      key={em.id}
                      onClick={() => {
                        setSelectedEmail(em);
                        setEmailSummary('');
                        setReplyOpen(false);
                        setReplyError('');
                        setEmails((prev) => prev.map((x) => (x.id === em.id ? { ...x, unread: false } : x)));
                      }}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#0055ff]/10 dark:bg-[#202c33]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-[#0055ff]/10 text-[#0055ff] dark:text-sky-400 text-[10.5px] font-bold">
                          {em.tag}
                        </span>
                        <span className="text-[11px] text-[#8696a0]">{em.date}</span>
                      </div>
                      <h4 className={`text-[13.5px] truncate ${em.unread ? 'font-bold text-[#111b21] dark:text-white' : 'font-semibold text-[#111b21] dark:text-[#e9edef]'}`}>
                        {em.subject}
                      </h4>
                      <p className="text-[11.5px] text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                        {em.from}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Email Reader + AI Actions */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-24 md:pb-6">
            {selectedEmail && (
              <div className="bg-white dark:bg-[#111b21] rounded-2xl p-5 sm:p-6 border border-black/5 dark:border-white/10 shadow-sm space-y-4 max-w-3xl">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[18px] font-bold text-[#111b21] dark:text-white">
                      {selectedEmail.subject}
                    </h3>
                    <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] mt-1">
                      From: <span className="font-semibold text-[#111b21] dark:text-[#e9edef]">{selectedEmail.from}</span> • {selectedEmail.date}
                    </p>
                  </div>
                  <select
                    value={targetChatId}
                    onChange={(e) => setTargetChatId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[11.5px] font-semibold text-[#111b21] dark:text-white border border-black/5 dark:border-white/10"
                  >
                    {chats.map((c) => (
                      <option key={c.id} value={c.id}>
                        Target: {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[14px] text-[#111b21] dark:text-[#e9edef] whitespace-pre-wrap leading-relaxed select-text">
                  {selectedEmail.body}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSummarizeEmail}
                    disabled={summarizingEmail}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0055ff] to-[#7b2cbf] text-white text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {summarizingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>AI Summarize</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDraftAIReply}
                    className="px-3.5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Draft Reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleForwardEmailToChat}
                    className="px-3.5 py-2 rounded-xl bg-[#0055ff]/10 hover:bg-[#0055ff]/20 text-[#0055ff] dark:text-sky-400 text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Forward to Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleForwardToVault}
                    className="px-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-slate-200 dark:hover:bg-[#2a3942] text-[#111b21] dark:text-white text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-[#0055ff]" />
                    <span>Save Note</span>
                  </button>
                </div>

                {/* AI Summary Result */}
                {emailSummary && (
                  <div className="p-4 rounded-xl bg-[#0055ff]/10 border border-[#0055ff]/25 space-y-1.5 animate-fadeIn">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0055ff] dark:text-sky-400">
                      Nexo AI Placement Summary
                    </span>
                    <div className="text-[13.5px] text-[#111b21] dark:text-white whitespace-pre-wrap leading-relaxed">
                      {emailSummary}
                    </div>
                  </div>
                )}

                {/* Draft Reply Composer */}
                {replyOpen && (
                  <form onSubmit={handleSendReply} className="p-4 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#111b21] dark:text-white">
                        Draft Reply ({isSignedIn ? 'Gmail API Ready' : 'Google Sign-In Required'})
                      </span>
                      {draftingReply && <Loader2 className="w-4 h-4 animate-spin text-[#0055ff]" />}
                    </div>

                    {!isSignedIn && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-[12px] text-amber-800 dark:text-amber-300">
                        <span>Click "Continue with Google" to send directly, or use Default Mail App.</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleContinueWithGoogle}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#111b21] text-[#111b21] dark:text-white font-semibold border border-black/10 flex items-center gap-1.5 cursor-pointer"
                          >
                            <GoogleGIcon />
                            <span>Continue with Google</span>
                          </button>
                          <a
                            href={buildMailtoHref(
                              selectedEmail.from.match(/<([^>]+)>/)?.[1] || selectedEmail.from,
                              `Re: ${selectedEmail.subject}`,
                              replyText
                            )}
                            className="px-2.5 py-1 rounded-lg bg-[#0055ff] text-white font-semibold"
                          >
                            Default Mail App
                          </a>
                        </div>
                      </div>
                    )}

                    {replyError && (
                      <div className="text-[12px] text-rose-600 dark:text-rose-400 font-medium">{replyError}</div>
                    )}

                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      className="w-full p-3 rounded-xl bg-white dark:bg-[#111b21] text-[13.5px] text-[#111b21] dark:text-white border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#0055ff]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-[12.5px] text-[#667781] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!isSignedIn || sendingReply}
                        className="px-4 py-1.5 rounded-lg bg-[#00a884] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Send via Gmail</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Dedicated Google Meet Scheduler + Instant Meet + AI MoM Generator */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Meeting Scheduler & Google Meet Schedule */}
            <div className="lg:col-span-6 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15.5px] font-bold text-[#111b21] dark:text-white flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-[#0055ff]" />
                  <span>Google Meet Scheduler</span>
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Create Instant Meet</span>
                  </a>
                  <select
                    value={targetChatId}
                    onChange={(e) => setTargetChatId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#202c33] text-[12px] font-semibold text-[#111b21] dark:text-white border border-black/10 dark:border-white/10 max-w-[155px]"
                  >
                    {chats.map((c) => (
                      <option key={c.id} value={c.id}>
                        To: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule New Google Meet Form */}
              <form
                onSubmit={handleCreateScheduleMeet}
                className="p-4 rounded-2xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/10 shadow-sm space-y-2.5"
              >
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] block">
                  Schedule / Create Google Meet
                </span>
                <input
                  type="text"
                  required
                  value={newMeetTitle}
                  onChange={(e) => setNewMeetTitle(e.target.value)}
                  placeholder="Meeting title (e.g. Resume & Graph Mock Round)"
                  className="w-full px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13px] text-[#111b21] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0055ff]"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMeetDateTime}
                    onChange={(e) => setNewMeetDateTime(e.target.value)}
                    placeholder="Date & Time (e.g. Fri, 6:00 PM)"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13px] text-[#111b21] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0055ff]"
                  />
                  <select
                    value={newMeetType}
                    onChange={(e) => setNewMeetType(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[12.5px] text-[#111b21] dark:text-white"
                  >
                    <option value="Mock Interview">Mock Interview</option>
                    <option value="Pre-Placement Talk">Pre-Placement Talk</option>
                    <option value="Group Study">Group Study</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] text-white text-[12.5px] font-bold cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>

              {meetings.map((mt) => (
                <div
                  key={mt.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/10 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0055ff]/10 text-[#0055ff] dark:text-sky-400 text-[11px] font-bold">
                      {mt.type}
                    </span>
                    <span className="text-[12px] font-medium text-[#667781] dark:text-[#8696a0]">
                      {mt.time}
                    </span>
                  </div>

                  <h4 className="text-[15px] font-bold text-[#111b21] dark:text-white">
                    {mt.title}
                  </h4>
                  <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">
                    {mt.host} • <span className="font-mono text-[#00a884]">{mt.meetUrl}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={mt.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-[12.5px] font-bold inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Join Google Meet</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        onSendMessageToChat?.(targetChatId, {
                          text: `📹 **Google Meet Invite: ${mt.title}**\n🕒 ${mt.time}\n🔗 Join Link: ${mt.meetUrl}`,
                        });
                        onShowToast?.('Meet link shared in chat!');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-slate-200 dark:hover:bg-[#2a3942] text-[#111b21] dark:text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#0055ff]" />
                      <span>Share Meet Link in Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: AI Minutes of Meeting (MoM) Generator */}
            <div className="lg:col-span-6">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-[#0055ff] to-[#7b2cbf] text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                      AI Minutes of Meeting (MoM) Generator
                    </h3>
                    <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                      Generates Title, Date, Attendees, Discussion Points, Decisions & Deadlines
                    </p>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={momInput}
                  onChange={(e) => setMomInput(e.target.value)}
                  placeholder="Paste meeting discussion notes or call transcript..."
                  className="w-full p-3 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white border border-transparent focus:border-[#0055ff] focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleGenerateMoM}
                  disabled={generatingMom || !momInput.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0055ff] to-[#7b2cbf] text-white text-[13.5px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {generatingMom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Structured MoM</span>
                </button>

                {momOutput && (
                  <div className="p-4 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-[#0055ff]/25 space-y-3 animate-fadeIn">
                    <div className="text-[13.5px] text-[#111b21] dark:text-white whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                      {momOutput}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5 dark:border-white/10">
                      <button
                        type="button"
                        onClick={handlePostMoMToChat}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00a884] text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post MoM to Group Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportMoMToSlides}
                        disabled={exportingSlides}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        {exportingSlides ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Presentation className="w-3.5 h-3.5" />}
                        <span>Export to Google Slides</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSaveToVault?.(momOutput, '#Important');
                          onShowToast?.('MoM saved!');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#111b21] text-[#0055ff] dark:text-sky-400 text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save MoM Note</span>
                      </button>
                    </div>
                    {exportedSlidesUrl && (
                      <a
                        href={exportedSlidesUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-600 dark:text-amber-400 hover:underline pt-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Exported Google Slides Deck</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose New Gmail Modal (Real RFC 2822 Gmail API Send + Sign-in / mailto fallback) */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleSendComposeEmail}
            className="w-full max-w-lg bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between border-b border-black/5 dark:border-white/10">
              <span className="text-[15px] font-bold text-[#111b21] dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0055ff]" />
                <span>Compose Email {isSignedIn ? `(${googleUser.email})` : ''}</span>
              </span>
              <button type="button" onClick={() => setComposeOpen(false)} className="p-1 text-[#8696a0] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {!isSignedIn && (
                <div className="p-3.5 rounded-xl bg-[#0055ff]/10 border border-[#0055ff]/25 space-y-2.5">
                  <div className="flex items-start gap-2 text-[12.5px] text-[#111b21] dark:text-[#e9edef]">
                    <AlertCircle className="w-4 h-4 text-[#0055ff] mt-0.5 flex-shrink-0" />
                    <span>
                      Sign in with Google first so Nexo can dispatch real emails via Gmail API, or use your default mail app.
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleContinueWithGoogle}
                      disabled={authLoading}
                      className="h-[36px] px-3.5 rounded-full bg-white dark:bg-[#202c33] border border-slate-300 dark:border-white/15 shadow-xs flex items-center gap-2 text-[12.5px] font-medium text-[#111b21] dark:text-white cursor-pointer"
                    >
                      {authLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GoogleGIcon />}
                      <span>Continue with Google</span>
                    </button>
                    <a
                      href={buildMailtoHref(composeTo, composeSubject, composeBody)}
                      className="h-[36px] px-3.5 rounded-full bg-[#0055ff] text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Send via Default Mail App</span>
                    </a>
                  </div>
                </div>
              )}

              {composeError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[12px] text-rose-600 dark:text-rose-400 font-medium">
                  {composeError}
                </div>
              )}

              <input
                type="email"
                required
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="To (e.g. tpo@jecrc.edu)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0055ff]"
              />
              <input
                type="text"
                required
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-3.5 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0055ff]"
              />
              <textarea
                rows={5}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your email..."
                className="w-full p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0055ff]"
              />

              <div className="flex items-center justify-between gap-2 pt-2">
                <a
                  href={buildMailtoHref(composeTo, composeSubject, composeBody)}
                  className="text-[12px] font-semibold text-[#0055ff] dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Mail App</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    className="px-4 py-2 rounded-xl text-[13px] text-[#8696a0] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isSignedIn || sendingCompose}
                    title={isSignedIn ? 'Deliver via Gmail API' : 'Sign in with Google first'}
                    className="px-4 py-2 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] disabled:opacity-45 text-white text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {sendingCompose ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{sendingCompose ? 'Sending...' : 'Send Email'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
