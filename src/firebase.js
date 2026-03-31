// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Configure Auth
const _auth = getAuth(app);

// browserLocalPersistence means user must log out explicitly,
// else they will stay logged in
setPersistence(_auth, browserLocalPersistence);

// Resolve auth state once on load
let currentUser = null;
let resolveAuthReady;

export const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

// fires once Firebase has resolved auth state
onAuthStateChanged(_auth, (user) => {
  currentUser = user;
  resolveAuthReady();
});

// Getter for other modules to use
export function getCurrentUser() {
  return currentUser;
}

export const auth = _auth;
