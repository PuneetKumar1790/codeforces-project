// config.example.js - Example Firebase Configuration (DO NOT USE IN PRODUCTION)
const firebaseConfig = {
    apiKey: window.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: window.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: window.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: window.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: window.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: window.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Prevent duplicate initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}
