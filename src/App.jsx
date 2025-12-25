import { useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();

      const botMsg = { role: "bot", text: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", text: "Server error" }]);
    }

    setInput("");
  }


  return (
    <div className="h-screen bg-zinc-900 text-white flex items-center justify-center">
      <div className="w-full max-w-2xl bg-zinc-700 p-5 rounded-xl shadow-lg flex flex-col gap-4">

        <h1 className="text-2xl font-bold text-center">
          RVSR's Gemini Chatbot
        </h1>

        <div className="flex-1 overflow-y-auto bg-zinc-800 p-4 rounded-lg space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg w-fit max-w-[80%] ${
                m.role === "user"
                  ? "bg-zinc-700 ml-auto"
                  : "bg-zinc-900 mr-auto"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 p-3 rounded-lg text-white"
            placeholder="Ask something..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button className="bg-zinc-100 px-4 py-2 rounded-full hover:bg-zinc-300">
            Send
          </button>
        </form>

      </div>
    </div>
  );
}

export default App;
