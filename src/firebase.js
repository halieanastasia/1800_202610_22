// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyBFiJCpRVD0CmOZFRhX3te9PQsFUUwuoJs",
  authDomain: "team-bby22.firebaseapp.com",
  projectId: "team-bby22",
  storageBucket: "team-bby22.firebasestorage.app",
  messagingSenderId: "825394620035",
  appId: "1:825394620035:web:1e61b266c8703e951f9db6",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
