/* =========================================================
   SettleSmart — profile

   Shows the student's details and their settlement stats, and
   lets them edit their own information in place.
   ========================================================= */

(function () {
    "use strict";

    const user = SettleSmart.getUser();
    if (!user) return;

    /* ---------- Stat cards ---------- */

    async function loadStats() {
        const progressEl = document.getElementById("statProgress");
        const docsEl = document.getElementById("statDocs");
        const tasksEl = document.getElementById("statTasks");

        if (!progressEl) return;

        try {
            const data = await SettleSmart.api.get(`/api/dashboard/${user.user_id}`);

            progressEl.textContent = `${data.progress.percent}%`;
            docsEl.textContent =
                `${data.stats.documents_uploaded}/${data.stats.documents_total}`;
            tasksEl.textContent =
                `${data.progress.completed}/${data.progress.total}`;
        } catch (error) {
            console.error("Couldn't load profile stats:", error.message);
        }
    }

    /* ---------- Edit mode ---------- */

    const editProfileBtn = document.getElementById("editProfileBtn");
    const cancelEditProfile = document.getElementById("cancelEditProfile");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const profileEditActions = document.getElementById("profileEditActions");

    const inputs = {
        full_name: document.getElementById("editFullName"),
        university: document.getElementById("editUniversity"),
        phone: document.getElementById("editPhone"),
        home_country: document.getElementById("editCountry"),
        arrival_date: document.getElementById("editArrival")
    };

    // Each editable field sits next to the paragraph it replaces.
    const displays = [
        "[data-user-name]",
        "[data-user-university]",
        "[data-user-phone]",
        "[data-user-country]",
        "[data-user-arrival]"
    ].map((selector) => document.querySelector(`#personalInfoSection ${selector}`));

    function showInputs(editing) {
        displays.forEach((element) => {
            if (element) element.hidden = editing;
        });

        Object.values(inputs).forEach((input) => {
            if (input) input.hidden = !editing;
        });

        profileEditActions.hidden = !editing;
        editProfileBtn.hidden = editing;
    }

    function enterEditMode() {
        const current = SettleSmart.getUser();

        inputs.full_name.value = current.full_name || "";
        inputs.university.value = current.university || "";
        inputs.phone.value = current.phone || "";
        inputs.home_country.value = current.home_country || "";
        inputs.arrival_date.value = current.arrival_date
            ? String(current.arrival_date).slice(0, 10)
            : "";

        showInputs(true);
    }

    async function saveProfile() {
        const payload = {
            full_name: inputs.full_name.value.trim(),
            university: inputs.university.value.trim(),
            phone: inputs.phone.value.trim(),
            home_country: inputs.home_country.value.trim(),
            arrival_date: inputs.arrival_date.value || null
        };

        if (!payload.full_name) {
            SettleSmart.toast("Full name can't be empty", "error");
            return;
        }

        saveProfileBtn.disabled = true;
        saveProfileBtn.textContent = "Saving…";

        try {
            const data = await SettleSmart.api.put(
                `/api/profile/${user.user_id}`, payload
            );

            SettleSmart.setUser(data.user);
            SettleSmart.toast("Profile updated");
            window.location.reload();
        } catch (error) {
            SettleSmart.toast(error.message, "error");
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = "Save changes";
        }
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", enterEditMode);
        cancelEditProfile.addEventListener("click", () => showInputs(false));
        saveProfileBtn.addEventListener("click", saveProfile);
    }

    loadStats();
})();
