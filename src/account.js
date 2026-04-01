import { logoutUser } from "./authentication";

function logoutUserButton() {
  logoutUser();
}

document
  .getElementById("logout-button")
  .addEventListener("click", logoutUserButton);
