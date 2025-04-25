// Importing required functions from Firebase SDK

// For initializing Firebase app
import {
  initializeApp,
  getApp,
  getApps,
} from 'firebase/app';

import { getAuth } from 'firebase/auth'; // For Firebase Authentication

import { getFirestore } from 'firebase/firestore'; // For Firestore (database)

// Firebase configuration object with credentials pulled from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app only if it hasn't been initialized yet
// This avoids errors in development where hot reload runs this multiple times
const app = !getApps.length
  ? initializeApp(firebaseConfig)
  : getApp();

// Get Firebase Auth instance tied to the initialized app
export const auth = getAuth(app);

// Get Firestore DB instance tied to the same app
export const db = getFirestore(app);
