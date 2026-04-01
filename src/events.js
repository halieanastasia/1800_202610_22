import { db } from "./firebase.js";
import { collection, getDocs } from "firebase/firestore";

async function loadAllEvents() {
  const container = document.getElementById("results-list");
  if (!container) return;

  container.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "events"));

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const div = document.createElement("div");
      div.className = "event-card";

      div.innerHTML = `
        <h3>${data.name || "Untitled Event"}</h3>
        <p><strong>Description:</strong> ${data.description || "N/A"}</p>
        <p><strong>Address:</strong> ${data.address || "N/A"}</p>
        <p><strong>City:</strong> ${data.city || "N/A"}</p>
        <p><strong>Tags:</strong> ${(data.tags || []).join(", ") || "N/A"}</p>

        <div class="event-actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading all events:", error);
    container.innerHTML = "<p>Failed to load events.</p>";
  }
}

loadAllEvents();