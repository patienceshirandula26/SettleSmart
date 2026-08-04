/* =========================================================
   SettleSmart — settlement checklist

   Loads the student's tasks from the backend, groups them by
   category, and saves every tick straight to the database so
   the dashboard stays in step.
   ========================================================= */

(function () {
    "use strict";

    const user = SettleSmart.getUser();
    if (!user) return;

    const escape = SettleSmart.escapeHtml;

    const filterBar = document.getElementById("filterBar");
    const groupsContainer = document.getElementById("checklistGroups");
    const emptyState = document.getElementById("checklistEmpty");
    const summaryText = document.getElementById("checklistSummary");
    const summaryBar = document.getElementById("checklistBar");

    let groups = [];
    let activeCategory = "all";

    /* ---------- Rendering ---------- */

    function renderFilters() {
        const chips = [{ id: "all", name: "All" }].concat(
            groups.map((group) => ({ id: group.category_id, name: group.category_name }))
        );

        filterBar.innerHTML = chips.map((chip) => `
            <button class="chip${String(chip.id) === String(activeCategory) ? " active" : ""}"
                    type="button" data-filter="${chip.id}">${escape(chip.name)}</button>
        `).join("");

        filterBar.querySelectorAll(".chip").forEach((chip) => {
            chip.addEventListener("click", () => {
                activeCategory = chip.dataset.filter;
                render();
            });
        });
    }

    function taskRow(task) {
        const isDone = task.status === "Completed";

        const overdue =
            !isDone && task.due_date && new Date(task.due_date) < new Date().setHours(0, 0, 0, 0);

        return `
            <div class="task-item${isDone ? " done" : ""}" id="task-${task.task_id}" data-task-id="${task.task_id}">
                <div class="task-main">
                    <button class="task-box" type="button"
                            data-task-id="${task.task_id}"
                            data-status="${task.status}"
                            aria-label="Toggle ${escape(task.task_name)}">&#10003;</button>
                    <div>
                        <p class="task-title">${escape(task.task_name)}</p>
                        <p class="task-desc">${escape(task.description || "")}</p>
                        <p class="task-meta">
                            ${task.estimated_time ? `<span>⏱ ${escape(task.estimated_time)}</span>` : ""}
                            ${task.due_date ? `<span class="${overdue ? "is-overdue" : ""}">📅 Due ${escape(SettleSmart.formatDate(task.due_date))}</span>` : ""}
                            ${task.official_link ? `<a href="${escape(task.official_link)}" target="_blank" rel="noopener">Official link ↗</a>` : ""}
                        </p>
                    </div>
                </div>
                <span class="task-badge priority-${task.priority.toLowerCase()}">${escape(task.priority)}</span>
            </div>
        `;
    }

    function render() {
        const visible = groups.filter(
            (group) => activeCategory === "all" || String(group.category_id) === String(activeCategory)
        );

        groupsContainer.innerHTML = visible.map((group) => `
            <section class="task-group" id="category-${group.category_id}">
                <div class="group-header">
                    <h2 class="group-name">${escape(group.emoji || "")} ${escape(group.category_name)}</h2>
                    <span class="group-count">
                        <span class="done-count">${group.completed}</span> of ${group.total} done
                    </span>
                </div>
                ${group.tasks.map(taskRow).join("")}
            </section>
        `).join("");

        emptyState.classList.toggle("show", visible.length === 0);

        groupsContainer.querySelectorAll(".task-box").forEach((box) => {
            box.addEventListener("click", () => toggleTask(box));
        });

        renderSummary();
    }

    function renderSummary() {
        const total = groups.reduce((sum, group) => sum + group.total, 0);
        const done = groups.reduce((sum, group) => sum + group.completed, 0);
        const percent = total ? Math.round((done / total) * 100) : 0;

        summaryText.textContent = `${done} of ${total} tasks completed · ${percent}%`;
        summaryBar.style.width = `${percent}%`;
    }

    /* ---------- Saving ---------- */

    async function toggleTask(box) {
        const taskId = Number(box.dataset.taskId);
        const newStatus = box.dataset.status === "Completed" ? "Not Started" : "Completed";

        box.disabled = true;

        try {
            await SettleSmart.api.put("/api/tasks/update", {
                user_id: user.user_id,
                task_id: taskId,
                status: newStatus
            });

            // Update the copy we hold in memory, then redraw the counters.
            groups.forEach((group) => {
                group.tasks.forEach((task) => {
                    if (task.task_id === taskId) {
                        task.status = newStatus;
                    }
                });

                group.completed = group.tasks.filter((task) => task.status === "Completed").length;
            });

            render();

            SettleSmart.toast(
                newStatus === "Completed" ? "Nice — task ticked off" : "Task reopened"
            );
        } catch (error) {
            box.disabled = false;
            SettleSmart.toast(error.message, "error");
        }
    }

    /* The notification bell links here as checklist.html#task-3, so scroll
       to that task and flash it briefly. */
    function highlightLinkedTask() {
        const hash = window.location.hash;
        if (!hash.startsWith("#task-")) return;

        const item = document.getElementById(hash.slice(1));
        if (!item) return;

        item.scrollIntoView({ behavior: "smooth", block: "center" });
        item.classList.add("is-highlighted");

        setTimeout(() => item.classList.remove("is-highlighted"), 2600);
    }

    /* ---------- Load ---------- */

    async function load() {
        try {
            groups = await SettleSmart.api.get(`/api/checklist/${user.user_id}`);

            // A link like checklist.html#category-2 opens on that category.
            const target = window.location.hash.replace("#category-", "");
            if (target && groups.some((group) => String(group.category_id) === target)) {
                activeCategory = target;
            }

            renderFilters();
            render();
            highlightLinkedTask();
        } catch (error) {
            console.error(error);
            summaryText.textContent = "Couldn't load your checklist";
            SettleSmart.toast(
                "Couldn't reach the server. Is python3 backend/app.py running?",
                "error"
            );
        }
    }

    load();
})();
