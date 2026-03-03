
const openBtn = document.getElementById('open-modal-btn');
const closeBtn = document.getElementById('close-modal-btn');
const dialog = document.getElementById('signup-dialog');

openBtn.addEventListener('click', () => {
    dialog.showModal();
});

closeBtn.addEventListener('click', () => {
    dialog.close();
});

const form = document.getElementById('signup-form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    console.log('Form submitted!');
    dialog.close();
});
const redirectBtn = document.getElementById('signup-redirect-btn');

redirectBtn.addEventListener('click', () => {
    // window.location.href changes the current URL of the browser
    window.location.href = 'signup.html';
});