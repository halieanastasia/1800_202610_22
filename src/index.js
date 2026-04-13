import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
import "./navbar.js";
import "../styles/style.css";


const eventForm = document.getElementById('event-form');

if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Submit clicked! Starting Firestore upload...");

        // Gather data from your specific IDs
        const formData = {
            restaurantName: document.getElementById('rest-name').value,
            description: document.getElementById('event-desc').value,
            time: document.getElementById('event-time').value,
            capacity: Number(document.getElementById('capacity').value) || 0,
            parking: document.getElementById('parking').value,
            isKidsFriendly: document.getElementById('kids-friendly').checked,
            submittedAt: serverTimestamp()
        };

        try {
            const docRef = await addDoc(collection(db, "events"), formData);

            console.log("Document successfully written with ID: ", docRef.id);
            alert("Success! Event added to Firestore.");

            eventForm.reset();
            const modalElement = document.getElementById('eventModal');
            const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
            modal.hide();


        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Error! Check the browser console for details.");
        }
    });
}