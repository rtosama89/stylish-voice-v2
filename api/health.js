export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    service: "Stylish English Voice Backend",
    version: "1.0.0",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
}
