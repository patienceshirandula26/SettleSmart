/* =========================================================
   SettleSmart — registration

   A successful sign-up logs the student straight in. The backend
   also builds their checklist, documents and reminders, so the
   dashboard has real data on the very first visit.
   ========================================================= */

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("message");

/* ---------- Password strength ----------

   The same rules the backend enforces, shown live so students aren't
   guessing. The server checks them again on submit — this is only a
   convenience, never the actual protection.                             */

const passwordField = document.getElementById("password");
const strengthBox = document.getElementById("passwordStrength");
const strengthFill = document.getElementById("strengthFill");
const strengthLabel = document.getElementById("strengthLabel");
const rulesList = document.getElementById("passwordRules");

function checkRules(password) {
    const name = (document.getElementById("fullName").value || "").toLowerCase();
    const email = (document.getElementById("email").value || "").toLowerCase();
    const lowered = password.toLowerCase();

    const localPart = email.split("@")[0];

    const usesPersonal =
        (localPart.length > 3 && lowered.includes(localPart)) ||
        name.split(" ").some((part) => part.length > 3 && lowered.includes(part));

    return {
        length: password.length >= 8,
        letter: /[a-zA-Z]/.test(password),
        number: /[0-9]/.test(password),
        personal: password.length > 0 && !usesPersonal
    };
}

/* Beyond the minimum rules, reward length and variety. */
function scorePassword(password, rules) {
    if (!rules.length || !rules.letter || !rules.number || !rules.personal) {
        return { percent: 25, label: "Too weak", tone: "weak" };
    }

    let points = 0;
    if (password.length >= 10) points++;
    if (password.length >= 14) points++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points++;
    if (/[^A-Za-z0-9]/.test(password)) points++;

    if (points >= 3) return { percent: 100, label: "Strong", tone: "strong" };
    if (points >= 1) return { percent: 66, label: "Good", tone: "good" };

    return { percent: 45, label: "Fair", tone: "fair" };
}

function updateStrength() {
    const password = passwordField.value;
    const rules = checkRules(password);

    rulesList.querySelectorAll("li").forEach((item) => {
        item.classList.toggle("met", rules[item.dataset.rule]);
    });

    if (!password) {
        strengthBox.hidden = true;
        return;
    }

    const score = scorePassword(password, rules);

    strengthBox.hidden = false;
    strengthFill.style.width = `${score.percent}%`;
    strengthFill.className = `strength-fill ${score.tone}`;
    strengthLabel.textContent = score.label;
    strengthLabel.className = `strength-label ${score.tone}`;
}

if (passwordField) {
    passwordField.addEventListener("input", updateStrength);

    // Typing a name or email changes whether the password reuses them.
    document.getElementById("fullName").addEventListener("input", updateStrength);
    document.getElementById("email").addEventListener("input", updateStrength);
}

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const arrivalField = document.getElementById("arrivalDate");

        const payload = {
            full_name: document.getElementById("fullName").value.trim(),
            email: document.getElementById("email").value.trim(),
            university: document.getElementById("university").value.trim(),
            password: document.getElementById("password").value,
            arrival_date: arrivalField ? arrivalField.value : null
        };

        const submitButton = registerForm.querySelector("button[type='submit']");

        // Catch the obvious problems before troubling the server.
        const rules = checkRules(payload.password);
        const unmet = Object.entries(rules).find(([, passed]) => !passed);

        if (unmet) {
            setMessage("Please meet all the password requirements below.");
            passwordField.focus();
            return;
        }

        setMessage("");
        submitButton.disabled = true;
        submitButton.textContent = "Creating your account…";

        try {
            const data = await SettleSmart.api.post("/api/register", payload);

            SettleSmart.setUser(data.user);
            window.location.href = "dashboard.html";
        } catch (error) {
            setMessage(error.message);
            submitButton.disabled = false;
            submitButton.textContent = "Create Account";
        }
    });
}

function setMessage(text) {
    if (registerMessage) {
        registerMessage.textContent = text;
    } else if (text) {
        alert(text);
    }
}
