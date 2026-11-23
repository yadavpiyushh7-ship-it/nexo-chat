import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCLZBIQHOo0jWTpnocHArv7GuEf0t_2S1U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nexo-chat-4f390.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nexo-chat-4f390",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nexo-chat-4f390.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "224303876926",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:224303876926:web:68a26a3ba67e7bae2e7a6f"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export default app;
