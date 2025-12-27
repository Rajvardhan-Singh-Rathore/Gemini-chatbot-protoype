import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import { app, db } from "./firebase";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs
} from "firebase/firestore";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const auth = getAuth(app);

function App() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "conversations"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, snap =>
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  useEffect(() => {
    if (!activeChat || !user) return;
    const q = query(
      collection(
        db,
        "users",
        user.uid,
        "conversations",
        activeChat,
        "messages"
      ),
      orderBy("ts", "asc")
    );
    return onSnapshot(q, snap =>
      setMessages(snap.docs.map(d => d.data()))
    );
  }, [activeChat, user]);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  async function login() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function logout() {
    await signOut(auth);
    setActiveChat(null);
  }

  async function newChat() {
    if (!user) return;
    const ref = await addDoc(
      collection(db, "users", user.uid, "conversations"),
      { title: "New chat", createdAt: serverTimestamp() }
    );
    setActiveChat(ref.id);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeChat || !user) return;

    const path = collection(
      db,
      "users",
      user.uid,
      "conversations",
      activeChat,
      "messages"
    );

    const text = input;
    setInput("");

    await addDoc(path, { role: "user", text, ts: Date.now() });

    const snaps = await getDocs(path);
    if (snaps.size === 1)
      await updateDoc(
        doc(db, "users", user.uid, "conversations", activeChat),
        { title: text.slice(0, 30) }
      );

    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    await addDoc(path, {
      role: "bot",
      text: data.reply,
      ts: Date.now()
    });

    setLoading(false);
  }

  // ================= UI ==================

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center chat-bg text-white">
        <button onClick={login} className="glass-btn">
          Continue with Google
        </button>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row chat-bg text-white">

      {/* Sidebar */}
      <div className="w-full lg:w-72 p-4 flex flex-col gap-3 glass-card">
        <button onClick={newChat} className="glass-btn">
          ➕ New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`glass-item ${
                c.id === activeChat ? "glass-item-active" : ""
              }`}
            >
              {c.title || "Untitled"}
            </div>
          ))}
        </div>

        <button onClick={logout} className="glass-danger">
          Logout
        </button>
      </div>

      {/* Chat */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-center drop-shadow-md">
          RVSR&apos;s Gemini Chatbot
        </h1>

        <div ref={chatRef} className="flex-1 glass-card overflow-y-auto space-y-3 p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`glass-bubble ${
                m.role === "user" ? "ml-auto user" : "mr-auto bot"
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

          {loading && (
            <div className="glass-bubble bot flex gap-2">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 glass-card p-2">
          <input
            className="flex-1 bg-transparent outline-none"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask something..."
          />
          <button className="glass-btn px-4">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
