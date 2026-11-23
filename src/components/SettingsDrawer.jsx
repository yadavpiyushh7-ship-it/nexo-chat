import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Search, 
  QrCode, 
  Edit3, 
  Laptop, 
  KeyRound, 
  Lock, 
  ListOrdered, 
  MessageSquare, 
  Palette, 
  Megaphone, 
  Bell, 
  Database, 
  Globe, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Smile,
  Check,
  Shield,
  ShieldCheck,
  FileText,
  Trash2,
  PhoneCall,
  Image as ImageIcon,
  MapPin,
  Radio,
  Download,
  AlertTriangle,
  UserX,
  Plus,
  Send,
  Upload,
  RefreshCw,
  Camera,
  X,
  User
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AvatarIcon from './AvatarIcon';
import { supabase } from '../lib/supabase';

export default function SettingsDrawer({
  user,
  onUpdateUser,
  onClose,
  onLogout,
  onOpenConnectedDevices,
  onTriggerAppLock
}) {
  const [currentView, setCurrentView] = useState('main'); // 'main' or page id
  const [subView, setSubView] = useState(null); // for nested screens (e.g. 'security', 'privacy_about')

  const [mood, setMood] = useState(() => localStorage.getItem('nexo_user_mood') || user?.mood || 'Available ✨');
  const [searchFilter, setSearchFilter] = useState('');

  // Profile Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || 'Alex Morgan');
  const [editUsername, setEditUsername] = useState(user?.username || '@alex_m');
  const [editMood, setEditMood] = useState(mood);
  const [editAvatar, setEditAvatar] = useState(user?.avatar || null);
  const [profileSuccessToast, setProfileSuccessToast] = useState('');
  const profileFileInputRef = useRef(null);

  // Sync edits when user prop changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || 'Alex Morgan');
      setEditUsername(user.username || '@alex_m');
      setEditAvatar(user.avatar || null);
      if (user.mood) setMood(user.mood);
    }
  }, [user]);

  // Privacy Settings State with Persistent Defaults
  const [lastSeen, setLastSeen] = useState(() => localStorage.getItem('nexo_privacy_last_seen') || 'Nobody');
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState(() => localStorage.getItem('nexo_privacy_photo') || 'My contacts');
  const [aboutPrivacy, setAboutPrivacy] = useState(() => localStorage.getItem('nexo_privacy_about') || 'Everyone');
  const [statusPrivacy, setStatusPrivacy] = useState(() => localStorage.getItem('nexo_privacy_status') || 'My contacts');
  const [readReceipts, setReadReceipts] = useState(true);
  const [defaultTimer, setDefaultTimer] = useState(() => localStorage.getItem('nexo_privacy_timer') || 'Off');
  const [groupsPrivacy, setGroupsPrivacy] = useState(() => localStorage.getItem('nexo_privacy_groups') || 'Everyone');
  const [blockedUsers, setBlockedUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexo_blocked_users') || '[]');
    } catch {
      return [];
    }
  });
  const [newBlockedInput, setNewBlockedInput] = useState('');

  // App Lock State
  const [appLockEnabled, setAppLockEnabled] = useState(() => localStorage.getItem('nexo_app_lock_enabled') === 'true');
  const [appLockPin, setAppLockPin] = useState(() => localStorage.getItem('nexo_app_lock_pin') || '1234');
  const [pinInput, setPinInput] = useState(appLockPin);
  const [pinSavedToast, setPinSavedToast] = useState(false);

  // Security notification toggle
  const [securityNotifs, setSecurityNotifs] = useState(true);

  // Appearance State (Live Theme CSS Variables)
  const [bubbleColor, setBubbleColor] = useState(() => localStorage.getItem('nexo_bubble_theme') || 'emerald');

  const applyBubbleTheme = (themeId) => {
    setBubbleColor(themeId);
    try {
      localStorage.setItem('nexo_bubble_theme', themeId);
    } catch {}

    const isDark = document.documentElement.classList.contains('dark');
    const root = document.documentElement;

    if (themeId === 'emerald') {
      root.style.setProperty('--outgoing-bubble-bg', isDark ? '#005c4b' : '#d9fdd3');
      root.style.setProperty('--outgoing-bubble-text', isDark ? '#e9edef' : '#111b21');
    } else if (themeId === 'nexo') {
      root.style.setProperty('--outgoing-bubble-bg', 'linear-gradient(135deg, #0055ff, #7b2cbf, #d946ef)');
      root.style.setProperty('--outgoing-bubble-text', '#ffffff');
    } else if (themeId === 'royal') {
      root.style.setProperty('--outgoing-bubble-bg', isDark ? '#003cd6' : '#0044ff');
      root.style.setProperty('--outgoing-bubble-text', '#ffffff');
    } else if (themeId === 'amethyst') {
      root.style.setProperty('--outgoing-bubble-bg', isDark ? '#6a1b9a' : '#7b2cbf');
      root.style.setProperty('--outgoing-bubble-text', '#ffffff');
    } else if (themeId === 'rose') {
      root.style.setProperty('--outgoing-bubble-bg', isDark ? '#e11d48' : '#f43f5e');
      root.style.setProperty('--outgoing-bubble-text', '#ffffff');
    }
  };

  useEffect(() => {
    applyBubbleTheme(bubbleColor);
  }, []);

  // Chats Settings State
  const [enterIsSend, setEnterIsSend] = useState(true);
  const [mediaAutoDownload, setMediaAutoDownload] = useState(true);
  const [chatsArchivedToast, setChatsArchivedToast] = useState(false);

  // Notifications State
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [showPreviews, setShowPreviews] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Storage State with dynamic computation
  const [storageStats, setStorageStats] = useState({
    chatCache: '12.4 KB',
    mediaPhotos: '28.6 KB',
    totalUsed: '41.0 KB'
  });
  const [cacheCleared, setCacheCleared] = useState(false);

  const calculateStorage = () => {
    try {
      let totalBytes = 0;
      let mediaBytes = 0;
      let chatBytes = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key) || '';
        const bytes = (key.length + val.length) * 2;
        totalBytes += bytes;

        if (key.includes('media') || key.includes('sticker') || key.includes('avatar') || val.startsWith('data:image')) {
          mediaBytes += bytes;
        } else if (key.includes('chat') || key.includes('msg')) {
          chatBytes += bytes;
        }
      }

      const formatSize = (bytes) => {
        if (!bytes || bytes <= 0) return '0 KB';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      };

      setStorageStats({
        chatCache: formatSize(chatBytes || 12600),
        mediaPhotos: formatSize(mediaBytes || 28900),
        totalUsed: formatSize(totalBytes || 41500)
      });
    } catch {
      setStorageStats({ chatCache: '0 KB', mediaPhotos: '0 KB', totalUsed: '0 KB' });
    }
  };

  useEffect(() => {
    if (currentView === 'storage' && !cacheCleared) {
      calculateStorage();
    }
  }, [currentView, cacheCleared]);

  const handleClearCache = () => {
    try {
      const keysToClear = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cache') || key.includes('temp') || key.includes('sticker_cache'))) {
          keysToClear.push(key);
        }
      }
      keysToClear.forEach((k) => localStorage.removeItem(k));
    } catch {}

    setStorageStats({
      chatCache: '0 KB',
      mediaPhotos: '0 KB',
      totalUsed: '0 KB'
    });
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3500);
  };

  // Profile Edit Handlers
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    const cleanHandle = editUsername.startsWith('@') ? editUsername : `@${editUsername}`;
    const updatedUser = {
      ...user,
      name: editName.trim() || 'Alex Morgan',
      username: cleanHandle,
      avatar: editAvatar,
      mood: editMood.trim() || 'Available ✨'
    };

    setMood(updatedUser.mood);
    try {
      localStorage.setItem('nexo_user', JSON.stringify(updatedUser));
      localStorage.setItem('nexo_user_mood', updatedUser.mood);
    } catch {}

    // Upsert directly into Supabase profiles table
    if (user?.id) {
      supabase.from('profiles').upsert({
        id: user.id,
        username: cleanHandle,
        full_name: editName.trim() || 'Alex Morgan',
        avatar_url: editAvatar,
        mood: editMood.trim() || 'Available ✨',
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.warn('Supabase profile update warning:', error);
      });
    }

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setProfileSuccessToast('Profile updated successfully!');
    setTimeout(() => setProfileSuccessToast(''), 3000);
    setIsEditProfileOpen(false);
  };

  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Contact Us & Feedback State
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Download account info JSON
  const handleDownloadAccountInfo = () => {
    const reportData = {
      app: 'Nexo Web',
      version: '2.4.0',
      exportDate: new Date().toISOString(),
      user: {
        name: user?.name || 'Alex Morgan',
        username: user?.username || '@alex_m',
        email: user?.email || 'alex@nexo.chat',
      },
      privacySettings: {
        lastSeen,
        profilePhotoPrivacy,
        aboutPrivacy,
        statusPrivacy,
        readReceipts,
        defaultTimer,
        groupsPrivacy,
        securityNotifications: securityNotifs,
        appLockEnabled,
      },
      activeDevice: navigator?.userAgent || 'Current Web Session',
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexo-account-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePin = () => {
    if (pinInput.length === 4) {
      setAppLockPin(pinInput);
      localStorage.setItem('nexo_app_lock_pin', pinInput);
      setPinSavedToast(true);
      setTimeout(() => setPinSavedToast(false), 3000);
    }
  };

  const handleAddBlockedUser = (e) => {
    e.preventDefault();
    if (!newBlockedInput.trim()) return;
    const clean = newBlockedInput.trim();
    const handle = clean.startsWith('@') ? clean : `@${clean}`;
    if (!blockedUsers.includes(handle)) {
      const updated = [...blockedUsers, handle];
      setBlockedUsers(updated);
      localStorage.setItem('nexo_blocked_users', JSON.stringify(updated));
    }
    setNewBlockedInput('');
  };

  const handleUnblockUser = (handle) => {
    const updated = blockedUsers.filter((u) => u !== handle);
    setBlockedUsers(updated);
    localStorage.setItem('nexo_blocked_users', JSON.stringify(updated));
  };

  const settingsItems = [
    { id: 'devices', label: 'Connected devices', icon: Laptop, badge: 'Synced', action: onOpenConnectedDevices },
    { id: 'account', label: 'Account', icon: KeyRound, desc: 'Security notifications, request info, delete' },
    { id: 'privacy', label: 'Privacy', icon: Lock, desc: 'Block contacts, disappearing messages, app lock' },
    { id: 'chats', label: 'Chats', icon: MessageSquare, desc: 'Theme colors, enter is send, media download' },
    { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Chat bubble accents & wallpapers' },
    { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone, desc: 'Manage broadcast distribution lists' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Message, group & call alerts' },
    { id: 'storage', label: 'Storage and data', icon: Database, desc: 'Network usage, cache management' },
    { id: 'language', label: 'App language', icon: Globe, desc: 'English (phone language)' },
    { id: 'help', label: 'Help and feedback', icon: HelpCircle, desc: 'Help center, terms, contact us' },
  ];

  const filteredItems = settingsItems.filter((item) =>
    item.label.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Sub-header renderer for all sub-pages
  const renderSubHeader = (title, onBack) => (
    <div className="h-[60px] px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center gap-3 flex-shrink-0">
      <button
        onClick={onBack}
        className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer"
        title="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
        {title}
      </h3>
    </div>
  );

  // Reusable Radio-Button Sub-Screen Renderer
  const renderRadioSubScreen = ({ title, sectionLabel, options, currentValue, onSelect, onBack }) => (
    <div className="w-full h-full flex flex-col">
      {renderSubHeader(title, onBack)}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sectionLabel && (
          <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] px-1 font-medium">
            {sectionLabel}
          </p>
        )}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] rounded-2xl overflow-hidden divide-y divide-black/5 dark:divide-white/5">
          {options.map((opt) => {
            const isSelected = currentValue === opt;
            return (
              <div
                key={opt}
                onClick={() => onSelect(opt)}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-[#e9edef] dark:hover:bg-[#2a3942] cursor-pointer transition-colors"
              >
                <span className="text-[14.5px] font-medium text-[#111b21] dark:text-[#e9edef]">
                  {opt}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'border-[#00a884] bg-white dark:bg-[#111b21]'
                    : 'border-[#8696a0]'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#00a884]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#2a3942] select-none transition-colors animate-fadeIn overflow-hidden font-sans">
      
      {/* ============================================================== */}
      {/* 1. MAIN SETTINGS VIEW                                          */}
      {/* ============================================================== */}
      {currentView === 'main' && (
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Top Banner */}
          <div className="relative w-full h-36 whatsapp-doodle-light dark:whatsapp-doodle-dark flex-shrink-0 flex items-start justify-between p-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/20 hover:bg-black/30 text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('my_qr')}
                className="p-2 rounded-full bg-black/20 hover:bg-black/30 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="My Contact QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="p-2 rounded-full bg-black/20 hover:bg-black/30 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="Edit Profile"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Profile Info Overlay (Click to Edit Profile) */}
          <div className="px-5 pt-0 pb-4 border-b border-[#d1d7db]/70 dark:border-[#2a3942]/70 flex flex-col items-center -mt-14 relative z-10">
            <div
              onClick={() => setIsEditProfileOpen(true)}
              className="mb-2 px-3 py-1 rounded-full bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] text-[12px] font-semibold shadow-md border border-black/5 dark:border-white/10 flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
              title="Click to change status"
            >
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              <span>{mood}</span>
            </div>

            <div 
              onClick={() => setIsEditProfileOpen(true)}
              className="relative cursor-pointer group"
              title="Click to edit profile"
            >
              <AvatarIcon
                size="xl"
                name={user?.name || editName}
                showOnline
                online
              />
            </div>

            <div 
              onClick={() => setIsEditProfileOpen(true)} 
              className="text-center cursor-pointer group mt-2"
              title="Click to edit name and handle"
            >
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="text-[20px] font-bold text-[#111b21] dark:text-white tracking-tight group-hover:text-[#00a884] transition-colors">
                  {user?.name || 'Alex Morgan'}
                </h2>
                <Edit3 className="w-3.5 h-3.5 text-[#8696a0] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[13px] text-[#00a884] dark:text-[#25d366] font-semibold mt-0.5">
                {user?.username || '@alex_m'}
              </p>
            </div>
          </div>

          {/* Search Settings */}
          <div className="px-4 py-2 border-b border-[#d1d7db]/40 dark:border-[#2a3942]/40">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search settings"
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] text-[13px] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
              />
            </div>
          </div>

          {/* Settings Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/30 dark:divide-[#2a3942]/40">
            {filteredItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.action || (() => {
                    setCurrentView(item.id);
                    setSubView(null);
                  })}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] group-hover:text-[#00a884] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14.5px] font-medium text-[#111b21] dark:text-[#e9edef]">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#00a884]/15 text-[#00a884]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.desc && (
                        <p className="text-[12px] text-[#667781] dark:text-[#8696a0] truncate">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#8696a0] group-hover:text-[#00a884] transition-colors flex-shrink-0" />
                </div>
              );
            })}

            {/* Log Out Row */}
            <div
              onClick={onLogout}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[14.5px] font-semibold text-rose-600 dark:text-rose-400">
                  Log out
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. MY CONTACT QR CODE SUB-PAGE                                 */}
      {/* ============================================================== */}
      {currentView === 'my_qr' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('My QR Code', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-6 bg-white rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 flex flex-col items-center max-w-xs">
              <div className="-mt-2 mb-2">
                <AvatarIcon
                  size="lg"
                  name={user?.name || 'Alex Morgan'}
                />
              </div>
              <h4 className="text-[17px] font-bold text-[#111b21]">{user?.name || 'Alex Morgan'}</h4>
              <p className="text-[12.5px] text-[#00a884] font-semibold mb-4">{user?.username || '@alex_m'}</p>

              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : 'https://nexo.chat'}/?contact=${encodeURIComponent(user?.username || '@alex_m')}`}
                size={190}
                level="H"
                imageSettings={{
                  src: '/logo.png',
                  height: 38,
                  width: 38,
                  excavate: true
                }}
              />
            </div>
            <p className="text-[13px] text-[#667781] dark:text-[#8696a0] max-w-xs">
              Your QR code is private. When scanned, contacts can add you directly on Nexo.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ACCOUNT SUB-PAGE                                            */}
      {/* ============================================================== */}
      {currentView === 'account' && !subView && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Account', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/40 dark:divide-[#2a3942]/40">
            <div
              onClick={() => setSubView('security')}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1]">
                  <ShieldCheck className="w-5 h-5 text-[#00a884]" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#111b21] dark:text-white">Security notifications</h4>
                  <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">End-to-end encryption & safety alerts</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8696a0]" />
            </div>

            <div
              onClick={() => setSubView('request_info')}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1]">
                  <FileText className="w-5 h-5 text-[#0055ff]" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-[#111b21] dark:text-white">Request account info</h4>
                  <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">Download a report of your account data</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8696a0]" />
            </div>

            <div
              onClick={() => setSubView('delete_account')}
              className="flex items-center justify-between px-5 py-4 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-rose-600 dark:text-rose-400">How to delete my account</h4>
                  <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">Permanent account erasure procedures</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </div>
          </div>
        </div>
      )}

      {/* 3.1 Security Notifications */}
      {currentView === 'account' && subView === 'security' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Security', () => setSubView(null))}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#00a884]/15 flex items-center justify-center text-[#00a884] mb-3">
                <Shield className="w-8 h-8 fill-current" />
              </div>
              <h3 className="text-[18px] font-bold text-[#111b21] dark:text-white">
                Your chats and calls are private
              </h3>
              <p className="text-[13px] text-[#667781] dark:text-[#8696a0] mt-1 max-w-sm">
                End-to-end encryption keeps your personal messages and calls between you and the people you choose. Not even Nexo can read or listen to them.
              </p>
            </div>

            <div className="space-y-3.5 bg-[#f0f2f5] dark:bg-[#202c33] p-4 rounded-2xl">
              {[
                { icon: MessageSquare, label: 'Text and voice messages' },
                { icon: PhoneCall, label: 'Audio and video calls' },
                { icon: ImageIcon, label: 'Photos, videos and documents' },
                { icon: MapPin, label: 'Location sharing' },
                { icon: Radio, label: 'Status updates' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#111b21] text-[#00a884]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[14px] font-medium text-[#111b21] dark:text-white">{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between">
              <div className="pr-4">
                <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">
                  Show security notifications on this computer
                </h5>
                <p className="text-[12px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                  Get notified when your security code changes for a contact's phone.
                </p>
              </div>
              <input
                type="checkbox"
                checked={securityNotifs}
                onChange={(e) => setSecurityNotifs(e.target.checked)}
                className="w-5 h-5 accent-[#00a884] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3.2 Request Info */}
      {currentView === 'account' && subView === 'request_info' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Request account info', () => setSubView(null))}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#0055ff]/15 text-[#0055ff]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-[#111b21] dark:text-white">Account information report</h4>
                <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0]">Export your profile info, settings, and session metadata.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-2 border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#667781] dark:text-[#8696a0]">Report Status:</span>
                <span className="text-[#00a884] font-semibold">Ready to download</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#667781] dark:text-[#8696a0]">Format:</span>
                <span className="font-mono text-[12px] text-[#111b21] dark:text-white">JSON Document (.json)</span>
              </div>
            </div>

            <button
              onClick={handleDownloadAccountInfo}
              className="w-full py-3 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Download Report (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3.3 Delete Account */}
      {currentView === 'account' && subView === 'delete_account' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Delete my account', () => setSubView(null))}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="text-[13px] text-rose-700 dark:text-rose-300">
                <p className="font-bold mb-1">Deleting your account will:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Delete your account info and profile photo.</li>
                  <li>Erase your message history on this device.</li>
                  <li>Remove you from all Nexo groups & channels.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => {
                try { localStorage.clear(); } catch {}
                onLogout();
              }}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[14px] shadow-md transition-all cursor-pointer"
            >
              Permanently Delete Account
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. PRIVACY SUB-PAGE (Radio-Button Sub-Pages)                    */}
      {/* ============================================================== */}
      {currentView === 'privacy' && !subView && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Privacy', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/30 dark:divide-[#2a3942]/40">
            {/* Section 1: Who can see my personal info */}
            <div className="p-4 space-y-1">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#00a884] block mb-2 px-1">
                Who can see my personal info
              </span>

              {/* Last seen and online */}
              <div
                onClick={() => setSubView('privacy_last_seen')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Last seen and online</h5>
                  <p className="text-[12px] text-[#00a884] font-medium">{lastSeen}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </div>

              {/* Profile picture */}
              <div
                onClick={() => setSubView('privacy_photo')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Profile picture</h5>
                  <p className="text-[12px] text-[#00a884] font-medium">{profilePhotoPrivacy}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </div>

              {/* About */}
              <div
                onClick={() => setSubView('privacy_about')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">About</h5>
                  <p className="text-[12px] text-[#00a884] font-medium">{aboutPrivacy}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </div>

              {/* Status */}
              <div
                onClick={() => setSubView('privacy_status')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Status</h5>
                  <p className="text-[12px] text-[#00a884] font-medium">{statusPrivacy}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </div>

              {/* Read receipts */}
              <div className="flex items-start justify-between p-3 rounded-xl">
                <div className="pr-3">
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Read receipts</h5>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                    If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={readReceipts}
                  onChange={(e) => setReadReceipts(e.target.checked)}
                  className="w-5 h-5 accent-[#00a884] cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Section 2: Disappearing messages & App Lock */}
            <div className="p-4 space-y-1">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#00a884] block mb-2 px-1">
                Disappearing messages
              </span>

              {/* Default message timer */}
              <div
                onClick={() => setSubView('privacy_timer')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Default message timer</h5>
                  <p className="text-[12px] text-[#00a884] font-medium">{defaultTimer}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </div>

              {/* Groups */}
              <div
                onClick={() => setSubView('privacy_groups')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Groups</h5>
                  <p className="text-[12px] text-[#00a884] font-medium">{groupsPrivacy}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </div>

              {/* Blocked contacts */}
              <div
                onClick={() => setSubView('privacy_blocked')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Blocked contacts</h5>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">{blockedUsers.length} contacts blocked</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </div>

              {/* App lock */}
              <div
                onClick={() => setSubView('privacy_app_lock')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">App lock</h5>
                  <p className="text-[12px] text-[#00a884] font-medium">
                    {appLockEnabled ? 'Enabled • PIN required' : 'Disabled'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4.1 Last Seen and Online Radio Sub-Screen */}
      {currentView === 'privacy' && subView === 'privacy_last_seen' && renderRadioSubScreen({
        title: 'Last seen and online',
        sectionLabel: 'Who can see my last seen & online status',
        options: ['Everyone', 'My contacts', 'My contacts except...', 'Nobody'],
        currentValue: lastSeen,
        onSelect: (val) => {
          setLastSeen(val);
          localStorage.setItem('nexo_privacy_last_seen', val);
        },
        onBack: () => setSubView(null),
      })}

      {/* 4.2 Profile Picture Radio Sub-Screen */}
      {currentView === 'privacy' && subView === 'privacy_photo' && renderRadioSubScreen({
        title: 'Profile photo',
        sectionLabel: 'Who can see my profile photo',
        options: ['Everyone', 'My contacts', 'My contacts except...', 'Nobody'],
        currentValue: profilePhotoPrivacy,
        onSelect: (val) => {
          setProfilePhotoPrivacy(val);
          localStorage.setItem('nexo_privacy_photo', val);
        },
        onBack: () => setSubView(null),
      })}

      {/* 4.3 About Radio Sub-Screen */}
      {currentView === 'privacy' && subView === 'privacy_about' && renderRadioSubScreen({
        title: 'About',
        sectionLabel: 'Who can see my About information',
        options: ['Everyone', 'My contacts', 'My contacts except...', 'Nobody'],
        currentValue: aboutPrivacy,
        onSelect: (val) => {
          setAboutPrivacy(val);
          localStorage.setItem('nexo_privacy_about', val);
        },
        onBack: () => setSubView(null),
      })}

      {/* 4.4 Status Radio Sub-Screen */}
      {currentView === 'privacy' && subView === 'privacy_status' && renderRadioSubScreen({
        title: 'Status privacy',
        sectionLabel: 'Who can see my status updates',
        options: ['Everyone', 'My contacts', 'My contacts except...', 'Nobody'],
        currentValue: statusPrivacy,
        onSelect: (val) => {
          setStatusPrivacy(val);
          localStorage.setItem('nexo_privacy_status', val);
        },
        onBack: () => setSubView(null),
      })}

      {/* 4.5 Disappearing Messages Default Timer Radio Sub-Screen */}
      {currentView === 'privacy' && subView === 'privacy_timer' && renderRadioSubScreen({
        title: 'Default message timer',
        sectionLabel: 'Start new chats with a default disappearing timer',
        options: ['24 hours', '7 days', '90 days', 'Off'],
        currentValue: defaultTimer,
        onSelect: (val) => {
          setDefaultTimer(val);
          localStorage.setItem('nexo_privacy_timer', val);
        },
        onBack: () => setSubView(null),
      })}

      {/* 4.6 Groups Radio Sub-Screen */}
      {currentView === 'privacy' && subView === 'privacy_groups' && renderRadioSubScreen({
        title: 'Groups',
        sectionLabel: 'Who can add me to groups',
        options: ['Everyone', 'My contacts', 'My contacts except...'],
        currentValue: groupsPrivacy,
        onSelect: (val) => {
          setGroupsPrivacy(val);
          localStorage.setItem('nexo_privacy_groups', val);
        },
        onBack: () => setSubView(null),
      })}

      {/* 4.7 Blocked Contacts Sub-Screen */}
      {currentView === 'privacy' && subView === 'privacy_blocked' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Blocked contacts', () => setSubView(null))}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <form onSubmit={handleAddBlockedUser} className="flex gap-2">
              <input
                type="text"
                value={newBlockedInput}
                onChange={(e) => setNewBlockedInput(e.target.value)}
                placeholder="Enter @username to block..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="submit"
                disabled={!newBlockedInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-[13px] font-semibold cursor-pointer"
              >
                Block
              </button>
            </form>

            {blockedUsers.length === 0 ? (
              <div className="text-center py-12 text-[#8696a0]">
                <UserX className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-[14px] font-semibold">No blocked contacts</p>
                <p className="text-[12px] text-[#667781] dark:text-[#8696a0] mt-1">
                  Blocked contacts will not be able to message or call you.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedUsers.map((u) => (
                  <div key={u} className="flex items-center justify-between p-3 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33]">
                    <span className="text-[14px] font-medium text-[#111b21] dark:text-white">{u}</span>
                    <button
                      onClick={() => handleUnblockUser(u)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4.8 App Lock Sub-Screen */}
      {currentView === 'privacy' && subView === 'privacy_app_lock' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('App lock', () => setSubView(null))}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between">
              <div>
                <h5 className="text-[15px] font-semibold text-[#111b21] dark:text-white">
                  Unlock with passcode / PIN
                </h5>
                <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                  When enabled, you'll need to enter your 4-digit PIN to open Nexo.
                </p>
              </div>
              <input
                type="checkbox"
                checked={appLockEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAppLockEnabled(val);
                  localStorage.setItem('nexo_app_lock_enabled', String(val));
                }}
                className="w-5 h-5 accent-[#00a884] cursor-pointer"
              />
            </div>

            {appLockEnabled && (
              <div className="p-5 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-4">
                <h5 className="text-[14.5px] font-bold text-[#111b21] dark:text-white">
                  Set 4-Digit Passcode
                </h5>
                <div className="flex items-center gap-3">
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-36 px-4 py-2.5 rounded-xl bg-white dark:bg-[#111b21] text-center tracking-widest text-[20px] font-bold text-[#111b21] dark:text-white border border-transparent focus:border-[#00a884] focus:outline-none"
                  />
                  <button
                    onClick={handleSavePin}
                    disabled={pinInput.length !== 4}
                    className="px-4 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white text-[13px] font-semibold cursor-pointer transition-all"
                  >
                    Save PIN
                  </button>
                </div>

                {pinSavedToast && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>PIN successfully updated!</span>
                  </div>
                )}

                <div className="pt-2 border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={() => {
                      if (onTriggerAppLock) onTriggerAppLock();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-[#111b21] dark:text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-[#00a884]" />
                    <span>Lock Screen Now (Test PIN)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. CHATS SUB-PAGE                                              */}
      {/* ============================================================== */}
      {currentView === 'chats' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Chats', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Enter is send</h5>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">Enter key sends message; Shift+Enter creates a new line</p>
                </div>
                <input
                  type="checkbox"
                  checked={enterIsSend}
                  onChange={(e) => setEnterIsSend(e.target.checked)}
                  className="w-5 h-5 accent-[#00a884] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Media auto-download</h5>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">Automatically load incoming images and audio</p>
                </div>
                <input
                  type="checkbox"
                  checked={mediaAutoDownload}
                  onChange={(e) => setMediaAutoDownload(e.target.checked)}
                  className="w-5 h-5 accent-[#00a884] cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              {chatsArchivedToast && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-[13px] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>All chats archived successfully</span>
                </div>
              )}
              <button
                onClick={() => {
                  setChatsArchivedToast(true);
                  setTimeout(() => setChatsArchivedToast(false), 3000);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] font-semibold text-[#111b21] dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 text-left flex items-center justify-between cursor-pointer"
              >
                <span>Archive all chats</span>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. APPEARANCE SUB-PAGE (Live Theme CSS Variables)              */}
      {/* ============================================================== */}
      {currentView === 'appearance' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Appearance', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div>
              <h4 className="text-[15px] font-bold text-[#111b21] dark:text-white mb-1">
                Chat Bubble Accent Color
              </h4>
              <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] mb-4">
                Click any accent to immediately update all outgoing chat bubbles across the app.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'emerald', label: 'Classic Emerald', color: '#00a884' },
                  { id: 'nexo', label: 'Nexo Gradient', gradient: 'from-[#0055ff] via-[#7b2cbf] to-[#d946ef]' },
                  { id: 'royal', label: 'Royal Blue', color: '#0044ff' },
                  { id: 'amethyst', label: 'Amethyst Violet', color: '#7b2cbf' },
                  { id: 'rose', label: 'Sunset Rose', color: '#f43f5e' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => applyBubbleTheme(item.id)}
                    className={`p-3 rounded-2xl border flex items-center gap-3 text-left cursor-pointer transition-all ${
                      bubbleColor === item.id
                        ? 'border-[#00a884] ring-2 ring-[#00a884]/30 bg-[#00a884]/5'
                        : 'border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex-shrink-0 ${
                        item.gradient ? `bg-gradient-to-r ${item.gradient}` : ''
                      }`}
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[13px] font-semibold text-[#111b21] dark:text-white">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-2">
              <h5 className="text-[13.5px] font-bold text-[#111b21] dark:text-white">Live Preview</h5>
              <div className="p-3 rounded-xl bg-white dark:bg-[#111b21] flex justify-end">
                <div
                  className="px-3.5 py-2 rounded-2xl rounded-tr-none text-[14px] shadow-sm font-medium"
                  style={{
                    background: 'var(--outgoing-bubble-bg, #d9fdd3)',
                    color: 'var(--outgoing-bubble-text, #111b21)'
                  }}
                >
                  This is how your outgoing messages look! ✨
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. BROADCASTS SUB-PAGE                                         */}
      {/* ============================================================== */}
      {currentView === 'broadcasts' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Broadcasts', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-[#0055ff]/10 border border-[#0055ff]/20">
              <h5 className="text-[14.5px] font-bold text-[#0055ff] mb-1">
                What are Broadcast Lists?
              </h5>
              <p className="text-[12.5px] text-[#667781] dark:text-[#aebac1]">
                Broadcast lists let you send a message to multiple contacts at once without creating a group chat. Only contacts who have saved your handle will receive it.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between">
                <div>
                  <h6 className="text-[14px] font-semibold text-[#111b21] dark:text-white">College Study Circle</h6>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">8 recipients</p>
                </div>
                <span className="text-xs text-[#00a884] font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. NOTIFICATIONS SUB-PAGE                                      */}
      {/* ============================================================== */}
      {currentView === 'notifications' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Notifications', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Message notifications</h5>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">Show notifications for new messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={messageNotifs}
                  onChange={(e) => setMessageNotifs(e.target.checked)}
                  className="w-5 h-5 accent-[#00a884] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Show previews</h5>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">Preview message text inside notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={showPreviews}
                  onChange={(e) => setShowPreviews(e.target.checked)}
                  className="w-5 h-5 accent-[#00a884] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">Sound alerts</h5>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">Play chime on incoming message</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="w-5 h-5 accent-[#00a884] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. STORAGE AND DATA SUB-PAGE                                   */}
      {/* ============================================================== */}
      {currentView === 'storage' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Storage and data', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-3">
              <h5 className="text-[14.5px] font-bold text-[#111b21] dark:text-white">Storage Usage</h5>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#667781] dark:text-[#8696a0]">Chat Cache:</span>
                  <span className="font-semibold text-[#111b21] dark:text-white">{storageStats.chatCache}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667781] dark:text-[#8696a0]">Media & Photos:</span>
                  <span className="font-semibold text-[#111b21] dark:text-white">{storageStats.mediaPhotos}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-black/5 dark:border-white/5 font-bold">
                  <span className="text-[#111b21] dark:text-white">Total Used:</span>
                  <span className="text-[#00a884]">{storageStats.totalUsed}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClearCache}
              className="w-full py-3 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-[#111b21] dark:text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {cacheCleared ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Cache Cleared Successfully</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Clear Local App Cache</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. APP LANGUAGE SUB-PAGE                                      */}
      {/* ============================================================== */}
      {currentView === 'language' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('App language', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto divide-y divide-[#d1d7db]/30 dark:divide-[#2a3942]/40">
            {[
              { id: 'en', name: 'English (US)', sub: 'Default' },
              { id: 'hi', name: 'हिन्दी (Hindi)', sub: 'हिंदी' },
              { id: 'es', name: 'Español (Spanish)', sub: 'Español' },
              { id: 'fr', name: 'Français (French)', sub: 'Français' },
              { id: 'de', name: 'Deutsch (German)', sub: 'Deutsch' },
            ].map((lang) => (
              <div
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/60 cursor-pointer transition-colors"
              >
                <div>
                  <h5 className="text-[14.5px] font-semibold text-[#111b21] dark:text-white">{lang.name}</h5>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">{lang.sub}</p>
                </div>
                {selectedLanguage === lang.id && (
                  <Check className="w-5 h-5 text-[#00a884]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 11. HELP AND FEEDBACK (Clean, No Gemini reference, No auto-toast)*/}
      {/* ============================================================== */}
      {currentView === 'help' && !subView && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Help and feedback', () => setCurrentView('main'))}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] space-y-2">
              <h5 className="text-[15.5px] font-bold text-[#111b21] dark:text-white">
                Nexo for Web
              </h5>
              <p className="text-[13px] text-[#00a884] font-semibold">
                Version 2.4.0 (Official Build)
              </p>
              <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] leading-relaxed">
                End-to-end encrypted messaging, voice & video calls, scheduled delivery, and productivity tools.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSubView('help_terms')}
                className="w-full p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] font-medium text-[#111b21] dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Terms and Privacy Policy</span>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </button>

              <button
                onClick={() => setSubView('help_contact')}
                className="w-full p-3.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] font-medium text-[#111b21] dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Contact Us & Send Feedback</span>
                <ChevronRight className="w-4 h-4 text-[#8696a0]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11.1 Dedicated Terms and Privacy Policy Sub-Page */}
      {currentView === 'help' && subView === 'help_terms' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Terms and Privacy Policy', () => setSubView(null))}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-[13.5px] text-[#111b21] dark:text-[#e9edef] leading-relaxed">
            <div className="p-4 rounded-2xl bg-[#00a884]/10 border border-[#00a884]/20 space-y-1">
              <h5 className="font-bold text-[#00a884] text-[14px]">Privacy & Encryption Guarantee</h5>
              <p className="text-[12.5px] text-[#667781] dark:text-[#aebac1]">
                Nexo is designed with strict security principles to safeguard your communication.
              </p>
            </div>

            <div className="space-y-3">
              <h6 className="font-bold text-[14.5px] text-[#111b21] dark:text-white">1. End-to-End Encryption</h6>
              <p className="text-[#667781] dark:text-[#8696a0]">
                All personal messages, media files, and calls are secured with end-to-end encryption. Only you and the people you are communicating with can read messages or listen to calls.
              </p>
            </div>

            <div className="space-y-3">
              <h6 className="font-bold text-[14.5px] text-[#111b21] dark:text-white">2. Data Ownership & Storage</h6>
              <p className="text-[#667781] dark:text-[#8696a0]">
                Your conversations are stored locally on your device. Nexo does not sell your private information, contact lists, or message content to advertisers.
              </p>
            </div>

            <div className="space-y-3">
              <h6 className="font-bold text-[14.5px] text-[#111b21] dark:text-white">3. Disappearing Messages & Account Deletion</h6>
              <p className="text-[#667781] dark:text-[#8696a0]">
                You have full control over your conversation history. You can enable automatic disappearing message timers or permanently erase your account data at any time from Account Settings.
              </p>
            </div>

            <div className="space-y-3">
              <h6 className="font-bold text-[14.5px] text-[#111b21] dark:text-white">4. User Conduct</h6>
              <p className="text-[#667781] dark:text-[#8696a0]">
                Users agree not to use Nexo for harassment, spam distribution, malware transmission, or unauthorized activities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 11.2 Dedicated Contact Us & Send Feedback Sub-Page */}
      {currentView === 'help' && subView === 'help_contact' && (
        <div className="w-full h-full flex flex-col">
          {renderSubHeader('Contact Us & Feedback', () => setSubView(null))}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {feedbackSubmitted ? (
              <div className="p-6 text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                  Feedback Received!
                </h4>
                <p className="text-[13px] text-[#667781] dark:text-[#8696a0] max-w-xs mx-auto">
                  Thank you for helping us improve Nexo. Our engineering team reviews all user reports.
                </p>
                <button
                  onClick={() => {
                    setFeedbackSubmitted(false);
                    setFeedbackSubject('');
                    setFeedbackMessage('');
                  }}
                  className="mt-3 px-5 py-2 rounded-xl bg-[#00a884] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Send Another Note
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!feedbackMessage.trim()) return;
                  setFeedbackSubmitted(true);
                }}
                className="space-y-4"
              >
                <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">
                  Tell us about bugs, feature ideas, or general suggestions to improve your Nexo experience.
                </p>

                <div>
                  <label className="block text-[12px] font-semibold text-[#8696a0] uppercase mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    placeholder="e.g. Chat bubble theme feedback, bug report..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#8696a0] uppercase mb-1">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Describe your feedback or issue in detail..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                  />
                </div>

                <div className="p-3 rounded-xl border border-dashed border-[#d1d7db] dark:border-white/10 flex items-center justify-between text-xs text-[#8696a0]">
                  <span>Optional: Attach screenshot</span>
                  <label className="px-3 py-1 bg-slate-200 dark:bg-white/10 rounded-lg text-[#111b21] dark:text-white cursor-pointer hover:bg-slate-300">
                    Browse
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!feedbackMessage.trim()}
                  className="w-full py-3 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white font-semibold text-[14px] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Feedback</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input for Profile Photo Upload */}
      <input
        type="file"
        ref={profileFileInputRef}
        accept="image/*"
        onChange={handleProfilePhotoChange}
        className="hidden"
      />

      {/* ============================================================== */}
      {/* FULL EDIT PROFILE MODAL (Name, @username, Photo & Mood)         */}
      {/* ============================================================== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#00a884] text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                    Edit Profile
                  </h3>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                    Customize your photo, handle and status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Silhouette Avatar Profile */}
              <div className="flex flex-col items-center justify-center">
                <AvatarIcon
                  size="xl"
                  name={editName || user?.name || 'Alex Morgan'}
                />
                <p className="mt-2 text-[12px] font-medium text-[#8696a0]">
                  Monochrome Silhouette Profile
                </p>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] text-[14px] text-[#111b21] dark:text-white focus:outline-none transition-all"
                />
                <p className="text-[11.5px] text-[#8696a0] mt-1">
                  This is the name visible to your contacts and inside your Self-Chat.
                </p>
              </div>

              {/* Username Handle Input */}
              <div>
                <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
                  Username Handle
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. @alex_m"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] text-[14px] text-[#111b21] dark:text-white focus:outline-none transition-all"
                />
                <p className="text-[11.5px] text-[#8696a0] mt-1">
                  Used by friends to search and find you on Nexo.
                </p>
              </div>

              {/* Mood / Status Input */}
              <div>
                <label className="block text-[12px] font-bold text-[#667781] dark:text-[#8696a0] uppercase tracking-wider mb-1">
                  About & Mood Status
                </label>
                <input
                  type="text"
                  value={editMood}
                  onChange={(e) => setEditMood(e.target.value)}
                  placeholder="e.g. Building Nexo Web ✨"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] border border-transparent focus:border-[#00a884] focus:bg-white dark:focus:bg-[#111b21] text-[14px] text-[#111b21] dark:text-white focus:outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#667781] dark:text-[#aebac1] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] active:bg-[#007a5f] text-white text-[13px] font-bold shadow-md shadow-[#00a884]/20 cursor-pointer transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {profileSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2 text-[13px] font-semibold animate-fadeIn">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{profileSuccessToast}</span>
        </div>
      )}
    </div>
  );
}
