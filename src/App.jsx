import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setInput(""); // clear immediately

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

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="h-screen bg-zinc-900 text-white flex items-center justify-center">
      <div className="w-full max-w-2xl bg-zinc-800 p-5 rounded-xl shadow-lg flex flex-col gap-4">

        <h1 className="text-2xl font-bold text-center">
          RVSR&apos;s Gemini Chatbot
        </h1>

        {/* CHAT BOX */}
        <div
          ref={chatRef}
          className="flex-1 bg-zinc-900 p-4 rounded-lg space-y-3 overflow-y-auto"
          style={{ maxHeight: "65vh" }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] ${
                m.role === "user"
                  ? "bg-zinc-800 p-3 rounded-lg ml-auto"
                  : "mr-auto"
              }`}
            >
              {m.role === "bot" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // normal paragraphs → NO bubble
                    p({ children }) {
                      return (
                        <p className="text-gray-200 leading-relaxed mb-2">
                          {children}
                        </p>
                      );
                    },
                    // inline code
                    code({ inline, className, children, ...props }) {
                      return inline ? (
                        <code className="bg-black/70 px-1 py-0.5 rounded">
                          {children}
                        </code>
                      ) : (
                        // code block inside a zinc-700 card
                        <div className="bg-zinc-700 p-2 rounded-lg my-2">
                          <pre className="bg-black text-gray-100 p-3 rounded-md overflow-x-auto">
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

          {loading && (
            <div className="p-3 rounded-lg bg-zinc-800 w-fit mr-auto">
              Typing…
            </div>
          )}
        </div>

        {/* INPUT */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 p-3 bg-zinc-900 rounded-lg text-white"
            placeholder="Ask something..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-full hover:bg-zinc-300 disabled:opacity-60"
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
