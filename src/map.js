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
  // Centered at BCIT
  const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.00163752324765, 49.25324576104826],
    zoom: 10,
  });

  // Add controls (zoom, rotation, etc.) shown in top-right corner of map
  addControls(map);

  // Once the map loads, we can add the user location and hike markers, etc.
  // We wait for the "load" event to ensure the map is fully initialized before we try to add sources/layers.
  map.once("load", async () => {
    // Choose either the built-in geolocate control or the manual pin method
    // addGeolocationControl(map);
    await addGeolocationControl(map);
    console.log("map loaded, placed user pin!");
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
// This function fetches restaurant data (converted to JSON)
// from Firestore and adds green pins to the map.
// It assumes each restaurant document has "lat" and "lng" fields.
// ------------------------------------------------------------
async function getRestaurants() {
  // Fetch all documents from the "restaurant" collection in Firestore
  const snapshot = await getDocs(collection(db, "restaurant"));

  // Convert Firestore documents to plain JavaScript objects
  // And returns a new array (list of the documents, json format)
  // Equivalent to doing this:
  //   const hikes = [];
  //   for (const doc of snapshot.docs) {
  //       hikes.push(doc.data());

  return snapshot.docs.map((doc) => doc.data());
}

// ------------------------------------------------------------
// This function takes the restaurant data and adds green pins to the map.
// It also stores the restaurant data in a global variable for later use (e.g., zooming).
// ------------------------------------------------------------
async function showRestaurants(map) {
  // Fetch hike data from Firestore
  const snapshot = await getRestaurants();

  // Loop through each restaurant document and add a green pin to the map
  snapshot.forEach((doc) => {
    // Store restaurant data in global variable (array)
    // for later use (e.g., zooming to all points)
    appState.restaurants.push(doc);

    // create green pin
    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = "green";
    el.style.border = "2px solid white";

    // new layer with markers, add to map
    new maplibregl.Marker({ element: el })
      .setLngLat([doc.lng, doc.lat])
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

  // hikes locations
  console.log("Hikes data:", appState.restaurants);
  appState.restaurants.forEach((post) => {
    console.log(
      `Adding post to bounds: ${post.name} at [${post.lng}, ${post.lat}]`,
    );
    bounds.extend([post.lng, post.lat]);
  });

  map.fitBounds(bounds, {
    padding: 80,
    duration: 1000,
  });
}
