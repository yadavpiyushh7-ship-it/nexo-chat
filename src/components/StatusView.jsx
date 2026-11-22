import React, { useState, useRef } from 'react';
import { Plus, Camera, Edit3, MoreVertical, X, Check, Eye, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default function StatusView({ user }) {
  const [myStatuses, setMyStatuses] = useState([]);
  const [viewingStatus, setViewingStatus] = useState(null); // null or status object
  const [composeMode, setComposeMode] = useState(null); // null, 'text', or 'photo'
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  
  // Text composer state
  const [textInput, setTextInput] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('from-emerald-600 to-teal-500');
  
  // Photo composer state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const fileInputRef = useRef(null);

  const gradients = [
    { id: 'g1', val: 'from-emerald-600 to-teal-500', bg: 'linear-gradient(135deg, #059669, #14b8a6)' },
    { id: 'g2', val: 'from-purple-600 to-indigo-600', bg: 'linear-gradient(135deg, #9333ea, #4f46e5)' },
    { id: 'g3', val: 'from-rose-500 to-orange-400', bg: 'linear-gradient(135deg, #f43f5e, #fb923c)' },
    { id: 'g4', val: 'from-blue-600 to-cyan-500', bg: 'linear-gradient(135deg, #2563eb, #06b6d4)' },
    { id: 'g5', val: 'from-slate-800 to-slate-950', bg: 'linear-gradient(135deg, #1e293b, #020617)' },
  ];

  const handlePostTextStatus = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const newStatus = {
      id: `st_${Date.now()}`,
      type: 'text',
      text: textInput.trim(),
      bgGradient: selectedGradient,
      time: 'Just now',
      timestamp: Date.now(),
      views: 0,
      author: user?.name || 'Alex Morgan',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'
    };

    setMyStatuses([newStatus, ...myStatuses]);
    setTextInput('');
    setComposeMode(null);
    setViewingStatus(newStatus);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostPhotoStatus = (e) => {
    e.preventDefault();
    if (!photoUrl) return;

    const newStatus = {
      id: `st_${Date.now()}`,
      type: 'photo',
      photoUrl: photoUrl,
      caption: photoCaption.trim(),
      time: 'Just now',
      timestamp: Date.now(),
      views: 0,
      author: user?.name || 'Alex Morgan',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'
    };

    setMyStatuses([newStatus, ...myStatuses]);
    setPhotoUrl('');
    setPhotoCaption('');
    setComposeMode(null);
    setViewingStatus(newStatus);
  };

  const handleDeleteStatus = (id) => {
    setMyStatuses(myStatuses.filter((s) => s.id !== id));
    if (viewingStatus?.id === id) {
      setViewingStatus(null);
    }
  };

  return (
    <div className="flex-1 h-full flex bg-[#f0f2f5] dark:bg-[#0c1317] select-none font-sans overflow-hidden">
      
      {/* ============================================================== */}
      {/* LEFT PANE: Header, My Status, Recent Updates                    */}
      {/* ============================================================== */}
      <div className="w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-white dark:bg-[#111b21] border-r border-[#d1d7db] dark:border-[#2a3942] flex-shrink-0">
        {/* Header: "Updates" (clean regular/medium weight, NOT bold!) + actions */}
        <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 bg-[#f0f2f5] dark:bg-[#202c33] flex-shrink-0">
          <h2 className="text-[17px] font-medium text-[#111b21] dark:text-white">
            Updates
          </h2>
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setComposeMode('text')}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] hover:text-[#00a884] cursor-pointer"
              title="Add text status"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#54656f] dark:text-[#aebac1] cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {optionsMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-44 bg-white dark:bg-[#202c33] rounded-2xl shadow-dropdown border border-[#d1d7db]/80 dark:border-white/10 py-1.5 text-[13px] animate-fadeIn">
                <button
                  onClick={() => setOptionsMenuOpen(false)}
                  className="w-full px-4 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[#111b21] dark:text-white"
                >
                  Status privacy: <strong>My contacts</strong>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Updates List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* "My status" item */}
          <div
            onClick={() => {
              if (myStatuses.length > 0) {
                setViewingStatus(myStatuses[0]);
              } else {
                setComposeMode('text');
              }
            }}
            className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#f0f2f5]/80 dark:bg-[#202c33]/70 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors cursor-pointer"
          >
            <div className="relative flex-shrink-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt="My status"
                className={`w-12 h-12 rounded-full object-cover ${
                  myStatuses.length > 0 ? 'ring-2 ring-[#00a884] p-0.5' : ''
                }`}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setComposeMode('text');
                }}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#00a884] text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#111b21] shadow-sm cursor-pointer"
                title="Add status update"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-[#111b21] dark:text-white">
                My status
              </h3>
              <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] truncate mt-0.5">
                {myStatuses.length > 0
                  ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''} • ${myStatuses[0].time}`
                  : 'Click to add status update'}
              </p>
            </div>
          </div>

          {/* User's posted statuses */}
          {myStatuses.length > 0 && (
            <div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#00a884] px-1 block mb-2">
                Your Updates ({myStatuses.length})
              </span>
              <div className="space-y-1.5">
                {myStatuses.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setViewingStatus(st)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      viewingStatus?.id === st.id
                        ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                        : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate mr-2">
                      {st.type === 'photo' ? (
                        <img
                          src={st.photoUrl}
                          alt="Photo status"
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00a884] flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${st.bgGradient} flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#00a884] flex-shrink-0`}>
                          Aa
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-[14px] font-medium text-[#111b21] dark:text-[#e9edef] truncate">
                          {st.type === 'photo' ? (st.caption || 'Photo update') : st.text}
                        </p>
                        <span className="text-[11.5px] text-[#667781] dark:text-[#8696a0]">
                          {st.time} • {st.views} views
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStatus(st.id);
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer flex-shrink-0"
                      title="Delete status"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent / Viewed section */}
          <div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] px-1 block mb-2">
              Recent updates
            </span>
            <div className="p-6 text-center text-[#8696a0] bg-[#f0f2f5]/40 dark:bg-[#202c33]/40 rounded-2xl border border-dashed border-[#d1d7db]/60 dark:border-white/5">
              <p className="text-[13px] font-medium">No recent updates from contacts</p>
              <p className="text-[11.5px] mt-0.5 text-[#667781] dark:text-[#8696a0]">
                Status updates from your contacts will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT PANE: Exact WhatsApp "Share updates" OR Active Viewer    */}
      {/* ============================================================== */}
      <div className="hidden md:flex flex-1 h-full flex-col items-center justify-center p-6 bg-[#efeae2]/30 dark:bg-[#0b141a] relative overflow-hidden">
        
        {/* State A: Viewing a Status */}
        {viewingStatus ? (
          <div className="w-full max-w-sm aspect-[9/16] max-h-[580px] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-6 bg-slate-900 border border-white/10 animate-fadeIn">
            {/* Top Close Button & Progress Bar */}
            <div className="space-y-3">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="w-full h-full bg-white rounded-full animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <img
                    src={viewingStatus.avatar}
                    alt={viewingStatus.author}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white/60"
                  />
                  <div>
                    <h5 className="text-[14.5px] font-bold leading-tight">{viewingStatus.author}</h5>
                    <span className="text-[11.5px] text-white/80">{viewingStatus.time}</span>
                  </div>
                </div>

                <button
                  onClick={() => setViewingStatus(null)}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer"
                  title="Close viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Content */}
            {viewingStatus.type === 'photo' ? (
              <div className="my-auto flex flex-col items-center">
                <img
                  src={viewingStatus.photoUrl}
                  alt="Status"
                  className="max-h-[380px] max-w-full rounded-2xl object-contain shadow-lg"
                />
                {viewingStatus.caption && (
                  <p className="mt-3 text-center text-white text-[15px] font-medium bg-black/50 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                    {viewingStatus.caption}
                  </p>
                )}
              </div>
            ) : (
              <div className="my-auto py-8 text-center px-4">
                <p className="text-[24px] font-bold text-white leading-snug drop-shadow-md">
                  "{viewingStatus.text}"
                </p>
              </div>
            )}

            {/* Bottom Footer */}
            <div className="flex items-center justify-between text-white/80 text-[12.5px] pt-4 border-t border-white/20">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{viewingStatus.views} views</span>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                Active for 24 hours
              </span>
            </div>
          </div>
        ) : (
          /* State B: Exact WhatsApp Web Layout "Share updates" */
          <div className="flex flex-col items-center justify-center text-center max-w-md space-y-6">
            {/* Centered Status Ring Icon */}
            <div className="w-24 h-24 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-center shadow-inner">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Broken concentric status rings */}
                <circle cx="32" cy="32" r="26" stroke="#00a884" strokeWidth="3" strokeDasharray="18 6" strokeLinecap="round" />
                <circle cx="32" cy="32" r="19" stroke="#0055ff" strokeWidth="2.5" strokeDasharray="12 4" strokeLinecap="round" opacity="0.8" />
                <circle cx="32" cy="32" r="8" fill="#00a884" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[21px] font-bold text-[#111b21] dark:text-white">
                Share updates
              </h3>
              <p className="text-[13.5px] text-[#667781] dark:text-[#8696a0] max-w-xs">
                Share photos and text that disappear after 24 hours.
              </p>
            </div>

            {/* Two Circular Action Buttons: Text status & Photo status */}
            <div className="flex items-center justify-center gap-8 pt-2">
              {/* Text Status Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setComposeMode('text')}
                  className="w-14 h-14 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:bg-[#007a5f] text-white flex items-center justify-center shadow-lg shadow-[#00a884]/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Create text update"
                >
                  <Edit3 className="w-6 h-6" />
                </button>
                <span className="text-[13px] font-semibold text-[#111b21] dark:text-[#e9edef]">
                  Text status
                </span>
              </div>

              {/* Photo Status Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => {
                    setComposeMode('photo');
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0055ff] to-[#7b2cbf] hover:opacity-95 text-white flex items-center justify-center shadow-lg shadow-[#0055ff]/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Create photo update"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <span className="text-[13px] font-semibold text-[#111b21] dark:text-[#e9edef]">
                  Photo status
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* ============================================================== */}
      {/* COMPOSE MODALS (Text or Photo)                                 */}
      {/* ============================================================== */}
      {composeMode === 'text' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                New text status
              </h3>
              <button
                onClick={() => setComposeMode(null)}
                className="p-1 rounded-full text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostTextStatus}>
              <textarea
                rows={4}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="What's on your mind?..."
                className="w-full p-4 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] text-[#111b21] dark:text-white text-[16px] focus:outline-none focus:ring-2 focus:ring-[#00a884] mb-4"
                autoFocus
              />

              <label className="block text-[12px] font-semibold text-[#8696a0] uppercase tracking-wider mb-2">
                Select Background Gradient
              </label>
              <div className="flex items-center gap-2.5 mb-6">
                {gradients.map((grad) => (
                  <button
                    key={grad.id}
                    type="button"
                    onClick={() => setSelectedGradient(grad.val)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-transform ${
                      selectedGradient === grad.val ? 'scale-110 ring-2 ring-[#00a884]' : ''
                    }`}
                    style={{ background: grad.bg }}
                  >
                    {selectedGradient === grad.val && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setComposeMode(null)}
                  className="px-4 py-2 rounded-xl text-[13.5px] text-[#667781] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white text-[13.5px] font-semibold shadow-md shadow-[#00a884]/20 cursor-pointer"
                >
                  Post update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {composeMode === 'photo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[17px] font-bold text-[#111b21] dark:text-white">
                New photo status
              </h3>
              <button
                onClick={() => {
                  setComposeMode(null);
                  setPhotoUrl('');
                }}
                className="p-1 rounded-full text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostPhotoStatus} className="space-y-4">
              {photoUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-black/5 max-h-[260px] flex items-center justify-center">
                  <img src={photoUrl} alt="Preview" className="max-h-[260px] object-contain rounded-2xl" />
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white text-xs cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-[#d1d7db] dark:border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Camera className="w-8 h-8 text-[#00a884]" />
                  <span className="text-[13.5px] font-medium text-[#111b21] dark:text-white">
                    Click to select photo
                  </span>
                </div>
              )}

              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] text-[14px] text-[#111b21] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposeMode(null);
                    setPhotoUrl('');
                  }}
                  className="px-4 py-2 rounded-xl text-[13.5px] text-[#667781] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!photoUrl}
                  className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white text-[13.5px] font-semibold shadow-md shadow-[#00a884]/20 cursor-pointer"
                >
                  Post update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
