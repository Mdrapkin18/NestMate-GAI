import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile, userProfileSchema } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubscribeProfile) unsubscribeProfile();

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Create user profile document on first sign-in, if it doesn't exist
        const newUserProfileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || '',
            schemaVersion: 2,
        };
        // Use setDoc with merge: true to create if not exists, but not overwrite important fields like familyId.
        setDoc(userDocRef, newUserProfileData, { merge: true });

        // Now, listen for real-time updates to the profile
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const parsed = userProfileSchema.safeParse({ ...docSnap.data(), uid: docSnap.id });
            if (parsed.success) {
              setUserProfile(parsed.data);
            } else {
              console.error("Zod validation failed for user profile:", parsed.error);
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });

      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);
  
  const signInWithGoogle = async (): Promise<string | null> => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      return null;
    } catch (error: any) {
      console.error("[useAuth] Error during Google sign-in", error);
      if (error.code === 'auth/unauthorized-domain') {
          return 'This domain is not authorized for sign-in. Please add it to the Firebase console under Authentication > Settings > Authorized domains.';
      }
      return error.message;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<string | null> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null;
    } catch (error: any) {
      console.error("[useAuth] Error signing in with email:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          return 'Invalid email or password. Please try again.';
      }
      return error.message;
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<string | null> => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the new user and profile creation
      return null;
    } catch (error: any) {
      console.error("[useAuth] Error signing up with email:", error);
      if (error.code === 'auth/email-already-in-use') {
        return 'An account with this email address already exists.';
      }
      return error.message;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = { user, userProfile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
