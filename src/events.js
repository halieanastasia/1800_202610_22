import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadAllEvents() {
  const container = document.getElementById("results-list"); // hoặc div bạn dùng
  if (!container) return;

  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "events"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "event-card";

    div.innerHTML = `
  <h3>${data.name}</h3>
  <p><strong>Description:</strong> ${data.description || "N/A"}</p>
  <p><strong>Address:</strong> ${data.address || "N/A"}</p>
  <p><strong>City:</strong> ${data.city || "N/A"}</p>
  <p><strong>Tags:</strong> ${(data.tags || []).join(", ")}</p>

  <div class="event-actions">
    <button class="edit-btn">Edit</button>
    <button class="delete-btn">Delete</button>
  </div>
`;

    container.appendChild(div);
  });
}

loadAllEvents();