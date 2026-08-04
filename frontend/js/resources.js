/* =========================================================
   SettleSmart — official resources

   The link cards come from the resources table, and the
   "Getting Started Steps" list shows the student's real
   progress on the highest-priority tasks.
   ========================================================= */

(function () {
    "use strict";

    const user = SettleSmart.getUser();
    if (!user) return;

    const escape = SettleSmart.escapeHtml;

    const resourceGrid = document.getElementById("resourceGrid");
    const stepsList = document.getElementById("stepsList");

    if (!resourceGrid) return;

    const doneIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 12.5 4 4 8-9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const pendingIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const externalIcon = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 3h6v6M10 14 21 3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function card(resource) {
        return `
            <a class="card resource-card" href="${escape(resource.official_link)}"
               target="_blank" rel="noopener">
                <span class="resource-emoji">${escape(resource.emoji || "🔗")}</span>
                <span class="resource-text">
                    <span class="resource-name">${escape(resource.resource_name)}</span>
                    <span class="resource-desc">${escape(resource.description || "")}</span>
                </span>
                ${externalIcon}
            </a>
        `;
    }

    function renderResources(resources) {
        if (!resources.length) {
            resourceGrid.innerHTML = '<p class="list-empty">No resources available yet.</p>';
            return;
        }

        // Group under category headings — the list is long enough that a flat
        // grid is hard to scan.
        const groups = new Map();

        resources.forEach((resource) => {
            const key = resource.category_name || "Other";

            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(resource);
        });

        resourceGrid.innerHTML = [...groups.entries()].map(([name, items]) => `
            <h3 class="resource-group-title">${escape(name)}</h3>
            <div class="resource-group">${items.map(card).join("")}</div>
        `).join("");
    }

    function renderSteps(groups) {
        // Flatten the checklist and show the tasks that matter most first.
        const tasks = groups
            .flatMap((group) => group.tasks.map((task) => ({
                ...task,
                category_name: group.category_name
            })))
            .filter((task) => task.priority === "High")
            .slice(0, 6);

        if (!tasks.length) {
            stepsList.innerHTML = '<p class="list-empty">Your checklist is complete. 🎉</p>';
            return;
        }

        stepsList.innerHTML = tasks.map((task) => {
            const done = task.status === "Completed";

            return `
                <div class="step-item">
                    <span class="step-icon ${done ? "done" : "pending"}">
                        ${done ? doneIcon : pendingIcon}
                    </span>
                    <div>
                        <p class="step-title">${escape(task.task_name)}</p>
                        <p class="step-desc">
                            ${escape(done ? "Completed" : task.description || task.category_name)}
                        </p>
                    </div>
                </div>
            `;
        }).join("");
    }

    async function load() {
        try {
            const [resources, checklist] = await Promise.all([
                SettleSmart.api.get("/api/resources"),
                SettleSmart.api.get(`/api/checklist/${user.user_id}`)
            ]);

            renderResources(resources);
            renderSteps(checklist);
        } catch (error) {
            console.error(error);
            resourceGrid.innerHTML =
                '<p class="list-empty">Couldn\'t load resources. Is the backend running?</p>';
        }
    }

    load();
})();
