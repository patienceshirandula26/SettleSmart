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
}