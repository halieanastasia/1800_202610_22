// -------------------------------------------------------------
// src/loginSignup.js
// -------------------------------------------------------------
// Manages the login and signup form UI on the login page (login-halie.html).
// Handles toggling between Login and Signup views, form validation,
// and redirects to the main page after successful authentication.
// This code was adapted from part of the COMP1800 Projects 1 Course (BCIT).
// Starter code that was provided for student use and adaptation.
// -------------------------------------------------------------

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "../styles/style.css";
import { loginUser, signupUser, authErrorMessage } from "./authentication.js";

function initAuthUI() {
  // --- DOM Elements ---
  const alertEl = document.getElementById("authAlert");
  const loginView = document.getElementById("loginView");
  const signupView = document.getElementById("signupView");
  const toSignupBtn = document.getElementById("toSignup");
  const toLoginBtn = document.getElementById("toLogin");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const redirectUrl = "index.html"; // Redirect target after successful login or signup

  // --- Helper Functions ---
  // Toggle element visibility
  function setVisible(el, visible) {
    el.classList.toggle("d-none", !visible);
  }

  // Show error message with accessibility and auto-hide
  let errorTimeout;
  function showError(msg) {
    alertEl.textContent = msg || "";
    alertEl.classList.remove("d-none");
    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(hideError, 5000); // Auto-hide after 5s
  }

  // Hide error message
  function hideError() {
    alertEl.classList.add("d-none");
    alertEl.textContent = "";
    clearTimeout(errorTimeout);
  }

  // Enable/disable submit button for forms
  function setSubmitDisabled(form, disabled) {
    const submitBtn = form?.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = disabled;
  }

  // --- Event Listeners ---
  // Toggle buttons
  toSignupBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    hideError();
    setVisible(loginView, false);
    setVisible(signupView, true);
    signupView?.querySelector("input")?.focus();
  });

  toLoginBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    hideError();
    setVisible(signupView, false);
    setVisible(loginView, true);
    loginView?.querySelector("input")?.focus();
  });

  // Login form submit
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    const email = document.querySelector("#loginEmail")?.value?.trim() ?? "";
    const password = document.querySelector("#loginPassword")?.value ?? "";
    if (!email || !password) {
      showError("Please enter your email and password.");
      return;
    }
    setSubmitDisabled(loginForm, true);
    try {
      await loginUser(email, password);
      location.href = redirectUrl;
    } catch (err) {
      showError(authErrorMessage(err));
      console.error(err);
    } finally {
      setSubmitDisabled(loginForm, false);
    }
  });

  // Signup form submit
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    const name = document.querySelector("#signupName")?.value?.trim() ?? "";
    const email = document.querySelector("#signupEmail")?.value?.trim() ?? "";
    const password = document.querySelector("#signupPassword")?.value ?? "";
    if (!name || !email || !password) {
      showError("Please fill in name, email, and password.");
      return;
    }
    setSubmitDisabled(signupForm, true);
    try {
      await signupUser(name, email, password);
      location.href = redirectUrl;
    } catch (err) {
      showError(authErrorMessage(err));
      console.error(err);
    } finally {
      setSubmitDisabled(signupForm, false);
    }
  });
}

// --- Initialize UI on DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", initAuthUI);
