import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Add this to the top of your JS file
// Database initialized
import { db } from "./firebase.js";
// Functions needed to read from database
import { collection, getDocs } from "firebase/firestore";

// ------------------------------------------------------------
// Global variable to store user location, restaurant data
// ------------------------------------------------------------
const appState = {
  restaurants: [],
  userLngLat: null,
};

// ------------------------------------------------------------
// This top level function initializes the MapLibre map, adds controls
// It waits for the map to load before trying to add sources/layers.
// ------------------------------------------------------------
function showMap() {
  // Initialize MapLibre
  // Centered at Vancouver
  const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.1244189912157, 49.28304910906851],
    zoom: 10,
  });

  // Add controls (zoom, rotation, etc.) shown in top-right corner of map
  addControls(map);

  // Once the map loads, we can add the user location and restaurant markers, etc.
  // We wait for the "load" event to ensure the map is fully initialized before we try to add sources/layers.
  map.once("load", async () => {
    // Choose either the built-in geolocate control or the manual pin method
    // addGeolocationControl(map);
    await addGeolocationControl(map);
    console.log("map loaded, placed user pin!");

    await showRestaurants(map);
    await zoomToAll(map);
  });

  function addControls(map) {
    // Zoom and rotation
    map.addControl(new maplibregl.NavigationControl(), "top-right");
  }
}

showMap();

function addGeolocationControl(map) {
  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  });
  map.addControl(geolocate, "top-right");

  // Optional: trigger a locate once the control is added
  geolocate.on("trackuserlocationstart", () => {
    // You can react to tracking start here if needed
  });
}

// ------------------------------------------------------------
// Gets the restaurant data from Firestore.
// It assumes each restaurant entry has a "lat" and "lng" fields.
// ------------------------------------------------------------
async function getRestaurants() {
  // Get all documents from the "restaurant" collection in Firestore
  const restaurants = await getDocs(collection(db, "restaurants"));

  // Convert Firestore documents (restaurants) to plain JavaScript objects
  // And returns an array containing the documents (restaurants) in json format)
  console.log("getting restaurants");
  return restaurants.docs.map((doc) => doc.data());
}

// ------------------------------------------------------------
// Takes the restaurant data and adds location pins to the map.
// It also stores the restaurant data in a global variable for later use (e.g., zooming).
// ------------------------------------------------------------
async function showRestaurants(map) {
  // Store restaurant data from Firestore database in the "restaurants" array
  const restaurants = await getRestaurants();

  // Loop through each restaurant document and add a green pin to the map
  restaurants.forEach((doc) => {
    // Store restaurant data in global variable (array)
    // for later use (e.g., zooming to all points)
    appState.restaurants.push(doc);
    console.log("adding restaurant");

    // create the location pin
    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = "green";
    el.style.border = "2px solid white";

    // new layer with markers, add to map
    new maplibregl.Marker({ element: el })
      .setLngLat([doc.location.longitude, doc.location.latitude])
      .addTo(map);
  });
}

// ------------------------------------------------------------
// This function calculates the bounding box that includes both the user location and all restaurant locations,
// and then zooms the map to fit that bounding box with some padding.
// It uses the MapLibre "fitBounds" method to smoothly zoom and pan the map.
// ------------------------------------------------------------
async function zoomToAll(map) {
  const bounds = new maplibregl.LngLatBounds();

  // user location
  console.log("User location:", appState.userLngLat);
  bounds.extend(appState.userLngLat);

  // restaurant locations
  console.log("Restaurant data:", appState.restaurants);
  appState.restaurants.forEach((post) => {
    console.log(
      `Adding post to bounds: ${post.name} at [${post.lng}, ${post.lat}]`,
    );
    bounds.extend([post.location.longitude, post.location.latitude]);
  });

  map.fitBounds(bounds, {
    padding: 80,
    duration: 1000,
  });
}
