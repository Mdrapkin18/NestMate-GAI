import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getMessaging } from "firebase/messaging";

// In a real app, this would be in environment variables and not checked into source control.
const firebaseConfig = {
  apiKey: "AIzaSyA6c0T0yIajgdCRUxP9srGm4oWRoga1apU",
  authDomain: "baby-tracker-beta.firebaseapp.com",
  projectId: "baby-tracker-beta",
  storageBucket: "baby-tracker-beta.appspot.com",
  messagingSenderId: "98692814398",
  appId: "1:98692814398:web:f8cd41dc844da9cb08636f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const messaging = getMessaging(app);

// Enable offline persistence for Firestore using the recommended modern approach.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({})
  });
} catch (error: any) {
  if (error.code == 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open. Offline support will be limited.');
  } else if (error.code == 'unimplemented') {
    console.warn('Firestore persistence not available in this browser. Offline support will be disabled.');
  }
  // Fallback to default in-memory cache if persistence fails
  db = getFirestore(app);
}

export { app, auth, db, messaging };