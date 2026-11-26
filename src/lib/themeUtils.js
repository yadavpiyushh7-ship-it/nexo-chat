/**
 * Custom Chat Themes, Bubble Accent Colors & Wallpapers
 * Independent of system Light / Dark mode.
 */

export const BUBBLE_ACCENTS = [
  {
    id: 'nexo_blue',
    label: 'Nexo Blue',
    swatch: '#0055ff',
    lightBg: '#0055ff',
    lightText: '#ffffff',
    darkBg: '#0044cc',
    darkText: '#ffffff',
    accentHex: '#0055ff',
  },
  {
    id: 'emerald_green',
    label: 'Emerald Green',
    swatch: '#00a884',
    lightBg: '#d9fdd3',
    lightText: '#111b21',
    darkBg: '#005c4b',
    darkText: '#e9edef',
    accentHex: '#00a884',
  },
  {
    id: 'royal_purple',
    label: 'Royal Purple',
    swatch: '#7b2cbf',
    lightBg: 'linear-gradient(135deg, #6d28d9, #9333ea)',
    lightText: '#ffffff',
    darkBg: 'linear-gradient(135deg, #5b21b6, #7e22ce)',
    darkText: '#ffffff',
    accentHex: '#7b2cbf',
  },
  {
    id: 'monochrome_minimal',
    label: 'Monochrome Minimal',
    swatch: '#334155',
    lightBg: '#1e293b',
    lightText: '#ffffff',
    darkBg: '#334155',
    darkText: '#f8fafc',
    accentHex: '#475569',
  },
];

export const CHAT_WALLPAPERS = [
  { id: 'default', label: 'Default Clean', desc: 'Minimalist system canvas' },
  { id: 'doodle', label: 'Subtle Doodle', desc: 'Classic messaging pattern' },
  { id: 'tech_grid', label: 'Tech Grid', desc: 'Engineering blueprint grid' },
  { id: 'aurora_soft', label: 'Campus Aurora', desc: 'Soft ambient tint' },
  { id: 'obsidian_slate', label: 'Focus Slate', desc: 'Distraction-free calm' },
];

export function applyThemePreferences(accentId = 'emerald_green', wallpaperId = 'default') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');

  const accent = BUBBLE_ACCENTS.find((a) => a.id === accentId) || BUBBLE_ACCENTS[1];
  root.style.setProperty('--outgoing-bubble-bg', isDark ? accent.darkBg : accent.lightBg);
  root.style.setProperty('--outgoing-bubble-text', isDark ? accent.darkText : accent.lightText);
  root.style.setProperty('--nexo-accent', accent.accentHex);

  try {
    localStorage.setItem('nexo_bubble_theme', accent.id);
    localStorage.setItem('nexo_chat_wallpaper', wallpaperId);
  } catch {}
}

export function getWallpaperClass(wallpaperId) {
  switch (wallpaperId) {
    case 'doodle':
      return 'bg-[#ffffff] dark:bg-[#0b141a]';
    case 'tech_grid':
      return 'nexo-tech-grid-light dark:nexo-tech-grid-dark';
    case 'aurora_soft':
      return 'bg-[#f8fafc] dark:bg-[#0b141a]';
    case 'obsidian_slate':
      return 'bg-[#f0f2f5] dark:bg-[#0b141a]';
    case 'default':
    default:
      return 'bg-[#ffffff] dark:bg-[#0b141a]';
  }
}
