'use server';

import { auth, db } from '@/firebase/admin';

// Importing cookies for session management
import { cookies } from 'next/headers';

const ONE_WEEK = 60 * 60 * 24 * 7;

//SignUp the user
export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    //Check if user already exists in DB and return error if exists already.
    const userRecord = await db
      .collection('users')
      .doc(uid)
      .get();

    if (userRecord.exists) {
      return {
        success: false,
        message:
          'User already exists. Please sign in instead',
      };
    }

    //Create a user in FireStore DB with name and email
    await db.collection('users').doc(uid).set({
      name,
      email,
    });

    return {
      success: true,
      message:
        'Account created successfully.Please sign in.',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error creating user', error);

    if (error.code === 'auth/email-already-exists') {
      return {
        success: false,
        message: 'This email is already in use',
      };
    }

    return {
      success: false,
      message: 'Failed to create an account',
    };
  }
}

// This function takes an ID token and creates a session cookie from it,
// storing it securely in the user's browser cookies.
export async function setSessionCookie(idToken: string) {
  // Get the cookie store from the Next.js server-side cookies API
  const cookieStore = await cookies();

  // Create a session cookie using the Firebase Admin SDK with the given ID token
  const sessionCookie = await auth.createSessionCookie(
    idToken,
    {
      expiresIn: ONE_WEEK * 1000,
    }
  );

  // Store the session cookie in the user's browser with secure settings
  cookieStore.set('session', sessionCookie, {
    maxAge: ONE_WEEK,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
}

//Sign in the user
export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    //Check if user exists in FireStore
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return {
        success: false,
        message:
          'User does not exist. Create an account instead',
      };
    }
    // Generate a cookie for the user's idToken
    await setSessionCookie(idToken);
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: 'Failed to log into an account',
    };
  }
}

//Get the current logged in user
export async function getCurrentUser(): Promise<User | null> {
  // Get the cookie store from the Next.js server-side cookies API
  const cookieStore = await cookies();

  //Reads a cookie name 'session' in browser and access value property of sessionCookie obj
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) return null;

  try {
    //Verify the cookie
    const decodedClaims = await auth.verifySessionCookie(
      sessionCookie,
      true
    );

    //Query firestore db to get the user details by his uid
    const userRecord = await db
      .collection('users')
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) {
      return null;
    }

    //Spread userRecord obj and add id because .data method don't return id by default
    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.log(error);

    return null;
  }
}

//Check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();

  //converting userRecord Obj returned by getCurrentUser to a boolean
  return !!user;
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();

  cookieStore.delete('session');
}
