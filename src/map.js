import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
