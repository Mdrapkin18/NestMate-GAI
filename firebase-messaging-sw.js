// Note: In a real app with a build process, you'd use ES modules.
// For this environment, we use the compat scripts.
self.importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6c0T0yIajgdCRUxP9srGm4oWRoga1apU",
  authDomain: "baby-tracker-beta.firebaseapp.com",
  projectId: "baby-tracker-beta",
  storageBucket: "baby-tracker-beta.appspot.com",
  messagingSenderId: "98692814398",
  appId: "1:98692814398:web:f8cd41dc844da9cb08636f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});