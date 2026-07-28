const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.location.href = "dashboard.html";
    });
}

const documentSearch = document.getElementById("documentSearch");
const documentsTableBody = document.getElementById("documentsTableBody");

if (documentSearch && documentsTableBody) {
    documentSearch.addEventListener("input", () => {
        const query = documentSearch.value.trim().toLowerCase();
        const rows = documentsTableBody.querySelectorAll("tr");

        rows.forEach((row) => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? "" : "none";
        });
    });
}
