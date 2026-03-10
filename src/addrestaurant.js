import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById("restaurantForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const address = document.getElementById("address").value;
    const city = document.getElementById("city").value;
    const event = document.getElementById("event").value;
    const capacity = document.getElementById("capacity").value;
    const description = document.getElementById("description").value;

    try {

        await addDoc(collection(db, "restaurants"), {
            name: name,
            address: address,
            city: city,
            event: event,
            capacity: capacity,
            description: description,
            createdAt: new Date()
        });

        alert("Location added successfully!");

    } catch (error) {
        console.error("Error adding location:", error);
    }

});


const form = document.getElementById('restaurantForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // collect the data
  // save to Firebase / Firestore
  // Show toast
  const toast = document.getElementById('success-toast');
  toast.classList.add('show');

  // Hide toast and redirect after 2.5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    
    // Redirect to index.html
    window.location.href = 'index.html';
  }, 2500);   // 2.5 seconds for visible time
});

setTimeout(() => {
  toast.style.opacity = '0';   // start fade out

  setTimeout(() => {
    toast.classList.remove('show');
    window.location.href = 'index.html';
  }, 600);   // wait for fade to finish
}, 2000);    // show for 2 seconds, then fade then redirect