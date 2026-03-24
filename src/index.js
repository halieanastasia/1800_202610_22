import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "../styles/style.css";
import "./navbar.js";

const eventForm = document.getElementById('event-form');

eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const eventData = {
        restaurantName: document.getElementById('rest-name').value,
        description: document.getElementById('event-desc').value,
        time: document.getElementById('event-time').value,
        capacity: Number(document.getElementById('capacity').value),
        parking: document.getElementById('parking').value,
        isKidsFriendly: document.getElementById('kids-friendly').checked,
        createdAt: new Date()
    };

    try {
        const docRef = await addDoc(collection(db, "events"), eventData);

        console.log("Document written with ID: ", docRef.id);
        alert("Event saved successfully!");

        eventForm.reset();
        const modalElement = document.getElementById('eventModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();

    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error saving event. Check console.");
    }
});