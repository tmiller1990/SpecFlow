import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  type Auth,
  connectAuthEmulator
} from 'firebase/auth';
import {
  getFirestore,
  setLogLevel,
  Firestore,
  connectFirestoreEmulator
} from 'firebase/firestore';

// --- CONFIGURATION ACCESS (Optimized for Local/Emulator) ---

type FirebaseConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  [key: string]: unknown;
};

let firebaseConfig: FirebaseConfig = {};
let rawAuthToken = '';
let rawAppId = 'local-dev-app-id';
let useEmulators = false;

// 1. Attempt to parse the Firebase config from environment variables (works in both dev and prod)
try {
  const configString = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configString) {
    const parsedConfig = JSON.parse(configString);
    if (parsedConfig && parsedConfig.apiKey && parsedConfig.projectId) {
      firebaseConfig = parsedConfig;
      rawAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN || '';
      rawAppId = import.meta.env.VITE_APP_ID || 'local-dev-app-id';
      if (import.meta.env.DEV) {
        console.debug('Firebase: parsed VITE_FIREBASE_CONFIG (DEV)', parsedConfig);
      }
      console.log('Firebase: VITE_FIREBASE_CONFIG detected.');
    }
  }
} catch (e) {
  // Keep this minimal; in dev we want to know parsing failed
  console.error('Firebase: Error parsing VITE_FIREBASE_CONFIG.', e);
}

// 2. If in dev, decide whether to use emulators (mock api-key or missing config)
function isFirebaseConfig(obj: unknown): obj is FirebaseConfig {
  return !!obj && typeof obj === 'object' && 'apiKey' in (obj as object);
}

if (import.meta.env.DEV) {
  if (isFirebaseConfig(firebaseConfig) && typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.includes('MOCK_API_KEY')) {
    console.warn(
      'Local Firebase: Detected Mock API Key in VITE_FIREBASE_CONFIG. Forcing Emulator Mode.'
    );
    useEmulators = true;
  }

  if (Object.keys(firebaseConfig).length === 0) {
    useEmulators = true;
  }
}

// If not in development or not explicitly set up for cloud, use the emulator mock config.
if (useEmulators) {
  // The emulator doesn't care about the key, but initializeApp requires a basic config object.
  firebaseConfig = {
    apiKey: 'emulator-key-mock',
    authDomain: 'emulator-auth.firebaseapp.com',
    projectId: 'specflow-emulator',
    storageBucket: 'specflow-emulator.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456'
  };
  rawAppId = 'specflow-emulator';
  rawAuthToken = '';
}

// --- INITIALIZATION ---

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;
export const appId = rawAppId;

/**
 * Initializes Firebase App, Firestore, and Auth. Connects to emulators if configured for local dev.
 */
const initializeFirebaseServices = () => {
  if (Object.keys(firebaseConfig).length === 0) {
    console.error('Cannot initialize Firebase: No valid configuration available.');
    return false;
  }

  try {
    // 1. Initialize Firebase App (uses either real or mock config)
    app = initializeApp(firebaseConfig);

    // 2. Initialize dependent services
    db = getFirestore(app);
    auth = getAuth(app);

    // 3. Connect to Emulators if we determined we are in a local development environment
    if (useEmulators && import.meta.env.DEV) {
      console.warn('Local Firebase: Connecting to Local Emulators (Auth: 9099, Firestore: 8080).');
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
    }

    // 4. Set debug logging for Firestore
    setLogLevel('debug');

    return true;
  } catch (e) {
    console.error('Error during firebase service initialization:', e);
    app = null;
    db = null;
    auth = null;
    return false;
  }
};

// Immediately attempt to initialize the services upon module load
const isInitialized = initializeFirebaseServices();

/**
 * Handles the initial authentication setup using the provided custom token.
 */
export const initializeAuth = async (): Promise<void> => {
  if (!isInitialized || !auth) {
    console.error('Cannot initialize Auth: Firebase services not available.');
    return;
  }

  try {
    // Note: signInWithCustomToken and signInAnonymously will automatically use the
    // local emulator if it is connected above.
    if (rawAuthToken && rawAuthToken.length > 10) {
      await signInWithCustomToken(auth, rawAuthToken);
      console.log('Firebase Auth: Signed in with custom token.');
    } else {
      // Fallback for anonymous users
      await signInAnonymously(auth);
      console.log('Firebase Auth: Signed in anonymously.');
    }
  } catch (error) {
    console.error('Firebase Auth initialization failed during sign-in:', error);
  }
};