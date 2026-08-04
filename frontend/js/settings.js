/* =========================================================
   SettleSmart — settings

   Notification toggles and the language choice save as soon as
   they change. The security section changes the account password.
   ========================================================= */

(function () {
    "use strict";

    const user = SettleSmart.getUser();
    if (!user) return;

    const toggles = {
        email_notifications: document.getElementById("toggleEmail"),
        sms_reminders: document.getElementById("toggleSms"),
        push_notifications: document.getElementById("togglePush")
    };

    const languageSelect = document.getElementById("languageSelect");
    const passwordForm = document.getElementById("passwordForm");

    if (!languageSelect && !passwordForm) return;

    /* ---------- Preferences ---------- */

    async function loadSettings() {
        try {
            const settings = await SettleSmart.api.get(`/api/settings/${user.user_id}`);

            Object.entries(toggles).forEach(([key, input]) => {
                if (input) input.checked = Boolean(settings[key]);
            });

            if (languageSelect && settings.language) {
                languageSelect.value = settings.language;
            }
        } catch (error) {
            console.error(error);
            SettleSmart.toast("Couldn't load your settings", "error");
        }
    }

    async function saveSettings() {
        const payload = { language: languageSelect ? languageSelect.value : undefined };

        Object.entries(toggles).forEach(([key, input]) => {
            if (input) payload[key] = input.checked;
        });

        try {
            await SettleSmart.api.put(`/api/settings/${user.user_id}`, payload);
            SettleSmart.toast("Settings saved");
        } catch (error) {
            SettleSmart.toast(error.message, "error");
            loadSettings();
        }
    }

    Object.values(toggles).forEach((input) => {
        if (input) input.addEventListener("change", saveSettings);
    });

    if (languageSelect) {
        languageSelect.addEventListener("change", saveSettings);
    }

    /* ---------- Password ---------- */

    if (passwordForm) {
        passwordForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const current = document.getElementById("currentPassword");
            const next = document.getElementById("newPassword");
            const confirm = document.getElementById("confirmPassword");
            const button = passwordForm.querySelector("button[type='submit']");

            if (next.value !== confirm.value) {
                SettleSmart.toast("The two new passwords don't match", "error");
                return;
            }

            button.disabled = true;
            button.textContent = "Updating…";

            try {
                await SettleSmart.api.put(`/api/profile/${user.user_id}/password`, {
                    current_password: current.value,
                    new_password: next.value
                });

                passwordForm.reset();
                SettleSmart.toast("Password updated");
            } catch (error) {
                SettleSmart.toast(error.message, "error");
            } finally {
                button.disabled = false;
                button.textContent = "Update password";
            }
        });
    }

    loadSettings();
})();
