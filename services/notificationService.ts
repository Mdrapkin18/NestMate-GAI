import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app, db, auth } from "./firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

// IMPORTANT: Replace this with your VAPID key from the Firebase console.
// Go to Project Settings > Cloud Messaging > Web configuration > Web Push certificates.
const VAPID_KEY = 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE';


export const requestNotificationPermission = async (): Promise<NotificationPermission | null> => {
    try {
        if (!await isSupported()) {
            console.log("Firebase Messaging is not supported in this browser.");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            await saveMessagingDeviceToken();
        } else {
            console.log('Unable to get permission to notify.');
        }
        return permission;
    } catch (error) {
        console.error("[notificationService] Error requesting permission:", error);
        return null;
    }
};

const saveMessagingDeviceToken = async () => {
    if (!auth.currentUser) {
        return;
    }
    if (VAPID_KEY === 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE' || !VAPID_KEY) {
        console.error(
`VAPID key not set in services/notificationService.ts.
Please add your key to enable push notifications.
You can find it in your Firebase project:
Project Settings > Cloud Messaging > Web configuration > Web Push certificates > Generate key pair.`
        );
        return;
    }
    try {
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
            console.log('Got FCM token:', currentToken);
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            // Add the token to the user's profile in Firestore
            await updateDoc(userDocRef, {
                fcmTokens: arrayUnion(currentToken)
            });
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
    }
};