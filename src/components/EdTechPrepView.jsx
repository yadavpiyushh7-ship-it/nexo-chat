import React, { useState } from 'react';
import { Code2, Trophy, Share2, BookmarkPlus, ExternalLink, Flame, Building2, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useGoogleAuth, exportTrackerToGoogleSheets } from '../lib/googleApis';

const DAILY_CHALLENGE = {
  id: 'lc_daily',
  platform: 'LeetCode Daily',
  title: 'Subarray Sum Equals K',
  difficulty: 'Medium',
  companies: ['Google', 'Amazon', 'Microsoft'],
  pattern: 'Prefix Sum + Hash Map • O(N) Time / O(N) Space',
  url: 'https://leetcode.com/problems/subarray-sum-equals-k/',
  starterCode: `\`\`\`cpp
int subarraySum(vector<int>& nums, int k) {
  unordered_map<int, int> freq{{0, 1}};
  int sum = 0, count = 0;
  for (int x : nums) {
    sum += x;
    if (freq.count(sum - k)) count += freq[sum - k];
    freq[sum]++;
  }
  return count;
}
\`\`\``,
};

const UPCOMING_CONTESTS = [
  { platform: 'LeetCode', title: 'Weekly Contest 438', schedule: 'Sunday, 8:00 AM IST', url: 'https://leetcode.com/contest/' },
  { platform: 'GeeksforGeeks', title: 'GFG Job-A-Thon Hiring Challenge', schedule: 'Saturday, 8:00 PM IST', url: 'https://practice.geeksforgeeks.org/contests' },
  { platform: 'HackerRank', title: 'Campus SDE Mock OA Sprint', schedule: 'Friday, 7:00 PM IST', url: 'https://www.hackerrank.com/contests' },
];

const COMPANY_SHEETS = [
  {
    id: 'p1',
    title: 'Trapping Rain Water',
    platform: 'LeetCode',
    difficulty: 'Hard',
    companies: ['Google', 'Amazon', 'Adobe'],
    pattern: 'Two Pointers • O(N) Time / O(1) Space',
    url: 'https://leetcode.com/problems/trapping-rain-water/',
    starterCode: `\`\`\`cpp
int trap(vector<int>& h) {
  int l = 0, r = h.size() - 1, lmax = 0, rmax = 0, ans = 0;
  while (l < r) {
    if (h[l] < h[r]) { lmax = max(lmax, h[l]); ans += lmax - h[l++]; }
    else { rmax = max(rmax, h[r]); ans += rmax - h[r--]; }
  }
  return ans;
}
\`\`\``,
  },
  {
    id: 'p2',
    title: 'LRU Cache Design',
    platform: 'GeeksforGeeks',
    difficulty: 'Medium',
    companies: ['Amazon', 'Microsoft', 'Product'],
    pattern: 'Doubly Linked List + Hash Map • O(1)',
    url: 'https://www.geeksforgeeks.org/lru-cache-implementation/',
    starterCode: `\`\`\`python
from collections import OrderedDict
class LRUCache:
    def __init__(self, cap: int):
        self.cache = OrderedDict()
        self.cap = cap
    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]
\`\`\``,
  },
  {
    id: 'p3',
    title: 'Course Schedule (Cycle Detection)',
    platform: 'LeetCode',
    difficulty: 'Medium',
    companies: ['Google', 'Microsoft', 'Adobe'],
    pattern: 'Topological Sort (Kahn BFS) • O(V+E)',
    url: 'https://leetcode.com/problems/course-schedule/',
    starterCode: `\`\`\`cpp
// Kahn's BFS Indegree Check for DAG
bool canFinish(int n, vector<vector<int>>& pre) {
  vector<vector<int>> adj(n);
  vector<int> indeg(n, 0);
  for (auto& e : pre) { adj[e[1]].push_back(e[0]); indeg[e[0]]++; }
  queue<int> q;
  for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);
  int cnt = 0;
  while (!q.empty()) {
    int u = q.front(); q.pop(); cnt++;
    for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
  }
  return cnt == n;
}
\`\`\``,
  },
  {
    id: 'p4',
    title: 'SQL: Nth Highest Salary & Window Ranking',
    platform: 'HackerRank',
    difficulty: 'Easy',
    companies: ['Service', 'Product', 'Amazon'],
    pattern: 'SQL DENSE_RANK() • DBMS Interview Must',
    url: 'https://www.hackerrank.com/domains/sql',
    starterCode: `\`\`\`sql
SELECT DISTINCT salary
FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM Employee
) t
WHERE rnk = 2;
\`\`\``,
  },
  {
    id: 'p5',
    title: 'System Design & GitHub Portfolio Blueprint',
    platform: 'GitHub',
    difficulty: 'Medium',
    companies: ['Google', 'Adobe', 'Product'],
    pattern: 'README Architecture + Live Benchmarks',
    url: 'https://github.com/explore',
    starterCode: `\`\`\`javascript
// Rate Limiter Token Bucket Middleware Sketch
export function allowRequest(bucket, capacity = 10) {
  const now = Date.now();
  bucket.tokens = Math.min(capacity, bucket.tokens + (now - bucket.last) * 0.01);
  bucket.last = now;
  if (bucket.tokens >= 1) { bucket.tokens -= 1; return true; }
  return false;
}
\`\`\``,
  },
];

const COMPANY_FILTERS = ['All', 'Google', 'Amazon', 'Microsoft', 'Adobe', 'Product', 'Service'];

function difficultyBadge(diff) {
  if (diff === 'Hard') return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
  if (diff === 'Medium') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
}

export default function EdTechPrepView({ chats = [], onSendMessageToChat, onSaveToVault, onShowToast }) {
  const { token: googleToken, signIn: signInGoogle } = useGoogleAuth();
  const [companyFilter, setCompanyFilter] = useState('All');
  const [targetChatId, setTargetChatId] = useState(chats[0]?.id || 'chat_dsa_squad');
  const [exportingSheet, setExportingSheet] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState('');

  const handleExportToSheets = async () => {
    let activeToken = googleToken;
    if (!activeToken) {
      const res = await signInGoogle();
      if (!res?.ok || !res?.token) {
        onShowToast?.(res?.error || 'Please sign in with Google to export to Google Sheets.');
        return;
      }
      activeToken = res.token;
    }

    setExportingSheet(true);
    try {
      const allItems = [DAILY_CHALLENGE, ...filteredProblems];
      const rows = [
        ['Platform', 'Problem Title', 'Difficulty', 'Target Companies', 'Pattern & Complexity', 'Problem Link', 'Status'],
        ...allItems.map((p) => [
          p.platform,
          p.title,
          p.difficulty,
          p.companies.join(', '),
          p.pattern,
          p.url,
          'To Solve',
        ]),
      ];

      const { url } = await exportTrackerToGoogleSheets({
        accessToken: activeToken,
        title: `Nexo DSA & Placement Tracker (${companyFilter})`,
        rows,
      });
      setExportedSheetUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
      onShowToast?.('Exported DSA & Placement tracker to Google Sheets!');
    } catch (err) {
      onShowToast?.(err?.message || 'Google Sheets export failed.');
    } finally {
      setExportingSheet(false);
    }
  };

  const filteredProblems = COMPANY_SHEETS.filter(
    (p) => companyFilter === 'All' || p.companies.includes(companyFilter)
  );

  const shareProblem = (prob) => {
    const formatted = `💻 **[${prob.platform}] ${prob.title}** (${prob.difficulty})\n🏢 Tags: ${prob.companies.join(', ')}\n⚡ Pattern: ${prob.pattern}\n🔗 ${prob.url}\n\n${prob.starterCode}`;
    onSendMessageToChat?.(targetChatId, { text: formatted });
    onShowToast?.(`Shared "${prob.title}" into chat!`);
  };

  const bookmarkProblem = (prob) => {
    const formatted = `💻 **[${prob.platform}] ${prob.title}** (${prob.difficulty})\n🏢 ${prob.companies.join(', ')} • ${prob.pattern}\n${prob.starterCode}`;
    onSaveToVault?.(formatted, '#DSA');
    onShowToast?.(`Saved "${prob.title}" to Study Vault (#DSA)!`);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0c1317] select-none font-sans overflow-hidden">
      {/* Header */}
      <div className="h-[64px] px-4 sm:px-6 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between flex-shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#0055ff] text-white">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[#111b21] dark:text-white truncate">
              EdTech & Placement Prep Hub
            </h2>
            <p className="text-[11.5px] text-[#667781] dark:text-[#8696a0] truncate">
              LeetCode • GeeksforGeeks • HackerRank • GitHub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportToSheets}
            disabled={exportingSheet}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs flex-shrink-0"
          >
            {exportingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Export to Google Sheets</span>
            <span className="sm:hidden">Sheets</span>
          </button>

          <select
            value={targetChatId}
            onChange={(e) => setTargetChatId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#111b21] text-[12px] font-semibold text-[#111b21] dark:text-white border border-black/10 dark:border-white/10 max-w-[170px]"
          >
            {chats.map((c) => (
              <option key={c.id} value={c.id}>
                Share to: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {exportedSheetUrl && (
        <div className="px-4 sm:px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-[12px]">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            Live Google Sheet created with {1 + filteredProblems.length} tracked placement problems.
          </span>
          <a
            href={exportedSheetUrl}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-emerald-700 dark:text-emerald-300 underline inline-flex items-center gap-1"
          >
            <span>Open Google Sheet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Grid: Daily DSA Challenge + Upcoming Contests */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Daily DSA Challenge */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-gradient-to-br from-[#0055ff]/10 via-white to-[#7b2cbf]/10 dark:from-[#0055ff]/20 dark:via-[#111b21] dark:to-[#7b2cbf]/20 border border-[#0055ff]/25 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{DAILY_CHALLENGE.platform}</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${difficultyBadge(DAILY_CHALLENGE.difficulty)}`}>
                  {DAILY_CHALLENGE.difficulty}
                </span>
              </div>

              <div>
                <h3 className="text-[18px] font-bold text-[#111b21] dark:text-white">
                  {DAILY_CHALLENGE.title}
                </h3>
                <p className="text-[12.5px] text-[#667781] dark:text-[#8696a0] mt-0.5">
                  {DAILY_CHALLENGE.pattern}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {DAILY_CHALLENGE.companies.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-white/10 text-[11px] font-semibold text-[#111b21] dark:text-[#e9edef]">
                    {c}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => shareProblem(DAILY_CHALLENGE)}
                  className="px-3.5 py-2 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Problem in Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => bookmarkProblem(DAILY_CHALLENGE)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#202c33] text-[#111b21] dark:text-white text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer border border-black/10 dark:border-white/10"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-[#00a884]" />
                  <span>Save to Study Vault</span>
                </button>
                <a
                  href={DAILY_CHALLENGE.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl text-[12.5px] font-semibold text-[#0055ff] dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Solve</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Upcoming Coding Contests */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/10 shadow-sm space-y-3">
              <h3 className="text-[15px] font-bold text-[#111b21] dark:text-white flex items-center gap-2">
                <Trophy className="w-4.5 h-4.5 text-amber-500" />
                <span>Upcoming Coding Contests</span>
              </h3>
              <div className="space-y-2.5">
                {UPCOMING_CONTESTS.map((ct, idx) => (
                  <a
                    key={idx}
                    href={ct.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-3 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] hover:bg-[#e9edef] dark:hover:bg-[#2a3942] transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#0055ff] dark:text-sky-400">
                      <span>{ct.platform}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                    <h4 className="text-[13.5px] font-bold text-[#111b21] dark:text-white mt-0.5">
                      {ct.title}
                    </h4>
                    <span className="text-[11.5px] text-[#667781] dark:text-[#8696a0]">
                      {ct.schedule}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Company-Tagged Interview Sheets */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-[#00a884]" />
                <span>Company-Tagged Interview Sheets</span>
              </h3>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {COMPANY_FILTERS.map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setCompanyFilter(comp)}
                    className={`px-3 py-1 rounded-full text-[12px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                      companyFilter === comp
                        ? 'bg-[#0055ff] text-white'
                        : 'bg-white dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] hover:bg-black/5'
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProblems.map((prob) => (
                <div
                  key={prob.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#111b21] border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-bold text-[#0055ff] dark:text-sky-400">
                        {prob.platform}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${difficultyBadge(prob.difficulty)}`}>
                        {prob.difficulty}
                      </span>
                    </div>

                    <h4 className="text-[15px] font-bold text-[#111b21] dark:text-white">
                      {prob.title}
                    </h4>
                    <p className="text-[12px] text-[#667781] dark:text-[#8696a0]">
                      {prob.pattern}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {prob.companies.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-md bg-[#f0f2f5] dark:bg-[#202c33] text-[11px] font-semibold text-[#54656f] dark:text-[#aebac1]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => shareProblem(prob)}
                      className="px-3 py-1.5 rounded-xl bg-[#0055ff] hover:bg-[#0044cc] text-white text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => bookmarkProblem(prob)}
                      className="px-3 py-1.5 rounded-xl bg-[#f0f2f5] dark:bg-[#202c33] text-[#111b21] dark:text-white text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-[#00a884]" />
                      <span>Vault</span>
                    </button>
                    <a
                      href={prob.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto text-[12px] font-semibold text-[#0055ff] dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
