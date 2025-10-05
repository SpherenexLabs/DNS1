

// src/firebase.js  (RECEIVER APP)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBCV4gWcvJwuGGq-kVS_Np2RFPmN95VKdM",
  authDomain: "dual-axis-2f701.firebaseapp.com",
  databaseURL: "https://dual-axis-2f701-default-rtdb.firebaseio.com",
  projectId: "dual-axis-2f701",
  storageBucket: "dual-axis-2f701.firebasestorage.app",
  messagingSenderId: "465420518729",
  appId: "1:465420518729:web:e3be4e8dc16913d0e30698",
  measurementId: "G-X3JDKHLPZF"
};

const app = getApps().find(a => a.name === "cybershield")
  ?? initializeApp(firebaseConfig, "cybershield");

export const db = getDatabase(app);
export const storage = getStorage(app);
try { getAnalytics(app); } catch {}
