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