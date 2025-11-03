import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app, db, auth } from "./firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export const requestNotificationPermission = async (): Promise<NotificationPermission | null> => {
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
};

const saveMessagingDeviceToken = async () => {
    if (!auth.currentUser) {
        return;
    }
    try {
        const messaging = getMessaging(app);
        // You need to provide your VAPID key here
        const currentToken = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE' });
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
