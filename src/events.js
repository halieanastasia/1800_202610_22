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
  orderBy,
} from "firebase/firestore";
import maplibregl from "maplibre-gl";
import "../styles/style.css";

// --- Global variables ---
let formMap;
let selectedMarker = null;
let selectedLngLat = null;
let selectedAddress = null;
let editingDocId = null;
let currentTags = [];

// --- Initialization & UI Listeners ---
window.addEventListener("DOMContentLoaded", () => {
  addAddressSearch();

  const streamYes = document.getElementById("stream-yes");
  const streamNo = document.getElementById("stream-no");
  const matchSection = document.getElementById("match-section");

  if (streamYes && streamNo && matchSection) {
    streamYes.addEventListener("change", () => {
      if (streamYes.checked) matchSection.classList.remove("d-none");
    });
    streamNo.addEventListener("change", () => {
      if (streamNo.checked) matchSection.classList.add("d-none");
    });
  }

  const tagInput = document.getElementById("tag-input");
  const tagContainer = document.getElementById("tag-container");

  if (tagInput && tagContainer) {
    tagContainer.addEventListener("click", () => tagInput.focus());

    tagInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const val = tagInput.value.trim().toLowerCase().replace(",", "");
        if (val && !currentTags.includes(val)) {
          currentTags.push(val);
          renderChips();
          tagInput.value = "";
        } else {
          tagInput.value = "";
        }
      } else if (e.key === "Backspace" && tagInput.value === "") {
        currentTags.pop();
        renderChips();
      }
    });
  }
});

function renderChips() {
  const tagInput = document.getElementById("tag-input");
  const tagContainer = document.getElementById("tag-container");
  if (!tagInput || !tagContainer) return;

  const existingChips = tagContainer.querySelectorAll(".badge");
  existingChips.forEach((c) => c.remove());

  currentTags.forEach((tag, index) => {
    const span = document.createElement("span");
    span.className =
      "badge bg-success d-flex align-items-center gap-2 p-2 rounded-pill";
    span.style.fontSize = "0.85rem";
    span.innerHTML = `
      ${tag} 
      <span class="material-icons-outlined" style="font-size:16px; cursor:pointer;" onclick="removeTag(${index})">close</span>
    `;
    tagContainer.insertBefore(span, tagInput);
  });
}

window.removeTag = (index) => {
  currentTags.splice(index, 1);
  renderChips();
};

// --- Map Initialization ---
function initFormMap() {
  if (formMap) return;
  const container = document.getElementById("formMap");
  if (!container) return;

  formMap = new maplibregl.Map({
    container: "formMap",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.0016, 49.2532],
    zoom: 10,
  });
  formMap.addControl(new maplibregl.NavigationControl(), "top-right");
}

// --- Tab Listeners ---
const createTab = document.getElementById("create-tab");
const createEventPanel = document.getElementById("create-event-panel");

if (createTab) {
  createTab.addEventListener("shown.bs.tab", () => {
    const user = auth.currentUser;

    if (!user) {
      createEventPanel.innerHTML = `
        <div class="text-start py-2">
          <p class="text-custom-cream mt-1">Login to create an event.</p>
        </div>`;
      return;
    }

    initFormMap();

    if (formMap) {
      setTimeout(() => {
        formMap.resize();
      }, 100);
    }
  });
}

const allTab = document.getElementById("all-tab");
if (allTab) allTab.addEventListener("shown.bs.tab", () => fetchEvents(false));

const myTab = document.getElementById("my-tab");
if (myTab) myTab.addEventListener("shown.bs.tab", () => fetchEvents(true));

const favTab = document.getElementById("fav-tab");
if (favTab) {
  favTab.addEventListener("shown.bs.tab", () => {
    fetchFavorites();
  });
}

// function addAddressSearch() {
  // const container = document.getElementById("addressSearch");
  // if (!container) return;
  // container.innerHTML = "";

  // // only send query once user has stopped typing
  // let debounceTimer;
  // function debounce(fn, delay) {
    // return (...args) => {
      // console.log("Start timer!");
      // clearTimeout(debounceTimer);
      // return new Promise((resolve) => {
        // debounceTimer = setTimeout(() => resolve(fn(...args)), delay);
      // });
    // };
  // }

  // // track last query, don't send a new query if user just hit the control key, shift key, etc
  // let lastQuery = "";
  // let pauseBeforeRequest = 500; // pause miliseconds after user stops typing;
  // const geocoderApi = {
    // forwardGeocode: debounce(async (config) => {
      // // prevent non-character keys from firing a query
      // const trimmed = config.query.trim();
      // if (trimmed === lastQuery) return { features: [] };
      // lastQuery = trimmed;

      // const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(config.query)}&format=geojson&limit=5`;
    // //   const url = `/nominatim/search?q=${encodeURIComponent(config.query)}&format=geojson&limit=5`;
      // try {
        // const response = await fetch(url, {
          // headers: { "User-Agent": "Rally-App-Winston" },
        // });

									  
														  
								  
		 

        // const geojson = await response.json();
        // return {
          // features: geojson.features.map((f) => ({
            // type: "Feature",
            // geometry: f.geometry,
            // place_name: f.properties.display_name,
            // center: f.geometry.coordinates,
            // properties: f.properties,
          // })),
        // };
      // } catch (err) {
        // console.error("Geocoding failed", err);
        // return { features: [] };
      // }
    // }, pauseBeforeRequest),
  // };

  // if (typeof MaplibreGeocoder === "undefined") return;
  // const geocoder = new MaplibreGeocoder(geocoderApi, {
    // maplibregl: maplibregl,
    // placeholder: "Search for location...",
    // minLength: 2,
				  
    // showResultsWhileTyping: true,
  // });

  // container.appendChild(geocoder.onAdd());
  // geocoder.on("result", (e) => {
    // const [lng, lat] = e.result.center;
    // selectedLngLat = [lng, lat];
    // selectedAddress = e.result.place_name;
    // const addrInput = document.getElementById("address");
    // if (addrInput) addrInput.value = selectedAddress;
    // setSelectedLocation(lng, lat);
  // });  
// }

// --- Geocoder Logic ---
let lastSearchTime = 0;

function addAddressSearch() {
  const container = document.getElementById("addressSearch");
  if (!container) return;
  container.innerHTML = "";

  const geocoderApi = {
    forwardGeocode: async (config) => {
      // rate limit to 1 request per 1.5 seconds
      const now = Date.now();
      if (now - lastSearchTime < 1500) {
        console.warn("Searching too fast, skipping request...");
        return { features: [] };
      }

      lastSearchTime = now;

      if (config.query.length < 3) return { features: [] };

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(config.query)}&format=geojson&limit=5`;

      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "Rally-App-BBY22" },
        });

        if (response.status === 429) {
          console.error("Nominatim Rate Limit Hit (429)");
          return { features: [] };
        }

        const geojson = await response.json();
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
        console.error("Geocoding failed", err);
        return { features: [] };
      }
    },
  };

  if (typeof MaplibreGeocoder === "undefined") return;
  const geocoder = new MaplibreGeocoder(geocoderApi, {
    maplibregl: maplibregl,
    placeholder: "Search for location...",
    minLength: 3,
    debounce: 800,
    showResultsWhileTyping: true,
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
    selectedMarker = new maplibregl.Marker()
      .setLngLat([lng, lat])
      .addTo(formMap);
  }
  formMap.flyTo({ center: [lng, lat], zoom: 15 });
}

// --- Favourites Logic ---
async function toggleBookmark(eventId, iconElement) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to favourite events!");
    return;
  }

  const bookmarkId = `${user.uid}_${eventId}`;
  const bookmarkRef = doc(db, "bookmarks", bookmarkId);
  const snap = await getDoc(bookmarkRef);

  if (snap.exists()) {
    await deleteDoc(bookmarkRef);
    iconElement.innerText = "favorite_border";
    iconElement.classList.remove("text-danger");
  } else {
    await setDoc(bookmarkRef, {
      userId: user.uid,
      eventId: eventId,
      timestamp: serverTimestamp(),
    });
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
    } catch (error) {
      console.error(error);
    }
  }
}

function startEdit(id, data) {
  editingDocId = id;
  const matchSection = document.getElementById("match-section");

  document.getElementById("event-name").value = data.name || "";
  document.getElementById("event-desc").value = data.description || "";
  document.getElementById("event-time").value = data.time || "";
  document.getElementById("kids-friendly").checked =
    data.isKidsFriendly || false;
  document.getElementById("pet-friendly").checked = data.isPetFriendly || false;

  currentTags = [
    ...new Set((data.tags || []).map((t) => t.toLowerCase().trim())),
  ];
  renderChips();

  // Sync FIFA Match section on Edit
  if (data.isStreaming) {
    document.getElementById("stream-yes").checked = true;
    matchSection?.classList.remove("d-none");
    document.getElementById("fifa-match").value = data.matchName || "";
  } else {
    document.getElementById("stream-no").checked = true;
    matchSection?.classList.add("d-none");
  }

  window.bootstrap.Tab.getOrCreateInstance(
    document.getElementById("create-tab"),
  ).show();

  selectedAddress = data.address;
  document.getElementById("address").value = data.address || "";
  selectedLngLat = [data.location.lng, data.location.lat];

  setTimeout(
    () => setSelectedLocation(data.location.lng, data.location.lat),
    150,
  );

  const submitBtn = document.querySelector('#event-form button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = "Update Event";
    submitBtn.classList.replace("btn-success", "btn-primary");
  }
}

// --- Form Submission ---
const eventForm = document.getElementById("event-form");
if (eventForm) {
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !selectedLngLat) {
      alert("Select a location on the map!");
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
      tags: currentTags,
      last_updated: serverTimestamp(),
    };

    try {
      if (editingDocId) {
        await updateDoc(doc(db, "events", editingDocId), combinedData);
        editingDocId = null;
      } else {
        await addDoc(collection(db, "events"), combinedData);
      }

      eventForm.reset();
      currentTags = [];
      renderChips();
      document.getElementById("match-section").classList.add("d-none");

      const submitBtn = eventForm.querySelector('button[type="submit"]');
      submitBtn.textContent = "Save Event";
      submitBtn.classList.replace("btn-primary", "btn-success");

      if (selectedMarker) {
        selectedMarker.remove();
        selectedMarker = null;
      }
      window.bootstrap.Tab.getOrCreateInstance(
        document.getElementById("all-tab"),
      ).show();
      fetchEvents(false);
    } catch (error) {
      console.error(error);
    }
  });
}

// --- Data Display ---
function createEventCard(docId, data, isOwner = false) {
  const div = document.createElement("div");
  div.className =
    "event-card mb-3 p-3 border rounded shadow-sm bg-custom-cream position-relative";

  const favButtonHtml = auth.currentUser
    ? `<button class="btn btn-link float-end p-0 fav-btn" title="Favourite">
         <span class="material-icons-outlined mt-1" id="icon-${docId}">favorite_border</span>
       </button>`
    : "";

  const badge =
    data.isStreaming && data.matchName !== "N/A"
      ? `<span class="badge bg-danger mb-2">FIFA: ${data.matchName}</span>`
      : '<span class="badge bg-secondary mb-2">Regular Stream</span>';

  div.innerHTML = `
    ${favButtonHtml}
    ${badge}
    <h2 class="h4 mb-1 fw-bold text-dark">${data.name || "Untitled Venue"}</h2>
    <p class="mb-1 text-primary small"><strong>🕒 ${new Date(data.time).toLocaleString()}</strong></p>
    <p class="mb-2 text-muted">${data.description || ""}</p>

    <div class="mb-2 d-flex flex-wrap gap-1">
      ${data.tags ? data.tags.map((t) => `<span class="badge rounded-pill bg-light text-dark border" style="font-size:0.75rem;">#${t}</span>`).join("") : ""}
    </div>

    <div class="mb-2">
      ${data.isKidsFriendly ? '<span class="badge bg-light text-dark border me-1">Kids OK</span>' : ""}
      ${data.isPetFriendly ? '<span class="badge bg-light text-dark border">Pets OK</span>' : ""}
    </div>
    <small class="text-muted d-block border-top pt-2 mt-2">
      <img src="/images/event-marker.png" alt="location" width="12" height="12" style="vertical-align: center; margin-right: 0px;">
       ${data.address || "Address TBD"}
    </small>
  `;

  if (auth.currentUser) {
    const iconEl = div.querySelector(`#icon-${docId}`);

    // Check initial bookmark state
    getDoc(doc(db, "bookmarks", `${auth.currentUser.uid}_${docId}`)).then(
      (snap) => {
        if (snap.exists() && iconEl) {
          iconEl.innerText = "favorite";
          iconEl.classList.add("text-danger");
        }
      },
    );

    // Attach click listener
    const favBtn = div.querySelector(".fav-btn");
    if (favBtn) {
      favBtn.onclick = (e) => {
        e.stopPropagation();
        toggleBookmark(docId, iconEl);
      };
    }
  }

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

// --- Fetch Functions ---
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
    container.innerHTML = snapshot.empty ? "No upcoming events found." : "";
    snapshot.forEach((docSnap) =>
      container.appendChild(
        createEventCard(docSnap.id, docSnap.data(), filterByUser),
      ),
    );
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

async function fetchFavorites() {
  const container = document.getElementById("fav-results-list");
  if (!container) return;

  container.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>`;

  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = "Login to see your favourites.";
    return;
  }

  try {
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    console.log("Bookmarks Snapshot size:", snapshot.size);

    container.innerHTML = snapshot.empty ? `<p class="text-custom-cream mt-3">No favourites found.</p>` : "";

    if (snapshot.empty) return;

    for (const docSnap of snapshot.docs) {
      const bData = docSnap.data();
      const eventId = bData.eventId;
      const eventSnap = await getDoc(doc(db, "events", eventId));

      if (eventSnap.exists()) {
        container.appendChild(createEventCard(eventSnap.id, eventSnap.data(), false));
      } else {
        console.warn("Cleaning up deleted bookmark:", docSnap.id);
        await deleteDoc(doc(db, "bookmarks", docSnap.id));
      }
    }
  } catch (error) {
    console.error("Fetch Favourites Error:", error);
    container.innerHTML = `<p class="text-danger mt-3">Error loading favourites.</p>`;
  }
}

// Initial Run
fetchEvents(false);
