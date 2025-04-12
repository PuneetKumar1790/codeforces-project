// config.js - Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB5PmC_MVog8h3apY_dihiWtE-W7B_wz5o",
    authDomain: "codeforces-1cd9c.firebaseapp.com",
    projectId: "codeforces-1cd9c",
    storageBucket: "codeforces-1cd9c.firebasestorage.app",
    messagingSenderId: "725740122293",
    appId: "1:725740122293:web:e5fdbdb25becf8793a4efc",
    measurementId: "G-PKN5WRHG50"
};

// Prevent duplicate initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); 
}
