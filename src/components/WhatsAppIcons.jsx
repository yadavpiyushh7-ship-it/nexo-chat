import React from 'react';

export function ChatsIcon({ className = "w-[22px] h-[22px]", active = false }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      {active ? (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3.2 4.5C2.45 4.5 2.02 5.35 2.48 5.95L4.5 8.6V16.5C4.5 18.43 6.07 20 8 20H17.5C19.43 20 21 18.43 21 16.5V8C21 6.07 19.43 4.5 17.5 4.5H3.2ZM8.5 10C8.5 9.45 8.95 9 9.5 9H16C16.55 9 17 9.45 17 10C17 10.55 16.55 11 16 11H9.5C8.95 11 8.5 10.55 8.5 10ZM8.5 14.2C8.5 13.65 8.95 13.2 9.5 13.2H13.5C14.05 13.2 14.5 13.65 14.5 14.2C14.5 14.75 14.05 15.2 13.5 15.2H9.5C8.95 15.2 8.5 14.75 8.5 14.2Z"
          fill="currentColor"
        />
      ) : (
        <>
          <path
            d="M3.2 4.5H17.5C19.43 4.5 21 6.07 21 8V16.5C21 18.43 19.43 20 17.5 20H8C6.07 20 4.5 18.43 4.5 16.5V8.6L2.48 5.95C2.02 5.35 2.45 4.5 3.2 4.5Z"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinejoin="round"
          />
          <path d="M9 10H16.2M9 14.2H13.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export const ChatsTabIcon = ChatsIcon;

export function UpdatesIcon({ className = "w-6 h-6", active = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a10 10 0 0 1 9.8 8" />
      <path d="M12 22a10 10 0 0 1-9.8-8" />
      <path d="M21.8 14a10 10 0 0 1-7.8 7.8" strokeDasharray="3 3" />
      <path d="M2.2 10a10 10 0 0 1 7.8-7.8" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="3.5" fill="#25d366" stroke="#25d366" />
    </svg>
  );
}

export function CommunitiesIcon({ className = "w-6 h-6", active = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function CallsIcon({ className = "w-[21px] h-[21px]", active = false }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M6.62 10.79C8.06 13.62 10.38 15.93 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const CallsTabIcon = CallsIcon;

export function YouTubeLecturesIcon({ className = "w-[22px] h-[22px]", active = false }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M22.54 6.42C22.29 5.47 21.54 4.72 20.59 4.47C18.88 4 12 4 12 4C12 4 5.12 4 3.41 4.47C2.46 4.72 1.71 5.47 1.46 6.42C1 8.14 1 12 1 12C1 12 1 15.86 1.46 17.58C1.71 18.53 2.46 19.28 3.41 19.53C5.12 20 12 20 12 20C12 20 18.88 20 20.59 19.53C21.54 19.28 22.29 18.53 22.54 17.58C23 15.86 23 12 23 12C23 12 23 8.14 22.54 6.42Z"
        fill={active ? "#FF0000" : "none"}
        stroke={active ? "#FF0000" : "currentColor"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 15.02L15.5 12L9.75 8.98V15.02Z"
        fill={active ? "#FFFFFF" : "currentColor"}
      />
    </svg>
  );
}
