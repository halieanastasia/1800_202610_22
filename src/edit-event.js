import { db } from "./firebase.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const nameInput = document.getElementById("name");
const descInput = document.getElementById("description");

async function loadEvent() {
  if (!id) {
    alert("Missing event ID.");
    window.location.href = "./manage-events.html";
    return;
  }

  try {
    const docRef = doc(db, "events", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      alert("Event not found.");
      window.location.href = "./manage-events.html";
      return;
    }

    const data = snap.data();
    nameInput.value = data.name || "";
    descInput.value = data.description || "";
  } catch (error) {
    console.error("Error loading event:", error);
    alert("Failed to load event.");
  }
}

loadEvent();

document.getElementById("editForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await updateDoc(doc(db, "events", id), {
      name: nameInput.value.trim(),
      description: descInput.value.trim(),
    });

    alert("Updated!");
    window.location.href = "./manage-events.html";
  } catch (error) {
    console.error("Error updating event:", error);
    alert("Failed to update event.");
  }
});