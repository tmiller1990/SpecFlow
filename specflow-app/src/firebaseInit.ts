import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, setLogLevel, Firestore } from 'firebase/firestore';

// --- SIMPLE PRODUCTION-FOCUSED FIREBASE INITIALIZER ---

type FirebaseConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  [key: string]: unknown;
};

let firebaseConfig: FirebaseConfig | null = null;
let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;
export const appId = import.meta.env.VITE_APP_ID || 'specflow-app';

// Parse the Vite-provided Firebase config (expects a JSON string in VITE_FIREBASE_CONFIG)
try {
  const cfg = import.meta.env.VITE_FIREBASE_CONFIG;
  if (cfg && typeof cfg === 'string') {
    const parsed = JSON.parse(cfg) as FirebaseConfig;
    if (parsed && parsed.apiKey && parsed.projectId) {
      firebaseConfig = parsed;
    }
  }
} catch (e) {
  console.error('Failed to parse VITE_FIREBASE_CONFIG:', e);
}

const initializeFirebaseServices = (): boolean => {
  if (!firebaseConfig) {
    console.error('No Firebase configuration available; cannot initialize Firebase.');
    return false;
  }

  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    setLogLevel('error');
    return true;
  } catch (err) {
    console.error('Error initializing Firebase services:', err);
    app = null;
    db = null;
    auth = null;
    return false;
  }
};

const isInitialized = initializeFirebaseServices();

export const initializeAuth = async (): Promise<void> => {
  if (!isInitialized || !auth) {
    console.error('Cannot initialize Auth: Firebase not initialized.');
    return;
  }

  try {
    await signInAnonymously(auth);
    console.log('Firebase Auth: signed in anonymously');
  } catch (error) {
    console.error('Failed to sign in anonymously:', error);
  }
};
