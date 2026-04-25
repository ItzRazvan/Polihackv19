import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};

const requiredKeys = Object.entries(firebaseConfig);
const hasPlaceholder = (value: unknown) => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();
  if (!normalized) {
    return true;
  }

  return (
    normalized.includes('REPLACE_WITH_YOUR') ||
    normalized.includes('YOUR_API_KEY') ||
    normalized.includes('your-project') ||
    normalized.includes('123456789012') ||
    normalized.includes('abcdef1234567890') ||
    normalized.includes('DemoKeyForDevelopment')
  );
};

const invalidKeys = requiredKeys
  .filter(([, value]) => hasPlaceholder(value))
  .map(([key]) => key);

if (invalidKeys.length > 0) {
  throw new Error(
    `Invalid Firebase configuration for: ${invalidKeys.join(', ')}. ` +
      'Set real values in .env.local and restart the dev server.'
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Uncomment to use emulator for local development
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }
