import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

function App() {
  const [messages, setMessages] = useState(() => {
    return JSON.parse(localStorage.getItem("chat_history")) || [];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  // ---------------- SAVE CHAT ----------------
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  // ---------------- SEND MESSAGE ----------------
  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text })
      });

      const data = await res.json();

      const botMsg = { role: "bot", text: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "Server error. Please try again." }
      ]);
    }

    setLoading(false);
  }

  // --------------- AUTO-SCROLL ----------------
  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  return (
    <div className="h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <div className="w-full max-w-2xl backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl p-6 rounded-3xl flex flex-col gap-4">

        <h1 className="text-2xl font-bold text-center drop-shadow">
          RVSR&apos;s Gemini Chatbot
        </h1>

        {/* CHAT */}
        <div
          ref={chatRef}
          className="flex-1 rounded-2xl p-4 overflow-y-auto space-y-3 bg-black/30 border border-white/10"
          style={{ maxHeight: "65vh" }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] ${
                m.role === "user"
                  ? "bg-white/20 border border-white/30 p-3 rounded-2xl ml-auto"
                  : "mr-auto"
              }`}
            >
              {m.role === "bot" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    p({ children }) {
                      return (
                        <p className="text-gray-200 leading-relaxed mb-2">
                          {children}
                        </p>
                      );
                    },

                    code({ inline, className, children, ...props }) {
                      return inline ? (
                        <code className="bg-black/60 px-1 py-0.5 rounded">
                          {children}
                        </code>
                      ) : (
                        <div className="bg-white/20 border border-white/30 rounded-xl my-2 relative">
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(children)
                            }
                            className="absolute top-2 right-2 text-xs bg-white/20 border border-white/20 px-2 py-1 rounded-lg hover:bg-white/30"
                          >
                            Copy
                          </button>

                          <pre className="bg-black text-gray-100 p-4 rounded-xl overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    }
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              ) : (
                m.text
              )}
            </div>
          ))}

          {/* TYPING BUBBLE */}
          {loading && (
            <div className="bg-white text-black px-3 py-2 rounded-2xl w-fit mr-auto flex gap-1">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          )}
        </div>

        {/* INPUT */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 p-3 bg-black/40 border border-white/20 rounded-2xl text-white"
            placeholder="Ask something..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            className="px-6 py-2 rounded-2xl bg-white/90 text-black font-semibold hover:bg-white disabled:opacity-50"
            disabled={loading}
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}

export default App;
