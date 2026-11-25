/**
 * Serverless API Route: api/ai.js
 * Compatible with Vercel Serverless Functions & Vite dev proxy.
 * Unlimited token generation (no maxOutputTokens or sentence-length caps).
 */

export default async function handler(req, res) {
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
  const { mode, text, tone, language, messages, userStatus, videoTitle, videoUrl } = req.body || {};

  if (!apiKey) {
    let simulatedText = '';
    if (mode === 'rewrite') {
      if (language && language !== 'Original language' && tone === 'Natural') {
        simulatedText = `[${language}] ${text}`;
      } else {
        const tones = {
          Professional: `Dear team, please find the updated technical details: ${text}`,
          Technical: `Engineering Update: ${text} (Verified edge cases, time/space complexity constraints, and concurrency safety.)`,
          Casual: `Hey! Just wanted to share: ${text} 😎`,
          Concise: `${(text || '').slice(0, 80)}${(text || '').length > 80 ? '...' : ''}`,
          Friendly: `Hope your placement prep is going great! ${text} ✨`,
          Urgent: `⚠️ Priority update: ${text}. Please review before the OA deadline.`,
        };
        simulatedText = tones[tone] || `[${tone}]: ${text}`;
      }
    } else if (mode === 'explain_code') {
      simulatedText = `### Complete Code & Algorithmic Breakdown\n\n**1. Core Intuition & Execution Flow**\nThe solution processes the input deterministically while preserving optimal state transitions across iterations.\n\n**2. Step-by-Step Walkthrough**\n- **Initialization**: Sets baseline state variables cleanly before entering the main loop.\n- **Loop Invariant**: Updates running optimum at each index without re-scanning previous elements.\n- **Termination**: Returns the accumulated optimal answer once all elements are processed.\n\n**3. Complexity Analysis**\n- **Time Complexity**: \`O(N)\` linear traversal.\n- **Space Complexity**: \`O(1)\` auxiliary space (or \`O(K)\` when maintaining a hash map).\n\n**4. Edge Cases for Online Assessments & Interviews**\n- Empty array or single-element input\n- Negative numbers and integer overflow boundaries (\`long long\` in C++)`;
    } else if (mode === 'interview_answer') {
      simulatedText = `### Structured SDE Interview Answer (STAR + Architecture)\n\n**Situation & Goal**\nWhile building ${text || 'a real-time collaborative messaging and placement prep platform'}, the key challenge was delivering sub-second updates alongside strict privacy and AI synthesis.\n\n**Technical Execution**\n1. Architected a modular React frontend backed by Web Crypto API (ECDH P-256 + AES-GCM 256-bit) so message payloads are encrypted client-side before leaving the browser.\n2. Integrated Supabase Realtime channels for zero-latency peer synchronization, live read receipts, and presence.\n3. Added Gemini 2.5 Flash pipelines for code explanations, thread summarization, and automated Minutes of Meeting.\n\n**Measurable Result**\nAchieved responsive real-time messaging across mobile and desktop viewports with zero unencrypted plaintext storage in transit.`;
    } else if (mode === 'summarize') {
      simulatedText = `### Comprehensive Lecture & Thread Summary\n\n- **Placement Cell Updates**: Upcoming 2027 Batch SDE & Full-Stack drives require CGPA ≥ 7.5 and updated PDF resumes.\n- **Technical & DSA Takeaways**: Reviewed optimal \`O(N)\` sliding window & Kadane's patterns, OS Coffman deadlock conditions, and SQL indexing.\n- **Next Action Items**:\n  1. Complete OA registration before Friday 6:00 PM.\n  2. Bookmark key code snippets under #DSA and #Placement in Resource Vault.`;
    } else if (mode === 'mom') {
      simulatedText = `### Minutes of Meeting (MoM)\n\n**Attendees**: Piyush Yadav (@piyush_dev), Placement Coordinator, Study Group Peers\n\n**Key Decisions**\n1. Finalized weekly mock interview cadence (SDE System Design + DSA rounds).\n2. Standardized code sharing in C++/Python with complexity annotations.\n\n**Placement Action Items**\n- Verify eligibility and register for upcoming 2027 Batch OA links.\n- Update GitHub README benchmarks and resume PDF.\n\n**Deadlines**\n- Resume freeze & portal submission: **Friday, 6:00 PM**\n- Practice Online Assessment Window: **Saturday, 10:00 AM**`;
    } else if (mode === 'youtube_notes') {
      simulatedText = `### Timestamped Lecture Notes & Interview Questions\n**Lecture**: ${videoTitle || videoUrl || 'Core CS & DSA Lecture'}\n\n**Timestamped Study Notes**\n- **[00:00 - 06:30]** Core problem framing, intuition, and brute-force baseline analysis.\n- **[06:30 - 15:45]** Optimal data structure / algorithm derivation and dry run on edge cases.\n- **[15:45 - 24:00]** Time & Space Complexity proof and real-world system trade-offs.\n\n**Top Interview Questions to Practice**\n1. How does the optimal approach reduce time complexity compared to brute force?\n2. What happens under memory constraints or skewed/duplicate inputs?\n3. How would you adapt this design for concurrent or distributed workloads?`;
    } else if (mode === 'auto_reply') {
      simulatedText = `Hi! I have Exam / Study Focus Mode active right now (${userStatus || 'Deep Study Session 📚'}). I've noted your message and will respond as soon as my study block finishes!`;
    }

    return res.status(200).json({
      success: true,
      mode,
      result: simulatedText,
      simulated: true,
    });
  }

  try {
    let prompt = '';

    if (mode === 'rewrite') {
      prompt = `You are Nexo AI Placement Assistant for B.Tech Computer Science students.
Task: Rewrite the following message thoroughly and clearly.
Target Tone: ${tone || 'Professional'}
Target Language: ${language || 'Original language'}
Input Text: "${text}"

Return ONLY the final rewritten message without quotes or meta-commentary.`;
    } else if (mode === 'explain_code') {
      prompt = `You are an expert Competitive Programming & SDE Interview Mentor inside Nexo.
Task: Provide a complete, unrestricted, multi-paragraph technical explanation of the following code or algorithm logic for a B.Tech CSE student preparing for campus placements.
Code / Logic:
${text}

Include:
1. High-level intuition & why the approach works
2. Line-by-line / step-by-step walkthrough
3. Exact Time & Space Complexity (Big-O)
4. Edge cases, optimizations, and common follow-up interview questions.`;
    } else if (mode === 'interview_answer') {
      prompt = `You are an expert Senior SDE Interview Coach inside Nexo.
Task: Convert the following rough note, project idea, or experience into a complete, unrestricted, detailed, interview-ready answer (using STAR + System Architecture / Engineering Impact structure).
Input Note:
"${text}"

Provide a thorough spoken-style technical answer plus 2-3 likely interviewer follow-up questions with short answers.`;
    } else if (mode === 'summarize') {
      const messageList = Array.isArray(messages)
        ? messages.map((m) => `${m.senderName || (m.isSender ? 'Me' : 'Peer')}: ${m.text}`).join('\n')
        : text;

      prompt = `You are Nexo AI Lecture & Thread Summarizer for B.Tech CSE students.
Task: Summarize these study/placement messages into a complete, well-structured set of notes.
Messages:
${messageList}

Include all key technical details, formulas/complexities, placement deadlines, eligibility criteria, links, and clear next action steps.`;
    } else if (mode === 'mom') {
      prompt = `You are Nexo AI Workspace Minutes of Meeting (MoM) Generator.
Task: Convert the following meeting notes, discussion, or transcript into a complete, structured Minutes of Meeting document:
Input Notes / Transcript:
${text}

Structure using clear markdown headings:
- **Attendees**
- **Key Decisions**
- **Placement / Engineering Action Items**
- **Deadlines & Owners**`;
    } else if (mode === 'youtube_notes') {
      prompt = `You are Nexo AI Study Coach for B.Tech CSE (AI & ML) students.
Task: Generate comprehensive **Timestamped Lecture Notes** and **Technical Interview Questions** for the following YouTube CS lecture:
Video Title: ${videoTitle || 'CS / Placement Lecture'}
Video URL: ${videoUrl || text}
Context / Notes: ${text || 'Core Computer Science / DSA / System Design / Placement Prep'}

Provide detailed timestamped sections, key definitions/formulas, code/architecture takeaways, and 5 high-yield interview questions with concise model answers.`;
    } else if (mode === 'auto_reply') {
      const history = Array.isArray(messages)
        ? messages.slice(-5).map((m) => `${m.isSender ? 'Me' : 'Peer'}: ${m.text}`).join('\n')
        : text;

      prompt = `You are Nexo Exam / Study Focus Mode Auto-Reply AI.
The student currently has Study Focus Mode active (Status: "${userStatus || 'Studying for DSA / Exams 📚'}").
Recent conversation:
${history}

Generate a polite, helpful automated reply letting them know you're in a study/exam block and will respond shortly. Return ONLY the reply text.`;
    } else {
      return res.status(400).json({ error: `Unknown mode: "${mode}".` });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errData = await geminiResponse.text();
      return res.status(geminiResponse.status).json({
        error: 'Gemini API call failed',
        details: errData,
      });
    }

    const data = await geminiResponse.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return res.status(200).json({
      success: true,
      mode,
      result: generatedText,
    });
  } catch (error) {
    console.error('API Error in api/ai.js:', error);
    return res.status(500).json({
      error: 'Internal server error while processing AI request.',
      message: error.message,
    });
  }
}
