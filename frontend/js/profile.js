const currentUser = JSON.parse(localStorage.getItem("user"));

if (currentUser) {
    fetch(`http://127.0.0.1:5000/api/profile/${currentUser.user_id}`)
        .then((response) => response.json())
        .then((user) => {
            // Save the latest user information returned by the database.
            localStorage.setItem("user", JSON.stringify(user));
        })
        .catch((error) => {
            console.error("Unable to load profile information:", error);
        });
}

const logoutLink = document.getElementById("logoutLink");

if (logoutLink) {
    logoutLink.addEventListener("click", function () {
        localStorage.removeItem("user");
    });
}

// ---------- Edit profile ----------

const editProfileBtn = document.getElementById("editProfileBtn");
const cancelEditProfile = document.getElementById("cancelEditProfile");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileEditActions = document.getElementById("profileEditActions");

const nameDisplay = document.querySelector("#personalInfoSection [data-user-name]");
const universityDisplay = document.querySelector("#personalInfoSection [data-user-university]");
const arrivalDisplay = document.querySelector("#personalInfoSection [data-user-arrival]");

const editFullName = document.getElementById("editFullName");
const editUniversity = document.getElementById("editUniversity");
const editArrival = document.getElementById("editArrival");

function enterEditMode() {
    if (!currentUser) return;

    editFullName.value = currentUser.full_name || "";
    editUniversity.value = currentUser.university || "";
    editArrival.value = currentUser.arrival_date ? currentUser.arrival_date.slice(0, 10) : "";

    [nameDisplay, universityDisplay, arrivalDisplay].forEach((el) => { if (el) el.hidden = true; });
    [editFullName, editUniversity, editArrival].forEach((el) => { el.hidden = false; });

    profileEditActions.hidden = false;
    editProfileBtn.hidden = true;
}

function exitEditMode() {
    [nameDisplay, universityDisplay, arrivalDisplay].forEach((el) => { if (el) el.hidden = false; });
    [editFullName, editUniversity, editArrival].forEach((el) => { el.hidden = true; });

    profileEditActions.hidden = true;
    editProfileBtn.hidden = false;
}

async function saveProfile() {
    if (!currentUser) return;

    const payload = {
        full_name: editFullName.value.trim(),
        university: editUniversity.value.trim(),
        arrival_date: editArrival.value || null
    };

    if (!payload.full_name) {
        alert("Full name can't be empty.");
        return;
    }

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Saving…";

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/profile/${currentUser.user_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to save profile");
        }

        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.reload();
    } catch (error) {
        console.error(error);
        alert("Could not save your changes. Is the backend server running?");
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = "Save changes";
    }
}

if (editProfileBtn) {
    editProfileBtn.addEventListener("click", enterEditMode);
    cancelEditProfile.addEventListener("click", exitEditMode);
    saveProfileBtn.addEventListener("click", saveProfile);
}