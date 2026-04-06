import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";
import maplibregl from "maplibre-gl";

// --- Global variables ---
let formMap;
let selectedMarker = null;
let selectedLngLat = null;
let selectedAddress = null;
let editingDocId = null;

// --- Map Initialization ---
function initFormMap() {
  if (formMap) return;

  const container = document.getElementById("formMap");
  if (!container) {
    console.warn("Target container 'formMap' not found in DOM yet.");
    return;
  }

  formMap = new maplibregl.Map({
    container: "formMap",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.0016, 49.2532],
    zoom: 10
  });

  formMap.addControl(new maplibregl.NavigationControl(), "top-right");
}

// --- UI & Tab Listeners ---
const createTab = document.getElementById('create-tab');
if (createTab) {
  createTab.addEventListener('shown.bs.tab', () => {
    initFormMap();
    if (formMap) formMap.resize();
  });
}

const allTab = document.getElementById('all-tab');
if (allTab) allTab.addEventListener('shown.bs.tab', () => fetchEvents(false));

const myTab = document.getElementById('my-tab');
if (myTab) myTab.addEventListener('shown.bs.tab', () => fetchEvents(true));

const favTab = document.getElementById('fav-tab');
if (favTab) favTab.addEventListener('shown.bs.tab', fetchFavorites);

const streamingRadios = document.getElementsByName('isStreaming');
if (streamingRadios.length > 0) {
  streamingRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const matchSection = document.getElementById('match-section');
      if (matchSection) {
        if (e.target.value === 'true') {
          matchSection.classList.remove('d-none');
        } else {
          matchSection.classList.add('d-none');
          const matchInput = document.getElementById('fifa-match');
          if (matchInput) matchInput.value = "";
        }
      }
    });
  });
}

// --- Geocoder Logic ---
window.addEventListener("DOMContentLoaded", () => {
  addAddressSearch();
});

function addAddressSearch() {
  const container = document.getElementById("addressSearch");
  if (!container) return;

  container.innerHTML = ""; // Clear to prevent double-bars

  const geocoderApi = {
    forwardGeocode: async (config) => {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(config.query)}&format=geojson&limit=5`;
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'FIFA-StrEATS-App-Winston' } // Unique User-Agent
        });
        const geojson = await response.json();
        return {
          features: geojson.features.map((f) => ({
            type: "Feature",
            geometry: f.geometry,
            place_name: f.properties.display_name,
            center: f.geometry.coordinates,
            properties: f.properties
          }))
        };
      } catch (err) {
        console.error("Geocoding failed", err);
        return { features: [] };
      }
    }
  };

  if (typeof MaplibreGeocoder === 'undefined') return;

  const geocoder = new MaplibreGeocoder(geocoderApi, {
    maplibregl: maplibregl,
    placeholder: "Search for a bar or restaurant...",
    showResultsWhileTyping: true
  });

  container.appendChild(geocoder.onAdd());

  geocoder.on("result", (e) => {
    const [lng, lat] = e.result.center;
    selectedLngLat = [lng, lat];
    selectedAddress = e.result.place_name;
    const addrInput = document.getElementById("address");
    if (addrInput) addrInput.value = selectedAddress;
    setSelectedLocation(lng, lat);
  });
}

function setSelectedLocation(lng, lat) {
  if (!formMap) initFormMap();

  if (selectedMarker) {
    selectedMarker.setLngLat([lng, lat]);
  } else {
    selectedMarker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(formMap);
  }
  formMap.flyTo({ center: [lng, lat], zoom: 15 });
}

// --- Favorites Logic ---
async function toggleBookmark(eventId, iconElement) {
  const user = auth.currentUser;
  if (!user) { alert("Please log in to favorite events!"); return; }

  const bookmarkId = `${user.uid}_${eventId}`;
  const bookmarkRef = doc(db, "bookmarks", bookmarkId);
  const snap = await getDoc(bookmarkRef);

  if (snap.exists()) {
    await deleteDoc(bookmarkRef);
    iconElement.innerText = "favorite_border";
    iconElement.classList.remove("text-danger");
  } else {
    await setDoc(bookmarkRef, { userId: user.uid, eventId: eventId, timestamp: serverTimestamp() });
    iconElement.innerText = "favorite";
    iconElement.classList.add("text-danger");
  }
}

// --- Delete & Edit Functions ---
async function deleteEvent(id) {
  if (confirm("Are you sure you want to delete this event?")) {
    try {
      await deleteDoc(doc(db, "events", id));
      fetchEvents(true);
    } catch (error) { console.error(error); }
  }
}

function startEdit(id, data) {
  editingDocId = id;

  // Fill text fields
  document.getElementById('event-name').value = data.name || "";
  document.getElementById('event-desc').value = data.description || "";
  document.getElementById('event-time').value = data.time || "";
  document.getElementById('kids-friendly').checked = data.isKidsFriendly || false;
  document.getElementById('pet-friendly').checked = data.isPetFriendly || false;

  // Handle FIFA streaming toggle
  const matchSection = document.getElementById('match-section');
  if (data.isStreaming) {
    document.getElementById('stream-yes').checked = true;
    if (matchSection) matchSection.classList.remove('d-none');
    document.getElementById('fifa-match').value = data.matchName || "";
  } else {
    document.getElementById('stream-no').checked = true;
    if (matchSection) matchSection.classList.add('d-none');
  }

  // Switch tab and then handle map
  const createTabTrigger = document.getElementById('create-tab');
  if (createTabTrigger) {
    const tabInstance = window.bootstrap.Tab.getOrCreateInstance(createTabTrigger);
    tabInstance.show();
  }

  // Set the address values
  selectedAddress = data.address;
  document.getElementById('address').value = data.address || "";
  selectedLngLat = [data.location.lng, data.location.lat];

  // Timeout ensures the tab is visible before map interacts
  setTimeout(() => {
    setSelectedLocation(data.location.lng, data.location.lat);
  }, 150);

  const submitBtn = document.querySelector('#event-form button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Update Event";
    submitBtn.classList.replace('btn-success', 'btn-primary');
  }
}

// --- Form Submission ---
const eventForm = document.getElementById('event-form');
if (eventForm) {
  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !selectedLngLat) { alert("Select a location!"); return; }

    const isStreaming = document.getElementById('stream-yes').checked;
    const combinedData = {
      owner: user.uid,
      name: document.getElementById('event-name').value,
      description: document.getElementById('event-desc').value,
      time: document.getElementById('event-time').value,
      isKidsFriendly: document.getElementById('kids-friendly').checked,
      isPetFriendly: document.getElementById('pet-friendly').checked,
      isStreaming: isStreaming,
      matchName: isStreaming ? document.getElementById('fifa-match').value : "N/A",
      address: selectedAddress,
      location: { lat: selectedLngLat[1], lng: selectedLngLat[0] },
      last_updated: serverTimestamp()
    };

    try {
      if (editingDocId) {
        await updateDoc(doc(db, "events", editingDocId), combinedData);
        editingDocId = null;
      } else {
        await addDoc(collection(db, "events"), combinedData);
      }
      eventForm.reset();
      const submitBtn = eventForm.querySelector('button[type="submit"]');
      submitBtn.textContent = "Save Event";
      submitBtn.classList.replace('btn-primary', 'btn-success');

      document.getElementById('match-section').classList.add('d-none');
      if (selectedMarker) { selectedMarker.remove(); selectedMarker = null; }
      window.bootstrap.Tab.getOrCreateInstance(document.getElementById('all-tab')).show();
      fetchEvents(false);
    } catch (error) { console.error(error); }
  });
}

// --- Data Display ---
function createEventCard(docId, data, isOwner = false) {
  const div = document.createElement("div");
  div.className = "event-card mb-3 p-3 border rounded shadow-sm bg-white position-relative";

  const badge = (data.isStreaming && data.matchName !== "N/A")
    ? `<span class="badge bg-danger mb-2">FIFA: ${data.matchName}</span>`
    : '<span class="badge bg-secondary mb-2">Regular Stream</span>';

  div.innerHTML = `
    <button class="btn btn-link float-end p-0 fav-btn" title="Favorite">
      <span class="material-icons-outlined mt-1" id="icon-${docId}">favorite_border</span>
    </button>
    ${badge}
    <h2 class="h4 mb-1 fw-bold text-dark">${data.name || "Untitled"}</h2>
    <p class="mb-1 text-primary small"><strong>🕒 ${data.time}</strong></p>
    <p class="mb-2 text-muted">${data.description || ""}</p>
    <div class="mb-2">
      ${data.isKidsFriendly ? '<span class="badge bg-light text-dark border me-1">Kids OK</span>' : ''}
      ${data.isPetFriendly ? '<span class="badge bg-light text-dark border">Pets OK</span>' : ''}
    </div>
    <small class="text-muted d-block border-top pt-2 mt-2">${data.address || "Address TBD"}</small>
  `;

  const iconEl = div.querySelector(`#icon-${docId}`);
  if (auth.currentUser) {
    getDoc(doc(db, "bookmarks", `${auth.currentUser.uid}_${docId}`)).then(snap => {
      if (snap.exists()) {
        iconEl.innerText = "favorite";
        iconEl.classList.add("text-danger");
      }
    });
  }

  div.querySelector('.fav-btn').onclick = (e) => {
    e.stopPropagation();
    toggleBookmark(docId, iconEl);
  };

  if (isOwner) {
    const actionDiv = document.createElement("div");
    actionDiv.className = "mt-3 pt-2 border-top d-flex gap-2";
    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-sm btn-outline-primary";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => startEdit(docId, data);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-sm btn-outline-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteEvent(docId);

    actionDiv.appendChild(editBtn);
    actionDiv.appendChild(deleteBtn);
    div.appendChild(actionDiv);
  }
  return div;
}

async function fetchEvents(filterByUser = false) {
  const container = document.getElementById(filterByUser ? "my-results-list" : "results-list");
  if (!container) return;
  container.innerHTML = "Loading...";

  try {
    const eventsRef = collection(db, "events");
    const now = new Date().toISOString().slice(0, 16);
    let q;

    if (filterByUser) {
      const user = auth.currentUser;
      if (!user) return;
      q = query(eventsRef, where("owner", "==", user.uid), where("time", ">=", now), orderBy("time", "asc"));
    } else {
      q = query(eventsRef, where("time", ">=", now), orderBy("time", "asc"));
    }

    const snapshot = await getDocs(q);
    container.innerHTML = snapshot.empty ? "No upcoming events found." : "";
    snapshot.forEach(docSnap => container.appendChild(createEventCard(docSnap.id, docSnap.data(), filterByUser)));
  } catch (error) { console.error(error); }
}

async function fetchFavorites() {
  const user = auth.currentUser;
  const container = document.getElementById("fav-results-list");
  if (!user || !container) return;
  container.innerHTML = "Loading Favorites...";

  try {
    const q = query(collection(db, "bookmarks"), where("userId", "==", user.uid));
    const snap = await getDocs(q);
    container.innerHTML = snap.empty ? "No favourites yet." : "";

    snap.forEach(async (bDoc) => {
      const eventSnap = await getDoc(doc(db, "events", bDoc.data().eventId));
      if (eventSnap.exists()) container.appendChild(createEventCard(eventSnap.id, eventSnap.data(), false));
    });
  } catch (error) { console.error(error); }
}

fetchEvents(false);