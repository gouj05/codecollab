
document.addEventListener("DOMContentLoaded", () => {
    // 1. Define the destination login/signup URLs
    const LOGIN_URL = "http://127.0.0.1:8000/auth/login"; 
    const SIGNUP_URL = "http://127.0.0.1:8000/auth/login"; 

    // 2. Select elements by targeting specific text content or classes safely
    const actionButtons = document.querySelectorAll("a, button");

    actionButtons.forEach(button => {
        const buttonText = button.textContent.trim().toLowerCase();

        // Check for "Sign In" clicks
        if (buttonText === "sign in") {
            button.addEventListener("click", (e) => {
                e.preventDefault(); // Stop standard hash/empty anchor behavior
                window.location.href = LOGIN_URL; // Redirect to the login page
            });
        }

        // Check for "Get Started" or "Start Coding Now" clicks
        if (buttonText === "get started" || buttonText.includes("start coding now")) {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href = SIGNUP_URL; // Redirect to the signup page
            });
        }
    });
});