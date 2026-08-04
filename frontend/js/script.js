/* =========================================================
   SettleSmart — login
   ========================================================= */

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("message");

if (loginForm) {
    // Already signed in? Skip straight to the dashboard.
    if (SettleSmart.getUser()) {
        window.location.href = "dashboard.html";
    }

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const submitButton = loginForm.querySelector("button[type='submit']");

        showMessage("");
        setBusy(submitButton, true, "Signing in…");

        try {
            const data = await SettleSmart.api.post("/api/login", { email, password });

            SettleSmart.setUser(data.user);
            window.location.href = "dashboard.html";
        } catch (error) {
            showMessage(error.message);
            setBusy(submitButton, false, "Log In");
        }
    });
}

function showMessage(text) {
    if (loginMessage) {
        loginMessage.textContent = text;
    } else if (text) {
        alert(text);
    }
}

function setBusy(button, busy, label) {
    if (!button) return;

    button.disabled = busy;
    button.textContent = label;
}
