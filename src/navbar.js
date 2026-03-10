async function loadNavbar() {
  const holder = document.getElementById("navbar-placeholder");
  if (!holder) return;

  const res = await fetch("/components/navbar.html");
  holder.innerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", loadNavbar);