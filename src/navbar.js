// import { onAuthReady } from "./authentication.js";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "/src/firebase.js";
import { getCurrentUser, authReady } from "./firebase";

async function loadNavbar() {
  const holder = document.getElementById("navbar-placeholder");
  if (!holder) return;

  const res = await fetch("./components/navbar.html");
  holder.innerHTML = await res.text();

  document
    .getElementById("menu-account-button")
    .addEventListener("click", accountButton);
}

document.addEventListener("DOMContentLoaded", loadNavbar);

async function accountButton() {
  //If the user is logged in navigate to account page
  //else navigate to the login page
  // if(){
  // }

  // if (auth.currentUser) {
  //   console.log("Logged in");
  // } else {
  //   console.log("Logged out");
  // }
  // console.log("working");
  // // onAuthReady((user) => {});

  // onAuthStateChanged(auth, (user) => {
  //   if (user) {
  //     console.log("Logged in:", user.email);
  //     alert("Logged in:", user.email);
  //     // update navbar for logged-in state
  //   } else {
  //     console.log("Logged out");
  //     alert("Logged out");
  //     // update navbar for logged-out state
  //   }
  // });

  // wait for Firebase before reading auth state
  await authReady;
  const currentUser = getCurrentUser();

  if (currentUser) {
    window.location.href = "./account.html";
  } else {
    window.location.href = "./login-halie.html";
  }

  // if (currentUser) {
  //   alert("User is logged in: " + currentUser.email);
  //   console.log("Full user object:", currentUser);
  // } else {
  //   console.log("You are not logged in.");
  // }
}
