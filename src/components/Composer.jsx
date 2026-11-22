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
  Sparkles,
  Upload
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
  { id: 'stk_1', label: 'Celebrate', emoji: '🎉', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120' },
  { id: 'stk_2', label: 'Heart Eyes', emoji: '😍', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=120' },
  { id: 'stk_3', label: 'Fire', emoji: '🔥', url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=120' },
  { id: 'stk_4', label: 'Cool Cat', emoji: '😎', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120' },
  { id: 'stk_5', label: 'Rocket', emoji: '🚀', url: 'https://images.unsplash.com/photo-1517976487588-41dfa7d65377?w=120' },
  { id: 'stk_6', label: 'Super Star', emoji: '⭐', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=120' }
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
  const [pendingAttachment, setPendingAttachment] = useState(null); // { type: 'document'|'audio', fileName, fileSize, fileUrl }

  // Modals & Popovers
  const [showToneModal, setShowToneModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState('emojis'); // 'emojis' | 'gifs' | 'stickers'

  // Sub-modals for 7 attachments
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Custom user stickers from localStorage
  const [customStickers, setCustomStickers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nexo_custom_stickers') || '[]');
    } catch {
      return [];
    }
  });

  // Refs for hidden inputs & click outside
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
        // Only close if not clicking the toggle button
        if (!e.target.closest('#emoji-toggle-btn')) {
          setShowEmojiTray(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!text.trim() && !imagePreview && !pendingAttachment) return;

    onSendMessage({
      text: text.trim(),
      image: imagePreview || null,
      attachment: pendingAttachment ? pendingAttachment.fileUrl : null,
      mediaType: pendingAttachment ? pendingAttachment.type : (imagePreview ? 'image' : null),
      fileName: pendingAttachment ? pendingAttachment.fileName : null,
      fileSize: pendingAttachment ? pendingAttachment.fileSize : null,
      quote: replyingTo ? { sender: replyingTo.sender, text: replyingTo.text } : null,
    });

    setText('');
    setImagePreview(null);
    setPendingAttachment(null);
    setShowAttachMenu(false);
    setShowEmojiTray(false);
    if (onCancelReply) onCancelReply();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Image & Video File Change
  const handlePhotoVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setShowAttachMenu(false);
    }
  };

  // Document File Change (.pdf, .doc, .zip, etc.)
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

  // Audio File Change
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

  // Custom Sticker Maker: file uploader converts image to custom sticker
  const handleCreateCustomSticker = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const newSticker = {
            id: `cust_${Date.now()}`,
            label: 'My Sticker',
            url: reader.result
          };
          const updated = [newSticker, ...customStickers];
          setCustomStickers(updated);
          try {
            localStorage.setItem('nexo_custom_stickers', JSON.stringify(updated));
          } catch {}
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Send a sticker immediately
  const handleSendSticker = (sticker) => {
    onSendMessage({
      text: '',
      stickerUrl: sticker.url,
      isSticker: true,
      quote: replyingTo ? { sender: replyingTo.sender, text: replyingTo.text } : null,
    });
    setShowEmojiTray(false);
    if (onCancelReply) onCancelReply();
  };

  // Send a GIF immediately
  const handleSendGif = (gif) => {
    onSendMessage({
      text: '',
      image: gif.url,
      mediaType: 'image/gif',
      quote: replyingTo ? { sender: replyingTo.sender, text: replyingTo.text } : null,
    });
    setShowEmojiTray(false);
    if (onCancelReply) onCancelReply();
  };

  const hasContent = text.trim().length > 0 || imagePreview || pendingAttachment;

  return (
    <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#d1d7db]/80 dark:border-[#2a3942]/80 z-20 transition-colors relative font-sans select-none">
      
      {/* 1. Reply Banner */}
      {replyingTo && (
        <div className="mb-2 mx-2 p-2.5 rounded-xl bg-white dark:bg-[#111b21] border-l-4 border-[#0044ff] shadow-sm flex items-center justify-between text-[13px] animate-fadeIn">
          <div className="truncate mr-2">
            <span className="font-semibold text-[#0044ff] mr-1.5">
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

      {/* 2. Image / Pending Attachment Preview Chips */}
      {imagePreview && (
        <div className="relative inline-block mb-2 ml-3 animate-fadeIn">
          <img
            src={imagePreview}
            alt="Upload Preview"
            className="w-16 h-16 rounded-xl object-cover ring-2 ring-[#0044ff]"
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
        <div className="relative inline-flex items-center gap-2 mb-2 ml-3 px-3 py-2 rounded-xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-white/10 shadow-sm animate-fadeIn">
          <div className="p-2 rounded-lg bg-[#0044ff]/10 text-[#0044ff]">
            {pendingAttachment.type === 'document' ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Headphones className="w-5 h-5" />
            )}
          </div>
          <div className="text-left text-[12.5px] max-w-[180px] truncate">
            <span className="font-semibold text-[#111b21] dark:text-white block truncate">
              {pendingAttachment.fileName}
            </span>
            <span className="text-[#8696a0] text-[11px]">
              {pendingAttachment.fileSize}
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
      <input
        type="file"
        accept="image/*,video/*"
        ref={photoInputRef}
        onChange={handlePhotoVideoChange}
        className="hidden"
      />
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.zip"
        ref={docInputRef}
        onChange={handleDocumentChange}
        className="hidden"
      />
      <input
        type="file"
        accept="audio/*"
        ref={audioInputRef}
        onChange={handleAudioChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={stickerCreatorInputRef}
        onChange={handleCreateCustomSticker}
        className="hidden"
      />

      {/* ============================================================== */}
      {/* 3. WHATSAPP-STYLE 7-OPTION ATTACHMENT FLOATING POPOVER         */}
      {/* ============================================================== */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="absolute bottom-16 left-3 sm:left-4 z-50 bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 p-3 w-64 animate-slideUp"
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
                label: 'Audio',
                color: 'bg-[#ff8000]',
                icon: Headphones,
                action: () => audioInputRef.current?.click(),
              },
              {
                id: 'contact',
                label: 'Contact',
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
                  className="flex items-center gap-3.5 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-full ${opt.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0`}>
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[13.5px] font-medium text-[#111b21] dark:text-[#e9edef]">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TABBED EMOJI / GIFS / STICKERS TRAY                        */}
      {/* ============================================================== */}
      {showEmojiTray && (
        <div
          ref={emojiTrayRef}
          className="absolute bottom-16 left-2 sm:left-12 z-50 bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 w-[95vw] sm:w-[380px] max-h-[420px] flex flex-col overflow-hidden animate-slideUp"
        >
          {/* Header Switcher: Emojis | GIFs | Stickers */}
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
                className={`flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-colors cursor-pointer text-center ${
                  activeEmojiTab === tab.id
                    ? 'bg-white dark:bg-[#202c33] text-[#0044ff] dark:text-[#0055ff] shadow-xs'
                    : 'text-[#667781] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Emoji Picker (emoji-picker-react) */}
          {activeEmojiTab === 'emojis' && (
            <div className="flex-1 overflow-hidden">
              <EmojiPicker
                onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)}
                autoFocusSearch={false}
                width="100%"
                height={350}
                theme="auto"
              />
            </div>
          )}

          {/* Tab 2: Reaction GIFs Grid */}
          {activeEmojiTab === 'gifs' && (
            <div className="p-3 overflow-y-auto max-h-[350px] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8696a0] px-1">
                Trending Reaction GIFs
              </span>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_GIFS.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => handleSendGif(gif)}
                    className="group relative rounded-xl overflow-hidden aspect-video bg-black/10 hover:ring-2 hover:ring-[#0044ff] cursor-pointer transition-all"
                  >
                    <img
                      src={gif.url}
                      alt={gif.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-black/60 text-white text-[10px] font-medium truncate">
                      {gif.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Stickers + Custom Sticker Creator */}
          {activeEmojiTab === 'stickers' && (
            <div className="p-3 overflow-y-auto max-h-[350px] space-y-3">
              {/* Add / Create Sticker Action Button */}
              <button
                type="button"
                onClick={() => stickerCreatorInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#0044ff] text-[#0044ff] dark:text-[#0055ff] hover:bg-[#0044ff]/5 text-[12.5px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add / Create Custom Sticker</span>
              </button>

              {/* Custom User Stickers */}
              {customStickers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8696a0] px-1">
                    Your Created Stickers ({customStickers.length})
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {customStickers.map((stk) => (
                      <button
                        key={stk.id}
                        type="button"
                        onClick={() => handleSendSticker(stk)}
                        className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5 flex items-center justify-center group cursor-pointer transition-all aspect-square"
                      >
                        <img
                          src={stk.url}
                          alt={stk.label}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Built-in Sticker Pack */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8696a0] px-1">
                  Nexo Pack
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_STICKERS.map((stk) => (
                    <button
                      key={stk.id}
                      type="button"
                      onClick={() => handleSendSticker(stk)}
                      className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/5 flex flex-col items-center justify-center group cursor-pointer transition-all aspect-square"
                    >
                      <img
                        src={stk.url}
                        alt={stk.label}
                        className="w-14 h-14 object-cover rounded-lg group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[10px] text-[#667781] dark:text-[#8696a0] mt-1 font-medium">
                        {stk.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MAIN COMPOSER BAR (Paperclip + Emoji + Pill + Send)          */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Multi-Option Paperclip Button (Item 5) */}
        <button
          type="button"
          onClick={() => {
            setShowAttachMenu(!showAttachMenu);
            setShowEmojiTray(false);
          }}
          title="Attach"
          className={`p-2.5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
            showAttachMenu
              ? 'bg-[#0044ff] text-white shadow-md'
              : 'text-[#54656f] dark:text-[#8696a0] hover:text-[#0044ff] hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* The Unified Pill Bar */}
        <div className="flex-1 flex items-center bg-white dark:bg-[#2a3942] rounded-full px-2.5 sm:px-3 py-1 shadow-composer border border-black/5 dark:border-white/5 transition-all min-w-0">
          {/* Emoji / GIF / Sticker Tray Toggle */}
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
                ? 'text-[#0044ff] dark:text-[#0055ff]'
                : 'text-[#54656f] dark:text-[#8696a0] hover:text-[#0044ff]'
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

          {/* AI Magic Wand (Tone Rewrite / Translate) */}
          <button
            type="button"
            onClick={() => setShowToneModal(true)}
            title="AI Tone Rewrite & Translate"
            className="p-1.5 text-[#0044ff] dark:text-[#0055ff] hover:scale-110 transition-transform relative cursor-pointer flex-shrink-0"
          >
            <Wand2 className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r from-[#0055ff] to-[#d946ef] animate-pulse" />
          </button>

          {/* Schedule Message (Clock Icon) */}
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            title="Schedule Message"
            className="p-1.5 text-[#54656f] dark:text-[#8696a0] hover:text-[#0044ff] transition-colors rounded-full cursor-pointer flex-shrink-0"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>

        {/* Send Button or Voice Note Mic */}
        {hasContent ? (
          <button
            type="button"
            onClick={handleSend}
            className="w-11 h-11 rounded-full bg-[#0044ff] hover:bg-[#0038d1] text-white flex items-center justify-center shadow-md shadow-[#0044ff]/25 transition-all transform active:scale-95 cursor-pointer flex-shrink-0"
            title="Send"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onSendMessage('🎙️ Voice message (0:12)');
            }}
            className="w-11 h-11 rounded-full bg-white dark:bg-[#2a3942] text-[#54656f] dark:text-[#8696a0] hover:text-[#0044ff] flex items-center justify-center shadow-composer transition-all cursor-pointer flex-shrink-0"
            title="Send Voice Note"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. MODALS                                                      */}
      {/* ============================================================== */}
      
      {/* AI Tone Modal */}
      {showToneModal && (
        <AiToneModal
          initialText={text}
          onApply={(rewritten) => {
            setText(rewritten);
            setShowToneModal(false);
          }}
          onClose={() => setShowToneModal(false)}
        />
      )}

      {/* Schedule Modal (Preserves attached media payload) */}
      {showScheduleModal && (
        <ScheduleModal
          messageText={text}
          imagePreview={imagePreview}
          mediaAttachment={pendingAttachment}
          onSchedule={(schedData) => {
            if (onScheduleMessage) {
              const isObj = typeof schedData === 'object' && schedData !== null;
              onScheduleMessage({
                text: text.trim() || (imagePreview ? 'Photo' : 'Scheduled Reminder'),
                image: imagePreview || null,
                mediaUrl: imagePreview || pendingAttachment?.fileUrl || null,
                mediaType: pendingAttachment?.type || (imagePreview ? 'image' : null),
                fileName: pendingAttachment?.fileName || null,
                fileSize: pendingAttachment?.fileSize || null,
                scheduledFor: isObj ? schedData.scheduledFor : schedData,
                scheduledAt: isObj ? schedData.scheduledAt : Date.now() + 60000,
                recipientName: chat?.name
              });
            }
            setShowScheduleModal(false);
            setText('');
            setImagePreview(null);
            setPendingAttachment(null);
          }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(dataUrl) => {
          setImagePreview(dataUrl);
        }}
      />

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onSubmit={(pollData) => {
          onSendMessage({
            text: `📊 Poll: ${pollData.question}`,
            poll: pollData
          });
        }}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSubmit={(eventData) => {
          onSendMessage({
            text: `📅 Event: ${eventData.title}`,
            event: eventData
          });
        }}
      />

      {/* Share Contact Modal */}
      <ShareContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSubmit={(contactData) => {
          onSendMessage({
            text: `👤 Contact: ${contactData.name}`,
            contactCard: contactData
          });
        }}
      />
    </div>
  );
}
