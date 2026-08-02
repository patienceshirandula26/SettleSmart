// Load the user saved after a successful login.
const loggedInUser = JSON.parse(localStorage.getItem("user"));

if (!loggedInUser) {
    // A user must log in before accessing the application pages.
    window.location.href = "login.html";
} else {
    const fullName = loggedInUser.full_name || "Student";
    const email = loggedInUser.email || "";
    const university = loggedInUser.university || "";
    const arrivalDate = loggedInUser.arrival_date || "";

    // Create initials such as "PS" or "FU".
    const initials = fullName
        .split(" ")
        .filter(Boolean)
        .map((name) => name.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // Update every element marked with these data attributes.
    document.querySelectorAll("[data-user-name]").forEach((element) => {
        element.textContent = fullName;
    });

    document.querySelectorAll("[data-user-email]").forEach((element) => {
        element.textContent = email;
    });

    document.querySelectorAll("[data-user-university]").forEach((element) => {
        element.textContent = university;
    });

    document.querySelectorAll("[data-user-arrival]").forEach((element) => {
        element.textContent = arrivalDate;
    });

    document.querySelectorAll("[data-user-initials]").forEach((element) => {
        element.textContent = initials;
    });

    document.querySelectorAll("[data-user-welcome]").forEach((element) => {
        element.textContent = `Welcome back, ${fullName.split(" ")[0]} 👋`;
    });

    // Any element with class "logout-link" clears the session, on every page.
    document.querySelectorAll(".logout-link").forEach((link) => {
        link.addEventListener("click", function () {
            localStorage.removeItem("user");
        });
    });

    // The generic topbar search box doesn't have anywhere on-page to search
    // (dashboard, profile, resources, settings). Pressing Enter jumps to the
    // Documents page and re-uses its existing search/filter there.
    document.querySelectorAll(".search-box input[type='search']").forEach((input) => {
        input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;

            const query = input.value.trim();
            if (!query) return;

            window.location.href = `documents.html?q=${encodeURIComponent(query)}`;
        });
    });
}