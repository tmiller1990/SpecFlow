import { initializeApp } from 'firebase/app'; // Runtime value imports
import type { FirebaseApp } from 'firebase/app'; // Type-only import for the type definition
import { getAuth, signInWithCustomToken, signInAnonymously, type Auth, connectAuthEmulator } from 'firebase/auth'; 
import { getFirestore, setLogLevel, Firestore, connectFirestoreEmulator } from 'firebase/firestore'; 

// --- CONFIGURATION ACCESS (Optimized for Local/Emulator) ---

let firebaseConfig: object = {};
let rawAuthToken = '';
let rawAppId = 'local-dev-app-id';
let useEmulators = false;

// 1. Check if we are in a development environment and likely need emulators.
if (import.meta.env.DEV) {
    // In local development, prioritize checking for the real cloud config first.
    let isCloudConfigValid = false;
    
    try {
        const configString = import.meta.env.VITE_FIREBASE_CONFIG;
        if (configString) {
            const parsedConfig = JSON.parse(configString);
            
            // We check for a *known* mock API key string, even if it has placeholders, 
            // and assume any config that uses it is attempting to use the emulators 
            // via an environment variable.
            if (parsedConfig.apiKey && parsedConfig.apiKey.includes('MOCK_API_KEY')) {
                 console.warn("Local Firebase: Detected Mock API Key in VITE_FIREBASE_CONFIG. Forcing Emulator Mode.");
                 useEmulators = true;
            } else if (parsedConfig && parsedConfig.apiKey && parsedConfig.projectId) {
                // This is where a real, non-mock cloud key would be detected.
                firebaseConfig = parsedConfig;
                rawAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN || '';
                rawAppId = import.meta.env.VITE_APP_ID || 'local-dev-app-id';
                isCloudConfigValid = true;
                console.log("Local Firebase: Using VITE_FIREBASE_CONFIG (Cloud connection intended).");
            }
        }
    } catch (e) {
        // If parsing fails, fall through to emulator setup.
        console.error("Local Firebase: Error parsing VITE_FIREBASE_CONFIG. Forcing Emulator Mode.", e);
        useEmulators = true;
    }
    
    // If we didn't validate a real cloud config, we default to the emulator setup.
    if (!isCloudConfigValid) {
        useEmulators = true;
    }
} 

// If not in development or not explicitly set up for cloud, use the emulator mock config.
if (useEmulators) {
    // The emulator doesn't care about the key, but initializeApp requires a basic config object.
    firebaseConfig = {
        apiKey: "emulator-key-mock", // Still required for initializeApp, but ignored by the emulator connection
        authDomain: "emulator-auth.firebaseapp.com",
        projectId: "specflow-emulator", 
        storageBucket: "specflow-emulator.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef123456"
    };
    rawAppId = 'specflow-emulator';
    // Ensure rawAuthToken is empty for anonymous sign-in unless explicitly provided otherwise
    rawAuthToken = ''; 
}

// --- INITIALIZATION ---

let app: FirebaseApp | null = null; // Use the type imported above
export let db: Firestore | null = null;
export let auth: Auth | null = null;
export const appId = rawAppId;

// --- INITIALIZATION FUNCTION ---

/**
 * Initializes Firebase App, Firestore, and Auth. Connects to emulators if configured for local dev.
 */
const initializeFirebaseServices = () => {
    
    if (Object.keys(firebaseConfig).length === 0) {
        console.error("Cannot initialize Firebase: No valid configuration available.");
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
            console.warn("Local Firebase: Connecting to Local Emulators (Auth: 9099, Firestore: 8080).");
            
            
            connectFirestoreEmulator(db, 'localhost', 8080);
            connectAuthEmulator(auth, 'http://localhost:9099');
        }

        // 4. Set debug logging
        setLogLevel('debug'); 
        
        return true;
    } catch (e) {
        // Catch any remaining initialization errors and log them.
        console.error("Error during firebase service initialization:", e);
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
        console.error("Cannot initialize Auth: Firebase services not available.");
        return; 
    }
    
    try {
        // Note: signInWithCustomToken and signInAnonymously will automatically use the 
        // local emulator if it is connected above.
        if (rawAuthToken && rawAuthToken.length > 10) { 
            await signInWithCustomToken(auth, rawAuthToken);
            console.log("Firebase Auth: Signed in with custom token (Emulator).");
        } else {
            // Fallback for anonymous users 
            await signInAnonymously(auth);
            console.log("Firebase Auth: Signed in anonymously (Emulator).");
        }
    } catch (error) {
        console.error("Firebase Auth initialization failed during sign-in:", error);
    }
};