import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smile, 
  Wand2, 
  Clock, 
  Image as ImageIcon, 
  X, 
  Mic, 
  Paperclip,
  FileText,
  Camera,
  Headphones,
  User,
  BarChart2,
  Calendar,
  Plus,
  Trash2,
  Square
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import AiToneModal from './AiToneModal';
import ScheduleModal from './ScheduleModal';
import CameraCaptureModal from './CameraCaptureModal';
import CreatePollModal from './CreatePollModal';
import CreateEventModal from './CreateEventModal';
import ShareContactModal from './ShareContactModal';

// Default built-in sticker pack
const DEFAULT_STICKERS = [
  { id: 'stk_1', label: 'Celebrate', emoji: '🎉', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2325d366" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">🎉</text></svg>' },
  { id: 'stk_2', label: 'Heart Eyes', emoji: '😍', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ff3b30" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">😍</text></svg>' },
  { id: 'stk_3', label: 'Fire', emoji: '🔥', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ff9500" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">🔥</text></svg>' },
  { id: 'stk_4', label: 'Cool Cat', emoji: '😎', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23007aff" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">😎</text></svg>' },
  { id: 'stk_5', label: 'Rocket', emoji: '🚀', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23af52de" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">🚀</text></svg>' },
  { id: 'stk_6', label: 'Super Star', emoji: '⭐', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ffcc00" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">⭐</text></svg>' }
];

// Reaction GIFs
const POPULAR_GIFS = [
  { id: 'g1', title: 'Happy Dance', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'g2', title: 'Thumbs Up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'g3', title: 'Mind Blown', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
  { id: 'g4', title: 'Cheers', url: 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif' },
  { id: 'g5', title: 'Laughing', url: 'https://media.giphy.com/media/dC9DTdqPmRnlS/giphy.gif' },
  { id: 'g6', title: 'Applause', url: 'https://media.giphy.com/media/nbvFVPiEiJH6JOGIok/giphy.gif' }
];

export default function Composer({
  onSendMessage,
  replyingTo,
  onCancelReply,
  chat,
  focusMode,
  onScheduleMessage
}) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null); // { type, fileName, fileSize, fileUrl }

  // Modals & Popovers
  const [showToneModal, setShowToneModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState('emojis');

  // Sub-modals for attachments
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Real Microphone Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const audioStreamRef = useRef(null);

  // Custom user stickers from localStorage
  const [customStickers, setCustomStickers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexo_custom_stickers') || '[]');
    } catch {
      return [];
    }
  });

  // Refs for hidden inputs
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const stickerCreatorInputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const emojiTrayRef = useRef(null);

  // Click outside listener for attachment menu and emoji tray
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
      if (emojiTrayRef.current && !emojiTrayRef.current.contains(e.target)) {
        if (!e.target.closest('#emoji-toggle-btn')) {
          setShowEmojiTray(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatRecordingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Real Mic Recording: Start
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone access is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission or recording error:', err);
      alert('Could not access microphone. Please ensure microphone permissions are granted in your browser settings.');
    }
  };

  // Real Mic Recording: Stop and Send
  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    const currentDuration = recordingSeconds;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current.mimeType || 'audio/webm'
      });

      // Stop stream tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }

      // Convert audio blob to base64 Data URL for instant playback and sync
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        onSendMessage({
          text: '',
          mediaType: 'audio',
          mediaUrl: base64Audio,
          duration: currentDuration || 1,
          fileName: `Voice_${Date.now().toString().slice(-4)}.m4a`
        });
      };
      reader.readAsDataURL(audioBlob);

      setIsRecording(false);
      setRecordingSeconds(0);
    };

    mediaRecorderRef.current.stop();
  };

  // Real Mic Recording: Cancel
  const cancelRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // Send typed message / images / attachments
  const handleSend = () => {
    if (!text.trim() && !imagePreview && !pendingAttachment) return;

    const payload = {
      text: text.trim(),
      image: imagePreview,
      quote: replyingTo ? { sender: replyingTo.sender, text: replyingTo.text } : null,
      attachment: pendingAttachment?.fileUrl || null,
      mediaType: pendingAttachment?.type || (imagePreview ? 'image' : null),
      fileName: pendingAttachment?.fileName || null,
      fileSize: pendingAttachment?.fileSize || null,
    };

    onSendMessage(payload);
    setText('');
    setImagePreview(null);
    setPendingAttachment(null);
    if (onCancelReply) onCancelReply();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File Upload Handlers
  const handlePhotoVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setShowAttachMenu(false);
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setPendingAttachment({
        type: 'document',
        fileName: file.name,
        fileSize: sizeStr,
        fileUrl: url
      });
      setShowAttachMenu(false);
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setPendingAttachment({
        type: 'audio',
        fileName: file.name,
        fileSize: sizeStr,
        fileUrl: url
      });
      setShowAttachMenu(false);
    }
  };

  const hasContent = text.trim().length > 0 || imagePreview || pendingAttachment;

  return (
    <div className="p-2.5 sm:p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#d1d7db]/80 dark:border-[#2a3942]/80 z-20 transition-colors relative font-sans select-none">
      
      {/* 1. Reply Banner */}
      {replyingTo && (
        <div className="mb-2 mx-2 p-2.5 rounded-xl bg-white dark:bg-[#111b21] border-l-4 border-[#00a884] shadow-xs flex items-center justify-between text-[13px] animate-fadeIn">
          <div className="truncate mr-2">
            <span className="font-semibold text-[#00a884] mr-1.5">
              Replying to {replyingTo.sender}:
            </span>
            <span className="text-[#54656f] dark:text-[#aebac1] truncate">
              {replyingTo.text}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Image / Attachment Preview Chips */}
      {imagePreview && (
        <div className="relative inline-block mb-2 ml-3 animate-fadeIn">
          <img
            src={imagePreview}
            alt="Upload Preview"
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-[#00a884]"
          />
          <button
            onClick={() => setImagePreview(null)}
            className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-500 text-white rounded-full shadow cursor-pointer hover:bg-rose-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {pendingAttachment && (
        <div className="relative inline-flex items-center gap-2 mb-2 ml-3 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-white/10 shadow-xs animate-fadeIn">
          <div className="p-1.5 rounded-lg bg-[#00a884]/15 text-[#00a884]">
            {pendingAttachment.type === 'document' ? (
              <FileText className="w-4 h-4" />
            ) : (
              <Headphones className="w-4 h-4" />
            )}
          </div>
          <div className="text-left text-[12.5px] max-w-[180px] truncate">
            <span className="font-semibold text-[#111b21] dark:text-white block truncate">
              {pendingAttachment.fileName}
            </span>
          </div>
          <button
            onClick={() => setPendingAttachment(null)}
            className="p-1 text-[#8696a0] hover:text-rose-500 cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input type="file" accept="image/*,video/*" ref={photoInputRef} onChange={handlePhotoVideoChange} className="hidden" />
      <input type="file" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.zip" ref={docInputRef} onChange={handleDocumentChange} className="hidden" />
      <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioChange} className="hidden" />

      {/* 3. COMPACT ATTACHMENT POPUP (28px icon circles, 13px labels, compact spacing) */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="absolute bottom-14 left-2 sm:left-4 z-50 bg-white dark:bg-[#202c33] rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 p-2 w-48 sm:w-52 animate-slideUp"
        >
          <div className="grid grid-cols-1 gap-1">
            {[
              {
                id: 'doc',
                label: 'Document',
                color: 'bg-[#7f66ff]',
                icon: FileText,
                action: () => docInputRef.current?.click(),
              },
              {
                id: 'photos',
                label: 'Photos & videos',
                color: 'bg-[#007bfc]',
                icon: ImageIcon,
                action: () => photoInputRef.current?.click(),
              },
              {
                id: 'camera',
                label: 'Camera',
                color: 'bg-[#d33b74]',
                icon: Camera,
                action: () => {
                  setShowAttachMenu(false);
                  setShowCameraModal(true);
                },
              },
              {
                id: 'audio',
                label: 'Audio file',
                color: 'bg-[#ff8000]',
                icon: Headphones,
                action: () => audioInputRef.current?.click(),
              },
              {
                id: 'contact',
                label: 'Contact card',
                color: 'bg-[#029eb4]',
                icon: User,
                action: () => {
                  setShowAttachMenu(false);
                  setShowContactModal(true);
                },
              },
              {
                id: 'poll',
                label: 'Poll',
                color: 'bg-[#ffb600]',
                icon: BarChart2,
                action: () => {
                  setShowAttachMenu(false);
                  setShowPollModal(true);
                },
              },
              {
                id: 'event',
                label: 'Event',
                color: 'bg-[#a855f7]',
                icon: Calendar,
                action: () => {
                  setShowAttachMenu(false);
                  setShowEventModal(true);
                },
              },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={opt.action}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                >
                  {/* Exactly 28px circle (w-7 h-7) */}
                  <div className={`w-7 h-7 rounded-full ${opt.color} text-white flex items-center justify-center flex-shrink-0 shadow-xs`}>
                    <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  {/* Exactly 13px label */}
                  <span className="text-[13px] font-medium text-[#111b21] dark:text-[#e9edef]">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TABBED EMOJI / GIFS / STICKERS TRAY */}
      {showEmojiTray && (
        <div
          ref={emojiTrayRef}
          className="absolute bottom-14 left-2 sm:left-12 z-50 bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 w-[95vw] sm:w-[360px] max-h-[380px] flex flex-col overflow-hidden animate-slideUp"
        >
          <div className="flex items-center border-b border-slate-200 dark:border-white/10 bg-[#f0f2f5] dark:bg-[#182229] px-2 py-1.5 flex-shrink-0">
            {[
              { id: 'emojis', label: 'Emojis' },
              { id: 'gifs', label: 'GIFs' },
              { id: 'stickers', label: 'Stickers' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveEmojiTab(tab.id)}
                className={`flex-1 py-1 text-[12.5px] font-semibold rounded-lg transition-colors cursor-pointer text-center ${
                  activeEmojiTab === tab.id
                    ? 'bg-white dark:bg-[#202c33] text-[#00a884] dark:text-[#25d366] shadow-xs'
                    : 'text-[#667781] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeEmojiTab === 'emojis' && (
            <div className="flex-1 overflow-hidden">
              <EmojiPicker
                onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)}
                autoFocusSearch={false}
                width="100%"
                height={320}
                theme="auto"
              />
            </div>
          )}

          {activeEmojiTab === 'gifs' && (
            <div className="p-2.5 overflow-y-auto max-h-[320px] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_GIFS.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => {
                      onSendMessage({ text: '', image: gif.url, mediaType: 'image/gif' });
                      setShowEmojiTray(false);
                    }}
                    className="group relative rounded-xl overflow-hidden aspect-video bg-black/10 hover:ring-2 hover:ring-[#00a884] cursor-pointer transition-all"
                  >
                    <img src={gif.url} alt={gif.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeEmojiTab === 'stickers' && (
            <div className="p-2.5 overflow-y-auto max-h-[320px] space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_STICKERS.map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => {
                      onSendMessage({ text: '', stickerUrl: stk.url, isSticker: true });
                      setShowEmojiTray(false);
                    }}
                    className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center group cursor-pointer transition-all aspect-square"
                  >
                    <img src={stk.url} alt={stk.label} className="w-12 h-12 object-cover rounded-lg group-hover:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MAIN COMPOSER BAR & REAL RECORDING BAR */}
      {isRecording ? (
        /* Live Recording Interface */
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#202c33] rounded-full px-4 py-2 border border-rose-500/30 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[14px] font-mono font-bold text-rose-600 dark:text-rose-400">
              {formatRecordingTime(recordingSeconds)}
            </span>
            <span className="text-[12.5px] text-[#8696a0] hidden sm:inline">
              Recording live microphone audio...
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-full text-[#8696a0] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-colors"
              title="Cancel recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {/* Send Recording Button */}
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="px-4 py-1.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-[13px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform active:scale-95"
              title="Stop and send audio message"
            >
              <Send className="w-4 h-4 ml-0.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      ) : (
        /* Normal Composer Bar */
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Multi-Option Paperclip Button */}
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojiTray(false);
            }}
            title="Attach"
            className={`p-2 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
              showAttachMenu
                ? 'bg-[#00a884] text-white shadow-xs'
                : 'text-[#54656f] dark:text-[#8696a0] hover:text-[#00a884] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Unified Input Pill Bar */}
          <div className="flex-1 flex items-center bg-white dark:bg-[#2a3942] rounded-full px-2.5 sm:px-3 py-1 shadow-xs border border-black/5 dark:border-white/5 transition-all min-w-0">
            {/* Emoji Toggle */}
            <button
              id="emoji-toggle-btn"
              type="button"
              onClick={() => {
                setShowEmojiTray(!showEmojiTray);
                setShowAttachMenu(false);
              }}
              title="Emojis, GIFs & Stickers"
              className={`p-1.5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                showEmojiTray
                  ? 'text-[#00a884] dark:text-[#25d366]'
                  : 'text-[#54656f] dark:text-[#8696a0] hover:text-[#00a884]'
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chat?.isSelfChat ? "Save a note, link, or code snippet..." : "Message..."}
              className="flex-1 px-2.5 py-1.5 bg-transparent text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] text-[15px] focus:outline-none font-sans min-w-0"
            />

            {/* AI Magic Wand */}
            <button
              type="button"
              onClick={() => setShowToneModal(true)}
              title="AI Tone Rewrite & Translate"
              className="p-1.5 text-[#00a884] dark:text-[#25d366] hover:scale-110 transition-transform relative cursor-pointer flex-shrink-0"
            >
              <Wand2 className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Schedule Message */}
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              title="Schedule Message"
              className="p-1.5 text-[#54656f] dark:text-[#8696a0] hover:text-[#00a884] transition-colors rounded-full cursor-pointer flex-shrink-0"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>

          {/* Send Button or Real Mic Recording Trigger */}
          {hasContent ? (
            <button
              type="button"
              onClick={handleSend}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-md shadow-[#00a884]/25 transition-all transform active:scale-95 cursor-pointer flex-shrink-0"
              title="Send message"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-md shadow-[#00a884]/25 transition-all transform active:scale-95 cursor-pointer flex-shrink-0"
              title="Record voice note (Click to start recording)"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Sub-modals */}
      {showToneModal && (
        <AiToneModal
          initialText={text}
          onApply={(rewritten) => setText(rewritten)}
          onClose={() => setShowToneModal(false)}
        />
      )}

      {showScheduleModal && (
        <ScheduleModal
          chat={chat}
          pendingText={text}
          pendingImage={imagePreview}
          onSchedule={(data) => {
            if (onScheduleMessage) onScheduleMessage(data);
            setText('');
            setImagePreview(null);
          }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {showCameraModal && (
        <CameraCaptureModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={(capturedUrl) => {
            setImagePreview(capturedUrl);
            setShowCameraModal(false);
          }}
        />
      )}

      {showPollModal && (
        <CreatePollModal
          isOpen={showPollModal}
          onClose={() => setShowPollModal(false)}
          onCreatePoll={(pollData) => {
            onSendMessage({ text: '', poll: pollData });
            setShowPollModal(false);
          }}
        />
      )}

      {showEventModal && (
        <CreateEventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onCreateEvent={(eventData) => {
            onSendMessage({ text: '', event: eventData });
            setShowEventModal(false);
          }}
        />
      )}

      {showContactModal && (
        <ShareContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onShareContact={(contactCard) => {
            onSendMessage({ text: '', contactCard });
            setShowContactModal(false);
          }}
        />
      )}
    </div>
  );
}
