import { db, auth } from "./firebase.js";
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function loadMyEvents(user) {
    const container = document.getElementById("my-events");
    container.innerHTML = "";

    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

    getDocs(q).then((snapshot) => {

        let hasEvent = false;

        snapshot.forEach((d) => {
            const data = d.data();

            if (data.createdBy === user.uid) {
                hasEvent = true;
                const card = createEventCard(d.id, data);
                container.appendChild(card);
            }
        });

        if (!hasEvent) {
            container.innerHTML = "<p>You have not created any events yet.</p>";
        }
    });

};


function createEventCard(id, data) {
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
    
    // Delete
    div.querySelector(".delete-btn").addEventListener("click", async () => {
        await deleteDoc(doc(db, "events", id));
        div.remove();
    });

    // Edit
    div.querySelector(".edit-btn").addEventListener("click", () => {
        window.location.href = `edit-event.html?id=${id}`;
    });

    return div;
}