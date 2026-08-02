// SettleSmart — Registration
const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const university = document.getElementById("university").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://127.0.0.1:5000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    university: university,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Log the new user straight in, same as a successful login.
                localStorage.setItem("user", JSON.stringify(data.user));
                window.location.href = "dashboard.html";
            } else if (message) {
                message.textContent = data.message;
            }
        } catch (error) {
            if (message) {
                message.textContent = "Unable to connect to the server.";
            }
            console.error(error);
        }
    });
}
