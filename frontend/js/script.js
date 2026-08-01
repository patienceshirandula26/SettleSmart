const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

// Handle login only when the current page contains the login form.
if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            // Send the user's credentials to the Flask login API.
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
                // Save the logged-in user's details for use on other pages.
                localStorage.setItem("user", JSON.stringify(data.user));

                // login.html is already inside frontend/pages/.
                window.location.href = "dashboard.html";
            } else if (message) {
                message.textContent = data.message;
            } else {
                alert(data.message);
            }
        } catch (error) {
            if (message) {
                message.textContent = "Unable to connect to the server.";
            } else {
                alert("Unable to connect to the server.");
            }

            console.error(error);
        }
    });
}

// Filter document rows as the user types in the search box.
const documentSearch = document.getElementById("documentSearch");
const documentsTableBody = document.getElementById("documentsTableBody");

if (documentSearch && documentsTableBody) {
    documentSearch.addEventListener("input", function () {
        const query = documentSearch.value.trim().toLowerCase();
        const rows = documentsTableBody.querySelectorAll("tr");

        rows.forEach(function (row) {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? "" : "none";
        });
    });
}
