import { db, auth } from "./firebase.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

//  Protect page
onAuthStateChanged(auth, (user) => {
    if (!user) {window.location.href = "login-halie.html";
    }
});

document.getElementById("eventForm").addEventListener("submit", async (e) => {
    e.preventDefault();


    await addDoc(collection(db, "events"), {
        name: document.getElementById("name").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        tags: document.getElementById("tags").value.split(","),
        description: document.getElementById("description").value,
        createdBy: user.uid,
        createdAt: serverTimestamp()
    });

    alert("Event created!");
    window.location.href = "index.html";
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login-halie.html";
        return;
    }

    document.getElementById("eventForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        await addDoc(collection(db, "events"), {
            name: document.getElementById("name").value,
            address: document.getElementById("address").value,
            city: document.getElementById("city").value,
            tags: document.getElementById("tags").value.split(","),
            description: document.getElementById("description").value,
            createdBy: user.uid,
            createdAt: serverTimestamp()
        });

        alert("Event created!");
        window.location.href = "index.html";
    });
});