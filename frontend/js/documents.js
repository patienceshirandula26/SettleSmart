// SettleSmart — Documents page
// Loads a user's documents from the backend, renders them to match
// the "Uploaded Documents" list, and wires up the stat cards,
// click-to-filter category pills, click-to-cycle status, and the
// "Add Document" modal.

const API_BASE = "http://127.0.0.1:5000";

const documentsPageUser = JSON.parse(localStorage.getItem("user"));
const listEl = document.getElementById("documentsList");
const emptyState = document.getElementById("documentsEmpty");
const subtitleEl = document.getElementById("documentsSubtitle");
const statUploaded = document.getElementById("statUploaded");
const statPending = document.getElementById("statPending");

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
    if (status === "Completed") return "Verified";
    if (status === "Not Required") return "Not required";
    return "Pending";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date)) return "—";
    return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function getQueryParam() {
    return new URLSearchParams(window.location.search).get("q") || "";
}

function renderStats() {
    statUploaded.textContent = allDocuments.length;
    statPending.textContent = allDocuments.filter((doc) => doc.status === "Pending").length;
}

function renderRows() {
    const query = getQueryParam().trim().toLowerCase();

    const visible = allDocuments.filter((doc) => {
        const matchesCategory = activeCategory === "all" || doc.document_type === activeCategory;
        const text = `${doc.document_name} ${doc.document_type || ""} ${doc.notes || ""}`.toLowerCase();
        const matchesSearch = !query || text.includes(query);
        return matchesCategory && matchesSearch;
    });

    listEl.innerHTML = "";

    visible.forEach((doc) => {
        const row = document.createElement("div");
        row.className = "document-row" + (doc.notes ? " flagged" : "");

        row.innerHTML = `
            <div class="doc-name-col">
                <p class="doc-name">${doc.document_name}</p>
                ${doc.notes ? `<p class="doc-flag-note">⚠ ${doc.notes}</p>` : ""}
            </div>
            <button type="button" class="doc-category-pill" data-category="${doc.document_type || ""}">${doc.document_type || "—"}</button>
            <button type="button" class="doc-status-pill ${statusClass(doc.status)} status-toggle" data-id="${doc.document_id}" data-status="${doc.status}" title="Click to change status">
                ${statusLabel(doc.status)}
            </button>
            <span class="doc-date">${formatDate(doc.created_at)}</span>
        `;

        listEl.appendChild(row);
    });

    const subtitleParts = [];
    subtitleParts.push(`${allDocuments.length} document${allDocuments.length === 1 ? "" : "s"}`);
    if (activeCategory !== "all") subtitleParts.push(`filtered by ${activeCategory}`);
    if (query) subtitleParts.push(`matching "${query}"`);
    subtitleEl.textContent = subtitleParts.join(" · ");

    emptyState.hidden = visible.length !== 0 || allDocuments.length === 0;
    if (allDocuments.length !== 0 && visible.length === 0) {
        emptyState.hidden = false;
        emptyState.textContent = "No documents match that search or filter.";
    }

    listEl.querySelectorAll(".status-toggle").forEach((badge) => {
        badge.addEventListener("click", handleStatusClick);
    });

    listEl.querySelectorAll(".doc-category-pill").forEach((pill) => {
        pill.addEventListener("click", () => {
            activeCategory = activeCategory === pill.dataset.category ? "all" : pill.dataset.category;
            renderRows();
        });
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

        renderStats();
        renderRows();
    } catch (error) {
        console.error(error);
        alert("Could not update status. Make sure the Flask backend is running (python3 backend/app.py) and has been restarted since the update.");
    }
}

async function loadDocuments() {
    if (!documentsPageUser) return;

    try {
        const response = await fetch(`${API_BASE}/api/documents/${documentsPageUser.user_id}`);
        if (!response.ok) throw new Error("Failed to load documents");

        allDocuments = await response.json();
        renderStats();
        renderRows();
    } catch (error) {
        console.error(error);
        subtitleEl.textContent = "Couldn't load documents";
        emptyState.hidden = false;
        emptyState.textContent = "Couldn't reach the backend. Make sure python3 backend/app.py is running.";
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

    if (!documentsPageUser) return;

    const formData = new FormData(addForm);
    const payload = {
        user_id: documentsPageUser.user_id,
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
        alert("Could not add the document. Make sure the Flask backend is running (python3 backend/app.py) and has been restarted since the update.");
    }
}

if (listEl) {
    addBtn.addEventListener("click", openModal);
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
    addForm.addEventListener("submit", handleAddDocument);

    loadDocuments();
}
