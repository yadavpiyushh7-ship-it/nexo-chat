import React from 'react';
import { User, Users } from 'lucide-react';

const SIZE_MAP = {
  xs: { box: 'w-7 h-7', icon: 'w-4 h-4' },
  sm: { box: 'w-9 h-9', icon: 'w-5 h-5' },
  md: { box: 'w-11 h-11', icon: 'w-6 h-6' },
  lg: { box: 'w-14 h-14', icon: 'w-7 h-7' },
  xl: { box: 'w-20 h-20', icon: 'w-10 h-10' },
  '2xl': { box: 'w-24 h-24', icon: 'w-12 h-12' },
  '3xl': { box: 'w-32 h-32', icon: 'w-16 h-16' },
};

// Clean solid circular backgrounds for monochrome silhouette avatars
const PALETTE = [
  'bg-[#64748b] dark:bg-[#475569]', // Slate
  'bg-[#0284c7] dark:bg-[#0369a1]', // Sky
  'bg-[#059669] dark:bg-[#047857]', // Emerald
  'bg-[#6366f1] dark:bg-[#4f46e5]', // Indigo
  'bg-[#8b5cf6] dark:bg-[#7c3aed]', // Violet
  'bg-[#0d9488] dark:bg-[#0f766e]', // Teal
  'bg-[#475569] dark:bg-[#334155]', // Charcoal
];

export default function AvatarIcon({
  size = 'md',
  isGroup = false,
  name = '',
  className = '',
  showOnline = false,
  online = false,
  iconClassName = ''
}) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  // Determine solid color deterministically from name or fallback
  let colorClass = PALETTE[0];
  if (name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % PALETTE.length;
    colorClass = PALETTE[idx];
  }

  return (
    <div className={`relative flex-shrink-0 inline-flex items-center justify-center select-none ${className}`}>
      <div
        className={`${sizeConfig.box} rounded-full ${colorClass} flex items-center justify-center text-white/95 shadow-xs transition-transform`}
        title={name || (isGroup ? 'Group' : 'User')}
      >
        {isGroup ? (
          <Users className={`${sizeConfig.icon} text-white fill-white/80 ${iconClassName}`} />
        ) : (
          <User className={`${sizeConfig.icon} text-white fill-white/80 ${iconClassName}`} />
        )}
      </div>

      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-[#202c33] ${
            online ? 'bg-emerald-500' : 'bg-slate-400'
          } ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
        />
      )}
    </div>
  );
}
