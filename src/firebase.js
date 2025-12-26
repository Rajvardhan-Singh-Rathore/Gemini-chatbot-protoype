// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQZPgA8V2I9bg5KcLOuJvkWgbfkzeM8F8",
  authDomain: "gemini-chat-bot-rvsr.firebaseapp.com",
  projectId: "gemini-chat-bot-rvsr",
  storageBucket: "gemini-chat-bot-rvsr.firebasestorage.app",
  messagingSenderId: "79786978434",
  appId: "1:79786978434:web:bf1a28a4e68bfb249a589b",
  measurementId: "G-93L070DRZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);