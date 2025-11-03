import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (unsubscribeProfile) {
        unsubscribeProfile(); // Stop listening to the old user's profile
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        unsubscribeProfile = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              const profileData = userProfileSchema.safeParse({ uid: docSnap.id, ...docSnap.data() });
              if (profileData.success) {
                setUserProfile(profileData.data);
              } else {
                console.error("Zod validation failed for user profile:", profileData.error);
                setUserProfile(null);
              }
              setLoading(false);
            } else {
              // This is a new user, create their profile document
              const newUserProfile: Omit<UserProfile, 'uid'> = {
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || '',
                // Family ID and role are left undefined until they join or create a family
              };
              setDoc(userDocRef, newUserProfile)
                .then(() => {
                   console.log("New user profile created.");
                   // The onSnapshot listener will fire again with the new data,
                   // so we don't need to call setUserProfile here.
                })
                .catch(error => {
                  console.error("Error creating user profile:", error);
                  setLoading(false);
                });
            }
          },
          (error) => {
            console.error("Error listening to user profile:", error);
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
        );
      } else {
        // User is signed out
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);
  
  const signInWithGoogle = async (): Promise<string | null> => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      return null;
    } catch (error: any) {
      console.error("Error during Google sign-in", error);
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
      console.error("Error signing in with email:", error);
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
      console.error("Error signing up with email:", error);
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