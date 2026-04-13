import {
  auth,
  onAuthReady,
  logoutUser,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
} from "./authentication.js";

// --- DOM Elements ---
const nameSpan = document.getElementById("name-goes-here");
const emailInput = document.getElementById("acc-email");
const securitySection = document.getElementById("security-section");

const editProfileBtn = document.getElementById("edit-profile-btn");
const logoutBtn = document.getElementById("logout-button");

// --- Global State ---
let isEditing = false;

function initAccount() {
  onAuthReady((user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    // Set initial display values
    nameSpan.textContent = user.displayName || "friend";
    if (emailInput) {
      emailInput.value = user.email;
    }
  });
}

async function handleEditToggle() {
  const user = auth.currentUser;
  if (!user) return;

  if (!isEditing) {
    isEditing = true;

    if (securitySection) {
      securitySection.classList.remove("d-none");
    }

    const currentName = nameSpan.textContent;
    nameSpan.innerHTML = `
  <input type="text" id="name-input" 
         class="form-control d-block w-100 mx-auto" 
         value="${currentName}" 
         style="text-align: center; font-size: 1.5rem; font-weight: bold; max-width: 300px;">
`;

    editProfileBtn.textContent = "Save Changes";
    editProfileBtn.classList.replace("btn-success", "btn-success");
  } else {
    const nameInput = document.getElementById("name-input");
    const newName = nameInput ? nameInput.value.trim() : "";

    if (newName && newName !== user.displayName) {
      editProfileBtn.disabled = true;
      editProfileBtn.textContent = "Saving...";

      const result = await updateUserProfile(newName);
      if (result.success) {
        nameSpan.textContent = newName;
      } else {
        alert("Failed to update name.");
        nameSpan.textContent = user.displayName || "friend";
      }
    } else {
      nameSpan.textContent = user.displayName || "friend";
    }

    // Hide the Email/Password section again
    if (securitySection) {
      securitySection.classList.add("d-none");
    }

    // 3. Reset Button UI
    editProfileBtn.disabled = false;
    editProfileBtn.textContent = "Edit Profile";
    editProfileBtn.classList.replace("btn-success", "btn-success");
    isEditing = false;
  }
}

// Handle Email Change
const editEmailBtn = document.getElementById("edit-email-btn");
if (editEmailBtn) {
  editEmailBtn.addEventListener("click", async () => {
    const newEmail = prompt("Enter your new email address:");
    if (newEmail && newEmail.includes("@")) {
      const res = await updateUserEmail(newEmail);
      if (res.success) {
        alert("Email updated! Please log in again with your new email.");
        logoutUser();
      } else if (res.error === "auth/requires-recent-login") {
        alert(
          "For security, please log out and back in before changing your email.",
        );
      } else {
        alert("Error: " + res.error);
      }
    }
  });
}

// Handle Password Change
const passBtn = document.getElementById("edit-pass-btn");
if (passBtn) {
  passBtn.addEventListener("click", async () => {
    const newPass = prompt("Enter your new password (min 6 characters):");
    if (newPass && newPass.length >= 6) {
      const res = await updateUserPassword(newPass);
      if (res.success) alert("Password updated successfully!");
      else alert("Error: " + res.error);
    } else if (newPass) {
      alert("Password must be at least 6 characters.");
    }
  });
}

/**
 * Event Listeners
 */
if (editProfileBtn) {
  editProfileBtn.addEventListener("click", handleEditToggle);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to log out?")) {
      logoutUser();
    }
  });
}

// Run on load
initAccount();
requireAuth();
