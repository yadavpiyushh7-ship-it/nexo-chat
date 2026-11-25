import React, { useState } from 'react';
import { Youtube, Search, Play, Sparkles, Share2, BookmarkPlus, X, Loader2, ChevronDown } from 'lucide-react';
import { requestAI } from '../lib/aiClient';
import { YOUTUBE_CS_CATALOG, filterAndRankCatalog } from '../data/youtubeCatalog';
import { useGoogleAuth } from '../lib/googleApis';

const TOPICS = ['All', 'DSA', 'OS', 'CN', 'DBMS', 'System Design', 'Web Dev', 'Python', 'C++', 'Java'];
const QUICK_QUERIES = [
  'Apna College',
  'Striver',
  'Operating System',
  'DBMS',
  'Gate Smashers',
  'Love Babbar',
  'Abdul Bari',
  'CodeWithHarry',
];

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function YouTubeHubView({ chats = [], onSendMessageToChat, onSaveToVault, onShowToast }) {
  const { token: googleToken } = useGoogleAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState('All');
  const [videos, setVideos] = useState(YOUTUBE_CS_CATALOG);
  const [visibleCount, setVisibleCount] = useState(21);
  const [searching, setSearching] = useState(false);
  const [searchLabel, setSearchLabel] = useState(`Comprehensive CSE & Placement Catalog (${YOUTUBE_CS_CATALOG.length} Lectures)`);
  const [targetChatId, setTargetChatId] = useState(chats[0]?.id || 'self_vault');

  // In-app Player Modal with Side-by-Side AI Timestamped Notes
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playerNotes, setPlayerNotes] = useState('');
  const [playerNotesLoading, setPlayerNotesLoading] = useState(false);

  // Standalone Link Notes Analyzer
  const [linkInput, setLinkInput] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState('');

  const runLiveSearch = async (queryText) => {
    const q = (queryText ?? searchQuery).trim();
    if (!q) {
      setVideos(YOUTUBE_CS_CATALOG);
      setVisibleCount(21);
      setSearchLabel(`Comprehensive CSE & Placement Catalog (${YOUTUBE_CS_CATALOG.length} Lectures)`);
      return;
    }

    setSearching(true);
    setActiveTopic('All');
    setVisibleCount(24);

    // 1. Live YouTube Data API v3 directly via VITE_YOUTUBE_API_KEY or Google OAuth Bearer Token
    const ytKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (ytKey || googleToken) {
      try {
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(q)}${ytKey ? `&key=${ytKey}` : ''}`;
        const ytRes = await fetch(ytUrl, {
          headers: googleToken && !ytKey ? { Authorization: `Bearer ${googleToken}` } : undefined,
        });
        if (ytRes.ok) {
          const data = await ytRes.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            const apiVids = data.items.map((item) => ({
              id: item.id.videoId,
              videoId: item.id.videoId,
              topic: q,
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              thumbnail: item.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
              duration: 'HD',
            }));
            const seen = new Set(apiVids.map((v) => v.videoId));
            const extraCatalog = filterAndRankCatalog(q, YOUTUBE_CS_CATALOG.length).filter((v) => !seen.has(v.videoId));
            setVideos([...apiVids, ...extraCatalog]);
            setSearchLabel(`YouTube Data API v3 results for "${q}" (${apiVids.length})`);
            setSearching(false);
            return;
          }
        }
      } catch (err) {
        console.warn('YouTube Data API v3 fallback:', err);
      }
    }

    // 2. Server-side /api/youtube fallback
    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          const seen = new Set(data.videos.map((v) => v.videoId));
          const extraCatalog = filterAndRankCatalog(q, YOUTUBE_CS_CATALOG.length).filter(
            (v) => !seen.has(v.videoId)
          );
          const merged = [...data.videos, ...extraCatalog];
          setVideos(merged);
          setSearchLabel(`Results for "${q}" (${data.videos.length} matches + related)`);
          setSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Live YouTube proxy warning:', err);
    }

    const ranked = filterAndRankCatalog(q, YOUTUBE_CS_CATALOG.length);
    setVideos(ranked);
    setSearchLabel(`Catalog matches for "${q}" (${ranked.length})`);
    setSearching(false);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    runLiveSearch(searchQuery);
  };

  const openVideoPlayer = async (vid) => {
    setPlayingVideo(vid);
    setPlayerNotes('');
    setPlayerNotesLoading(true);
    try {
      const res = await requestAI({
        mode: 'youtube_notes',
        videoTitle: vid.title,
        videoUrl: `https://www.youtube.com/watch?v=${vid.videoId}`,
        text: `${vid.title} (${vid.channel})`,
      });
      setPlayerNotes(res);
    } finally {
      setPlayerNotesLoading(false);
    }
  };

  const handleGenerateNotes = async (videoOrUrl) => {
    const isObj = typeof videoOrUrl === 'object' && videoOrUrl !== null;
    const url = isObj ? `https://www.youtube.com/watch?v=${videoOrUrl.videoId}` : videoOrUrl;
    const title = isObj ? videoOrUrl.title : linkInput;

    if (!url && !title) return;
    setNotesLoading(true);
    setGeneratedNotes('');
    try {
      const res = await requestAI({
        mode: 'youtube_notes',
        videoTitle: title,
        videoUrl: url,
        text: title || url,
      });
      setGeneratedNotes(res);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleShareVideoInChat = (vid) => {
    onSendMessageToChat?.(targetChatId, {
      text: `🎬 **Lecture Video: ${vid.title}**\nChannel: ${vid.channel}`,
      youtubeVideo: {
        videoId: vid.videoId,
        title: vid.title,
        channelTitle: vid.channel,
      },
    });
    onShowToast?.(`Shared "${vid.title.slice(0, 32)}..." into chat!`);
  };

  const filteredVideos = videos.filter(
    (v) => activeTopic === 'All' || v.topic === activeTopic
  );
  const displayedVideos = filteredVideos.slice(0, visibleCount);
  const hasMoreVideos = filteredVideos.length > visibleCount;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0c1317] select-none overflow-hidden">
      {/* Header */}
      <div className="h-[64px] px-4 sm:px-6 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between flex-shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-rose-600 text-white">
            <Youtube className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[#111b21] dark:text-white truncate">
              YouTube Lectures Hub
            </h2>
            <p className="text-[11.5px] text-[#667781] dark:text-[#8696a0] truncate">
              {searchLabel}
            </p>
          </div>
        </div>

        <select
          value={targetChatId}
          onChange={(e) => setTargetChatId(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#111b21] text-[12px] font-semibold text-[#111b21] dark:text-white border border-black/10 dark:border-white/10 max-w-[180px]"
        >
          {chats.map((c) => (
            <option key={c.id} value={c.id}>
              Share to: {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Search + AI YouTube Link Analyzer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <form onSubmit={handleSearchSubmit} className="p-4 rounded-2xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/10 shadow-sm space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696a0] block">
                Search Any YouTube Channel or CS Topic (25+ Videos)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Apna College, Striver, OS, DBMS, CodeWithHarry...'
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0055ff]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] text-white text-[13px] font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{searching ? 'Searching' : 'Search'}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_QUERIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setSearchQuery(q);
                      runLiveSearch(q);
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#0055ff]/15 text-[11.5px] font-medium text-[#54656f] dark:text-[#aebac1] hover:text-[#0055ff] cursor-pointer transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </form>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/10 shadow-sm space-y-2.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-[#7b2cbf] dark:text-purple-400 block">
                Paste Any YouTube Link → Play + AI Notes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[13.5px] text-[#111b21] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7b2cbf]"
                />
                <button
                  type="button"
                  onClick={() => handleGenerateNotes(linkInput)}
                  disabled={notesLoading || !linkInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0055ff] to-[#7b2cbf] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {notesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>AI Notes</span>
                </button>
                {extractYouTubeId(linkInput) && (
                  <button
                    type="button"
                    onClick={() =>
                      openVideoPlayer({
                        videoId: extractYouTubeId(linkInput),
                        title: 'YouTube Lecture Player',
                        channel: 'YouTube',
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-rose-600 text-white text-[12.5px] font-bold cursor-pointer"
                    title="Play pasted link"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Standalone Generated Notes Output */}
          {generatedNotes && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111b21] border border-[#7b2cbf]/30 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#7b2cbf] dark:text-purple-400">
                  AI Timestamped Lecture Notes & Interview Questions
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSaveToVault?.(generatedNotes, '#Notes');
                      onShowToast?.('Lecture notes saved (#Notes)!');
                    }}
                    className="px-3 py-1 rounded-lg bg-[#00a884]/15 text-[#00a884] dark:text-[#25d366] text-[12px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratedNotes('')}
                    className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-[13.5px] text-[#111b21] dark:text-[#e9edef] whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-[#f0f2f5] dark:bg-[#202c33] p-4 rounded-xl">
                {generatedNotes}
              </div>
            </div>
          )}

          {/* Topic Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setActiveTopic(t);
                  setVisibleCount(24);
                }}
                className={`px-3 py-1 rounded-full text-[12.5px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  activeTopic === t
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Lecture Cards Grid (20+ results) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedVideos.map((vid, idx) => (
              <div
                key={`${vid.id || vid.videoId}_${idx}`}
                className="rounded-2xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/10 shadow-sm overflow-hidden flex flex-col"
              >
                <div
                  onClick={() => openVideoPlayer(vid)}
                  className="relative aspect-video bg-slate-900 cursor-pointer group overflow-hidden"
                >
                  <img
                    src={vid.thumbnail || `https://i.ytimg.com/vi/${vid.videoId}/hqdefault.jpg`}
                    alt={vid.title}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10.5px] font-mono">
                    {vid.duration || 'HD'}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                      {vid.channel}
                    </span>
                    <h4
                      onClick={() => openVideoPlayer(vid)}
                      className="text-[14px] font-bold text-[#111b21] dark:text-white mt-1 line-clamp-2 cursor-pointer hover:text-[#0055ff]"
                    >
                      {vid.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => handleShareVideoInChat(vid)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] text-white text-[12px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openVideoPlayer(vid)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#7b2cbf]/15 hover:bg-[#7b2cbf]/25 text-[#7b2cbf] dark:text-purple-300 text-[12px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Play + AI Notes</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Videos Button */}
          {hasMoreVideos && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 18)}
                className="px-6 py-2.5 rounded-full bg-white dark:bg-[#202c33] hover:bg-[#0055ff] hover:text-white text-[#111b21] dark:text-white border border-black/10 dark:border-white/10 text-[13.5px] font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <ChevronDown className="w-4 h-4" />
                <span>Load More Videos ({filteredVideos.length - visibleCount} more)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* In-App Player Modal with Side-by-Side AI Timestamped Notes & Share Card */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-6xl bg-white dark:bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh]">
            <div className="px-4 sm:px-5 py-3.5 bg-[#202c33] flex items-center justify-between text-white gap-3 flex-shrink-0">
              <div className="min-w-0">
                <h4 className="text-[15px] font-bold truncate">{playingVideo.title}</h4>
                <span className="text-[12px] text-slate-400">{playingVideo.channel}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleShareVideoInChat(playingVideo)}
                  className="px-3 py-1.5 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share Video Card to Chat</span>
                  <span className="sm:hidden">Share</span>
                </button>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Video Iframe */}
              <div className="lg:col-span-7 bg-black flex items-center justify-center">
                <div className="w-full aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${playingVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title={playingVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Side-by-Side AI Timestamped Notes Panel */}
              <div className="lg:col-span-5 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 bg-[#f0f2f5] dark:bg-[#182229] overflow-hidden max-h-[45vh] lg:max-h-full">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-shrink-0">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#7b2cbf] dark:text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Timestamped Notes</span>
                  </span>
                  {playerNotes && (
                    <button
                      type="button"
                      onClick={() => {
                        onSaveToVault?.(playerNotes, '#Notes');
                        onShowToast?.('Video notes saved!');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#00a884] text-white text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Save Notes</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 text-[13px] text-[#111b21] dark:text-[#e9edef] whitespace-pre-wrap leading-relaxed">
                  {playerNotesLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 py-8 text-[#8696a0]">
                      <Loader2 className="w-6 h-6 animate-spin text-[#7b2cbf]" />
                      <span>Generating timestamped study notes & interview Qs...</span>
                    </div>
                  ) : (
                    playerNotes
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
