import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const form = document.getElementById("restaurantForm");
const toast = document.getElementById("success-toast");

function normalizeTags(tagText) {
  if (!tagText) return [];

  return tagText
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const address = document.getElementById("address")?.value.trim();
    const city = document.getElementById("city")?.value.trim();
    const event = document.getElementById("event")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const tags = normalizeTags(document.getElementById("tags")?.value.trim());
    const capacity = Number(document.getElementById("capacity")?.value);
    const description = document.getElementById("description")?.value.trim();

    try {
      await addDoc(collection(db, "restaurants"), {
        name,
        address,
        city,
        event,
        phone,
        tags,
        capacity,
        description,
        createdAt: serverTimestamp(),
      });

      if (toast) {
        toast.classList.add("show");

        setTimeout(() => {
          toast.style.opacity = "0";

          setTimeout(() => {
            toast.classList.remove("show");
            toast.style.opacity = "";
            window.location.href = "./map.html";
          }, 600);
        }, 2000);
      } else {
        window.location.href = "./map.html";
      }
    } catch (error) {
      console.error("Error adding location:", error);
      alert("Failed to save the restaurant.");
    }
  });
}