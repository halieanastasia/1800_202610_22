import { db } from "./firebase.js";
import { collection, addDoc, getDocs, serverTimestamp }
    from "firebase/firestore";

redirectBtn.addEventListener('click', () => {
    // window.location.href changes the current URL of the browser
    window.location.href = 'restaurant-skeleton.html';
});

// Helper function to add sample restaurant documents
function addRestaurantData() {
    const restoRef = collection(db, "restaurants");
    console.log("Adding sample restaurant data...");

    const sampleRestaurants = [
        {
            name: "Nightingale",
            description: "Chef David Hawksworth's informal restaurant/bar serving modern Canadian fare & classic cocktails.",
            rating: 4.5,
            operation_hours: { open: "11:30 AM", close: "11:00 PM" },
            city: "Vancouver",
            last_updated: serverTimestamp()
        },
        {
            name: "Chambar Restaurant",
            description: "Chic exposed-brick space serving creative Belgian cuisine & sustainable seafood, plus beer & wine.",
            rating: 4.5,
            operation_hours: { open: "4:30 PM", close: "11:30 PM" },
            city: "Vancouver",
            last_updated: serverTimestamp()
        },
        {
            name: "Trattoria by Italian Kitchen",
            description: "Lively Italian restaurant in Burnaby, offering handmade pasta, wood-fired pizza, and authentic Italian cuisine made with fresh, local ingredients.",
            rating: 4.7,
            operation_hours: { open: "11:30 AM", close: "11:00 PM" },
            city: "Burnaby",
            last_updated: serverTimestamp()
        }
    ];

    sampleRestaurants.forEach((resto) => {
        addDoc(restoRef, resto)
            .then(() => console.log(`Added: ${resto.name}`))
            .catch((error) => console.error("Error adding document: ", error));
    });
}

// Seeds the "restaurants" collection if it's empty
export function seedRestaurants() {
    const restoRef = collection(db, "restaurants");

    getDocs(restoRef)
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.log("Restaurant collection is empty. Seeding...");
                addRestaurantData();
            } else {
                console.log("Restaurant data already exists. Skipping seed.");
            }
        })
        .catch((error) => {
            console.error("Error accessing Firestore:", error);
        });
}

// restaurants.js

