/**
 * Client helper to call /api/ai
 */
export async function requestAI({ mode, text, tone, language, messages, userStatus }) {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, text, tone, language, messages, userStatus }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.result;
    }
  } catch (err) {
    console.warn('API /api/ai error, utilizing local backup simulation.', err);
  }

  // Fallback simulation in case API is temporarily unavailable
  await new Promise((r) => setTimeout(r, 600));

  if (mode === 'rewrite') {
    const tones = {
      Professional: `Dear team, please find the updated information as discussed: ${text}`,
      Casual: `Hey! Just wanted to share: ${text} 😎`,
      Concise: `${text.slice(0, 45)}...`,
      Friendly: `Hope you're having a wonderful day! ${text} ✨`,
      Urgent: `⚠️ Priority update: ${text}. Please let me know your thoughts ASAP.`,
    };
    return tones[tone] || `[${tone}]: ${text}`;
  }

  if (mode === 'summarize') {
    return `📌 **Unread Summary**:\n• Discussed project milestone deliverables.\n• Checked UI mockups and design tokens.\n• Final presentation scheduled for tomorrow 10:00 AM.\n\n⚡ **Next Action**: Review the shared prototype before noon.`;
  }

  if (mode === 'auto_reply') {
    return `Hi! I have Focus Mode turned on right now. I've noted your message and will get back to you as soon as I wrap up this session. Thanks for your patience! 🚀`;
  }

  return 'AI generated response.';
}
