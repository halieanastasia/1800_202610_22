import { db, auth } from "./firebase.js";
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function createEventCard(id, data) {
    const div = document.createElement("div");
    div.className = "event-card";

    div.innerHTML = `
    <h3>${data.name || "Untitled Event"}</h3>
    <p><strong>Description:</strong> ${data.description || "N/A"}</p>
    <p><strong>Address:</strong> ${data.address || "N/A"}</p>
    <p><strong>City:</strong> ${data.city || "N/A"}</p>
    <p><strong>Tags:</strong> ${Array.isArray(data.tags) && data.tags.length > 0
            ? data.tags.join(", ")
            : "N/A"
        }</p>

    <div class="event-actions">
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;

    div.querySelector(".edit-btn").addEventListener("click", () => {
        window.location.href = `./edit-event.html?id=${id}`;
    });

    div.querySelector(".delete-btn").addEventListener("click", async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this event?",
        );
        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, "events", id));
            div.remove();
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event.");
        }
    });

    return div;
}

async function loadMyEvents(user) {
    const container = document.getElementById("my-events");
    if (!container) return;

    container.innerHTML = "";

    try {
        const snapshot = await getDocs(collection(db, "events"));

        let hasEvent = false;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            if (data.createdBy === user.uid) {
                hasEvent = true;
                container.appendChild(createEventCard(docSnap.id, data));
            }
        });

        if (!hasEvent) {
            container.innerHTML = "<p>You have not created any events yet.</p>";
        }
    } catch (error) {
        console.error("Error loading events:", error);
        container.innerHTML = "<p>Failed to load events.</p>";
    }
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "./login-halie.html";
        return;
    }

    loadMyEvents(user);
});