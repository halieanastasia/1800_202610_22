import { db } from "./firebase.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const nameInput = document.getElementById("name");
const descInput = document.getElementById("description");

// Load data
async function loadEvent() {
  const docRef = doc(db, "events", id);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const data = snap.data();
    nameInput.value = data.name;
    descInput.value = data.description || "";
  }
}

loadEvent();

// Update
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await updateDoc(doc(db, "events", id), {
    name: nameInput.value,
    description: descInput.value
  });

  alert("Updated!");
  window.location.href = "account.html";
});