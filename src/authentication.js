// -------------------------------------------------------------
// src/authentication.js
// -------------------------------------------------------------
// Provides all Firebase Authentication logic for the app.
// Exports functions for login, signup, logout, profile/email/password updates,
// auth state monitoring, and user-friendly error messages.
// -------------------------------------------------------------

import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword, // For Login
  createUserWithEmailAndPassword, // For Signup
  updateProfile, // For Name
  updateEmail, // For Email
  updatePassword, // For Password
  onAuthStateChanged, // For Auth state
  signOut, // For Logout
} from "firebase/auth";

// Export auth so account.js can use it
export { auth };

// --- Use email & password to authenticate user ---
export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// --- Create firebase usere with provided credentials ---
export async function signupUser(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  // Update the user's profile with the display name
  await updateProfile(user, { displayName: name });
  return user;
}

// --- Log out user ---
export function logoutUser() {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((err) => console.error(err));
}

// --- Change user display name ---
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

// --- Change user email ---
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

// --- Change user password ---
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

// --- Delay callback until auth resolves ---
export function onAuthReady(callback) {
  onAuthStateChanged(auth, (user) => callback(user));
}

// --- Maps Firebase error codes to user-friendly messages ---
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

// --- Redirect to login if auth fails ---
export function requireAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "./login-halie.html";
    }
  });
}
