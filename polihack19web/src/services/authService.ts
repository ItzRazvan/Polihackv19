import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError,
  User,
} from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  createdAt: Date;
  devices: number;
  subscription?: string; // 'starter', 'pro', 'business', 'enterprise'
}

function getDisplayName(firebaseUser: User): string {
  if (firebaseUser.displayName?.trim()) {
    return firebaseUser.displayName.trim();
  }

  const email = firebaseUser.email || '';
  const base = email.split('@')[0] || 'User';
  return base;
}

function buildFallbackUser(firebaseUser: User): AppUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: getDisplayName(firebaseUser),
    createdAt: new Date(),
    devices: 0,
  };
}

export const authService = {
  async signup(email: string, password: string, name: string): Promise<AppUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Create user document in Firestore
      const userData: AppUser = {
        uid: userId,
        email,
        name,
        createdAt: new Date(),
        devices: 0,
      };

      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: Timestamp.now(),
      });

      return userData;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  },

  async login(email: string, password: string): Promise<AppUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const userId = firebaseUser.uid;

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        const fallback = buildFallbackUser(firebaseUser);
        await setDoc(
          doc(db, 'users', userId),
          {
            ...fallback,
            createdAt: Timestamp.now(),
          },
          { merge: true }
        );
        return fallback;
      }

      const userData = userDoc.data();
      return {
        ...userData,
        createdAt: userData.createdAt?.toDate?.() || new Date(),
      } as AppUser;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  },

  onAuthStateChanged(callback: (user: AppUser | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            callback({
              ...userData,
              createdAt: userData.createdAt?.toDate?.() || new Date(),
            } as AppUser);
            return;
          }

          const fallback = buildFallbackUser(firebaseUser);
          await setDoc(
            userRef,
            {
              ...fallback,
              createdAt: Timestamp.now(),
            },
            { merge: true }
          );
          callback(fallback);
        } catch (error) {
          console.error('Error fetching user data:', error);
          callback(buildFallbackUser(firebaseUser));
        }
      } else {
        callback(null);
      }
    });
  },

  async getCurrentUser(): Promise<AppUser | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    const userRef = doc(db, 'users', firebaseUser.uid);

    try {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          ...userData,
          createdAt: userData.createdAt?.toDate?.() || new Date(),
        } as AppUser;
      }

      const fallback = buildFallbackUser(firebaseUser);
      await setDoc(
        userRef,
        {
          ...fallback,
          createdAt: Timestamp.now(),
        },
        { merge: true }
      );
      return fallback;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return buildFallbackUser(firebaseUser);
    }
  },

  async updateSubscription(userId: string, subscriptionPlan: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { subscription: subscriptionPlan }, { merge: true });
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  },

  handleAuthError(error: AuthError): Error {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('Email already in use');
      case 'auth/weak-password':
        return new Error('Password is too weak');
      case 'auth/invalid-email':
        return new Error('Invalid email address');
      case 'auth/user-not-found':
        return new Error('User not found');
      case 'auth/wrong-password':
        return new Error('Incorrect password');
      case 'auth/configuration-not-found':
        return new Error(
          'Firebase Auth is not configured for this project. In Firebase Console, enable Authentication -> Sign-in method -> Email/Password, then retry.'
        );
      case 'auth/operation-not-allowed':
        return new Error('Email/Password sign-in is disabled for this Firebase project. Enable it in Firebase Console.');
      default:
        return new Error(error.message || 'Authentication error');
    }
  },
};
