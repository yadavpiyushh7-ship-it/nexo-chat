import React from 'react';

export default function NexoLogo({ size = 38, className = '', isDark = null, useImg = true }) {
  if (useImg) {
    return (
      <img
        src="/logo.png"
        alt="Nexo"
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`object-contain select-none flex-shrink-0 drop-shadow-sm ${className}`}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none flex-shrink-0 transition-transform ${className}`}
    >
      <defs>
        <linearGradient id="nexo-front-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0055ff" />
          <stop offset="50%" stopColor="#7b2cbf" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <filter id="logoShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      <path
        d="M32 14 C32 7.5 38 4 45 4 H75 C82 4 88 10 88 17 V45 C88 52 82 58 75 58 H68 L76 72 L58 58 H45 C38 58 32 52 32 45 Z"
        className={
          isDark === true
            ? 'fill-transparent stroke-white stroke-[3.5]'
            : isDark === false
            ? 'fill-[#0044ff] stroke-none'
            : 'fill-[#0044ff] dark:fill-transparent dark:stroke-white dark:stroke-[3.5]'
        }
        filter="url(#logoShadow)"
        strokeLinejoin="round"
      />

      <path
        d="M14 36 C14 26 22 18 32 18 H66 C76 18 84 26 84 36 V62 C84 72 76 80 66 80 H36 L18 94 V76 C14 72 14 66 14 62 Z"
        className={
          isDark === true
            ? 'fill-transparent stroke-white stroke-[3.5]'
            : isDark === false
            ? 'fill-[url(#nexo-front-grad)] stroke-none'
            : 'fill-[url(#nexo-front-grad)] dark:fill-transparent dark:stroke-white dark:stroke-[3.5]'
        }
        filter="url(#logoShadow)"
        strokeLinejoin="round"
      />
    </svg>
  );
}
