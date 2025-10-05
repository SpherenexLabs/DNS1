// Firebase v9+ modular SDK
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import {
  getDatabase
} from "firebase/database";

// Your config (provided)
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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

// Persist login across tabs/reloads
setPersistence(auth, browserLocalPersistence).catch(console.error);
