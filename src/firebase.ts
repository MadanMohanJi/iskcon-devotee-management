import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // Import Realtime Database SDK
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Core Engine safely using your combined parameters
const app = initializeApp(firebaseConfig);

// Initialize Services targeting both default tracking lines
export const db = getFirestore(app);                      // Firestore Database Instantiation
export const rtdb = getDatabase(app);                    // Realtime Database Instantiation
export const auth = getAuth(app);                        // Authentication
export const googleProvider = new GoogleAuthProvider();  // Google Provider

/**
 * Signs in user using Google Auth Providers
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
}

/**
 * Maps a simple tracking User ID to an internal formatted email domain session
 */
export async function loginWithUserId(userId: string, password: string) {
  const email = `${userId.toLowerCase().trim()}@iskcon.app`;
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Registers secondary administrative staff without breaking the current administrator's runtime authentication state
 */
export async function registerSevak(userId: string, password: string) {
  const email = `${userId.toLowerCase().trim()}@iskcon.app`;
  const secondaryAppName = 'SecondaryAppForRegistration';
  
  let secondaryApp;
  const existingApps = getApps();
  const found = existingApps.find((a: any) => a.name === secondaryAppName);
  
  if (found) {
    secondaryApp = found;
  } else {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }
  
  const secondaryAuth = getAuth(secondaryApp);
  const creds = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  
  // Clean up secondary application sessions immediately to save browser memory
  await secondaryAuth.signOut();
  return creds;
}