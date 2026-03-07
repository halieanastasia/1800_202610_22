import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "../styles/style.css";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { seedRestaurants } from './restaurants.js';
import "./navbar.js";

function sayHello() { }
// document.addEventListener('DOMContentLoaded', sayHello);






seedRestaurants();