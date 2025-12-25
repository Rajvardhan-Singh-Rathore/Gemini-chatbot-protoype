export default async function handler(req, res) {
  try {
    const { message } = JSON.parse(req.body);

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    const data = await r.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ??
      "No reply returned.";

    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ reply: "Server error" });
  }
}
