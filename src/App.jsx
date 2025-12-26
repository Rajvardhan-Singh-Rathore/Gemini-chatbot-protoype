import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { db } from "./firebase";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

function App() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  // Listen to all conversations
  useEffect(() => {
    const q = query(
      collection(db, "conversations"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, snap => {
      setConversations(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
    });

    return () => unsub();
  }, []);

  // Load messages of active chat
  useEffect(() => {
    if (!activeChat) return;

    const unsub = onSnapshot(
      collection(db, "conversations", activeChat, "messages"),
      snap => {
        setMessages(snap.docs.map(d => d.data()));
      }
    );

    return () => unsub();
  }, [activeChat]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  async function newChat() {
    const docRef = await addDoc(collection(db, "conversations"), {
      title: "New chat",
      createdAt: serverTimestamp()
    });
    setActiveChat(docRef.id);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;

    const userMsg = {
      role: "user",
      text: input,
      ts: Date.now()
    };

    setInput("");

    await addDoc(
      collection(db, "conversations", activeChat, "messages"),
      userMsg
    );

    // first user message becomes title
    await updateDoc(doc(db, "conversations", activeChat), {
      title: userMsg.text.slice(0, 25)
    });

    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg.text })
    });

    const data = await res.json();

    await addDoc(
      collection(db, "conversations", activeChat, "messages"),
      { role: "bot", text: data.reply, ts: Date.now() }
    );

    setLoading(false);
  }

  return (
    <div className="h-screen flex bg-zinc-900 text-white">

      {/* Sidebar */}
      <div className="w-64 bg-zinc-800 p-3 flex flex-col gap-3">
        <button
          onClick={newChat}
          className="bg-zinc-700 p-2 rounded-lg"
        >
          ➕ New Chat
        </button>

        <input
          placeholder="Search..."
          className="p-2 rounded bg-zinc-900"
        />

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`p-2 rounded cursor-pointer ${
                c.id === activeChat
                  ? "bg-zinc-600"
                  : "bg-zinc-700"
              }`}
            >
              {c.title || "Untitled"}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col p-5 gap-3">

        <h1 className="text-2xl font-bold text-center">
          RVSR&apos;s Gemini Chatbot
        </h1>

        <div
          ref={chatRef}
          className="flex-1 bg-zinc-800 p-4 rounded-lg overflow-y-auto space-y-3"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[80%] ${
                m.role === "user"
                  ? "bg-zinc-700 ml-auto"
                  : "bg-zinc-900 mr-auto"
              }`}
            >
              {m.role === "bot" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {m.text}
                </ReactMarkdown>
              ) : (
                m.text
              )}
            </div>
          ))}

          {loading && <div>Typing…</div>}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 p-3 rounded bg-zinc-900"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask something..."
          />
          <button className="bg-white text-black px-4 rounded">
            Send
          </button>
        </form>

      </div>
    </div>
  );
}

export default App;
