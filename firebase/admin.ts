// Import necessary functions from Firebase Admin SDK
import {
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const initFirebaseAdmin = () => {
  // Get the list of already initialized Firebase apps
  const apps = getApps();

  // If no Firebase apps are initialized, initialize one
  if (!apps.length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:
          process.env.FIREBASE_PRIVATE_KEY?.replace(
            /\\n/g,
            '\n'
          ),
      }),
    });
  }

  // Return the initialized Auth and Firestore instances
  return {
    auth: getAuth(),
    db: getFirestore(),
  };
};

// Destructure and export the auth and db instances
export const { auth, db } = initFirebaseAdmin();
