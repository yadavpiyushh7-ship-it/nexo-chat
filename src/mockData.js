export const INITIAL_FOLDERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'favourites', label: 'Favourites' },
  { id: 'groups', label: 'Groups' },
  { id: 'friends', label: 'Friends' },
  { id: 'requests', label: 'Requests' },
];

export const INITIAL_ARCHIVED = [];

export const INITIAL_CHATS = [];

/**
 * Default pre-authenticated B.Tech CSE (AI & ML) Student Profile (JECRC University)
 */
export const DEFAULT_STUDENT_PROFILE = {
  id: 'student_piyush_jecrc',
  name: 'Piyush Yadav',
  username: '@piyush_dev',
  program: 'B.Tech CSE (AI & ML)',
  university: 'JECRC University',
  bio: 'B.Tech CSE (AI & ML) • JECRC University • 2027 Placement Batch',
  mood: 'Prepping DSA & System Design 💻',
  avatar: null,
};

/**
 * Cloud-Synced Categorized Bookmarks (Survives Clear Chat!)
 */
export const INITIAL_BOOKMARKS = [
  {
    id: 'bm_placement_1',
    chatId: 'chat_placement_cell',
    chatName: 'Placement Cell – 2027 Batch',
    senderName: 'Placement Cell',
    isSender: false,
    category: '#Placement',
    text: '🏢 Campus Drive Update: 2027 Batch SDE Intern + PPO Drives\n• Eligibility: B.Tech CSE / AI & ML | CGPA ≥ 7.5 | 0 Active Backlogs\n• Online Assessment: Saturday, 10:00 AM (90 mins)\n• OA Registration Portal: https://placements.jecrc.edu/drives/2027-sde',
    time: '9:10 am',
    date: 'Today',
  },
  {
    id: 'bm_dsa_1',
    chatId: 'chat_dsa_squad',
    chatName: 'DSA & Coding Prep Squad',
    senderName: 'DSA Squad',
    isSender: false,
    category: '#DSA',
    text: "Optimal O(N) Kadane's Maximum Subarray reference in C++:\n```cpp\nint maxSubArray(vector<int>& nums) {\n  int curr = nums[0], best = nums[0];\n  for (int i = 1; i < nums.size(); i++) {\n    curr = max(nums[i], curr + nums[i]);\n    best = max(best, curr);\n  }\n  return best;\n}\n```",
    time: '9:42 am',
    date: 'Today',
  },
  {
    id: 'bm_imp_1',
    chatId: 'self_vault',
    chatName: 'Piyush Yadav (You)',
    senderName: 'You',
    isSender: true,
    category: '#Important',
    text: '📌 Interview Checklist: Keep STAR stories ready for Nexo E2EE Web Crypto Architecture (ECDH P-256 + AES-GCM-256) and Gemini 2.5 Flash AI Pipelines.',
    time: '8:00 am',
    date: 'Today',
  },
];

/**
 * Creates the pinned "Message Yourself" self-chat dynamically bound to Profile Name
 */
export function createSelfChat(user) {
  const userName = user?.name || 'Piyush Yadav';
  const userHandle = user?.username || '@piyush_dev';

  return {
    id: 'self_vault',
    isSelfChat: true,
    pinned: true,
    name: `${userName} (You)`,
    handle: `${userHandle} • Message yourself`,
    subtitle: 'Message yourself • Notes, links & snippets',
    online: true,
    typing: false,
    unreadCount: 0,
    folder: 'all',
    status: 'accepted',
    lastSeen: 'Personal Cloud Vault',
    bio: 'Your private Study Vault for placement links, DSA cheat sheets, call recordings, and AI notes.',
    messages: [
      {
        id: 'self_m1',
        isSender: true,
        text: '📌 Interview Checklist: Keep STAR stories ready for Nexo E2EE Web Crypto Architecture (ECDH P-256 + AES-GCM-256) and Gemini 2.5 Flash AI Pipelines.',
        time: '8:00 am',
        read: true,
        isStarred: true,
        bookmarkCategory: '#Important',
      },
      {
        id: 'self_m2',
        isSender: true,
        text: "SQL Quick Cheat Sheet — 2nd Highest Salary (asked in OA & Interviews):\n```sql\nSELECT MAX(salary) AS SecondHighestSalary\nFROM Employee\nWHERE salary < (SELECT MAX(salary) FROM Employee);\n```",
        time: '8:15 am',
        read: true,
        isStarred: false,
      },
    ],
  };
}

/**
 * Core Channels ONLY (Zero hardcoded dummy friends!)
 * - Study Vault (Message Yourself)
 * - Placement Cell – 2027 Batch
 * - DSA & Coding Prep Squad
 * - Placement Bot
 */
export function createCampusWorkspaceChats(user) {
  const selfChat = createSelfChat(user);

  const placementCell = {
    id: 'chat_placement_cell',
    name: 'Placement Cell – 2027 Batch',
    handle: '@jecrc_tpo_2027',
    subtitle: 'Official drives, eligibility & OA alerts',
    isGroup: true,
    isPlacementAlert: true,
    pinned: true,
    online: true,
    typing: false,
    unreadCount: 2,
    folder: 'groups',
    status: 'accepted',
    bio: 'Official JECRC University Training & Placement Cell • B.Tech CSE 2027 Batch',
    messages: [
      {
        id: 'm_pc_1',
        isSender: false,
        senderName: 'Placement Bot (@placement_bot)',
        text: '📢 Welcome B.Tech CSE (AI & ML) 2027 Batch! Keep your resumes updated in PDF format (< 1 MB) and check eligibility criteria before registering.',
        time: '8:30 am',
        read: true,
      },
      {
        id: 'm_pc_2',
        isSender: false,
        senderName: 'Placement Cell',
        text: '🏢 Campus Drive Update: 2027 Batch SDE Intern + PPO Drives\n• Eligibility: B.Tech CSE / AI & ML | CGPA ≥ 7.5 | 0 Active Backlogs\n• Online Assessment: Saturday, 10:00 AM (90 mins)\n• OA Registration Portal: https://placements.jecrc.edu/drives/2027-sde',
        time: '9:10 am',
        read: false,
        isStarred: true,
        bookmarkCategory: '#Placement',
      },
      {
        id: 'm_pc_3',
        isSender: false,
        senderName: 'Placement Bot (@placement_bot)',
        text: '⏰ Reminder: Submit your GitHub & LeetCode profile links by 6:00 PM today for upcoming SDE shortlisting.',
        time: '10:05 am',
        read: false,
      },
    ],
  };

  const dsaSquad = {
    id: 'chat_dsa_squad',
    name: 'DSA & Coding Prep Squad',
    handle: '@dsa_prep_2027',
    subtitle: 'Daily LeetCode/C++ & complexity prep',
    isGroup: true,
    pinned: true,
    online: true,
    typing: false,
    unreadCount: 2,
    folder: 'groups',
    status: 'accepted',
    bio: 'Daily LeetCode Medium/Hard discussions, C++ STL tricks & OA problem breakdowns.',
    messages: [
      {
        id: 'm_dsa_1',
        isSender: false,
        senderName: 'DSA Prep Moderator',
        text: "Optimal O(N) Kadane's Maximum Subarray reference in C++:\n```cpp\nint maxSubArray(vector<int>& nums) {\n  int curr = nums[0], best = nums[0];\n  for (int i = 1; i < nums.size(); i++) {\n    curr = max(nums[i], curr + nums[i]);\n    best = max(best, curr);\n  }\n  return best;\n}\n```",
        time: '9:42 am',
        read: false,
        isStarred: true,
        bookmarkCategory: '#DSA',
      },
      {
        id: 'm_dsa_2',
        isSender: true,
        text: "Python sliding window template for Longest Substring Without Repeating Characters (O(N) time):\n```python\ndef lengthOfLongestSubstring(s: str) -> int:\n    seen = {}\n    left = best = 0\n    for right, ch in enumerate(s):\n        if ch in seen and seen[ch] >= left:\n            left = seen[ch] + 1\n        seen[ch] = right\n        best = max(best, right - left + 1)\n    return best\n```",
        time: '9:50 am',
        read: true,
      },
      {
        id: 'm_dsa_3',
        isSender: false,
        senderName: 'DSA Prep Moderator',
        text: 'Check out the Prep tab for today’s company-tagged Google & Amazon DSA sheet + LeetCode Daily Challenge!',
        time: '10:12 am',
        read: false,
      },
    ],
  };

  const placementBot = {
    id: 'chat_placement_bot',
    name: 'Placement Bot',
    handle: '@placement_bot',
    subtitle: 'Automated Drive Alerts & E2EE Assistant',
    online: true,
    typing: false,
    unreadCount: 0,
    folder: 'all',
    status: 'accepted',
    lastSeen: 'Always online',
    bio: 'Official JECRC Placement Bot • Tracks 2027 Batch SDE drives, resume deadlines, and OA schedules.',
    messages: [
      {
        id: 'm_bot_1',
        isSender: false,
        text: '👋 Hi Piyush! I track 2027 Batch SDE drives, resume deadlines, and OA schedules. Invite real peers via + → Invite Link or search @username!',
        time: '8:05 am',
        read: true,
      },
    ],
  };

  return [selfChat, placementCell, dsaSquad, placementBot];
}

export const DEFAULT_DIRECTORY_PEERS = [
  {
    id: 'chat_placement_bot',
    full_name: 'Placement Bot',
    username: '@placement_bot',
    mood: '2027 Batch Drive Alerts & Eligibility Helper',
  },
];

export const DEFAULT_CHANNELS = [
  {
    id: 'ch_1',
    name: 'Placement Cell – 2027 Batch',
    handle: '@jecrc_tpo_2027',
    verified: true,
    followers: '1.8k',
    description: 'Official campus placement announcements, SDE/Full-Stack drives, eligibility criteria & OA links.',
    isFollowing: true,
    recentUpdate: {
      text: '🏢 2027 Batch SDE Intern + PPO drive registrations close Friday at 6:00 PM. CGPA ≥ 7.5 required.',
      time: 'Today, 9:10 am',
    },
  },
  {
    id: 'ch_2',
    name: 'DSA & Coding Prep Squad',
    handle: '@dsa_prep_2027',
    verified: true,
    followers: '6.4k',
    description: 'Curated interview-focused DSA problems, DP patterns, and C++/Python complexity breakdowns.',
    isFollowing: true,
    recentUpdate: {
      text: "⚡ Today's Pattern: Sliding Window & Monotonic Stack — 3 must-solve questions before product-based OAs.",
      time: 'Yesterday',
    },
  },
];

export const DEFAULT_COMMUNITIES = [
  {
    id: 'com_1',
    name: 'JECRC B.Tech CSE (2027 Batch)',
    description: 'Central engineering & campus placement collaboration hub for CSE & AI/ML students.',
    membersCount: 420,
    groups: [
      { id: 'g1', name: 'Placement Cell – 2027 Batch', unread: 2 },
      { id: 'g2', name: 'DSA & Coding Prep Squad', unread: 2 },
    ],
  },
];
