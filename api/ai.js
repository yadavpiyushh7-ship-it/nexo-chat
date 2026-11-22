/**
 * Serverless API Route: api/ai.js
 * Compatible with Vercel Serverless Functions.
 * Reads process.env.GEMINI_API_KEY and calls Gemini 2.5 Flash.
 */

export default async function handler(req, res) {
  // Allow cross-origin requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const { mode, text, tone, language, messages, userStatus } = req.body || {};

  if (!apiKey) {
    // Graceful fallback response when API key is not yet set in environment
    let simulatedText = '';
    if (mode === 'rewrite') {
      const tones = {
        Professional: `Dear team, please find the updated information as discussed: ${text}`,
        Casual: `Hey! Just wanted to share: ${text} 😎`,
        Concise: `${text.slice(0, 45)}...`,
        Friendly: `Hope you're having a wonderful day! ${text} ✨`,
        Urgent: `⚠️ Priority update: ${text}. Please let me know your thoughts ASAP.`,
      };
      simulatedText = tones[tone] || `[${tone}]: ${text}`;
    } else if (mode === 'summarize') {
      simulatedText = `📌 **Unread Summary**:\n• Discussed project milestone deliverables.\n• Checked UI mockups and design tokens.\n• Final presentation scheduled for tomorrow 10:00 AM.\n\n⚡ **Next Action**: Review the shared prototype before noon.`;
    } else if (mode === 'auto_reply') {
      simulatedText = `Hi! I have Focus Mode turned on right now (${userStatus || 'Focus Mode active'}). I've received your message and will get back to you as soon as I'm free! 🚀`;
    }

    return res.status(200).json({
      success: true,
      mode,
      result: simulatedText,
      simulated: true,
      note: 'Configure GEMINI_API_KEY in .env or Vercel Environment Variables to use live Gemini 2.5 Flash.'
    });
  }

  try {
    let prompt = '';

    if (mode === 'rewrite') {
      prompt = `You are an AI assistant in Nexo, a modern messaging app.
Task: Rewrite the following message.
Target Tone: ${tone || 'Professional'}
Target Language: ${language || 'Original language'}
Input Text: "${text}"

Rules:
1. Return ONLY the final rewritten message. Do not add quotes, markdown formatting labels, or conversational preamble.
2. Keep it natural, WhatsApp-friendly, and concise.`;
    } else if (mode === 'summarize') {
      const messageList = Array.isArray(messages)
        ? messages.map((m) => `${m.senderName || (m.isSender ? 'Me' : 'Them')}: ${m.text}`).join('\n')
        : text;

      prompt = `You are Nexo AI Summarizer.
Task: Summarize these unread messages in a high-priority, executive briefing style:
Messages:
${messageList}

Requirements:
- Provide 2-4 succinct bullet points highlighting key updates, questions asked, or decisions needed.
- Conclude with a 1-sentence "Next Action" recommendation.
- Keep the format clean with emojis.`;
    } else if (mode === 'auto_reply') {
      const history = Array.isArray(messages)
        ? messages.slice(-5).map((m) => `${m.isSender ? 'Me' : 'Contact'}: ${m.text}`).join('\n')
        : text;

      prompt = `You are Nexo Focus Mode Auto-Reply AI.
The user is currently busy / in Focus Mode (Status: "${userStatus || 'Focus Mode active'}").
Recent conversation:
${history}

Task: Generate a polite, intelligent, and natural 1-2 sentence automated WhatsApp reply acknowledging their latest message, stating that I'm currently focused/busy, and offering a brief helpful next step.
Return ONLY the drafted response text.`;
    } else {
      return res.status(400).json({ error: `Unknown mode: "${mode}". Valid modes: rewrite, summarize, auto_reply.` });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    if (!geminiResponse.ok) {
      const errData = await geminiResponse.text();
      return res.status(geminiResponse.status).json({
        error: 'Gemini API call failed',
        details: errData
      });
    }

    const data = await geminiResponse.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return res.status(200).json({
      success: true,
      mode,
      result: generatedText
    });
  } catch (error) {
    console.error('API Error in api/ai.js:', error);
    return res.status(500).json({
      error: 'Internal server error while processing AI request.',
      message: error.message
    });
  }
}
