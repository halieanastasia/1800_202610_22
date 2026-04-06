import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import maplibregl from "maplibre-gl";

// --- Global variables ---
let formMap;
let selectedMarker = null;
let selectedLngLat = null;
let selectedAddress = null;
let editingDocId = null;

const eventForm = document.getElementById("event-form");

// --- Map Initialization ---
function initFormMap() {
  formMap = new maplibregl.Map({
    container: "formMap",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.00163752324765, 49.25324576104826],
    zoom: 10,
  });
  formMap.addControl(new maplibregl.NavigationControl(), "top-right");
}

initFormMap();

// --- UI & Tab Listeners ---

// Fix Map size when switching to "Create Event" tab
document.getElementById("create-tab").addEventListener("shown.bs.tab", () => {
  if (formMap) formMap.resize();
});

document
  .getElementById("my-tab")
  .addEventListener("shown.bs.tab", () => fetchEvents(true));
document
  .getElementById("all-tab")
  .addEventListener("shown.bs.tab", () => fetchEvents(false));

document.getElementsByName("isStreaming").forEach((radio) => {
  radio.addEventListener("change", (e) => {
    const matchSection = document.getElementById("match-section");
    if (e.target.value === "true") {
      matchSection.classList.remove("d-none");
    } else {
      matchSection.classList.add("d-none");
      document.getElementById("fifa-match").value = "";
    }
  });
});

// --- Geocoder & Marker Logic ---
window.addEventListener("DOMContentLoaded", () => {
  addAddressSearch();
});

function addAddressSearch() {
  const geocoderApi = {
    forwardGeocode: async (config) => {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(config.query)}&format=geojson&limit=5`;

      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "FIFA-Project-Search" },
        });
        const geojson = await response.json();

        // DEBUG: Look at your console to see if results are coming back
        console.log("Search results found:", geojson.features.length);

        return {
          features: geojson.features.map((f) => ({
            type: "Feature",
            geometry: f.geometry,
            place_name: f.properties.display_name,
            center: f.geometry.coordinates,
            properties: f.properties,
          })),
        };
      } catch (err) {
        console.error("Search failed:", err);
        return { features: [] };
      }
    },
  };

  const geocoder = new MaplibreGeocoder(geocoderApi, {
    maplibregl: maplibregl,
    placeholder: "Search for a bar or restaurant...",
    minLength: 2, // Starts searching after 2 characters
    showResultsWhileTyping: true,
    popup: false, // Set to false to keep results in the list format
    trackProximity: true, // Helps find local results
  });

  document.getElementById("addressSearch").appendChild(geocoder.onAdd());

  geocoder.on("result", (e) => {
    const [lng, lat] = e.result.center;
    selectedLngLat = [lng, lat];
    selectedAddress = e.result.place_name;
    document.getElementById("address").value = selectedAddress;
    setSelectedLocation(lng, lat);
  });
}

function setSelectedLocation(lng, lat) {
  if (selectedMarker) selectedMarker.setLngLat([lng, lat]);
  else
    selectedMarker = new maplibregl.Marker()
      .setLngLat([lng, lat])
      .addTo(formMap);
  formMap.flyTo({ center: [lng, lat], zoom: 15 });
}

// --- Delete & Edit Functions ---
async function deleteEvent(id) {
  if (confirm("Are you sure you want to delete this event?")) {
    try {
      await deleteDoc(doc(db, "events", id));
      alert("Event deleted.");
      fetchEvents(true);
    } catch (error) {
      console.error("Delete Error:", error);
    }
  }
}

/**
 * This function fills the form and switches the tab
 */
function startEdit(id, data) {
  editingDocId = id;

  // Fill Form Fields
  document.getElementById("event-name").value = data.name || "";
  document.getElementById("event-desc").value = data.description || "";
  document.getElementById("event-time").value = data.time || "";
  document.getElementById("kids-friendly").checked =
    data.isKidsFriendly || false;
  document.getElementById("pet-friendly").checked = data.isPetFriendly || false;

  // FIFA Toggle
  if (data.isStreaming) {
    document.getElementById("stream-yes").checked = true;
    document.getElementById("match-section").classList.remove("d-none");
    document.getElementById("fifa-match").value = data.matchName || "";
  } else {
    document.getElementById("stream-no").checked = true;
    document.getElementById("match-section").classList.add("d-none");
  }

  // Map Data
  selectedAddress = data.address;
  document.getElementById("address").value = data.address || "";
  selectedLngLat = [data.location.lng, data.location.lat];
  setSelectedLocation(data.location.lng, data.location.lat);

  // Update Button Style
  const submitBtn = eventForm.querySelector('button[type="submit"]');
  submitBtn.textContent = "Update Event";
  submitBtn.classList.replace("btn-success", "btn-primary");

  // SWITCH TO CREATE TAB
  const createTabTrigger = document.getElementById("create-tab");
  document.getElementById("create-tab").addEventListener("shown.bs.tab", () => {
    if (formMap) {
      formMap.resize();
      // Force the geocoder to update its internal size
      const geocoderInput = document.querySelector(".maplibregl-ctrl-geocoder");
      if (geocoderInput) {
        geocoderInput.style.width = "100%";
      }
    }
  });
  const tabInstance =
    window.bootstrap.Tab.getOrCreateInstance(createTabTrigger);
  tabInstance.show();

  // Scroll to top of form
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- Form Submission ---

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in first!");
    return;
  }
  if (!selectedLngLat) {
    alert("Please select a location.");
    return;
  }

  const isStreaming = document.getElementById("stream-yes").checked;
  const combinedData = {
    owner: user.uid,
    name: document.getElementById("event-name").value,
    description: document.getElementById("event-desc").value,
    time: document.getElementById("event-time").value,
    isKidsFriendly: document.getElementById("kids-friendly").checked,
    isPetFriendly: document.getElementById("pet-friendly").checked,
    isStreaming: isStreaming,
    matchName: isStreaming
      ? document.getElementById("fifa-match").value
      : "N/A",
    address: selectedAddress,
    location: { lat: selectedLngLat[1], lng: selectedLngLat[0] },
    last_updated: serverTimestamp(),
  };

  try {
    if (editingDocId) {
      await updateDoc(doc(db, "events", editingDocId), combinedData);
      alert("Event updated successfully!");
      editingDocId = null;
      const btn = eventForm.querySelector('button[type="submit"]');
      btn.textContent = "Save Event";
      btn.classList.replace("btn-primary", "btn-success");
    } else {
      await addDoc(collection(db, "events"), combinedData);
      alert("Event saved!");
    }

    eventForm.reset();
    document.getElementById("match-section").classList.add("d-none");
    if (selectedMarker) {
      selectedMarker.remove();
      selectedMarker = null;
    }
    selectedLngLat = null;

    window.bootstrap.Tab.getOrCreateInstance(
      document.getElementById("all-tab"),
    ).show();
    fetchEvents(false);
  } catch (error) {
    console.error("Save Error:", error);
  }
});

// --- Data Display ---

async function fetchEvents(filterByUser = false) {
  const containerId = filterByUser ? "my-results-list" : "results-list";
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>`;

  try {
    let q;
    const eventsRef = collection(db, "events");

    if (filterByUser) {
      const user = auth.currentUser;
      if (!user) {
        container.innerHTML = "Login to manage events.";
        return;
      }
      q = query(
        eventsRef,
        where("owner", "==", user.uid),
        orderBy("time", "asc"),
      );
    } else {
      q = query(eventsRef, orderBy("time", "asc"));
    }

    const snapshot = await getDocs(q);
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p class='text-muted'>No events found.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;
      const div = document.createElement("div");
      div.className = "event-card mb-3 p-3 border rounded shadow-sm bg-white";

      const badge =
        data.isStreaming && data.matchName !== "N/A"
          ? `<span class="badge bg-danger mb-2">FIFA: ${data.matchName}</span>`
          : '<span class="badge bg-secondary mb-2">Regular Stream</span>';

      div.innerHTML = `
        ${badge}
        <h2 class="h4 mb-1 fw-bold text-dark">${data.name || "Untitled"}</h2>
        <p class="mb-1 text-primary small"><strong>🕒 ${data.time || "Time TBD"}</strong></p>
        <p class="mb-2 text-muted">${data.description || ""}</p>
        <div class="mb-2">
          ${data.isKidsFriendly ? '<span class="badge bg-light text-dark border me-1">Kids OK</span>' : ""}
          ${data.isPetFriendly ? '<span class="badge bg-light text-dark border">Pets OK</span>' : ""}
        </div>
        <small class="text-muted d-block border-top pt-2 mt-2">${data.address || "Address TBD"}</small>
      `;

      if (filterByUser) {
        const actionDiv = document.createElement("div");
        actionDiv.className = "mt-3 pt-2 border-top d-flex gap-2";

        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-sm btn-outline-primary";
        editBtn.textContent = "Edit";
        editBtn.onclick = (e) => {
          e.stopPropagation();
          startEdit(docId, data);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-outline-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          deleteEvent(docId);
        };

        actionDiv.appendChild(editBtn);
        actionDiv.appendChild(deleteBtn);
        div.appendChild(actionDiv);
      }

      container.appendChild(div);
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    container.innerHTML =
      "<p class='text-danger'>Check Firestore Index link in console.</p>";
  }
}

fetchEvents(false);
