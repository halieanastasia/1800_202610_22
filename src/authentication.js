// src/authentication.js
import { auth } from "./firebase.js";
// Also need db if you are using Firestore in signup
// import { db } from "./firebase.js"; 

import {
  signInWithEmailAndPassword,      // For Login
  createUserWithEmailAndPassword, // For Signup
  updateProfile,                  // For Name
  updateEmail,                    // For Email
  updatePassword,                 // For Password
  onAuthStateChanged,             // For Auth state
  signOut                         // For Logout
} from "firebase/auth";

// Export auth so account.js can use it
export { auth };

// -------------------------------------------------------------
// loginUser
// -------------------------------------------------------------
export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// -------------------------------------------------------------
// signupUser
// -------------------------------------------------------------
export async function signupUser(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update the user's profile with the display name
  await updateProfile(user, { displayName: name });

  // Note: If you want to use Firestore (setDoc), 
  // you must import { doc, setDoc } from "firebase/firestore" 
  // and import 'db' from your firebase.js at the top.

  return user;
}

// -------------------------------------------------------------
// logoutUser
// -------------------------------------------------------------
export function logoutUser() {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  }).catch(err => console.error(err));
}

// -------------------------------------------------------------
// updateUserProfile
// -------------------------------------------------------------
export async function updateUserProfile(newName) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "No user" };
  try {
    await updateProfile(user, { displayName: newName });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function updateUserEmail(newEmail) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "No user" };
  try {
    await updateEmail(user, newEmail);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function updateUserPassword(newPassword) {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "No user" };
  try {
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

// -------------------------------------------------------------
// onAuthReady
// -------------------------------------------------------------
export function onAuthReady(callback) {
  onAuthStateChanged(auth, (user) => callback(user));
}

// -------------------------------------------------------------
// authErrorMessage
// -------------------------------------------------------------
export function authErrorMessage(error) {
  const code = (error?.code || "").toLowerCase();
  const map = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/email-already-in-use": "Email is already in use.",
    "auth/weak-password": "Password too weak (min 6 characters).",
    "auth/missing-password": "Password cannot be empty.",
    "auth/network-request-failed": "Network error. Try again.",
  };
  return map[code] || "Something went wrong. Please try again.";
}