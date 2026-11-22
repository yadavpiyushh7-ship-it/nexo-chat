export const INITIAL_FOLDERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'requests', label: 'Requests' },
  { id: 'groups', label: 'Groups' },
  { id: 'college', label: 'College' },
];

export const INITIAL_ARCHIVED = [];

export const INITIAL_CHATS = [];

/**
 * Creates the official pinned Self-Chat for the logged in user
 */
export function createSelfChat(user) {
  const userName = user?.name || 'Alex Morgan';
  const userHandle = user?.username || '@alex_m';
  const avatar = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';

  return {
    id: 'self_vault',
    isSelfChat: true,
    pinned: true,
    name: `${userName} (You)`,
    handle: `${userHandle} (You)`,
    subtitle: 'Message yourself • Notes, links & AI vault',
    avatar: avatar,
    online: true,
    typing: false,
    unreadCount: 0,
    folder: 'all',
    lastSeen: 'Personal Vault',
    bio: 'Your personal Nexo vault for notes, bookmarks, links, reminders, and AI synthesis.',
    messages: [
      {
        id: 'self_m1',
        isSender: true,
        text: '📌 Welcome to your personal AI Vault! Use this space to save notes, paste links, store images, test tone rewrites, and schedule reminders.',
        time: '7:00 am',
        read: true,
        isStarred: true
      },
      {
        id: 'self_m2',
        isSender: true,
        text: '💡 Tip: Click "Summarize Unread" anytime to have Gemini summarize and organize your saved thoughts into key bullet points.',
        time: '7:05 am',
        read: true,
        isStarred: false
      }
    ]
  };
}

export const DEFAULT_CHANNELS = [
  {
    id: 'ch_1',
    name: 'College Announcements',
    handle: '@college_announcements',
    avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150',
    verified: true,
    followers: '4.2k',
    description: 'Official academic dates, holiday alerts, and campus schedule updates.',
    isFollowing: true,
    recentUpdate: {
      text: '📢 Midterm schedule for Computer Science departments is now posted on the student portal.',
      time: 'Today, 11:30 am'
    }
  },
  {
    id: 'ch_2',
    name: 'Tech & AI Daily',
    handle: '@tech_ai_daily',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    verified: true,
    followers: '18.9k',
    description: 'Curated breakthroughs in Gemini models, LLM tooling, and software engineering.',
    isFollowing: false,
    recentUpdate: {
      text: '🚀 Gemini 3.5 Flash Lite benchmarks demonstrate 40% latency reduction in chat summarization.',
      time: 'Yesterday'
    }
  }
];

export const DEFAULT_COMMUNITIES = [
  {
    id: 'com_1',
    name: 'CS Capstone Cohort 2026',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
    description: 'Central hub for final year computer science project teams and faculty mentors.',
    membersCount: 84,
    groups: [
      { id: 'g1', name: 'Announcements 📣', unread: 0 },
      { id: 'g2', name: 'Frontend Dev Discussion 💻', unread: 0 },
      { id: 'g3', name: 'AI Models & APIs 🤖', unread: 0 }
    ]
  }
];
