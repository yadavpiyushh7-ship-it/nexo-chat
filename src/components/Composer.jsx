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
  Trash2,
  Code2,
  Check,
  Loader2,
  Crop,
  SlidersHorizontal,
  Type,
  Download,
  Plus
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import AiToneModal from './AiToneModal';
import ScheduleModal from './ScheduleModal';
import CameraCaptureModal from './CameraCaptureModal';
import CreatePollModal from './CreatePollModal';
import CreateEventModal from './CreateEventModal';
import ShareContactModal from './ShareContactModal';
import { useLanguage } from '../contexts/LanguageContext';

const DEFAULT_STICKERS = [
  { id: 'stk_1', label: 'Celebrate', emoji: '🎉', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2325d366" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">🎉</text></svg>' },
  { id: 'stk_2', label: 'Heart Eyes', emoji: '😍', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ff3b30" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">😍</text></svg>' },
  { id: 'stk_3', label: 'Fire', emoji: '🔥', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ff9500" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">🔥</text></svg>' },
  { id: 'stk_4', label: 'Cool', emoji: '😎', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23007aff" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">😎</text></svg>' },
  { id: 'stk_5', label: 'Rocket', emoji: '🚀', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23af52de" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">🚀</text></svg>' },
  { id: 'stk_6', label: 'Super Star', emoji: '⭐', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23ffcc00" opacity="0.15"/><text x="50" y="65" font-size="50" text-anchor="middle">⭐</text></svg>' }
];

const POPULAR_GIFS = [
  { id: 'g1', title: 'Happy Dance', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'g2', title: 'Thumbs Up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'g3', title: 'Mind Blown', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
  { id: 'g4', title: 'Cheers', url: 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif' },
  { id: 'g5', title: 'Laughing', url: 'https://media.giphy.com/media/dC9DTdqPmRnlS/giphy.gif' },
  { id: 'g6', title: 'Applause', url: 'https://media.giphy.com/media/nbvFVPiEiJH6JOGIok/giphy.gif' }
];

const CODE_LANGUAGES = [
  { id: 'cpp', label: 'C++' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'sql', label: 'SQL' },
];

function formatExactFileSize(bytes) {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(name) {
  if (!name || !name.includes('.')) return 'FILE';
  return name.split('.').pop().toUpperCase().slice(0, 6);
}

function processImageWithCanvas(srcUrl, isHd, options = {}) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = isHd ? 3840 : 1280;
      const quality = isHd ? 0.96 : 0.8;
      let sx = 0;
      let sy = 0;
      let sWidth = img.width || 1280;
      let sHeight = img.height || 720;

      if (options.croppedSquare) {
        const minSide = Math.min(sWidth, sHeight);
        sx = Math.round((sWidth - minSide) / 2);
        sy = Math.round((sHeight - minSide) / 2);
        sWidth = minSide;
        sHeight = minSide;
      }

      let width = sWidth;
      let height = sHeight;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (options.filterMode === 'vivid') ctx.filter = 'contrast(1.12) saturate(1.22)';
      else if (options.filterMode === 'bw') ctx.filter = 'grayscale(1) contrast(1.08)';
      else if (options.filterMode === 'warm') ctx.filter = 'sepia(0.22) saturate(1.12)';
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);

      if (options.overlayText && options.overlayText.trim()) {
        ctx.filter = 'none';
        const fontSize = Math.max(20, Math.round(height * 0.045));
        ctx.font = `600 ${fontSize}px "Segoe UI Variable Display", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, height - fontSize * 2.2, width, fontSize * 2.2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(options.overlayText.trim(), width / 2, height - fontSize * 0.75);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({
        dataUrl,
        width,
        height,
        approxSize: formatExactFileSize(Math.round((dataUrl.length * 3) / 4)),
      });
    };
    img.onerror = () => resolve({ dataUrl: srcUrl, width: 0, height: 0, approxSize: '' });
    img.src = srcUrl;
  });
}

export default function Composer({
  onSendMessage,
  replyingTo,
  onCancelReply,
  chat,
  focusMode,
  onScheduleMessage
}) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);

  // WhatsApp-style Pre-Send "HD" Media Preview & Editor Modal
  const [hdPreviewModal, setHdPreviewModal] = useState(null); // { items: [{ rawSrc, fileName, isHd, caption, filterMode, croppedSquare, overlayText }], activeIndex }
  const [showOverlayTextBar, setShowOverlayTextBar] = useState(false);
  const [processingHdImage, setProcessingHdImage] = useState(false);

  // Built-in Code Snippet Composer
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeLang, setCodeLang] = useState('cpp');
  const [codeContent, setCodeContent] = useState('');
  const [pendingCodeBlock, setPendingCodeBlock] = useState(null);

  const textInputRef = useRef(null);

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

  const photoInputRef = useRef(null);
  const addMorePhotoRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const emojiTrayRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatRecordingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
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
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access error:', err);
    }
  };

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

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dur = currentDuration || 1;
        onSendMessage({
          text: '',
          audio_url: reader.result,
          audio_duration: dur,
          mediaType: 'audio',
          mediaUrl: reader.result,
          duration: dur,
          fileName: `Voice_${Date.now().toString().slice(-4)}.webm`,
          fileSize: formatExactFileSize(audioBlob.size),
        });
      };
      reader.readAsDataURL(audioBlob);

      setIsRecording(false);
      setRecordingSeconds(0);
    };

    mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const handleSend = () => {
    if (!text.trim() && !imagePreview && !pendingAttachment && !pendingCodeBlock) return;

    const finalText = pendingCodeBlock
      ? `${text.trim() ? text.trim() + '\n' : ''}\`\`\`${pendingCodeBlock.language}\n${pendingCodeBlock.code}\n\`\`\``
      : text.trim();

    const payload = {
      text: finalText,
      image: imagePreview,
      quote: replyingTo ? { sender: replyingTo.sender, text: replyingTo.text } : null,
      attachment: pendingAttachment?.fileUrl || null,
      mediaType: pendingAttachment?.type || (imagePreview ? 'image' : null),
      fileName: pendingAttachment?.fileName || imageMeta?.fileName || null,
      fileSize: pendingAttachment?.fileSize || imageMeta?.fileSize || null,
      fileExt: pendingAttachment?.fileExt || imageMeta?.fileExt || null,
      isUncompressed: Boolean(pendingAttachment || imageMeta),
    };

    onSendMessage(payload);
    setText('');
    setImagePreview(null);
    setImageMeta(null);
    setPendingAttachment(null);
    setPendingCodeBlock(null);
    if (onCancelReply) onCancelReply();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // WhatsApp-style Pre-Send Media Preview & Editor trigger (supports multi-photo + HD toggle)
  const loadImagesIntoPreviewModal = (files, append = false) => {
    const imgFiles = Array.from(files || []).filter((f) => f.type?.startsWith('image/'));
    if (imgFiles.length === 0) return;

    Promise.all(
      imgFiles.map(
        (file) =>
          new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () =>
              res(
                reader.result
                  ? {
                      rawSrc: reader.result,
                      fileName: file.name || `Image_${Date.now()}.jpg`,
                      isHd: false,
                      caption: text || '',
                      filterMode: 'none',
                      croppedSquare: false,
                      overlayText: '',
                    }
                  : null
              );
            reader.onerror = () => res(null);
            reader.readAsDataURL(file);
          })
      )
    ).then((loaded) => {
      const valid = loaded.filter(Boolean);
      if (valid.length === 0) return;
      setShowOverlayTextBar(false);
      setHdPreviewModal((prev) => {
        if (append && prev?.items?.length) {
          const nextItems = [...prev.items, ...valid];
          return { items: nextItems, activeIndex: nextItems.length - valid.length };
        }
        return { items: valid, activeIndex: 0 };
      });
    });
  };

  const handlePhotoVideoChange = (e) => {
    const files = e.target.files;
    if (files?.length) {
      const firstFile = files[0];
      const hasImages = Array.from(files).some((f) => f.type?.startsWith('image/'));
      if (hasImages) {
        loadImagesIntoPreviewModal(files, false);
      } else if (firstFile) {
        const url = URL.createObjectURL(firstFile);
        setPendingAttachment({
          type: 'document',
          fileName: firstFile.name,
          fileSize: formatExactFileSize(firstFile.size),
          fileExt: getFileExtension(firstFile.name),
          fileUrl: url,
        });
      }
      setShowAttachMenu(false);
    }
    e.target.value = '';
  };

  const handleConfirmSendHdImage = async (e) => {
    e?.preventDefault();
    const items = hdPreviewModal?.items || [];
    if (items.length === 0 || processingHdImage) return;
    setProcessingHdImage(true);
    try {
      for (const item of items) {
        const processed = await processImageWithCanvas(item.rawSrc, item.isHd, {
          filterMode: item.filterMode,
          croppedSquare: item.croppedSquare,
          overlayText: item.overlayText,
        });
        await onSendMessage({
          text: (item.caption || '').trim(),
          image: processed.dataUrl,
          mediaUrl: processed.dataUrl,
          mediaType: 'image',
          is_hd: Boolean(item.isHd),
          fileName: item.fileName,
          fileSize: processed.approxSize || undefined,
          fileExt: 'JPG',
        });
      }
      setHdPreviewModal(null);
      setShowOverlayTextBar(false);
      setText('');
      if (onCancelReply) onCancelReply();
    } finally {
      setProcessingHdImage(false);
    }
  };

  const applyRichFormat = (marker) => {
    const el = textInputRef.current;
    if (!el) {
      setText((prev) => `${prev}${marker}${marker}`);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const selected = text.slice(start, end);
    const wrapped = selected ? `${marker}${selected}${marker}` : `${marker}text${marker}`;
    const nextVal = text.slice(0, start) + wrapped + text.slice(end);
    setText(nextVal);
    setTimeout(() => {
      el.focus();
      if (selected) {
        const pos = start + wrapped.length;
        el.setSelectionRange(pos, pos);
      } else {
        el.setSelectionRange(start + marker.length, start + marker.length + 4);
      }
    }, 10);
  };

  // Uncompressed File & Code (.cpp, .py, .pdf, .zip, etc.) Upload
  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPendingAttachment({
        type: 'document',
        fileName: file.name,
        fileSize: formatExactFileSize(file.size),
        fileExt: getFileExtension(file.name),
        fileUrl: url
      });
      setShowAttachMenu(false);
    }
    e.target.value = '';
  };

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPendingAttachment({
        type: 'audio',
        fileName: file.name,
        fileSize: formatExactFileSize(file.size),
        fileExt: getFileExtension(file.name),
        fileUrl: url
      });
      setShowAttachMenu(false);
    }
    e.target.value = '';
  };

  const handleAttachCodeSnippet = (e) => {
    e.preventDefault();
    if (!codeContent.trim()) return;
    setPendingCodeBlock({
      language: codeLang,
      code: codeContent.replace(/\n$/, ''),
    });
    setCodeContent('');
    setShowCodeModal(false);
  };

  const hasContent = Boolean(text.trim() || imagePreview || pendingAttachment || pendingCodeBlock);

  return (
    <div className="p-2 sm:p-2.5 bg-[#f0f2f5] dark:bg-[#111b21] border-t border-[#e9edef] dark:border-[#222e35] z-20 transition-colors duration-150 relative select-none">
      
      {/* 1. Reply Banner */}
      {replyingTo && (
        <div className="mb-2 mx-2 p-2.5 rounded-xl bg-white dark:bg-[#111b21] border-l-4 border-[#0055ff] shadow-xs flex items-center justify-between text-[13px] animate-fadeIn">
          <div className="truncate mr-2">
            <span className="font-semibold text-[#0055ff] mr-1.5">
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

      {/* 2. Preview Chips (High-Res Image, Uncompressed File, Code Block) */}
      <div className="flex flex-wrap items-center gap-2">
        {imagePreview && (
          <div className="relative inline-flex items-center gap-2 mb-2 ml-2 p-1.5 pr-7 rounded-xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-white/10 shadow-xs animate-fadeIn">
            <img
              src={imagePreview}
              alt="Full-Res Preview"
              className="w-12 h-12 rounded-lg object-cover ring-1 ring-[#00a884]"
            />
            {imageMeta && (
              <div className="text-left text-[11.5px] max-w-[140px]">
                <span className="font-semibold text-[#111b21] dark:text-white block truncate">{imageMeta.fileName}</span>
                <span className="text-[#00a884] font-semibold">
                  {imageMeta.fileExt} • {imageMeta.fileSize} (Full-Res)
                </span>
              </div>
            )}
            <button
              onClick={() => { setImagePreview(null); setImageMeta(null); }}
              className="absolute top-1 right-1 p-0.5 bg-rose-500 text-white rounded-full shadow cursor-pointer hover:bg-rose-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {pendingAttachment && (
          <div className="relative inline-flex items-center gap-2 mb-2 ml-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-white/10 shadow-xs animate-fadeIn">
            <div className="px-2 py-1 rounded-lg bg-[#0055ff]/15 text-[#0055ff] dark:text-sky-400 text-[10.5px] font-bold">
              {pendingAttachment.fileExt || 'FILE'}
            </div>
            <div className="text-left text-[12px] max-w-[180px] truncate">
              <span className="font-semibold text-[#111b21] dark:text-white block truncate">
                {pendingAttachment.fileName}
              </span>
              <span className="text-[10.5px] text-[#667781] dark:text-[#8696a0]">
                {pendingAttachment.fileSize} • Uncompressed
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

        {pendingCodeBlock && (
          <div className="relative inline-flex items-center gap-2 mb-2 ml-2 px-3 py-1.5 rounded-xl bg-[#0d1117] text-white border border-slate-700 shadow-xs animate-fadeIn">
            <Code2 className="w-4 h-4 text-sky-400" />
            <div className="text-left text-[12px] max-w-[200px] truncate">
              <span className="font-bold text-sky-300 uppercase mr-1.5">{pendingCodeBlock.language}</span>
              <span className="text-slate-300 font-mono truncate">{pendingCodeBlock.code.split('\n')[0]}</span>
            </div>
            <button
              onClick={() => setPendingCodeBlock(null)}
              className="p-0.5 text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Inputs (Uncompressed High-Res & Code Files Supported) */}
      <input type="file" accept="image/*,video/*" multiple ref={photoInputRef} onChange={handlePhotoVideoChange} className="hidden" />
      <input
        type="file"
        accept="image/*"
        multiple
        ref={addMorePhotoRef}
        onChange={(e) => {
          if (e.target.files?.length) loadImagesIntoPreviewModal(e.target.files, true);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        type="file"
        accept=".cpp,.c,.h,.py,.js,.jsx,.ts,.tsx,.sql,.java,.pdf,.zip,.rar,.doc,.docx,.txt,.ppt,.pptx,.md,.json,.csv"
        ref={docInputRef}
        onChange={handleDocumentChange}
        className="hidden"
      />
      <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioChange} className="hidden" />

      {/* 3. COMPACT ATTACHMENT POPUP */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="absolute bottom-14 left-2 sm:left-4 z-50 bg-white dark:bg-[#202c33] rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 p-2 w-56 animate-slideUp"
        >
          <div className="grid grid-cols-1 gap-1">
            {[
              {
                id: 'doc',
                label: 'Code & Files (.cpp, .py, .pdf, .zip)',
                color: 'bg-[#7f66ff]',
                icon: FileText,
                action: () => docInputRef.current?.click(),
              },
              {
                id: 'photos',
                label: 'Full-Res Photos & Video',
                color: 'bg-[#007bfc]',
                icon: ImageIcon,
                action: () => photoInputRef.current?.click(),
              },
              {
                id: 'code',
                label: 'Formatted Code Block',
                color: 'bg-[#0ea5e9]',
                icon: Code2,
                action: () => {
                  setShowAttachMenu(false);
                  setShowCodeModal(true);
                },
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
                label: 'Audio File',
                color: 'bg-[#ff8000]',
                icon: Headphones,
                action: () => audioInputRef.current?.click(),
              },
              {
                id: 'contact',
                label: 'Share @username Card',
                color: 'bg-[#029eb4]',
                icon: User,
                action: () => {
                  setShowAttachMenu(false);
                  setShowContactModal(true);
                },
              },
              {
                id: 'poll',
                label: 'Study / Batch Poll',
                color: 'bg-[#ffb600]',
                icon: BarChart2,
                action: () => {
                  setShowAttachMenu(false);
                  setShowPollModal(true);
                },
              },
              {
                id: 'event',
                label: 'OA / Mock Interview Event',
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
                  <div className={`w-7 h-7 rounded-full ${opt.color} text-white flex items-center justify-center flex-shrink-0 shadow-xs`}>
                    <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <span className="text-[12.5px] font-medium text-[#111b21] dark:text-[#e9edef] truncate">
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

      {/* 5. MAIN COMPOSER BAR */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#202c33] rounded-full px-4 py-2 border border-rose-500/30 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="font-numeric text-[14px] font-bold text-rose-600 dark:text-rose-400">
              {formatRecordingTime(recordingSeconds)}
            </span>
            <span className="text-[12.5px] text-[#8696a0] hidden sm:inline">
              Recording live microphone audio...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-full text-[#8696a0] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-colors"
              title="Cancel recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>

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
        <div className="space-y-1">
          {/* Quick Rich Text Formatting Toolbar (*bold*, _italic_, ~strike~, `code`) */}
          <div className="flex items-center gap-1 px-2">
            <button
              type="button"
              onClick={() => applyRichFormat('*')}
              title="Bold (*text*)"
              className="px-2 py-0.5 rounded-md text-[11px] font-bold text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-[#202c33] cursor-pointer"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => applyRichFormat('_')}
              title="Italic (_text_)"
              className="px-2 py-0.5 rounded-md text-[11px] italic font-semibold text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-[#202c33] cursor-pointer"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => applyRichFormat('~')}
              title="Strikethrough (~text~)"
              className="px-2 py-0.5 rounded-md text-[11px] line-through font-semibold text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-[#202c33] cursor-pointer"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => applyRichFormat('`')}
              title="Inline code (`code`)"
              className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-[#202c33] cursor-pointer"
            >
              {'</>'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-1.5 py-0.5">
            {/* Unified Floating Pill Input Bar */}
            <div className="flex-1 flex items-center bg-white dark:bg-[#202c33] rounded-full px-2 sm:px-3 py-1 border border-[#e9edef] dark:border-[#222e35] min-w-0">
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
                ref={textInputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  chat?.isSelfChat
                    ? t('vaultPlaceholder')
                    : t('messagePlaceholder')
                }
                className="flex-1 px-2 py-1.5 bg-transparent text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] text-[14px] focus:outline-none min-w-0"
              />

            {/* Paperclip Button inside pill */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiTray(false);
              }}
              title="Attach files, full-res images, polls..."
              className={`p-1.5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                showAttachMenu
                  ? 'bg-[#0055ff] text-white shadow-xs'
                  : 'text-[#54656f] dark:text-[#8696a0] hover:text-[#0055ff]'
              }`}
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>

            {/* Camera Trigger inside pill */}
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              title="Camera Photo"
              className="p-1.5 text-[#54656f] dark:text-[#8696a0] hover:text-[#00a884] transition-colors rounded-full cursor-pointer flex-shrink-0"
            >
              <Camera className="w-[18px] h-[18px]" />
            </button>

            {/* Code Snippet Composer Trigger */}
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              title="Insert Formatted Code Snippet (C++, Python, JS, SQL)"
              className="hidden sm:inline-flex p-1.5 text-[#54656f] dark:text-[#8696a0] hover:text-[#0055ff] dark:hover:text-sky-400 transition-colors rounded-full cursor-pointer flex-shrink-0"
            >
              <Code2 className="w-[18px] h-[18px]" />
            </button>

            {/* AI Placement Assistant Magic Wand */}
            <button
              type="button"
              onClick={() => setShowToneModal(true)}
              title="AI Placement Assistant (Explain Code, Interview Answer, Rewrite)"
              className="p-1.5 text-[#0055ff] dark:text-sky-400 hover:scale-110 transition-transform relative cursor-pointer flex-shrink-0"
            >
              <Wand2 className="w-[18px] h-[18px]" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#7b2cbf] animate-pulse" />
            </button>
          </div>

          {/* Schedule Message Clock Icon */}
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            title="Schedule Message (Date & Time Picker)"
            className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#202c33] hover:bg-[#0055ff]/10 text-[#54656f] dark:text-[#aebac1] hover:text-[#0055ff] dark:hover:text-sky-400 items-center justify-center shadow-md border border-black/5 dark:border-white/10 transition-all cursor-pointer flex-shrink-0"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Send Button or Real Mic Recording Trigger */}
          {hasContent ? (
            <button
              type="button"
              onClick={handleSend}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-md shadow-[#00a884]/25 transition-all transform active:scale-95 cursor-pointer flex-shrink-0"
              title={t('send')}
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-md shadow-[#00a884]/25 transition-all transform active:scale-95 cursor-pointer flex-shrink-0"
              title="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          </div>
        </div>
      )}

      {/* Code Block Input Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#202c33] rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0055ff] text-white">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
                    Attach Syntax-Highlighted Code
                  </h3>
                  <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                    Supports C++, Python, JavaScript, and SQL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAttachCodeSnippet} className="mt-4 space-y-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                {CODE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setCodeLang(lang.id)}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold cursor-pointer transition-all ${
                      codeLang === lang.id
                        ? 'bg-[#0055ff] text-white shadow-xs'
                        : 'bg-[#f0f2f5] dark:bg-[#111b21] text-[#54656f] dark:text-[#aebac1]'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={7}
                autoFocus
                required
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder={`Paste your ${codeLang.toUpperCase()} solution or query here...`}
                className="w-full p-3.5 rounded-xl bg-[#0d1117] text-[#e6edf3] font-mono text-[13px] leading-relaxed border border-slate-700 focus:border-[#0055ff] focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="px-4 py-2 rounded-xl text-[13px] text-[#667781] dark:text-[#8696a0] hover:bg-black/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!codeContent.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] disabled:opacity-40 text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Attach Code Block</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      {showToneModal && (
        <AiToneModal
          initialText={text || pendingCodeBlock?.code || ''}
          initialMode={pendingCodeBlock ? 'explain_code' : 'rewrite'}
          onApply={(rewritten) => setText(rewritten)}
          onClose={() => setShowToneModal(false)}
        />
      )}

      {showScheduleModal && (
        <ScheduleModal
          chat={chat}
          pendingText={text}
          pendingImage={imagePreview}
          pendingAttachment={pendingAttachment}
          pendingCodeBlock={pendingCodeBlock}
          onSchedule={(data) => {
            if (onScheduleMessage) onScheduleMessage(data);
            setText('');
            setImagePreview(null);
            setImageMeta(null);
            setPendingAttachment(null);
            setPendingCodeBlock(null);
          }}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {showCameraModal && (
        <CameraCaptureModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={(capturedUrl) => {
            setHdPreviewModal({
              items: [
                {
                  rawSrc: capturedUrl,
                  fileName: `Camera_${Date.now()}.jpg`,
                  isHd: false,
                  caption: text || '',
                  filterMode: 'none',
                  croppedSquare: false,
                  overlayText: '',
                },
              ],
              activeIndex: 0,
            });
            setShowCameraModal(false);
          }}
        />
      )}

      {/* WhatsApp-Style Inline Media Preview & Editor Modal with "HD" Toggle */}
      {hdPreviewModal && hdPreviewModal.items?.length > 0 && (() => {
        const items = hdPreviewModal.items;
        const activeIdx = Math.min(hdPreviewModal.activeIndex || 0, items.length - 1);
        const activeItem = items[activeIdx];
        const updateActiveItem = (patch) => {
          setHdPreviewModal((prev) => ({
            ...prev,
            items: prev.items.map((it, idx) => (idx === activeIdx ? { ...it, ...patch } : it)),
          }));
        };
        const filterCss =
          activeItem.filterMode === 'vivid'
            ? 'contrast(1.12) saturate(1.22)'
            : activeItem.filterMode === 'bw'
            ? 'grayscale(1) contrast(1.08)'
            : activeItem.filterMode === 'warm'
            ? 'sepia(0.22) saturate(1.12)'
            : 'none';
        const filterOrder = ['none', 'vivid', 'bw', 'warm'];

        return (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#0b141a] text-[#e9edef] animate-fadeIn">
            {/* Top Editor Toolbar */}
            <div className="px-4 py-3 bg-[#111b21] border-b border-[#222e35] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setHdPreviewModal(null);
                    setShowOverlayTextBar(false);
                  }}
                  className="p-2 rounded-full hover:bg-[#202c33] text-[#aebac1] hover:text-white cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <span className="text-[14px] font-semibold block truncate">
                    {activeItem.fileName}
                  </span>
                  <span className="font-numeric text-[11px] text-[#8696a0]">
                    {activeItem.isHd
                      ? 'HD Mode ON • Max 3840px (4K) @ 96% quality'
                      : 'Standard Mode • Max 1280px @ 80% quality'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* HD Toggle */}
                <button
                  type="button"
                  onClick={() => updateActiveItem({ isHd: !activeItem.isHd })}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold border flex items-center gap-1 cursor-pointer ${
                    activeItem.isHd
                      ? 'bg-[#00a884] border-[#00a884] text-white'
                      : 'bg-[#202c33] border-[#222e35] text-[#aebac1] hover:text-white'
                  }`}
                  title="Toggle HD (4K) Quality"
                >
                  <span className="font-numeric">HD</span>
                </button>

                {/* Crop 1:1 / Original Toggle */}
                <button
                  type="button"
                  onClick={() => updateActiveItem({ croppedSquare: !activeItem.croppedSquare })}
                  className={`p-2 rounded-full border cursor-pointer ${
                    activeItem.croppedSquare
                      ? 'bg-[#005c4b] border-[#00a884] text-white'
                      : 'bg-[#202c33] border-[#222e35] text-[#aebac1] hover:text-white'
                  }`}
                  title="Crop (Square / Original)"
                >
                  <Crop className="w-4 h-4" />
                </button>

                {/* Filter Cycle */}
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (filterOrder.indexOf(activeItem.filterMode || 'none') + 1) % filterOrder.length;
                    updateActiveItem({ filterMode: filterOrder[nextIdx] });
                  }}
                  className={`p-2 rounded-full border cursor-pointer ${
                    activeItem.filterMode && activeItem.filterMode !== 'none'
                      ? 'bg-[#005c4b] border-[#00a884] text-white'
                      : 'bg-[#202c33] border-[#222e35] text-[#aebac1] hover:text-white'
                  }`}
                  title={`Filter (${activeItem.filterMode || 'none'})`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>

                {/* Text Overlay Toggle */}
                <button
                  type="button"
                  onClick={() => setShowOverlayTextBar((v) => !v)}
                  className={`p-2 rounded-full border cursor-pointer ${
                    showOverlayTextBar || activeItem.overlayText
                      ? 'bg-[#005c4b] border-[#00a884] text-white'
                      : 'bg-[#202c33] border-[#222e35] text-[#aebac1] hover:text-white'
                  }`}
                  title="Add Image Label Text"
                >
                  <Type className="w-4 h-4" />
                </button>

                {/* Download Processed Preview ("Done") */}
                <button
                  type="button"
                  onClick={async () => {
                    const processed = await processImageWithCanvas(activeItem.rawSrc, activeItem.isHd, {
                      filterMode: activeItem.filterMode,
                      croppedSquare: activeItem.croppedSquare,
                      overlayText: activeItem.overlayText,
                    });
                    const a = document.createElement('a');
                    a.href = processed.dataUrl;
                    a.download = activeItem.fileName || 'Nexo_Media.jpg';
                    a.click();
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#202c33] hover:bg-[#2a3942] border border-[#222e35] text-[12px] font-medium text-[#e9edef] cursor-pointer"
                  title="Download Preview"
                >
                  <Download className="w-3.5 h-3.5 text-[#00a884]" />
                  <span>Done</span>
                </button>
              </div>
            </div>

            {showOverlayTextBar && (
              <div className="px-4 py-2 bg-[#111b21] border-b border-[#222e35] flex items-center justify-center">
                <input
                  type="text"
                  value={activeItem.overlayText || ''}
                  onChange={(e) => updateActiveItem({ overlayText: e.target.value })}
                  placeholder="Type label text onto image..."
                  className="w-full max-w-md px-3.5 py-1.5 rounded-full bg-[#202c33] border border-[#222e35] text-[13px] text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                />
              </div>
            )}

            {/* Centered Crisp Image Stage */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                <img
                  src={activeItem.rawSrc}
                  alt="Media preview"
                  style={{ filter: filterCss }}
                  className={`rounded-xl border border-[#222e35] transition-all ${
                    activeItem.croppedSquare
                      ? 'w-[min(70vh,86vw)] h-[min(70vh,86vw)] object-cover'
                      : 'max-h-[66vh] max-w-[92vw] object-contain'
                  }`}
                />
                {activeItem.overlayText && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/60 text-white text-center py-1.5 px-3 rounded-lg text-[13.5px] font-semibold">
                    {activeItem.overlayText}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Thumbnail Strip + Caption + Emerald Send Button */}
            <form
              onSubmit={handleConfirmSendHdImage}
              className="p-3 sm:p-4 bg-[#111b21] border-t border-[#222e35] space-y-3"
            >
              {/* Thumbnail Strip with + Add */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {items.map((item, idx) => (
                  <div key={idx} className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setHdPreviewModal((prev) => ({ ...prev, activeIndex: idx }))}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer block ${
                        idx === activeIdx ? 'border-[#00a884]' : 'border-[#222e35] opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img src={item.rawSrc} alt={item.fileName} className="w-full h-full object-cover" />
                    </button>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextItems = items.filter((_, i) => i !== idx);
                          setHdPreviewModal({
                            items: nextItems,
                            activeIndex: Math.min(activeIdx, nextItems.length - 1),
                          });
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addMorePhotoRef.current?.click()}
                  className="w-12 h-12 rounded-lg bg-[#202c33] hover:bg-[#2a3942] border border-[#222e35] text-[#aebac1] hover:text-white flex items-center justify-center flex-shrink-0 cursor-pointer"
                  title="Add more images"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2.5 max-w-2xl w-full mx-auto">
                <input
                  type="text"
                  value={activeItem.caption || ''}
                  onChange={(e) => updateActiveItem({ caption: e.target.value })}
                  placeholder="Add a caption..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#202c33] text-[14px] text-[#e9edef] placeholder-[#8696a0] border border-[#222e35] focus:outline-none focus:border-[#00a884]"
                />
                <button
                  type="submit"
                  disabled={processingHdImage}
                  className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-60 text-white flex items-center justify-center cursor-pointer flex-shrink-0"
                  title="Send Media"
                >
                  {processingHdImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 ml-0.5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        );
      })()}

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
          onSubmit={(contactCard) => {
            onSendMessage({ text: '', contactCard });
            setShowContactModal(false);
          }}
        />
      )}
    </div>
  );
}
