/* =========================================================
   SettleSmart — logged-in user

   Runs on every page inside the app. It guards the page,
   fills in the sidebar/top bar, and keeps the stored copy of
   the user in step with the database.
   ========================================================= */

const loggedInUser = SettleSmart.requireUser();

if (loggedInUser) {
    paintUser(loggedInUser);
    refreshUserFromServer();
    wireLogout();
    wireTopbarSearch();
    wireNotificationBell();
}

/* Someone on their first day hasn't started a journey yet, so both the
   greeting and the line under it change. Anything created today counts
   as a first visit. */
function isFirstVisit(user) {
    const created = user.created_at
        ? new Date(String(user.created_at).replace(" ", "T"))
        : null;

    return Boolean(
        created && !isNaN(created) &&
        created.toDateString() === new Date().toDateString()
    );
}

function greetingFor(user) {
    const firstName = (user.full_name || "Student").split(" ")[0];

    return isFirstVisit(user)
        ? `Welcome to SettleSmart, ${firstName} 👋`
        : `Welcome back, ${firstName} 👋`;
}

function subtitleFor(user) {
    return isFirstVisit(user)
        ? "Start your settlement journey in Australia."
        : "Continue your settlement journey in Australia.";
}

/* Fill in every element tagged with a data-user-* attribute. */
function paintUser(user) {
    const fullName = user.full_name || "Student";

    const values = {
        "data-user-name": fullName,
        "data-user-email": user.email || "",
        "data-user-university": user.university || "Not set",
        "data-user-arrival": user.arrival_date
            ? SettleSmart.formatDate(user.arrival_date)
            : "Not set",
        "data-user-phone": user.phone || "Not set",
        "data-user-country": user.home_country || "Not set",
        "data-user-initials": SettleSmart.initials(fullName),
        "data-user-welcome": greetingFor(user),
        "data-user-subtitle": subtitleFor(user)
    };

    Object.entries(values).forEach(([attribute, value]) => {
        document.querySelectorAll(`[${attribute}]`).forEach((element) => {
            element.textContent = value;
        });
    });
}

/* Another device (or the profile page) may have changed the details. */
async function refreshUserFromServer() {
    try {
        const fresh = await SettleSmart.api.get(`/api/profile/${loggedInUser.user_id}`);

        SettleSmart.setUser(fresh);
        paintUser(fresh);
    } catch (error) {
        // Offline or the backend isn't running — the stored copy still works.
        console.warn("Could not refresh profile:", error.message);
    }
}

function wireLogout() {
    document.querySelectorAll(".logout-link, #logoutLink").forEach((link) => {
        link.addEventListener("click", function () {
            SettleSmart.clearUser();
        });
    });
}

/* ---------- Notification bell ----------

   The bell sits in the top bar on most pages. Clicking it opens a panel
   listing anything overdue or due in the next week, and the dot beside it
   only appears when there is actually something to see.                    */

function wireNotificationBell() {
    // Two pages were built with slightly different bell markup.
    const bells = document.querySelectorAll(".bell, .notification-button");
    if (!bells.length) return;

    const panel = buildNotificationPanel();
    let items = [];
    let loaded = false;

    bells.forEach((bell) => {
        bell.setAttribute("aria-expanded", "false");

        bell.addEventListener("click", async (event) => {
            event.stopPropagation();

            const isOpen = panel.classList.toggle("open");
            bell.setAttribute("aria-expanded", String(isOpen));

            if (!isOpen) return;

            positionPanel(panel, bell);

            if (!loaded) {
                await loadNotifications();
            }
        });
    });

    // Clicking anywhere else closes the panel.
    document.addEventListener("click", (event) => {
        if (!panel.contains(event.target)) {
            panel.classList.remove("open");
            bells.forEach((bell) => bell.setAttribute("aria-expanded", "false"));
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") panel.classList.remove("open");
    });

    async function loadNotifications() {
        try {
            const data = await SettleSmart.api.get(
                `/api/notifications/${loggedInUser.user_id}`
            );

            items = data.items;
            loaded = true;

            renderPanel(panel, items);
            updateDots(data.count, data.overdue);
        } catch (error) {
            panel.querySelector(".notif-list").innerHTML =
                '<p class="notif-empty">Couldn\'t load notifications.</p>';
        }
    }

    // Load once on arrival so the dot is accurate before anything is clicked.
    loadNotifications();
}

function buildNotificationPanel() {
    const panel = document.createElement("div");
    panel.className = "notif-panel";
    panel.innerHTML = `
        <div class="notif-header">
            <strong>Notifications</strong>
            <span class="notif-sub">Overdue and due this week</span>
        </div>
        <div class="notif-list"><p class="notif-empty">Loading…</p></div>
    `;

    document.body.appendChild(panel);
    return panel;
}

function positionPanel(panel, bell) {
    const box = bell.getBoundingClientRect();

    panel.style.top = `${box.bottom + window.scrollY + 10}px`;

    // Keep the panel on screen when the bell sits near the right edge.
    const left = Math.min(
        box.left + window.scrollX - 150,
        window.innerWidth - panel.offsetWidth - 16
    );

    panel.style.left = `${Math.max(16, left)}px`;
}

function renderPanel(panel, items) {
    const list = panel.querySelector(".notif-list");
    const escape = SettleSmart.escapeHtml;

    if (!items.length) {
        list.innerHTML =
            '<p class="notif-empty">Nothing due this week. You\'re all caught up. 🎉</p>';
        return;
    }

    list.innerHTML = items.map((item) => {
        const when = item.days < 0
            ? `${Math.abs(item.days)} day${Math.abs(item.days) === 1 ? "" : "s"} overdue`
            : item.days === 0 ? "Due today"
            : item.days === 1 ? "Due tomorrow"
            : `Due in ${item.days} days`;

        const tone = item.days < 0 ? "overdue" : item.days <= 2 ? "soon" : "";

        return `
            <a class="notif-item ${tone}" href="${escape(item.link)}">
                <span class="notif-icon">${item.type === "reminder" ? "🔔" : "✓"}</span>
                <span class="notif-text">
                    <span class="notif-title">${escape(item.title)}</span>
                    <span class="notif-meta">${escape(item.detail)} · ${escape(when)}</span>
                </span>
            </a>
        `;
    }).join("");
}

/* The dot is hidden by default and only turns on when something is waiting. */
function updateDots(count, overdue) {
    document.querySelectorAll(".bell-dot, .notification-dot").forEach((dot) => {
        dot.style.display = count > 0 ? "" : "none";
        dot.classList.toggle("is-overdue", overdue > 0);
    });

    document.querySelectorAll(".bell, .notification-button").forEach((bell) => {
        bell.setAttribute(
            "aria-label",
            count > 0 ? `Notifications, ${count} waiting` : "Notifications, none waiting"
        );
    });
}

/* The top bar search box has nothing to search on most pages, so
   pressing Enter jumps to Documents and re-uses the filter there. */
function wireTopbarSearch() {
    document.querySelectorAll(".search-box input[type='search']").forEach((input) => {
        input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;

            const query = input.value.trim();
            if (!query) return;

            window.location.href = `documents.html?q=${encodeURIComponent(query)}`;
        });
    });
}
