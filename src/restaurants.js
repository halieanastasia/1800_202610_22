import { db } from "./firebase.js";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

function addRestaurantData() {
  const restoRef = collection(db, "restaurants");

  const sampleRestaurants = [
    {
      name: "Nightingale",
      description:
        "Chef David Hawksworth's informal restaurant and bar serving modern Canadian fare and classic cocktails.",
      atmosphere: "Modern, lively, and stylish.",
      tags: "Canadian, Cocktails, Downtown",
      price: "$$$",
      city: "Vancouver",
      rating: 4.5,
      operation_hours: { open: "11:30 AM", close: "11:00 PM" },
      last_updated: serverTimestamp()
    },
    {
      name: "Chambar Restaurant",
      description:
        "Chic exposed-brick space serving creative Belgian cuisine and sustainable seafood, plus beer and wine.",
      atmosphere: "Warm, elegant, and energetic.",
      tags: "Belgian, Seafood, Wine",
      price: "$$$",
      city: "Vancouver",
      rating: 4.5,
      operation_hours: { open: "4:30 PM", close: "11:30 PM" },
      last_updated: serverTimestamp()
    },
    {
      name: "Trattoria by Italian Kitchen",
      description:
        "Lively Italian restaurant in Burnaby offering handmade pasta, wood-fired pizza, and authentic Italian cuisine.",
      atmosphere: "Casual, cozy, and family-friendly.",
      tags: "Italian, Pasta, Pizza",
      price: "$$",
      city: "Burnaby",
      rating: 4.7,
      operation_hours: { open: "11:30 AM", close: "11:00 PM" },
      last_updated: serverTimestamp()
    }
  ];

  sampleRestaurants.forEach((resto) => {
    addDoc(restoRef, resto)
      .then(() => console.log(`Added: ${resto.name}`))
      .catch((error) => console.error("Error adding document: ", error));
  });
}

export async function seedRestaurants() {
  const restoRef = collection(db, "restaurants");

  try {
    const querySnapshot = await getDocs(restoRef);

    if (querySnapshot.empty) {
      console.log("Restaurant collection is empty. Seeding...");
      addRestaurantData();
    } else {
      console.log("Restaurant data already exists. Skipping seed.");
    }
  } catch (error) {
    console.error("Error accessing Firestore:", error);
  }
}

async function displayRestaurant() {
  const nameElement = document.getElementById("restaurant-name");
  const descriptionElement = document.getElementById("restaurant-description");
  const atmosphereElement = document.getElementById("restaurant-atmosphere");
  const tagsElement = document.getElementById("restaurant-tags");
  const priceElement = document.getElementById("restaurant-price");

  if (
    !nameElement ||
    !descriptionElement ||
    !atmosphereElement ||
    !tagsElement ||
    !priceElement
  ) {
    return;
  }

  try {
    const restoRef = collection(db, "restaurants");
    const querySnapshot = await getDocs(restoRef);

    if (querySnapshot.empty) {
      nameElement.textContent = "No restaurant found";
      descriptionElement.textContent = "No data available.";
      atmosphereElement.textContent = "No data available.";
      tagsElement.textContent = "No data available.";
      priceElement.textContent = "$";
      return;
    }

    const restaurantData = querySnapshot.docs[0].data();

    nameElement.textContent = restaurantData.name || "Restaurant Name";
    descriptionElement.textContent =
      restaurantData.description || "No description available.";
    atmosphereElement.textContent =
      restaurantData.atmosphere || "No atmosphere information available.";
    tagsElement.textContent = restaurantData.tags || "No tags available.";
    priceElement.textContent = restaurantData.price || "$$";
  } catch (error) {
    console.error("Error loading restaurant data:", error);
  }
}

document.addEventListener("DOMContentLoaded", displayRestaurant);