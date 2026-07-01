import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPTS = {
  boy: `You are Mohammed (محمد), a warm and playful English tutor with a light Jizani accent. You are teaching a young boy (age 6-12). Use simple words, lots of encouragement, and make learning fun. Respond in English first, then give a short Arabic tip in friendly Gulf dialect. Keep responses under 3 sentences in English.`,
  girl: `You are Mohammed (محمد), a warm and playful English tutor with a light Jizani accent. You are teaching a young girl (age 6-12). Use simple words, lots of encouragement, and make learning fun. Respond in English first, then give a short Arabic tip in friendly Gulf dialect. Keep responses under 3 sentences in English.`,
  teen: `You are Mohammed (محمد), an energetic English tutor with a light Jizani accent. You are teaching a teenager (age 13-17). Use relatable examples from school, social media, and daily life. Be enthusiastic but not childish. Respond in English first, then give a short Arabic tip in friendly Gulf dialect. Keep responses under 3 sentences in English.`,
  adult: `You are Mohammed (محمد), a professional and respectful English tutor with a light Jizani accent. You are teaching an adult learner. Use practical examples from work, travel, and daily life. Be encouraging without being patronizing. Respond in English first, then give a short Arabic tip in friendly Gulf dialect. Keep responses under 3 sentences in English.`
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables");
    return res.status(500).json({
      error: "Server configuration error",
      detail: "API key not configured"
    });
  }

  // Parse and validate request body
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { text, age = "adult", history = [] } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty "text" field' });
  }

  // Validate age parameter
  const validAges = ["boy", "girl", "teen", "adult"];
  const safeAge = validAges.includes(age) ? age : "adult";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPTS[safeAge],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 256
      }
    });

    // Build conversation history
    const chatHistory = history
      .filter(h => h && h.role && h.text)
      .map(h => ({
        role: h.role === "ai" ? "model" : "user",
        parts: [{ text: h.text }]
      }));

    const chat = model.startChat({ history: chatHistory });

    const result = await chat.sendMessage(text.trim());
    const reply = result.response.text();

    return res.status(200).json({
      reply: reply,
      age: safeAge,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error("Gemini API Error:", error.message);

    // Return user-friendly error
    const status = error.message?.includes("API_KEY") ? 401 : 500;
    return res.status(status).json({
      error: "AI processing failed",
      detail: error.message?.substring(0, 200) || "Unknown error"
    });
  }
}
