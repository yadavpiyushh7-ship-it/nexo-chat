export const INITIAL_FOLDERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'requests', label: 'Requests' },
  { id: 'groups', label: 'Groups' },
];

export const INITIAL_ARCHIVED = [];

export const INITIAL_CHATS = [];

export const DEMO_USER = {
  id: 'demo_user_piyush',
  name: 'Piyush Yadav',
  username: '@piyushyadav',
  phone: '+919817701848',
  email: 'piyush.demo@nexo.app',
  avatar: null, // Strictly NO stock profile photo!
  mood: 'Building Nexo Capstone ✨',
  isDemo: true
};

/**
 * Generates rich sample conversations for Instant Demo Login
 */
export function createDemoChats(user) {
  const selfChat = createSelfChat(user);

  const groupChat = {
    id: 'chat_group_capstone',
    name: 'CS Capstone Group 💻',
    handle: '@cs_capstone_2026',
    subtitle: 'Sarah, Liam, Elena & You',
    isGroup: true,
    pinned: true,
    online: true,
    typing: false,
    unreadCount: 2,
    folder: 'groups',
    status: 'accepted',
    bio: 'Final year capstone engineering project team',
    messages: [
      {
        id: 'm_grp_1',
        isSender: false,
        senderName: 'Sarah Connor',
        text: 'Pushed the latest Supabase Realtime schema updates to our repo! 🚀',
        time: '9:15 am',
        read: true
      },
      {
        id: 'm_grp_2',
        isSender: true,
        text: 'Awesome! I just tested the real-time single and double read receipts, working seamlessly.',
        time: '9:20 am',
        read: true
      },
      {
        id: 'm_grp_3',
        isSender: false,
        senderName: 'Liam Patel',
        text: "Don't forget to test the Gemini 2.5 Flash tone rewrites and auto-summarizer before the review.",
        time: '9:28 am',
        read: false
      },
      {
        id: 'm_grp_4',
        isSender: false,
        senderName: 'Elena Rostova',
        text: 'All UI components are responsive for mobile phones (100dvh) and laptops.',
        time: '9:30 am',
        read: false
      }
    ]
  };

  const peerSarah = {
    id: 'chat_sarah',
    name: 'Sarah Connor',
    handle: '@sarah_c',
    subtitle: 'Product Design & HCI',
    online: true,
    typing: false,
    unreadCount: 1,
    folder: 'all',
    status: 'accepted',
    lastSeen: 'Online',
    bio: 'Product Design & HCI • Always building',
    phone: '+919876543201',
    email: 'sarah.c@nexo.app',
    messages: [
      {
        id: 'm_sc_1',
        isSender: false,
        text: 'Hey Piyush! Did you get a chance to test the WebRTC video calling?',
        time: '8:50 am',
        read: true
      },
      {
        id: 'm_sc_2',
        isSender: true,
        text: 'Yes! Real-time peer-to-peer audio & video streaming with mute and camera toggle are working smoothly.',
        time: '8:55 am',
        read: true
      },
      {
        id: 'm_sc_3',
        isSender: false,
        text: "Perfect! Let's do a quick rehearsal call before the examiner arrives.",
        time: '9:05 am',
        read: false
      }
    ]
  };

  const peerLiam = {
    id: 'chat_liam',
    name: 'Liam Patel',
    handle: '@liam_dev',
    subtitle: 'Full-stack & AI pipelines',
    online: false,
    typing: false,
    unreadCount: 0,
    folder: 'all',
    status: 'accepted',
    lastSeen: 'Last seen today at 8:40 am',
    bio: 'Full-stack & AI pipelines',
    phone: '+919876543202',
    email: 'liam.dev@nexo.app',
    messages: [
      {
        id: 'm_lp_1',
        isSender: true,
        text: 'Scheduled messages queue is tested at 1-second intervals.',
        time: 'Yesterday',
        read: true
      },
      {
        id: 'm_lp_2',
        isSender: false,
        text: 'Great! The background timer triggers immediate dispatch the second the scheduled time arrives.',
        time: 'Yesterday',
        read: true
      }
    ]
  };

  const requestElena = {
    id: 'chat_elena_req',
    name: 'Elena Rostova',
    handle: '@elena_r',
    subtitle: 'Visual Systems & UI Designer',
    online: false,
    typing: false,
    unreadCount: 1,
    folder: 'requests',
    status: 'pending',
    lastSeen: 'Yesterday',
    bio: 'Visual Systems & UI Designer',
    phone: '+919876543203',
    email: 'elena.design@nexo.app',
    messages: [
      {
        id: 'm_el_1',
        isSender: false,
        text: "Hi Piyush, I'd like to connect on Nexo regarding the Capstone UI inspection!",
        time: 'Yesterday, 10:15 pm',
        read: false
      }
    ]
  };

  return [selfChat, groupChat, peerSarah, peerLiam, requestElena];
}

/**
 * Creates the official pinned Self-Chat for the logged in user
 */
export function createSelfChat(user) {
  const userName = user?.name || user?.full_name || 'You';
  const userHandle = user?.username || '@you';

  return {
    id: 'self_vault',
    isSelfChat: true,
    pinned: true,
    name: `${userName} (You)`,
    handle: `${userHandle} (You)`,
    subtitle: 'Message yourself • Notes, links & AI vault',
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
        text: '📌 Welcome to your personal AI Vault! Use this space to save notes, paste links, test tone rewrites, and schedule reminders.',
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
    verified: true,
    followers: '18.9k',
    description: 'Curated breakthroughs in Gemini models, LLM tooling, and software engineering.',
    isFollowing: false,
    recentUpdate: {
      text: '🚀 Gemini 2.5 Flash benchmarks demonstrate low latency in real-time chat synthesis.',
      time: 'Yesterday'
    }
  }
];

export const DEFAULT_COMMUNITIES = [
  {
    id: 'com_1',
    name: 'CS Capstone Cohort 2026',
    description: 'Central hub for final year computer science project teams and faculty mentors.',
    membersCount: 84,
    groups: [
      { id: 'g1', name: 'Announcements 📣', unread: 0 },
      { id: 'g2', name: 'Frontend Dev Discussion 💻', unread: 0 },
      { id: 'g3', name: 'AI Models & APIs 🤖', unread: 0 }
    ]
  }
];
