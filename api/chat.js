export default async function handler(req, res) {
  try {
    const { message, history = [] } = req.body;

    // Build chat history in Gemini format
    const contents = [
      ...history.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res
        .status(500)
        .json({ reply: data.error?.message || "Gemini API Error" });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "No reply returned.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ reply: "Server error" });
  }
}
