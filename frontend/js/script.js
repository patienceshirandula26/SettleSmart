const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = "pages/dashboard.html";
        } else {
            message.textContent = data.message;
        }
    } catch (error) {
        message.textContent = "Unable to connect to the server.";
        console.error(error);
    }
});