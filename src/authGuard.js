import { auth } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";

// export function requireAuth() {
//   onAuthStateChanged(auth, (user) => {
//     if (!user) {
//       window.location.href = "./login-halie.html";
//     }
//   });
// }
