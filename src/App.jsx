import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import { db, auth, googleProvider } from "./firebase";
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

import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  // ==== AUTH ====
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  function login() {
    signInWithPopup(auth, googleProvider);
  }

  function logout() {
    signOut(auth);
  }

  // ==== LOAD CHATS (per-user) ====
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

  // ==== LOAD MESSAGES ====
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

  async function newChat() {
    const ref = await addDoc(
      collection(db, "users", user.uid, "conversations"),
      { title: "New chat", createdAt: serverTimestamp() }
    );
    setActiveChat(ref.id);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;

    const userMsg = { role: "user", text: input, ts: Date.now() };
    const nowText = input;
    setInput("");

    await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "conversations",
        activeChat,
        "messages"
      ),
      userMsg
    );

    if (!messages.length) {
      await updateDoc(
        doc(db, "users", user.uid, "conversations", activeChat),
        { title: nowText.slice(0, 25) }
      );
    }

    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: nowText, history: messages })
    });

    const data = await res.json();

    await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "conversations",
        activeChat,
        "messages"
      ),
      { role: "bot", text: data.reply, ts: Date.now() }
    );

    setLoading(false);
  }

  // ==== NOT LOGGED IN ====
  if (!user)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-white">
        <button
          onClick={login}
          className="bg-white text-black px-5 py-3 rounded-lg"
        >
          Continue with Google
        </button>
      </div>
    );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-zinc-900 text-white">

      {/* Sidebar */}
      <div className="md:w-64 w-full bg-zinc-800 p-3 flex flex-col gap-3">
        <div className="flex justify-between">
          <button onClick={newChat} className="bg-zinc-700 p-2 rounded-lg">
            ➕ New Chat
          </button>
          <button onClick={logout}>🚪</button>
        </div>

        <input
          placeholder="Search..."
          className="p-2 rounded bg-zinc-900"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && setSearch("")}
        />

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations
            .filter(c =>
              (c.title || "")
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            .map(c => (
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

        <h1 className="text-xl md:text-2xl font-bold text-center">
          RVSR&apos;s Gemini Chatbot
        </h1>

        <div
          ref={chatRef}
          className="flex-1 bg-zinc-800 p-4 rounded-lg overflow-y-auto space-y-3"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[90%] md:max-w-[80%] ${
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
