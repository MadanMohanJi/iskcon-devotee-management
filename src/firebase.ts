import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ai-studio-applet-webapp-5183d",
  appId: "1:79556266038:web:fc7f701f9ca9493c923097",
  apiKey: "AIzaSyB6mrrj6p9ojyf7-DjN9qUCWqPXLCZYoUU",
  authDomain: "ai-studio-applet-webapp-5183d.firebaseapp.com",
  storageBucket: "ai-studio-applet-webapp-5183d.firebasestorage.app",
  messagingSenderId: "79556266038"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  databaseId: "ai-studio-59da9217-aa3c-42d4-b27e-4cb8814438d3"
});

export default app;