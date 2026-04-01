import { db, auth } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const form = document.getElementById("eventForm");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "./login-halie.html";
    return;
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const address = document.getElementById("address")?.value.trim();
    const city = document.getElementById("city")?.value.trim();
    const tags = (document.getElementById("tags")?.value || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const description = document.getElementById("description")?.value.trim();

    try {
      await addDoc(collection(db, "events"), {
        name,
        address,
        city,
        tags,
        description,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      alert("Event created successfully.");
      window.location.href = "./manage-event.html";
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event.");
    }
  });
});