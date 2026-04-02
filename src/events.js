import { db, auth } from "./firebase.js";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import maplibregl from "maplibre-gl";


//-------------------------------------------------------
// Global variables to put somewhere at the top of your JS file
//-------------------------------------------------------
let formMap;                // New map instance for the form page
let selectedMarker = null;  // Marker to show selected location on the map
let selectedLngLat = null;  // Array to store selected longitude and latitude
let selectedAddress = null; // String to store the selected address from geocoding results

//------------------------------------------------------------
// This function initializes the Maplibre map for the form page.
// It sets up the map and adds navigation controls.
//-------------------------------------------------------------
function initFormMap() {
  formMap = new maplibregl.Map({
    container: "formMap",              //Unique ID of the div for displaying map
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.00163752324765, 49.25324576104826],    //Centred on BCIT :)
    zoom: 10
  });

  formMap.addControl(new maplibregl.NavigationControl(), "top-right");
}

initFormMap();   //Call it when the page loads

// --------------------------------------------
// Adds event listener to initialize the address search functionality 
// once the DOM is fully loaded.
//----------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  addAddressSearch();
});

//------------------------------------------------------------
// This function adds the Maplibre Geocoder control to the form map.
// It allows users to search for an address and select it, which will
// update the map and form fields with the selected location.
//
// This function is called once the DOM content is loaded.
//-------------------------------------------------------------
function addAddressSearch() {
  const geocoderApi = {
    forwardGeocode: async (config) => {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(config.query)}` +
        `&format=geojson&limit=5`;

      // Fetch geocoding results from the Nominatim API
      const response = await fetch(url);
      const geojson = await response.json();

      // Map the GeoJSON features to the format expected by the Maplibre Geocoder
      const features = geojson.features.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          place_name: feature.properties.display_name,
          text: feature.properties.display_name,
          place_type: ["place"],
          center: [lng, lat],
          properties: feature.properties
        };
      });

      return { features };
    }
  };

  // Create a new Maplibre Geocoder instance with the custom geocoder API
  const geocoder = new MaplibreGeocoder(geocoderApi, {
    maplibregl,
    placeholder: "Start typing an address",
    minLength: 2,
    showResultsWhileTyping: true,
    debounceSearch: 300
  });

  // Add the geocoder control to the map container
  const container = document.getElementById("addressSearch");
  container.appendChild(geocoder.onAdd());

  // Listen for the "result" event when a user selects an address from the geocoder results
  geocoder.on("result", (e) => {
    const [lng, lat] = e.result.center;
    const addressText = e.result.place_name;

    selectedLngLat = [lng, lat];
    selectedAddress = addressText;

    // Display the address
    document.getElementById("address").value = addressText;

    // Finally, update the map with the selected location
    setSelectedLocation(lng, lat);
  });
}

//------------------------------------------------------------
// This function updates the form map with the selected location.
// It moves the Marker to the new location and updates the form fields
// with the longitude, latitude.
//-------------------------------------------------------------
function setSelectedLocation(lng, lat) {

  // Check if a Marker object already exists. 
  // If it does, move it to the new location. 
  // Otherwise, create a new marker, add to the map.

  if (selectedMarker) {
    selectedMarker.setLngLat([lng, lat]);
  } else {
    selectedMarker = new maplibregl.Marker()
      .setLngLat([lng, lat])
      .addTo(formMap);
  }

  // Optionally, zoom the map to the selected location
  formMap.flyTo({
    center: [lng, lat],
    zoom: 15
  });
}

const eventForm = document.getElementById('event-form');

eventForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Check to see if user is logged in/authenticated
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to create an event.");
    return;
  }

  // Check if a location has been selected on the map
  if (!selectedLngLat) {
    alert("Please search for and select an address on the map.");
    return;
  }

  console.log("Starting unified upload to Firestore...");

  // Data gathering
  const [longitude, latitude] = selectedLngLat;
  const inputImage = localStorage.getItem("inputImage") || ""; // From savePost logic

  const combinedData = {
    // User Info
    owner: user.uid,

    // Form Fields
    name: document.getElementById('event-name').value,
    description: document.getElementById('event-desc').value, // Matches HTML ID
    time: document.getElementById('event-time').value,
    capacity: Number(document.getElementById('capacity').value) || 0,
    parking: document.getElementById('parking').value,
    isKidsFriendly: document.getElementById('kids-friendly').checked,

    // Location Data
    address: selectedAddress,
    location: {
      lat: latitude,
      lng: longitude
    },

    // Media & Metadata
    image: inputImage,
    last_updated: serverTimestamp()
  };

  try {
    // Saves to event collection
    const docRef = await addDoc(collection(db, "events"), combinedData);

    console.log("Document successfully written with ID: ", docRef.id);
    alert("Success! Event added to Firestore.");

    // Clean UI
    eventForm.reset();

    // Clear global map state
    selectedLngLat = null;
    selectedAddress = null;
    if (selectedMarker) {
      selectedMarker.remove();
      selectedMarker = null;
    }

    // Close the Modal
    const closeButton = document.querySelector('#eventModal [data-bs-dismiss="modal"]');
    if (closeButton) {
      closeButton.click();
    } else {
      window.location.reload();
    }

    // Refresh the list of events on the page
    if (typeof loadAllEvents === "function") {
      loadAllEvents();
    }

  } catch (error) {
    console.error("Error adding document: ", error);
    alert("Error! Check the browser console for details.");
  }
});

async function loadAllEvents() {
  const container = document.getElementById("results-list");
  if (!container) return;

  container.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "events"));

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const div = document.createElement("div");
      div.className = "event-card";

      div.innerHTML = `
  <h3>${data.name || "Untitled Event"}</h3>
    <p><strong>Description:</strong> ${data.description || "No description"}</p>
  <p><strong>Time:</strong> ${data.time || "TBD"}</p>
  <p><strong>Address:</strong> ${data.address || "No address provided"}</p>
  <hr>
  <p><strong>Capacity:</strong> ${data.capacity || "0"} people</p>
  <p><strong>Parking:</strong> ${data.parking || "Not specified"}</p>
  <p><strong>Kids Welcome:</strong> ${data.isKidsFriendly ? "Yes ✅" : "No ❌"}</p>
`;

      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading all events:", error);
    container.innerHTML = "<p>Failed to load events.</p>";
  }
}

loadAllEvents();