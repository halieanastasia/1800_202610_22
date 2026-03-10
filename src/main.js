import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "../styles/style.css";
import { seedRestaurants } from "./restaurants.js";
import "./navbar.js";

function sayHello() { }
// document.addEventListener('DOMContentLoaded', sayHello);






seedRestaurants();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  // collect the data
  // save to Firebase / Firestore
  // Show toast
  const toast = document.getElementById('success-toast');
  toast.classList.add('show');

  // Hide toast and redirect after 2.5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    
    // Redirect to index.html
    window.location.href = 'index.html';
  }, 2500);   // 2.5 seconds for visible time
});

setTimeout(() => {
  toast.style.opacity = '0';   // start fade out

  setTimeout(() => {
    toast.classList.remove('show');
    window.location.href = 'index.html';
  }, 600);   // wait for fade to finish
}, 2000);    // show for 2 seconds, then fade then redirect
seedRestaurants();
