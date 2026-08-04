/* =========================================================
   SettleSmart — documents

   Every new account starts with a checklist of the documents an
   international student needs. From this page you can upload the
   real file, view or replace it, change a status, add your own
   document, or delete one.
   ========================================================= */

(function () {
    "use strict";

    const user = SettleSmart.getUser();
    if (!user) return;

    const escape = SettleSmart.escapeHtml;

    const listEl = document.getElementById("documentsList");
    if (!listEl) return;

    const emptyState = document.getElementById("documentsEmpty");
    const subtitleEl = document.getElementById("documentsSubtitle");
    const statUploaded = document.getElementById("statUploaded");
    const statPending = document.getElementById("statPending");
    const statFiles = document.getElementById("statFiles");
    const filterBar = document.getElementById("docFilterBar");
    const searchInput = document.getElementById("documentSearch");

    const modal = document.getElementById("addDocumentModal");
    const addBtn = document.getElementById("addDocumentBtn");
    const cancelBtn = document.getElementById("cancelAddDocument");
    const addForm = document.getElementById("addDocumentForm");
    const modalFileInput = document.getElementById("docFile");
    const modalFileName = document.getElementById("docFileName");

    // One shared hidden file picker, re-used by every row's Upload button.
    const rowFileInput = document.getElementById("rowFileInput");

    let allDocuments = [];
    let activeCategory = "all";
    let searchQuery = new URLSearchParams(window.location.search).get("q") || "";
    let uploadTargetId = null;

    /* ---------- Status helpers ---------- */

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

    function nextStatus(current) {
        if (current === "Pending") return "Completed";
        if (current === "Completed") return "Not Required";
        return "Pending";
    }

    /* ---------- Rendering ---------- */

    function renderStats() {
        const withFiles = allDocuments.filter((doc) => doc.has_file).length;

        statUploaded.textContent = allDocuments.length;
        statPending.textContent = allDocuments.filter((doc) => doc.status === "Pending").length;

        if (statFiles) {
            statFiles.textContent = withFiles;
        }
    }

    function renderFilters() {
        const categories = [...new Set(
            allDocuments.map((doc) => doc.document_type).filter(Boolean)
        )].sort();

        filterBar.innerHTML = [{ key: "all", label: "All documents" }]
            .concat(categories.map((name) => ({ key: name, label: name })))
            .map((item) => `
                <button type="button"
                        class="doc-filter${item.key === activeCategory ? " active" : ""}"
                        data-category="${escape(item.key)}">${escape(item.label)}</button>
            `).join("");

        filterBar.querySelectorAll(".doc-filter").forEach((button) => {
            button.addEventListener("click", () => {
                activeCategory = button.dataset.category;
                renderFilters();
                renderRows();
            });
        });
    }

    function visibleDocuments() {
        const query = searchQuery.trim().toLowerCase();

        return allDocuments.filter((doc) => {
            const matchesCategory =
                activeCategory === "all" || doc.document_type === activeCategory;

            const haystack = [
                doc.document_name, doc.document_type, doc.notes,
                doc.provider, doc.reference_number, doc.file_name
            ].filter(Boolean).join(" ").toLowerCase();

            return matchesCategory && (!query || haystack.includes(query));
        });
    }

    function renderRows() {
        const visible = visibleDocuments();

        listEl.innerHTML = visible.map((doc) => `
            <div class="document-row">
                <div class="doc-name-col">
                    <p class="doc-name">${escape(doc.document_name)}</p>
                    ${doc.notes ? `<p class="doc-flag-note">${escape(doc.notes)}</p>` : ""}
                    ${doc.has_file ? `
                        <span class="doc-file">
                            📎 ${escape(doc.file_name)}
                            <span class="doc-file-size">${escape(SettleSmart.formatFileSize(doc.file_size))}</span>
                        </span>` : ""}
                </div>

                <span class="doc-category-pill">${escape(doc.document_type || "—")}</span>

                <button type="button"
                        class="doc-status-pill ${statusClass(doc.status)} status-toggle"
                        data-id="${doc.document_id}" data-status="${escape(doc.status)}"
                        title="Click to change status">${statusLabel(doc.status)}</button>

                <span class="doc-date">${escape(
                    doc.uploaded_at
                        ? SettleSmart.formatDate(doc.uploaded_at)
                        : "Not uploaded"
                )}</span>

                <div class="doc-actions">
                    ${doc.has_file ? `
                        <a class="doc-action" href="${SettleSmart.api.fileUrl(doc.document_id)}"
                           target="_blank" rel="noopener">View</a>` : ""}

                    <button type="button" class="doc-action primary upload-btn"
                            data-id="${doc.document_id}">
                        ${doc.has_file ? "Replace" : "Upload"}
                    </button>

                    <button type="button" class="doc-action danger delete-btn"
                            data-id="${doc.document_id}"
                            data-name="${escape(doc.document_name)}"
                            title="Delete this document">✕</button>
                </div>
            </div>
        `).join("");

        const parts = [`${allDocuments.length} document${allDocuments.length === 1 ? "" : "s"}`];
        if (activeCategory !== "all") parts.push(`filtered by ${activeCategory}`);
        if (searchQuery) parts.push(`matching "${searchQuery}"`);
        subtitleEl.textContent = parts.join(" · ");

        if (!allDocuments.length) {
            emptyState.hidden = false;
            emptyState.textContent =
                'No documents yet — click "Add Document" above to get started.';
        } else if (!visible.length) {
            emptyState.hidden = false;
            emptyState.textContent = "No documents match that search or filter.";
        } else {
            emptyState.hidden = true;
        }

        wireRowButtons();
    }

    function wireRowButtons() {
        listEl.querySelectorAll(".status-toggle").forEach((badge) => {
            badge.addEventListener("click", () => changeStatus(badge));
        });

        listEl.querySelectorAll(".upload-btn").forEach((button) => {
            button.addEventListener("click", () => {
                uploadTargetId = button.dataset.id;
                rowFileInput.value = "";
                rowFileInput.click();
            });
        });

        listEl.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", () => deleteDocument(button));
        });
    }

    /* ---------- Actions ---------- */

    async function changeStatus(badge) {
        const documentId = badge.dataset.id;
        const newStatus = nextStatus(badge.dataset.status);

        badge.disabled = true;

        try {
            const data = await SettleSmart.api.put(
                `/api/documents/${documentId}`, { status: newStatus }
            );

            replaceDocument(data.document);
            renderStats();
            renderRows();
        } catch (error) {
            badge.disabled = false;
            SettleSmart.toast(error.message, "error");
        }
    }

    async function uploadRowFile() {
        const file = rowFileInput.files[0];
        if (!file || !uploadTargetId) return;

        const formData = new FormData();
        formData.append("file", file);

        listEl.classList.add("is-loading");

        try {
            const data = await SettleSmart.api.upload(
                `/api/documents/${uploadTargetId}/upload`, formData
            );

            replaceDocument(data.document);
            renderStats();
            renderRows();
            SettleSmart.toast(`${file.name} uploaded`);
        } catch (error) {
            SettleSmart.toast(error.message, "error");
        } finally {
            listEl.classList.remove("is-loading");
            uploadTargetId = null;
            rowFileInput.value = "";
        }
    }

    async function deleteDocument(button) {
        const name = button.dataset.name;

        if (!window.confirm(`Delete "${name}"? This also removes any uploaded file.`)) {
            return;
        }

        button.disabled = true;

        try {
            await SettleSmart.api.remove(`/api/documents/${button.dataset.id}`);

            allDocuments = allDocuments.filter(
                (doc) => String(doc.document_id) !== String(button.dataset.id)
            );

            renderStats();
            renderFilters();
            renderRows();
            SettleSmart.toast(`${name} deleted`);
        } catch (error) {
            button.disabled = false;
            SettleSmart.toast(error.message, "error");
        }
    }

    function replaceDocument(updated) {
        const index = allDocuments.findIndex(
            (doc) => doc.document_id === updated.document_id
        );

        if (index !== -1) {
            allDocuments[index] = updated;
        }
    }

    /* ---------- Add document modal ---------- */

    function openModal() {
        modal.hidden = false;
    }

    function closeModal() {
        modal.hidden = true;
        addForm.reset();
        modalFileName.textContent = "";
    }

    async function handleAddDocument(event) {
        event.preventDefault();

        const submitButton = addForm.querySelector("button[type='submit']");
        const formData = new FormData(addForm);
        formData.append("user_id", user.user_id);

        // FormData picks up an empty file input, which the backend would
        // reject as an unsupported type. Drop it when nothing was chosen.
        if (!modalFileInput.files.length) {
            formData.delete("file");
        }

        submitButton.disabled = true;
        submitButton.textContent = "Saving…";

        try {
            await SettleSmart.api.upload("/api/documents", formData);

            closeModal();
            await load();
            SettleSmart.toast("Document added");
        } catch (error) {
            SettleSmart.toast(error.message, "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Add document";
        }
    }

    /* ---------- Load ---------- */

    async function load() {
        try {
            allDocuments = await SettleSmart.api.get(`/api/documents/${user.user_id}`);

            renderStats();
            renderFilters();
            renderRows();
        } catch (error) {
            console.error(error);
            subtitleEl.textContent = "Couldn't load documents";
            emptyState.hidden = false;
            emptyState.textContent =
                "Couldn't reach the server. Make sure python3 backend/app.py is running.";
        }
    }

    /* ---------- Wiring ---------- */

    addBtn.addEventListener("click", openModal);
    cancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    addForm.addEventListener("submit", handleAddDocument);
    rowFileInput.addEventListener("change", uploadRowFile);

    modalFileInput.addEventListener("change", () => {
        modalFileName.textContent = modalFileInput.files.length
            ? modalFileInput.files[0].name
            : "";
    });

    // The search box in the top bar sends its query here as ?q=…
    if (searchInput) {
        searchInput.value = searchQuery;
        searchInput.addEventListener("input", () => {
            searchQuery = searchInput.value;
            renderRows();
        });
    }

    load();
})();
