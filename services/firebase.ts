import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
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
const db = getFirestore(app);
const messaging = getMessaging(app);


// Enable offline persistence for Firestore.
// This allows the app to work offline and syncs data when the connection is restored.
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Firestore persistence failed: multiple tabs open. Offline support will be disabled.');
    } else if (err.code == 'unimplemented') {
      console.warn('Firestore persistence not available in this browser. Offline support will be disabled.');
    }
  });

export { app, auth, db, messaging };