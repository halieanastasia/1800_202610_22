import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Optional seed data helper for development
async function addRestaurantData() {
  const restoRef = collection(db, "restaurants");

  const sampleRestaurants = [
    {
      name: "The Sports Bar",
      description: "A lively sports bar to watch FIFA with friends.",
      atmosphere: "Energetic and casual",
      tags: ["sports bar", "pub", "large screen"],
      price: "$$",
      address: "Vancouver, BC",
      city: "Vancouver",
      website: "https://example.com",
      operation_hours: { open: "11:00 AM", close: "11:00 PM" },
      location: { latitude: 49.2827, longitude: -123.1207 },
      last_updated: serverTimestamp(),
    },
  ];

  for (const restaurant of sampleRestaurants) {
    await addDoc(restoRef, restaurant);
  }
}

// Seed only if collection is empty
export async function seedRestaurants() {
  const restoRef = collection(db, "restaurants");

  try {
    const querySnapshot = await getDocs(restoRef);

    if (querySnapshot.empty) {
      console.log("Restaurant collection is empty. Seeding...");
      await addRestaurantData();
    } else {
      console.log("Restaurant data already exists. Skipping seed.");
    }
  } catch (error) {
    console.error("Error accessing Firestore:", error);
  }
}

// Convert tags to readable text
function normalizeTags(tags) {
  if (!tags) return "No tags available.";
  if (Array.isArray(tags)) return tags.join(", ");
  return String(tags);
}

// Convert hours to readable text
function getOperatingHoursText(hours) {
  if (!hours) return "No hours available.";
  if (typeof hours === "string") return hours;

  if (hours.open || hours.close) {
    return `${hours.open || "?"} - ${hours.close || "?"}`;
  }

  return "No hours available.";
}

// Fill restaurant detail page
function populateRestaurantPage(restaurantData) {
  const nameElement = document.getElementById("restaurant-name");
  const descriptionElement = document.getElementById("restaurant-description");
  const atmosphereElement = document.getElementById("restaurant-atmosphere");
  const tagsElement = document.getElementById("restaurant-tags");
  const addressElement = document.getElementById("restaurant-address");
  const websiteElement = document.getElementById("restaurant-website");
  const hoursElement = document.getElementById("restaurant-hours");
  const priceElement = document.getElementById("restaurant-price");
  const imageElement = document.getElementById("restaurant-image");

  if (!nameElement) return;

  nameElement.textContent = restaurantData.name || "Restaurant Name";
  descriptionElement.textContent =
    restaurantData.description || "No description available.";
  atmosphereElement.textContent =
    restaurantData.atmosphere || "No atmosphere information available.";
  tagsElement.textContent = normalizeTags(
    restaurantData.tags || restaurantData.tagsArray,
  );
  addressElement.textContent =
    restaurantData.address || restaurantData.city || "Address not available.";
  hoursElement.textContent = getOperatingHoursText(
    restaurantData.operation_hours || restaurantData.operatingHours,
  );
  priceElement.textContent = restaurantData.price || "$$";

  if (restaurantData.website) {
    websiteElement.href = restaurantData.website;
    websiteElement.textContent = restaurantData.website;
  } else {
    websiteElement.removeAttribute("href");
    websiteElement.textContent = "Not available";
  }

  if (restaurantData.photoURL) {
    imageElement.src = restaurantData.photoURL;
  }
}

// Fallback if localStorage is empty
async function getFallbackRestaurant() {
  const snapshot = await getDocs(collection(db, "restaurants"));
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

// Page init
async function displayRestaurant() {
  try {
    const storedRestaurant = localStorage.getItem("selectedRestaurant");

    if (storedRestaurant) {
      populateRestaurantPage(JSON.parse(storedRestaurant));
      return;
    }

    const fallbackRestaurant = await getFallbackRestaurant();

    if (fallbackRestaurant) {
      populateRestaurantPage(fallbackRestaurant);
      return;
    }

    populateRestaurantPage({
      name: "No restaurant found",
      description: "No data available.",
      atmosphere: "No data available.",
      tags: "No data available.",
      address: "No data available.",
      price: "$",
    });
  } catch (error) {
    console.error("Error loading restaurant data:", error);
  }
}

document.addEventListener("DOMContentLoaded", displayRestaurant);