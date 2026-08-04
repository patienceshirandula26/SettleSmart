/* =========================================================
   SettleSmart — reminders

   Reminders live in the database, so they follow the student to
   any device and feed the "Upcoming Reminders" panel and the
   reminder count on the dashboard.
   ========================================================= */

(function () {
    "use strict";

    const user = SettleSmart.getUser();
    if (!user) return;

    const escape = SettleSmart.escapeHtml;

    const reminderModal = document.getElementById("reminderModal");
    const reminderForm = document.getElementById("reminderForm");
    const reminderList = document.getElementById("reminderList");
    const reminderCount = document.getElementById("reminderCount");
    const emptyMessage = document.getElementById("emptyMessage");
    const searchInput = document.getElementById("searchInput");
    const createReminderButton = document.getElementById("createReminderButton");
    const reminderTitle = document.getElementById("reminderTitle");
    const reminderDate = document.getElementById("reminderDate");
    const reminderCategory = document.getElementById("reminderCategory");

    if (!reminderList) return;

    let reminders = [];
    let searchQuery = "";

    /* Colour of the dot beside each reminder. */
    function categorySlug(category) {
        const slugs = {
            "Identity & Study": "study",
            "Financial": "financial",
            "Transport & Licensing": "transport",
            "Health": "health",
            "Accommodation": "housing",
            "Work Clearances": "visa",
            "Communication": "general",
            "Employment": "study"
        };

        return slugs[category] || String(category || "general").toLowerCase();
    }

    function dueLabel(reminder) {
        if (reminder.is_done) return "Done";

        const days = reminder.days_away;

        if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
        if (days === 0) return "Today";
        if (days === 1) return "Tomorrow";
        if (days <= 14) return `In ${days} days`;

        return SettleSmart.formatDate(reminder.reminder_date);
    }

    /* ---------- Rendering ---------- */

    function visibleReminders() {
        const query = searchQuery.trim().toLowerCase();

        if (!query) return reminders;

        return reminders.filter((reminder) =>
            `${reminder.title} ${reminder.category || ""}`.toLowerCase().includes(query)
        );
    }

    function render() {
        const visible = visibleReminders();
        const open = reminders.filter((reminder) => !reminder.is_done).length;

        reminderCount.textContent =
            `${open} open · ${reminders.length} total`;

        reminderList.innerHTML = visible.map((reminder) => `
            <div class="reminder-item${reminder.is_done ? " is-done" : ""}">
                <span class="reminder-dot ${categorySlug(reminder.category)}"></span>

                <span class="reminder-title" title="${escape(reminder.title)}">
                    ${escape(reminder.title)}
                </span>

                <span class="reminder-date${reminder.is_overdue ? " is-overdue" : ""}">
                    ${escape(dueLabel(reminder))}
                </span>

                <span class="reminder-actions">
                    <button type="button" class="done-reminder-button"
                            data-id="${reminder.reminder_id}"
                            data-done="${reminder.is_done ? "1" : "0"}"
                            title="${reminder.is_done ? "Mark as still open" : "Mark as done"}">
                        ${reminder.is_done ? "↺" : "✓"}
                    </button>

                    <button type="button" class="delete-reminder-button"
                            data-id="${reminder.reminder_id}"
                            data-title="${escape(reminder.title)}"
                            aria-label="Delete ${escape(reminder.title)}">×</button>
                </span>
            </div>
        `).join("");

        emptyMessage.hidden = visible.length !== 0;

        reminderList.querySelectorAll(".done-reminder-button").forEach((button) => {
            button.addEventListener("click", () => toggleDone(button));
        });

        reminderList.querySelectorAll(".delete-reminder-button").forEach((button) => {
            button.addEventListener("click", () => removeReminder(button));
        });
    }

    /* ---------- Actions ---------- */

    async function toggleDone(button) {
        button.disabled = true;

        try {
            await SettleSmart.api.put(`/api/reminders/${button.dataset.id}`, {
                is_done: button.dataset.done !== "1"
            });

            await load();
        } catch (error) {
            button.disabled = false;
            SettleSmart.toast(error.message, "error");
        }
    }

    async function removeReminder(button) {
        if (!window.confirm(`Delete the reminder "${button.dataset.title}"?`)) return;

        button.disabled = true;

        try {
            await SettleSmart.api.remove(`/api/reminders/${button.dataset.id}`);

            reminders = reminders.filter(
                (reminder) => String(reminder.reminder_id) !== String(button.dataset.id)
            );

            render();
            SettleSmart.toast("Reminder deleted");
        } catch (error) {
            button.disabled = false;
            SettleSmart.toast(error.message, "error");
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const submitButton = reminderForm.querySelector("button[type='submit']");

        submitButton.disabled = true;
        submitButton.textContent = "Saving…";

        try {
            await SettleSmart.api.post("/api/reminders", {
                user_id: user.user_id,
                title: reminderTitle.value.trim(),
                reminder_date: reminderDate.value,
                category: reminderCategory ? reminderCategory.value : null
            });

            closeModal();
            await load();
            SettleSmart.toast("Reminder created");
        } catch (error) {
            SettleSmart.toast(error.message, "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Save Reminder";
        }
    }

    /* ---------- Modal ---------- */

    function openModal() {
        reminderForm.reset();

        // Default to a week from today so the date field is never empty.
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        reminderDate.value = nextWeek.toISOString().slice(0, 10);

        reminderModal.hidden = false;
        reminderTitle.focus();
    }

    function closeModal() {
        reminderModal.hidden = true;
    }

    /* ---------- Load ---------- */

    async function load() {
        try {
            reminders = await SettleSmart.api.get(`/api/reminders/${user.user_id}`);
            render();
        } catch (error) {
            console.error(error);
            reminderCount.textContent = "Couldn't load reminders";
            emptyMessage.hidden = false;
            SettleSmart.toast(
                "Couldn't reach the server. Is python3 backend/app.py running?",
                "error"
            );
        }
    }

    /* ---------- Wiring ---------- */

    createReminderButton.addEventListener("click", openModal);
    reminderForm.addEventListener("submit", handleSubmit);

    document.querySelectorAll("[data-close-modal]").forEach((element) => {
        element.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !reminderModal.hidden) closeModal();
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            searchQuery = searchInput.value;
            render();
        });
    }

    load();
})();
