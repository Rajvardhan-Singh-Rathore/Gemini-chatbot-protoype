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

  // 🔐 Track auth state
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  // 📂 Load user conversations
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "conversations"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // 💬 Load messages
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

    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
    });
  }, [activeChat, user]);

  // 🔽 Auto scroll when messages change
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
      {
        title: "New chat",
        createdAt: serverTimestamp()
      }
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

    const userMsg = { role: "user", text, ts: Date.now() };
    await addDoc(path, userMsg);

    // 🏷️ Only set title if it's still default
    const msgsSnap = await getDocs(path);
    if (msgsSnap.size === 1) {
      await updateDoc(
        doc(db, "users", user.uid, "conversations", activeChat),
        { title: text.slice(0, 30) }
      );
    }

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
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-white">
        <button
          onClick={login}
          className="bg-white text-black px-5 py-3 rounded-lg shadow"
        >
          Continue with Google
        </button>
      </div>
    );

  return (
    <div className="h-screen flex bg-zinc-900 text-white">

      {/* Sidebar */}
      <div className="w-64 bg-zinc-800 p-3 flex flex-col gap-3">
        <button onClick={newChat} className="bg-zinc-700 p-2 rounded-lg">
          ➕ New Chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`p-2 rounded cursor-pointer ${
                c.id === activeChat ? "bg-zinc-600" : "bg-zinc-700"
              }`}
            >
              {c.title || "Untitled"}
            </div>
          ))}
        </div>

        <button onClick={logout} className="bg-red-600 p-2 rounded-lg">
          Logout
        </button>
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
