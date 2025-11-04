import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';

// Defer service worker registration until after the page has fully loaded.
// This prevents "The document is in an invalid state" errors.
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    // FIX: Explicitly construct the service worker URL from the current origin
    // to resolve the "origin does not match" error.
    const swUrl = new URL('/firebase-messaging-sw.js', window.location.origin).href;
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('Service Worker registered successfully with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
});


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);