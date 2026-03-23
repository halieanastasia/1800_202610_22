const signupForm = document.getElementById("signup-form");
const homeBtn = document.getElementById("go-home-btn");

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("signup-name")?.value.trim();
    const email = document.getElementById("signup-email")?.value.trim();
    const password = document.getElementById("signup-password")?.value.trim();

    console.log("Signup form submitted:", { name, email, password });

    alert("Signup submitted successfully.");
    window.location.href = "./index.html";
  });
}

if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    window.location.href = "./index.html";
  });
}