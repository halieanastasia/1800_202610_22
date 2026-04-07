import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { db } from "./firebase.js";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const state = {
  map: null,
  events: [],
  filteredEvents: [],
  markers: [],
  userMarker: null,
  userLngLat: null,
  searchCenterMarker: null,
  searchCenter: null,
  selectedTag: "all",
  distanceRadiusKm: 0,
  sourceMode: "auto", // auto | user
  isTagPanelOpen: false,
};

const elements = {
  eventSearchInput: document.getElementById("event-search-input"),
  // placeSearchInput: document.getElementById("place-search-input"),
  // searchBtn: document.getElementById("search-btn"),
  // useMyLocationBtn: document.getElementById("use-my-location-btn"),
  resetBtn: document.getElementById("reset-btn"),
  // distanceHelperText: document.getElementById("distance-helper-text"),
  tagFilterContainer: document.getElementById("tag-filter-container"),
  tagFilterWrapper: document.getElementById("tag-filter-wrapper"),
  toggleTagBtn: document.getElementById("toggle-tag-btn"),
  tagToggleIcon: document.getElementById("tag-toggle-icon"),
  resultsList: document.getElementById("results-list"),
  resultsCount: document.getElementById("results-count"),
  quickDistanceButtons: document.querySelectorAll(".quick-distance-btn"),
  // distanceRangeInput: document.getElementById("distance-range-input"),
};

function normalizeTags(tags) {
  if (!tags) return [];

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function getEventCoords(event) {
  if (event?.location?.lat != null && event?.location?.lng != null) {
    return [Number(event.location.lng), Number(event.location.lat)];
  }

  if (event?.lat != null && event?.lng != null) {
    return [Number(event.lng), Number(event.lat)];
  }

  return null;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceKm(lng1, lat1, lng2, lat2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getActiveDistanceCenter() {
  if (state.sourceMode === "user" && state.userLngLat) {
    return {
      lng: state.userLngLat[0],
      lat: state.userLngLat[1],
      label: "your current location",
      source: "user",
    };
  }

  if (state.userLngLat) {
    return {
      lng: state.userLngLat[0],
      lat: state.userLngLat[1],
      label: "your current location",
      source: "user",
    };
  }

  return null;
}

// TODO probably remove
// async function patchExistingEventTags() {
//   const snapshot = await getDocs(collection(db, "events"));

//   //TODO  It should be being read from the collection!????
//   const tagsByRestaurantName = {
//     "Trattoria by Italian Kitchen": ["italian", "pasta", "casual", "burnaby"],
//     "Chambar Restaurant": ["belgian", "seafood", "downtown", "fine dining"],
//     Nightingale: ["bar", "cocktails", "modern canadian", "downtown"],
//   };

//   const updates = snapshot.docs.map(async (restaurantDoc) => {
//     const data = restaurantDoc.data();
//     const currentTags = normalizeTags(data.tags);

//     if (currentTags.length > 0) return;

//     const suggestedTags = tagsByRestaurantName[data.name];
//     if (!suggestedTags) return;

//     await updateDoc(doc(db, "events", restaurantDoc.id), {
//       tags: suggestedTags,
//     });
//   });

//   await Promise.all(updates);
// }

async function getEvents() {
  const snapshot = await getDocs(collection(db, "events"));

  return snapshot.docs.map((eventDoc) => {
    const data = eventDoc.data();

    return {
      id: eventDoc.id,
      ...data,
      tagsArray: normalizeTags(data.tags),
    };
  });
}

function createMarkerElement() {
  const el = document.createElement("div");
  el.className = "event-marker";
  return el;
}

function clearMarkers() {
  state.markers.forEach((marker) => marker.remove());
  state.markers = [];
}

function renderMarkers(events) {
  clearMarkers();

  events.forEach((event) => {
    const coords = getEventCoords(event);

    if (!coords) {
      console.warn("No valid coordinates for event:", event.name, event);
      return;
    }

    const markerEl = createMarkerElement();
    markerEl.title = event.name || "Event";

    const marker = new maplibregl.Marker({
      element: markerEl,
      anchor: "center",
    })
      .setLngLat(coords)
      // TODO Edit popup here
      .setPopup(
        new maplibregl.Popup({ offset: 18 }).setHTML(`
          <div style="min-width: 180px;">
            <strong>${event.name || "Event"}</strong><br />
            <small>${event.address || event.city || ""}</small>
          </div>
        `),
      )
      .addTo(state.map);

    // FIX removing redirection
    // markerEl.addEventListener("click", () => {
    //   openRestaurantDetails(event);
    // });

    // FIX adding these to make the markers open a pop up on hover
    markerEl.addEventListener("mouseenter", () => marker.togglePopup());
    markerEl.addEventListener("mouseleave", () => marker.togglePopup());

    state.markers.push(marker);
  });
}

function renderTagButtons(events) {
  const tagSet = new Set();

  events.forEach((event) => {
    event.tagsArray.forEach((tag) => tagSet.add(tag));
  });

  const tags = [
    "all",
    ...Array.from(tagSet).sort((a, b) => a.localeCompare(b)),
  ];

  elements.tagFilterContainer.innerHTML = "";

  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = tag;
    button.className = `tag-btn ${state.selectedTag === tag ? "active" : ""}`;

    button.addEventListener("click", () => {
      state.selectedTag = tag;
      renderTagButtons(state.events);
      applyFilters();
    });

    elements.tagFilterContainer.appendChild(button);
  });
}

function setTagPanelOpen(isOpen) {
  state.isTagPanelOpen = isOpen;
  elements.tagFilterWrapper.classList.toggle("collapsed", !isOpen);
  elements.tagToggleIcon.textContent = isOpen ? "▲" : "▼";
}

function updateQuickDistanceButtons() {
  elements.quickDistanceButtons.forEach((button) => {
    const buttonDistance = Number(button.dataset.distance);
    button.classList.toggle(
      "active",
      state.distanceRadiusKm > 0 && state.distanceRadiusKm === buttonDistance,
    );
  });
}

function buildEventCard(event) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "event-card";

  const tagsHtml =
    event.tagsArray.length > 0
      ? event.tagsArray
          .map((tag) => `<span class="event-tag">${tag}</span>`)
          .join("")
      : `<span class="event-tag">No tags</span>`;

  const distanceText =
    typeof event.distanceKm === "number"
      ? `<p class="event-distance">${event.distanceKm.toFixed(2)} km away</p>`
      : "";

  card.innerHTML = `
    <div class="event-card-top">
      <h3>${event.name || "Event"}</h3>
    </div>
    <p class="event-address">${event.address || event.city || "Address not available"}</p>
    <p class="event-description">${event.description || "No description available."}</p>
    ${distanceText}
    <div class="event-tags">${tagsHtml}</div>
  `;
  //FIX removing this to prevent map redirection
  // card.addEventListener("click", () => {
  //   openRestaurantDetails(event);
  // });

  return card;
}

function renderResults(events) {
  elements.resultsList.innerHTML = "";
  elements.resultsCount.textContent = `${events.length} event${events.length === 1 ? "" : "s"}`;
  const searchResultPopup = document.getElementById("search-result-popup");

  if (!events || events.length === 0) {
    elements.resultsList.innerHTML = `
      <div class="empty-state">No events matched your filters.</div>`;
    searchResultPopup.style.display = "none";
    return;
  }

  events.forEach((event) => {
    elements.resultsList.appendChild(buildEventCard(event));
  });
  // searchResultPopup.style.display = "block";

  // FIX trying to have results only appear when user is actively using the filer/ search function
  const isFiltering =
    elements.eventSearchInput.value.trim() ||
    state.selectedTag !== "all" ||
    state.distanceRadiusKm > 0;
  // elements.placeSearchInput.value.trim() ||
  // if the user is filtering display, if they are not hide
  searchResultPopup.style.display = isFiltering ? "block" : "none";
}

//TODO remove this if it doesn't get used
// function openEventDetails(event) {
//   localStorage.setItem("selectedEvent", JSON.stringify(event));
//   window.location.href = "./event.html";
// }

function updateSearchCenterMarker() {
  if (state.searchCenterMarker) {
    state.searchCenterMarker.remove();
    state.searchCenterMarker = null;
  }

  if (!state.searchCenter) return;

  const el = document.createElement("div");
  el.className = "search-center-marker";

  state.searchCenterMarker = new maplibregl.Marker({ element: el })
    .setLngLat([state.searchCenter.lng, state.searchCenter.lat])
    // TODO remove? I dont think we need this
    // .setPopup(
    //   new maplibregl.Popup({ offset: 18 }).setText(
    //     state.searchCenter.placeName || "Search location",
    //   ),
    // )
    .addTo(state.map);
}

function fitMapToVisibleResults(events) {
  const bounds = new maplibregl.LngLatBounds();
  let hasPoints = false;

  const activeCenter = getActiveDistanceCenter();
  // FIX removes user from the zoom to results
  if (activeCenter && activeCenter.source !== "user") {
    bounds.extend([activeCenter.lng, activeCenter.lat]);
    hasPoints = true;
  }

  events.forEach((event) => {
    const coords = getEventCoords(event);
    if (!coords) return;
    bounds.extend(coords);
    hasPoints = true;
  });

  // if (hasPoints) {
  //   state.map.fitBounds(bounds, {
  //     padding: 80,
  //     duration: 700,
  //     maxZoom: 14,
  //   });
  // }

  // TODO Might be unnecessary but it looks bad if the map zooms in too much
  if (!hasPoints) return;

  const zoomOptions = {};
  if (events.length === 1 && activeCenter) {
    zoomOptions.maxZoom = 14;
  } else {
    zoomOptions.maxZoom = 16;
  }

  state.map.fitBounds(bounds, {
    padding: 80,
    duration: 700,
    ...zoomOptions,
  });
}

function updateMapAfterFilter(events) {
  const activeCenter = getActiveDistanceCenter();

  //if (!activeCenter && events.length === 0) return;

  if (state.distanceRadiusKm > 0 && activeCenter && events.length > 0) {
    fitMapToVisibleResults(events);
    return;
  }

  if (events.length === 0) {
    if (activeCenter) {
      state.map.flyTo({
        center: [activeCenter.lng, activeCenter.lat],
        zoom: 11,
        essential: true,
        duration: 700,
      });
    } else {
      // FIX made the map zoom back out if there is nothing to display
      state.map.flyTo({
        center: [-123.1207, 49.2827], //Downtown vancouver
        zoom: 11,
        duration: 700,
      });
    }
    return;
  }

  fitMapToVisibleResults(events);
}

function getEventsWithComputedDistance() {
  const activeCenter = getActiveDistanceCenter();

  return state.events.map((event) => {
    if (!activeCenter) {
      return {
        ...event,
        distanceKm: null,
      };
    }

    const coords = getEventCoords(event);

    if (!coords) {
      return {
        ...event,
        distanceKm: null,
      };
    }

    return {
      ...event,
      distanceKm: distanceKm(
        activeCenter.lng,
        activeCenter.lat,
        coords[0],
        coords[1],
      ),
    };
  });
}

// function updateHelperText() {
//   const activeCenter = getActiveDistanceCenter();

//   if (!activeCenter) {
//     elements.distanceHelperText.textContent =
//       "Click “Use My Location” to enable distance-based filtering.";
//     return;
//   }

//   if (state.distanceRadiusKm > 0) {
//     elements.distanceHelperText.textContent = `Showing events within ${state.distanceRadiusKm} km of ${activeCenter.label}.`;
//   } else {
//     elements.distanceHelperText.textContent =
//       "Choose a quick distance filter to narrow results, or press Reset to clear filters.";
//   }
// }

function applyFilters() {
  const eventQuery = elements.eventSearchInput.value.trim().toLowerCase();

  let filtered = getEventsWithComputedDistance();

  if (eventQuery) {
    filtered = filtered.filter((event) => {
      const haystack = [
        event.name,
        event.description,
        event.address,
        event.city,
        ...(event.tagsArray || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(eventQuery);
    });
  }

  if (state.selectedTag !== "all") {
    filtered = filtered.filter((event) =>
      event.tagsArray.some(
        (tag) => tag.toLowerCase() === state.selectedTag.toLowerCase(),
      ),
    );
  }

  if (state.distanceRadiusKm > 0) {
    filtered = filtered.filter(
      (event) =>
        typeof event.distanceKm === "number" &&
        event.distanceKm <= state.distanceRadiusKm,
    );
  }

  if (getActiveDistanceCenter()) {
    filtered.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  state.filteredEvents = filtered;
  renderMarkers(filtered);
  renderResults(filtered);
  // updateHelperText();
  updateQuickDistanceButtons();

  requestAnimationFrame(() => {
    updateMapAfterFilter(filtered);
  });
}

function handleReset() {
  elements.eventSearchInput.value = "";
  // elements.placeSearchInput.value = "";
  // elements.distanceRangeInput.value = "1";

  state.selectedTag = "all";
  state.distanceRadiusKm = 0;
  state.sourceMode = state.userLngLat ? "user" : "auto";

  updateSearchCenterMarker();
  renderTagButtons(state.events);
  applyFilters();
  document.getElementById("search-result-popup").style.display = "none";
}

// function handleShowAll() {
//   state.distanceRadiusKm = 0;
//   updateQuickDistanceButtons();
//   updateHelperText();
//   applyFilters();
// }

function attachEvents() {
  // elements.useMyLocationBtn.addEventListener("click", () => {
  //   state.sourceMode = "user";
  //   state.distanceRadiusKm = 1;
  //   updateQuickDistanceButtons();
  //   addUserLocationToMap(true);
  // });

  elements.resetBtn.addEventListener("click", handleReset);

  elements.toggleTagBtn.addEventListener("click", () => {
    setTagPanelOpen(!state.isTagPanelOpen);
  });

  elements.eventSearchInput.addEventListener("input", applyFilters);

  // function syncDistanceFromInput() {
  //   // const radiusValue = Number(elements.distanceRangeInput.value);

  //   if (!Number.isFinite(radiusValue) || radiusValue < 1 || radiusValue > 50) {
  //     state.distanceRadiusKm = 0;
  //     return;
  //   }

  //   state.distanceRadiusKm = radiusValue;
  // }

  // elements.distanceRangeInput.addEventListener("input", () => {
  //   syncDistanceFromInput();
  //   applyFilters();
  // });

  // elements.placeSearchInput.addEventListener("keydown", async (event) => {
  //   if (event.key === "Enter") {
  //     event.preventDefault();
  //     // await handleSearch();
  //   }
  // });

  elements.quickDistanceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const chosenDistance = Number(button.dataset.distance);
      state.distanceRadiusKm = chosenDistance;
      applyFilters();
    });
  });
}

function addUserLocationToMap(applyAfterSuccess = false) {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lng = position.coords.longitude;
      const lat = position.coords.latitude;
      state.userLngLat = [lng, lat];

      if (state.userMarker) {
        state.userMarker.remove();
      }

      const el = document.createElement("div");
      el.className = "user-location-marker";

      state.userMarker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setText("Your location"))
        .addTo(state.map);

      if (applyAfterSuccess) {
        applyFilters();
      } else {
        // updateHelperText();
      }
    },
    (error) => {
      console.warn("User location unavailable:", error.message);
      alert("Could not get your current location.");
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 60000,
    },
  );
}

function registerMissingImageFallback() {
  state.map.on("styleimagemissing", (event) => {
    const imageId = event.id;

    if (state.map.hasImage(imageId)) return;

    const width = 16;
    const height = 16;
    const data = new Uint8Array(width * height * 4);

    state.map.addImage(imageId, {
      width,
      height,
      data,
    });
  });
}

async function initializeMapPage() {
  state.map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.1207, 49.2827],
    zoom: 11,
  });

  state.map.touchZoomRotate.disableRotation();
  state.map.addControl(new maplibregl.NavigationControl(), "top-right");
  registerMissingImageFallback();

  state.map.on("load", async () => {
    try {
      // await patchExistingEventTags();
      state.events = await getEvents();
      renderTagButtons(state.events);
      setTagPanelOpen(false);

      // HotFix for map pins not displaying on load
      handleReset();

      //TODO I don't think the filters need to be applied on load
      //applyFilters();
      addUserLocationToMap(false);
    } catch (error) {
      console.error("Failed to load event data:", error);
      elements.resultsList.innerHTML = `
        <div class="empty-state">Failed to load event data.</div>
      `;
    }
  });

  attachEvents();
}
initializeMapPage();

// function displayFilterPopup() {
//   document.getElementById("map-filter-popup").style.display = "block";
// }

function toggleFilterPopup() {
  const popup = document.getElementById("map-filter-popup");
  const button = document.getElementById("filter-button");
  if (popup.style.display == "block") {
    popup.style.display = "none";
    button.innerHTML = "Filters";
  } else {
    popup.style.display = "block";
    button.innerHTML = "Close";
  }
}

document
  .getElementById("filter-button")
  .addEventListener("click", toggleFilterPopup);
