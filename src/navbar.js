// -------------------------------------------------------------
// src/navbar.js
// -------------------------------------------------------------
// Builds and injects the bottom navigation bar into every page.
// Highlights the active nav item based on the current URL, and
// routes the account button to either the account or login page
// depending on whether the user is logged in.
// -------------------------------------------------------------

import { getCurrentUser, authReady } from "./firebase.js";

// Determines which nav item should be marked active based on the current page URL.
function getActivePage() {
  const path = window.location.pathname.toLowerCase();

  if (
    path.endsWith("/index.html") ||
    path.endsWith("/map.html") ||
    path === "/" ||
    path.endsWith("/")
  ) {
    return "map";
  }

  if (
    path.endsWith("/event.html") ||
    path.endsWith("/create-event.html") ||
    path.endsWith("/manage-event.html") ||
    path.endsWith("/edit-event.html")
  ) {
    return "events";
  }

  if (
    path.endsWith("/account.html") ||
    path.endsWith("/login-halie.html") ||
    path.endsWith("/login.html") ||
    path.endsWith("/signup.html")
  ) {
    return "account";
  }

  return "";
}

// Builds and returns the bottom navigation bar HTML string.
// Marks the active page and adjusts the account button label based on login state.
function renderNavbar(isLoggedIn) {
  const activePage = getActivePage();

  return `
    <nav class="bottom-navbar" aria-label="Bottom navigation">
      <ul class="menu bottom-menu">
        <li>
          <a href="./index.html" class="nav-items ${activePage === "map" ? "active" : ""}" aria-label="Map">
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" class="nav-svg">
                <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M9 4v14M15 6v14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </span>
            <span>Map</span>
          </a>
        </li>

        <li>
          <a href="./event.html" class="nav-items ${activePage === "events" ? "active" : ""}" aria-label="Events">
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" class="nav-svg">
                <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
                <path d="M8 3v4M16 3v4M3 10h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
            <span>Events</span>
          </a>
        </li>

        <li>
          <button
            type="button"
            id="menu-account-button"
            class="nav-items nav-button-reset ${activePage === "account" ? "active" : ""}"
            aria-label="${isLoggedIn ? "Account" : "Login"}"
          >
            <span class="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" class="nav-svg">
                <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/>
                <path d="M4 20c1.8-3.6 5-5 8-5s6.2 1.4 8 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </span>
            <span>${isLoggedIn ? "Account" : "Login"}</span>
          </button>
        </li>
      </ul>
    </nav>
  `;
}

// Inserts the rendered navbar into the DOM after auth state is resolved.
async function loadNavbar() {
  document.querySelectorAll("site-navbar").forEach((el) => el.remove());

  let holder = document.getElementById("navbar-placeholder");

  if (!holder) {
    holder = document.createElement("div");
    holder.id = "navbar-placeholder";
    document.body.appendChild(holder);
  }

  await authReady;
  const currentUser = getCurrentUser();

  holder.innerHTML = renderNavbar(!!currentUser);

  document
    .getElementById("menu-account-button")
    ?.addEventListener("click", accountButton);
}

document.addEventListener("DOMContentLoaded", loadNavbar);

async function accountButton() {
  await authReady;
  const currentUser = getCurrentUser();

  if (currentUser) {
    window.location.href = "./account.html";
  } else {
    window.location.href = "./login-halie.html";
  }
}
