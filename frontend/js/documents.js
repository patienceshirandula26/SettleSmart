// SettleSmart — Documents page
// Loads a user's documents from the backend, renders them, and
// wires up category filtering, search, status toggling and the
// "Add document" modal.

const API_BASE = "http://127.0.0.1:5000";

const loggedInUser = JSON.parse(localStorage.getItem("user"));
const tableBody = document.getElementById("documentsTableBody");
const emptyState = document.getElementById("documentsEmpty");
const filterBar = document.getElementById("categoryFilterBar");
const searchInput = document.getElementById("documentSearch");

const modal = document.getElementById("addDocumentModal");
const addBtn = document.getElementById("addDocumentBtn");
const cancelBtn = document.getElementById("cancelAddDocument");
const addForm = document.getElementById("addDocumentForm");

let allDocuments = [];
let activeCategory = "all";

function statusClass(status) {
    if (status === "Completed") return "status-completed";
    if (status === "Not Required") return "status-neutral";
    return "status-pending";
}

function statusLabel(status) {
    return status === "Not Required" ? "Not required" : status;
}

function renderCategoryChips() {
    const categories = Array.from(
        new Set(allDocuments.map((doc) => doc.document_type).filter(Boolean))
    );

    filterBar.innerHTML = "";

    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = "filter-chip" + (activeCategory === "all" ? " active" : "");
    allChip.dataset.category = "all";
    allChip.textContent = "All";
    filterBar.appendChild(allChip);

    categories.forEach((category) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "filter-chip" + (activeCategory === category ? " active" : "");
        chip.dataset.category = category;
        chip.textContent = category;
        filterBar.appendChild(chip);
    });

    filterBar.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", function () {
            activeCategory = chip.dataset.category;
            renderCategoryChips();
            renderRows();
        });
    });
}

function renderRows() {
    const query = (searchInput.value || "").trim().toLowerCase();

    const visible = allDocuments.filter((doc) => {
        const matchesCategory = activeCategory === "all" || doc.document_type === activeCategory;
        const text = `${doc.document_name} ${doc.document_type || ""} ${doc.notes || ""}`.toLowerCase();
        const matchesSearch = !query || text.includes(query);
        return matchesCategory && matchesSearch;
    });

    tableBody.innerHTML = "";

    visible.forEach((doc) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${doc.document_name}</td>
            <td>${doc.document_type || "—"}</td>
            <td>
                <span class="status-badge ${statusClass(doc.status)} status-toggle" data-id="${doc.document_id}" data-status="${doc.status}" title="Click to change status">
                    ${statusLabel(doc.status)}
                </span>
            </td>
            <td>${doc.notes || "—"}</td>
        `;

        tableBody.appendChild(row);
    });

    emptyState.hidden = visible.length !== 0;

    tableBody.querySelectorAll(".status-toggle").forEach((badge) => {
        badge.addEventListener("click", handleStatusClick);
    });
}

function nextStatus(current) {
    if (current === "Pending") return "Completed";
    if (current === "Completed") return "Not Required";
    return "Pending";
}

async function handleStatusClick(event) {
    const badge = event.currentTarget;
    const documentId = badge.dataset.id;
    const newStatus = nextStatus(badge.dataset.status);

    try {
        const response = await fetch(`${API_BASE}/api/documents/status/${documentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error("Failed to update status");

        const doc = allDocuments.find((d) => String(d.document_id) === String(documentId));
        if (doc) doc.status = newStatus;

        renderRows();
    } catch (error) {
        console.error(error);
        alert("Could not update status. Is the backend server running?");
    }
}

async function loadDocuments() {
    if (!loggedInUser) return;

    try {
        const response = await fetch(`${API_BASE}/api/documents/${loggedInUser.user_id}`);
        if (!response.ok) throw new Error("Failed to load documents");

        allDocuments = await response.json();
        renderCategoryChips();
        applyQueryParam();
        renderRows();
    } catch (error) {
        console.error(error);
        emptyState.textContent = "Couldn't load documents — is the backend server running?";
        emptyState.hidden = false;
    }
}

function applyQueryParam() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
        searchInput.value = query;
    }
}

function openModal() {
    modal.hidden = false;
}

function closeModal() {
    modal.hidden = true;
    addForm.reset();
}

async function handleAddDocument(event) {
    event.preventDefault();

    if (!loggedInUser) return;

    const formData = new FormData(addForm);
    const payload = {
        user_id: loggedInUser.user_id,
        document_name: formData.get("document_name"),
        document_type: formData.get("document_type"),
        status: formData.get("status"),
        notes: formData.get("notes")
    };

    try {
        const response = await fetch(`${API_BASE}/api/documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to add document");

        closeModal();
        await loadDocuments();
    } catch (error) {
        console.error(error);
        alert("Could not add the document. Is the backend server running?");
    }
}

if (tableBody) {
    searchInput.addEventListener("input", renderRows);
    addBtn.addEventListener("click", openModal);
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
    addForm.addEventListener("submit", handleAddDocument);

    loadDocuments();
}
