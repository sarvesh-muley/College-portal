import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoEYMf4-UoWjY2VdVkt5I0bBEuLid9Ji0",
  authDomain: "portal-f61d2.firebaseapp.com",
  projectId: "portal-f61d2",
  storageBucket: "portal-f61d2.firebasestorage.app",
  messagingSenderId: "804151825025",
  appId: "1:804151825025:web:4b036e0d43905587087380",
  measurementId: "G-Q1PHS6Y6YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Secondary app for admin tools (create user without logging out)
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export { app, auth, db, secondaryAuth };
