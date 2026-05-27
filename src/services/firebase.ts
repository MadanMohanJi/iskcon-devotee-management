import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Core Engine safely
const app = initializeApp(firebaseConfig);

// Initialize Services targeting explicit Database ID instances
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Signs in user using Google Auth Providers
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
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

// Global Connection Safety Monitor
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.warn("Firebase network layer warning: Client appears to be offline.");
    }
  }
}
testConnection();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: any[];
  };
}

/**
 * Global Firestore Exception Normalization Handler
 */
export function handleFirestoreError(error: any, operation: any, path: string | null = null): never {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email || '',
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData
  } : {
    userId: 'anonymous',
    email: '',
    emailVerified: false,
    isAnonymous: true,
    providerInfo: []
  };

  const errorInfo: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore execution error occurred.',
    operationType: operation,
    path,
    authInfo
  };

  const errorString = JSON.stringify(errorInfo);
  console.error('Firestore Database Exception Context:', errorString);
  throw new Error(errorString);
}