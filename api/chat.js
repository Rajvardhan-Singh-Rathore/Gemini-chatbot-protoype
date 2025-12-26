export default async function handler(req, res) {
  try {
    const { message, history = [] } = req.body;

    const messages = [
      ...history.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: messages })
      }
    );

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Sorry — I couldn’t generate a reply.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({ reply: "Server error" });
  }
}
