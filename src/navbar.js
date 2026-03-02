async function loadNavbar() {
  const holder = document.getElementById("navbar-placeholder");
  if (!holder) return;

  const res = await fetch("/components/navbar.html");
  holder.innerHTML = await res.text();

  document.getElementById("nav-map")?.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Map clicked");
  });

  document.getElementById("nav-favourites")?.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Favourites clicked");
  });

  document.getElementById("nav-settings")?.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Settings clicked");
  });
}

document.addEventListener("DOMContentLoaded", loadNavbar);