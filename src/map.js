import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { db } from "./firebase.js";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const state = {
  map: null,
  restaurants: [],
  filteredRestaurants: [],
  markers: [],
  userMarker: null,
  userLngLat: null,
  selectedTag: "all",
  distanceRadiusKm: 0,
  sourceMode: "auto", // auto | user
  isTagPanelOpen: false,
};

const elements = {
  restaurantSearchInput: document.getElementById("restaurant-search-input"),
  useMyLocationBtn: document.getElementById("use-my-location-btn"),
  resetBtn: document.getElementById("reset-btn"),
  distanceHelperText: document.getElementById("distance-helper-text"),
  tagFilterContainer: document.getElementById("tag-filter-container"),
  tagFilterWrapper: document.getElementById("tag-filter-wrapper"),
  toggleTagBtn: document.getElementById("toggle-tag-btn"),
  tagToggleIcon: document.getElementById("tag-toggle-icon"),
  resultsList: document.getElementById("results-list"),
  resultsCount: document.getElementById("results-count"),
  quickDistanceButtons: document.querySelectorAll(".quick-distance-btn"),
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

function getRestaurantCoords(restaurant) {
  if (
    restaurant?.location?.latitude != null &&
    restaurant?.location?.longitude != null
  ) {
    return [
      Number(restaurant.location.longitude),
      Number(restaurant.location.latitude),
    ];
  }

  if (
    restaurant?.location?._lat != null &&
    restaurant?.location?._long != null
  ) {
    return [
      Number(restaurant.location._long),
      Number(restaurant.location._lat),
    ];
  }

  if (restaurant?.lat != null && restaurant?.lng != null) {
    return [Number(restaurant.lng), Number(restaurant.lat)];
  }

  if (restaurant?.latitude != null && restaurant?.longitude != null) {
    return [Number(restaurant.longitude), Number(restaurant.latitude)];
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

async function patchExistingRestaurantTags() {
  const snapshot = await getDocs(collection(db, "restaurants"));

  const tagsByRestaurantName = {
    "Trattoria by Italian Kitchen": ["italian", "pasta", "casual", "burnaby"],
    "Chambar Restaurant": ["belgian", "seafood", "downtown", "fine dining"],
    Nightingale: ["bar", "cocktails", "modern canadian", "downtown"],
  };

  const updates = snapshot.docs.map(async (restaurantDoc) => {
    const data = restaurantDoc.data();
    const currentTags = normalizeTags(data.tags);

    if (currentTags.length > 0) return;

    const suggestedTags = tagsByRestaurantName[data.name];
    if (!suggestedTags) return;

    await updateDoc(doc(db, "restaurants", restaurantDoc.id), {
      tags: suggestedTags,
    });
  });

  await Promise.all(updates);
}

async function getRestaurants() {
  const snapshot = await getDocs(collection(db, "restaurants"));

  return snapshot.docs.map((restaurantDoc) => {
    const data = restaurantDoc.data();

    return {
      id: restaurantDoc.id,
      ...data,
      tagsArray: normalizeTags(data.tags),
    };
  });
}


function createMarkerElement() {
  const el = document.createElement("div");
  el.className = "restaurant-marker";
  return el;
}

function clearMarkers() {
  state.markers.forEach((marker) => marker.remove());
  state.markers = [];
}

function renderMarkers(restaurants) {
  clearMarkers();

  restaurants.forEach((restaurant) => {
    const coords = getRestaurantCoords(restaurant);

    if (!coords) {
      console.warn(
        "No valid coordinates for restaurant:",
        restaurant.name,
        restaurant,
      );
      return;
    }

    const markerEl = createMarkerElement();
    markerEl.title = restaurant.name || "Restaurant";

    const marker = new maplibregl.Marker({
      element: markerEl,
      anchor: "center",
    })
      .setLngLat(coords)
      .setPopup(
        new maplibregl.Popup({ offset: 18 }).setHTML(`
          <div style="min-width: 180px;">
            <strong>${restaurant.name || "Restaurant"}</strong><br />
            <small>${restaurant.address || restaurant.city || ""}</small>
          </div>
        `),
      )
      .addTo(state.map);

    markerEl.addEventListener("click", () => {
      openRestaurantDetails(restaurant);
    });

    state.markers.push(marker);
  });
}

function renderTagButtons(restaurants) {
  const tagSet = new Set();

  restaurants.forEach((restaurant) => {
    restaurant.tagsArray.forEach((tag) => tagSet.add(tag));
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
      renderTagButtons(state.restaurants);
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

function buildRestaurantCard(restaurant) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "restaurant-card";

  const tagsHtml =
    restaurant.tagsArray.length > 0
      ? restaurant.tagsArray
          .map((tag) => `<span class="restaurant-tag">${tag}</span>`)
          .join("")
      : `<span class="restaurant-tag">No tags</span>`;

  const distanceText =
    typeof restaurant.distanceKm === "number"
      ? `<p class="restaurant-distance">${restaurant.distanceKm.toFixed(2)} km away</p>`
      : "";

  card.innerHTML = `
    <div class="restaurant-card-top">
      <h3>${restaurant.name || "Restaurant"}</h3>
      <p>${restaurant.price || ""}</p>
    </div>
    <p class="restaurant-address">${restaurant.address || restaurant.city || "Address not available"}</p>
    <p class="restaurant-description">${restaurant.description || "No description available."}</p>
    ${distanceText}
    <div class="restaurant-tags">${tagsHtml}</div>
  `;

  card.addEventListener("click", () => {
    openRestaurantDetails(restaurant);
  });

  return card;
}

function renderResults(restaurants) {
  elements.resultsList.innerHTML = "";
  elements.resultsCount.textContent = `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"}`;

  if (restaurants.length === 0) {
    elements.resultsList.innerHTML = `
      <div class="empty-state">No restaurants matched your filters.</div>
    `;
    return;
  }

  restaurants.forEach((restaurant) => {
    elements.resultsList.appendChild(buildRestaurantCard(restaurant));
  });
  document.getElementById("search-result-popup").style.display = "block";
}

function openRestaurantDetails(restaurant) {
  localStorage.setItem("selectedRestaurant", JSON.stringify(restaurant));
  window.location.href = "./restaurant.html";
}



function fitMapToVisibleResults(restaurants) {
  const bounds = new maplibregl.LngLatBounds();
  let hasPoints = false;

  const activeCenter = getActiveDistanceCenter();
  if (activeCenter) {
    bounds.extend([activeCenter.lng, activeCenter.lat]);
    hasPoints = true;
  }

  restaurants.forEach((restaurant) => {
    const coords = getRestaurantCoords(restaurant);
    if (!coords) return;
    bounds.extend(coords);
    hasPoints = true;
  });

  if (hasPoints) {
    state.map.fitBounds(bounds, {
      padding: 80,
      duration: 700,
      maxZoom: 14,
    });
  }
}

function updateMapAfterFilter(restaurants) {
  const activeCenter = getActiveDistanceCenter();

  if (!activeCenter && restaurants.length === 0) return;

  if (state.distanceRadiusKm > 0 && activeCenter) {
    fitMapToVisibleResults(restaurants);
    return;
  }

  if (restaurants.length === 0) {
    if (activeCenter) {
      state.map.flyTo({
        center: [activeCenter.lng, activeCenter.lat],
        zoom: 14,
        essential: true,
        duration: 700,
      });
    }
    return;
  }

  fitMapToVisibleResults(restaurants);
}

function getRestaurantsWithComputedDistance() {
  const activeCenter = getActiveDistanceCenter();

  return state.restaurants.map((restaurant) => {
    if (!activeCenter) {
      return {
        ...restaurant,
        distanceKm: null,
      };
    }

    const coords = getRestaurantCoords(restaurant);

    if (!coords) {
      return {
        ...restaurant,
        distanceKm: null,
      };
    }

    return {
      ...restaurant,
      distanceKm: distanceKm(
        activeCenter.lng,
        activeCenter.lat,
        coords[0],
        coords[1],
      ),
    };
  });
}

function updateHelperText() {
  const activeCenter = getActiveDistanceCenter();

  if (!activeCenter) {
    elements.distanceHelperText.textContent =
      "Click “Use My Location” to enable distance-based filtering.";
    return;
  }

  if (state.distanceRadiusKm > 0) {
    elements.distanceHelperText.textContent = `Showing restaurants within ${state.distanceRadiusKm} km of ${activeCenter.label}.`;
  } else {
    elements.distanceHelperText.textContent =
      "Choose a quick distance filter to narrow results, or press Reset to clear filters.";
  }
}

function applyFilters() {
  const restaurantQuery = elements.restaurantSearchInput.value
    .trim()
    .toLowerCase();

  let filtered = getRestaurantsWithComputedDistance();

  if (restaurantQuery) {
    filtered = filtered.filter((restaurant) => {
      const haystack = [
        restaurant.name,
        restaurant.description,
        restaurant.address,
        restaurant.city,
        ...(restaurant.tagsArray || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(restaurantQuery);
    });
  }

  if (state.selectedTag !== "all") {
    filtered = filtered.filter((restaurant) =>
      restaurant.tagsArray.some(
        (tag) => tag.toLowerCase() === state.selectedTag.toLowerCase(),
      ),
    );
  }

  if (state.distanceRadiusKm > 0) {
    filtered = filtered.filter(
      (restaurant) =>
        typeof restaurant.distanceKm === "number" &&
        restaurant.distanceKm <= state.distanceRadiusKm,
    );
  }

  if (getActiveDistanceCenter()) {
    filtered.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  state.filteredRestaurants = filtered;
  renderMarkers(filtered);
  renderResults(filtered);
  updateHelperText();
  updateQuickDistanceButtons();

  requestAnimationFrame(() => {
    updateMapAfterFilter(filtered);
  });
}

function handleReset() {
  elements.restaurantSearchInput.value = "";

  state.selectedTag = "all";
  state.distanceRadiusKm = 0;
  state.sourceMode = state.userLngLat ? "user" : "auto";

  renderTagButtons(state.restaurants);
  applyFilters();
}

function handleShowAll() {
  state.distanceRadiusKm = 0;
  updateQuickDistanceButtons();
  updateHelperText();
  applyFilters();
}

function attachEvents() {
  elements.useMyLocationBtn.addEventListener("click", () => {
    state.sourceMode = "user";
    state.distanceRadiusKm = 1;
    updateQuickDistanceButtons();
    addUserLocationToMap(true);
  });

  elements.resetBtn.addEventListener("click", handleReset);

  elements.toggleTagBtn.addEventListener("click", () => {
    setTagPanelOpen(!state.isTagPanelOpen);
  });

  elements.restaurantSearchInput.addEventListener("input", applyFilters);

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
        updateHelperText();
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
      await patchExistingRestaurantTags();
      state.restaurants = await getRestaurants();
      renderTagButtons(state.restaurants);
      setTagPanelOpen(false);

      // HotFix for map pins not displaying on load
      handleReset();

      //TODO I don't think the filters need to be applied on load
      //applyFilters();
      addUserLocationToMap(false);
    } catch (error) {
      console.error("Failed to load restaurant data:", error);
      elements.resultsList.innerHTML = `
        <div class="empty-state">Failed to load restaurant data.</div>
      `;
    }
  });

  attachEvents();
}

initializeMapPage();

function displayFilterPopup() {
  document.getElementById("map-filter-popup").style.display = "block";
}

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
