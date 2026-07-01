/**
 * Stylish English — Voice Proxy API
 * Bridges browser WebSocket ↔ Google GenAI Live API
 * 
 * Deploy on Vercel: GEMINI_API_KEY stored as env variable
 * Frontend connects via: POST /api/voice-session
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// System prompts by age group
const SYSTEM_PROMPTS = {
  boy: `أنت محمد، معلم إنجليزي ودود ومرح بلهجة جيزانية خفيفة. تتحدث مع ولد صغير (6-12 سنة). استخدم كلمات بسيطة وشجّعه كثيراً. علّمه الحروف والكلمات الأساسية بطريقة ممتعة.`,
  girl: `أنت محمد، معلم إنجليزي ودود ومرح بلهجة جيزانية خفيفة. تتحدث مع بنت صغيرة (6-12 سنة). استخدم كلمات بسيطة وشجّعها كثيراً. علّمها الحروف والكلمات الأساسية بطريقة ممتعة.`,
  teen: `أنت محمد، معلم إنجليزي شبابي وحماسي بلهجة جيزانية خفيفة. تتحدث مع مراهق/مراهقة (13-17 سنة). استخدم أمثلة من حياتهم اليومية (مدرسة، ألعاب، سوشيال ميديا). حافظ على الحماس.`,
  adult: `أنت محمد، معلم إنجليزي محترف ومحترم بلهجة جيزانية خفيفة. تتحدث مع شخص بالغ يتعلم الإنجليزية. استخدم أمثلة عملية (عمل، سفر، مقابلات). كن مشجّعاً بدون مبالغة.`
};

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { text, age = 'adult', history = [] } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing "text" field' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPTS[age] || SYSTEM_PROMPTS.adult
    });

    // Build conversation history
    const chatHistory = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(text);
    const response = result.response.text();

    return res.status(200).json({
      reply: response,
      age: age
    });

  } catch (error) {
    console.error('GenAI Error:', error);
    return res.status(500).json({ 
      error: 'AI processing failed',
      details: error.message 
    });
  }
};
