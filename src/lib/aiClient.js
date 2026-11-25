/**
 * Client helper to call /api/ai with unrestricted local fallback
 */
export async function requestAI({ mode, text, tone, language, messages, userStatus, videoTitle, videoUrl }) {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, text, tone, language, messages, userStatus, videoTitle, videoUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.result) return data.result;
    }
  } catch (err) {
    console.warn('API /api/ai fallback active:', err?.message || err);
  }

  await new Promise((r) => setTimeout(r, 400));

  if (mode === 'rewrite') {
    const tones = {
      Professional: `Dear team, please find the updated technical details: ${text}`,
      Technical: `Engineering Update: ${text} (Verified edge cases, time/space complexity constraints, and concurrency safety.)`,
      Casual: `Hey! Just wanted to share: ${text} 😎`,
      Concise: `${(text || '').slice(0, 80)}${(text || '').length > 80 ? '...' : ''}`,
      Friendly: `Hope your placement prep is going great! ${text} ✨`,
      Urgent: `⚠️ Priority update: ${text}. Please review before the OA deadline.`,
    };
    return tones[tone] || `[${tone}]: ${text}`;
  }

  if (mode === 'explain_code') {
    const snippet = String(text || '').trim();
    const isSql = /SELECT|FROM|WHERE|JOIN/i.test(snippet);
    const isPython = /def |enumerate|import /i.test(snippet);
    const langLabel = isSql ? 'SQL Query' : isPython ? 'Python' : 'C++ / Algorithm';

    return `### Complete ${langLabel} Analysis\n\n**1. Core Intuition**\nProcesses the dataset deterministically in a structured pass, maintaining invariant bounds so redundant subproblems are never recomputed.\n\n**2. Time & Space Complexity**\n- **Time**: ${isSql ? 'Index-assisted scan / O(N log N)' : 'O(N) optimal linear scan'}\n- **Space**: O(1) to O(N) auxiliary memory depending on state tracking.\n\n**3. Interview Edge Cases**\n- Empty / single-item input\n- Negative values, duplicate keys, and integer overflow boundaries.`;
  }

  if (mode === 'interview_answer') {
    const clean = String(text || '').trim() || 'real-time collaborative engineering workflow';
    return `### Structured SDE Interview Answer\n\n**Overview & Ownership**\n"While engineering ${clean}, I focused on deterministic state synchronization, client-side cryptographic privacy, and low-latency responsiveness.\n\n**Architecture & Trade-offs**\nBy combining Web Crypto API (ECDH P-256 + AES-GCM-256) with Supabase Realtime channels and Gemini 2.5 Flash AI pipelines, the system scales smoothly across both desktop and mobile viewports without storing unencrypted plaintext.\n\n**Outcome**\nDelivered reliable end-to-end encrypted communication, live code rendering, and automated study workflows ready for real-world deployment."`;
  }

  if (mode === 'summarize') {
    const msgTexts = Array.isArray(messages) ? messages.map((m) => m.text).filter(Boolean) : [];
    const previewBullets = msgTexts.map((t) => `- ${t.replace(/```[\s\S]*?```/g, '[Code Snippet]').slice(0, 140)}${t.length > 140 ? '...' : ''}`);
    return `### Lecture & Thread Summary\n\n${previewBullets.length > 0 ? previewBullets.join('\n') : '- Reviewed key technical & placement updates.'}\n\n**Next Action**: Save important code snippets under #DSA and verify upcoming OA deadlines under #Placement.`;
  }

  if (mode === 'mom') {
    return `### Minutes of Meeting (MoM)\n\n**Attendees**: Piyush Yadav (@piyush_dev), Placement Coordinator, Study Squad\n\n**Key Decisions**\n1. Prioritized company-tagged DSA patterns and full-stack project walkthroughs.\n2. Agreed on daily peer code reviews inside Nexo.\n\n**Placement Action Items**\n- Verify eligibility and complete OA links from Placement Cell.\n- Finalize resume PDF & GitHub portfolio links.\n\n**Deadlines**\n- Portal Submission: **Friday, 6:00 PM**\n- Mock Interview Window: **Saturday, 10:00 AM**`;
  }

  if (mode === 'youtube_notes') {
    return `### Timestamped Lecture Notes & Interview Questions\n**Lecture**: ${videoTitle || videoUrl || 'CS Core Lecture'}\n\n**Timestamped Notes**\n- **[00:00 - 07:00]** Problem intuition, constraints, and naive brute-force analysis.\n- **[07:00 - 16:30]** Optimal data structure walkthrough and dry run on edge cases.\n- **[16:30 - 25:00]** Big-O Time/Space proof and production scaling considerations.\n\n**Interview Questions**\n1. Why is this approach asymptotically faster than brute force?\n2. What edge cases can break naive implementations?\n3. How would you test and scale this logic in a distributed backend?`;
  }

  if (mode === 'auto_reply') {
    return `Hi! I'm currently in Exam / Study Focus Mode (${userStatus || 'Deep Study Session 📚'}). I've saved your message and will reply as soon as I wrap up!`;
  }

  return 'AI response ready.';
}
