import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQZPgA8V2I9bg5KcLOuJvkWgbfkzeM8F8",
  authDomain: "gemini-chat-bot-rvsr.firebaseapp.com",
  projectId: "gemini-chat-bot-rvsr",
  storageBucket: "gemini-chat-bot-rvsr.firebasestorage.app",
  messagingSenderId: "79786978434",
  appId: "1:79786978434:web:bf1a28a4e68bfb249a589b",
  measurementId: "G-93L070DRZ3"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
