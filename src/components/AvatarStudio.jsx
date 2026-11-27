import React, { useMemo, useRef, useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars, notionists, adventurer, bottts } from '@dicebear/collection';
import { Shuffle, Upload, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react';

const AVATAR_STYLES = [
  { id: 'avataaars', label: 'Illustrated', style: avataaars },
  { id: 'notionists', label: 'Minimal', style: notionists },
  { id: 'adventurer', label: 'Youth', style: adventurer },
  { id: 'bottts', label: 'Tech Bots', style: bottts },
];

const BG_SWATCHES = ['#b6e3f4', '#c0aede', '#d1d4f9', '#ffd5dc', '#ffdfbf', '#00a884'];

const CURATED_SEEDS = [
  'NexoAlex', 'PiyushDev', 'ThorCode', 'AaravML', 'RiyaAI', 'KabirSys',
  'ZaraJS', 'VikramCPP', 'AnanyaUI', 'DevOpsMax', 'NehaSQL', 'RohanRust',
  'SanaCloud', 'ArjunWeb', 'MayaData', 'KaranAlgo', 'TaraCyber', 'NeilReact',
  'IshaanDB', 'DiyaAPI', 'SameerGo', 'KiaraTS', 'AdityaOS', 'MeeraNet',
];

export function resizeProfileImageToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const targetSize = 256;
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = Math.round((img.width - minSide) / 2);
        const sy = Math.round((img.height - minSide) / 2);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function AvatarStudio({ selectedAvatar, onSelectAvatar, compact = false }) {
  const [modeTab, setModeTab] = useState('choose'); // 'choose' | 'upload'
  const [activeStyleId, setActiveStyleId] = useState('avataaars');
  const [activeBgHex, setActiveBgHex] = useState(BG_SWATCHES[0]);
  const [seeds, setSeeds] = useState(CURATED_SEEDS);
  const uploadInputRef = useRef(null);

  const activeStyleObj = AVATAR_STYLES.find((s) => s.id === activeStyleId)?.style || avataaars;

  const avatarOptions = useMemo(() => {
    const cleanHex = activeBgHex.replace('#', '');
    return seeds.map((seed) => {
      const dataUri = createAvatar(activeStyleObj, {
        seed,
        size: 128,
        backgroundColor: [cleanHex],
      }).toDataUri();
      return { seed, dataUri };
    });
  }, [activeStyleObj, activeBgHex, seeds]);

  const handleShuffle = () => {
    const stamp = Math.random().toString(36).slice(2, 7);
    setSeeds(
      Array.from({ length: 24 }, (_, idx) => `nexo_${stamp}_${idx}_${Math.floor(Math.random() * 999)}`)
    );
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeProfileImageToDataUrl(file);
    if (dataUrl) onSelectAvatar(dataUrl);
    e.target.value = '';
  };

  return (
    <div className="rounded-2xl bg-[#f0f2f5] dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222e35] p-3 space-y-3 select-none">
      {/* Mode Toggle: Choose Avatar vs Upload Photo */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#111b21] border border-[#e9edef] dark:border-[#222e35]">
        <button
          type="button"
          onClick={() => setModeTab('choose')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
            modeTab === 'choose'
              ? 'bg-[#00a884] text-white'
              : 'text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Choose Avatar</span>
        </button>
        <button
          type="button"
          onClick={() => setModeTab('upload')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
            modeTab === 'upload'
              ? 'bg-[#00a884] text-white'
              : 'text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Upload Photo</span>
        </button>
      </div>

      {modeTab === 'choose' ? (
        <div className="space-y-2.5">
          {/* 4 DiceBear Style Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {AVATAR_STYLES.map((st) => {
              const isSelected = activeStyleId === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStyleId(st.id)}
                  className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#008069] dark:text-[#25d366]'
                      : 'bg-white dark:bg-[#111b21] text-[#54656f] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* 6 Background Swatches + Shuffle Avatars Button */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {BG_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setActiveBgHex(hex)}
                  style={{ backgroundColor: hex }}
                  title={`Background ${hex}`}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                    activeBgHex === hex
                      ? 'ring-2 ring-offset-2 ring-[#00a884] dark:ring-offset-[#202c33] scale-110'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleShuffle}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#111b21] border border-[#e9edef] dark:border-[#222e35] text-[11.5px] font-semibold text-[#00a884] flex items-center gap-1 hover:bg-[#d9fdd3]/40 dark:hover:bg-[#005c4b]/40 cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              <span>Shuffle Avatars</span>
            </button>
          </div>

          {/* 24 Curated Avatars Scrollable Grid */}
          <div className={`${compact ? 'max-h-40' : 'max-h-52'} overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 p-1`}>
            {avatarOptions.map(({ seed, dataUri }) => {
              const isPicked = selectedAvatar === dataUri;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => onSelectAvatar(dataUri)}
                  className={`aspect-square rounded-full overflow-hidden p-0.5 cursor-pointer transition-transform hover:scale-105 ${
                    isPicked
                      ? 'ring-2 ring-[#00a884] bg-[#00a884]/20 scale-105'
                      : 'ring-1 ring-black/10 dark:ring-white/10 bg-white dark:bg-[#111b21]'
                  }`}
                  title={`Select avatar ${seed}`}
                >
                  <img src={dataUri} alt={seed} className="w-full h-full rounded-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-4 flex flex-col items-center justify-center gap-2.5 text-center">
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleFilePicked}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="px-4 py-2 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
          {selectedAvatar && (
            <button
              type="button"
              onClick={() => onSelectAvatar(null)}
              className="px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          )}
          <p className="text-[11px] text-[#667781] dark:text-[#8696a0]">
            Automatically cropped & resized cleanly to 256×256.
          </p>
        </div>
      )}
    </div>
  );
}
