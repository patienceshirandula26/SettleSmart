/* =========================================================
   SettleSmart — dashboard

   Everything on this page comes from /api/dashboard/<user_id>:
   the progress ring, the stat cards, category progress, the
   pending task table, recent activity and upcoming reminders.
   ========================================================= */

(function () {
    "use strict";

    const user = SettleSmart.getUser();
    if (!user) return;

    const escape = SettleSmart.escapeHtml;

    // The progress ring is a circle of radius 82, so its outline is
    // 2 x pi x 82 = about 515 units long.
    const RING_LENGTH = 515;

    const elements = {
        subtitle: document.getElementById("progressSubtitle"),
        donutFill: document.getElementById("donutFill"),
        donutValue: document.getElementById("donutValue"),
        done: document.getElementById("progressDone"),
        left: document.getElementById("progressLeft"),
        bar: document.getElementById("progressBar"),
        notice: document.getElementById("attentionNotice"),
        noticeText: document.getElementById("attentionText"),
        statCompleted: document.getElementById("statCompleted"),
        statPending: document.getElementById("statPendingTasks"),
        statReminders: document.getElementById("statReminders"),
        statDocuments: document.getElementById("statDocuments"),
        categoryGrid: document.getElementById("categoryGrid"),
        pendingBody: document.getElementById("pendingTasksBody"),
        activityList: document.getElementById("activityList"),
        reminderList: document.getElementById("upcomingReminders"),
        resourceGrid: document.getElementById("resourceGrid")
    };

    /* Turn "Transport & Licensing" into "transport" for the pill colours. */
    function categorySlug(name) {
        const slugs = {
            "Identity & Study": "study",
            "Financial": "financial",
            "Transport & Licensing": "transport",
            "Health": "health",
            "Accommodation": "accommodation",
            "Work Clearances": "clearances",
            "Communication": "communication",
            "Employment": "employment"
        };

        return slugs[name] || "low";
    }

    function dueLabel(dueDate) {
        if (!dueDate) return "No due date";

        const days = Math.round(
            (new Date(dueDate) - new Date().setHours(0, 0, 0, 0)) / 86400000
        );

        if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
        if (days === 0) return "Due today";
        if (days === 1) return "Due tomorrow";

        return SettleSmart.formatDate(dueDate);
    }

    /* ---------- Rendering ---------- */

    function renderProgress(progress, attentionCount) {
        const percent = progress.percent;

        elements.subtitle.textContent =
            `${progress.completed} of ${progress.total} tasks completed`;

        elements.donutValue.textContent = `${percent}%`;
        elements.donutFill.style.strokeDashoffset = RING_LENGTH * (1 - percent / 100);

        elements.done.textContent = `${progress.completed} completed`;
        elements.left.textContent = `${progress.remaining} remaining`;
        elements.bar.style.width = `${percent}%`;

        if (attentionCount > 0) {
            elements.notice.hidden = false;
            elements.noticeText.innerHTML =
                `<strong>${attentionCount} task${attentionCount === 1 ? "" : "s"}</strong> ` +
                "need attention in the next week.";
        } else if (progress.remaining === 0 && progress.total > 0) {
            elements.notice.hidden = false;
            elements.noticeText.innerHTML =
                "<strong>All done!</strong> Your settlement checklist is complete. 🎉";
        } else {
            elements.notice.hidden = true;
        }
    }

    function renderStats(stats) {
        elements.statCompleted.textContent = stats.completed_tasks;
        elements.statPending.textContent = stats.pending_tasks;
        elements.statReminders.textContent = stats.upcoming_reminders;
        elements.statDocuments.textContent =
            `${stats.documents_uploaded}/${stats.documents_total}`;
    }

    function renderCategories(categories) {
        elements.categoryGrid.innerHTML = categories.map((category) => `
            <div class="card category-card">
                <div class="category-top">
                    <span class="category-emoji">${escape(category.emoji || "📋")}</span>
                    <span class="count-badge${category.percent === 100 ? " is-complete" : ""}">
                        ${category.completed}/${category.total}
                    </span>
                </div>
                <h3 class="category-name">${escape(category.category_name)}</h3>
                <p class="category-desc">${escape(category.description || "")}</p>
                <p class="category-percent">${category.percent}% done</p>
                <div class="progress-track">
                    <div class="progress-fill${category.percent === 100 ? " is-complete" : ""}"
                         style="width: ${category.percent}%;"></div>
                </div>
                <a href="checklist.html#category-${category.category_id}"
                   class="link-more${category.percent === 100 ? " is-complete" : ""}">
                    View Details
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </a>
            </div>
        `).join("");
    }

    function renderPendingTasks(tasks) {
        const subtitle = document.querySelector(".tasks-card .card-subtitle");

        if (subtitle) {
            subtitle.textContent = tasks.length
                ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} need your attention`
                : "Nothing outstanding — great work!";
        }

        if (!tasks.length) {
            elements.pendingBody.innerHTML = `
                <tr><td colspan="4" class="table-empty">
                    You've completed every task on your checklist. 🎉
                </td></tr>`;
            return;
        }

        elements.pendingBody.innerHTML = tasks.map((task) => `
            <tr class="${task.is_urgent ? "is-urgent" : ""}">
                <td>
                    <div class="task-cell">
                        <button class="task-check" type="button"
                                data-task-id="${task.task_id}"
                                aria-label="Mark ${escape(task.task_name)} complete"
                                title="Mark complete"></button>
                        <div>
                            <p class="task-name">${escape(task.task_name)}</p>
                            ${task.is_urgent ? `
                                <p class="task-warning">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.2" fill="currentColor" stroke="none"/></svg>
                                    Due soon — action required
                                </p>` : ""}
                        </div>
                    </div>
                </td>
                <td><span class="pill ${categorySlug(task.category_name)}">${escape(task.category_name)}</span></td>
                <td><span class="pill ${task.priority.toLowerCase()}">${escape(task.priority)}</span></td>
                <td>
                    <span class="due-cell">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke-linecap="round"/></svg>
                        ${escape(dueLabel(task.due_date))}
                    </span>
                </td>
            </tr>
        `).join("");

        elements.pendingBody.querySelectorAll(".task-check").forEach((button) => {
            button.addEventListener("click", () => completeTask(button));
        });
    }

    function renderActivity(activity) {
        if (!activity.length) {
            elements.activityList.innerHTML =
                '<p class="list-empty">Your activity will show up here as you work through the checklist.</p>';
            return;
        }

        const icons = {
            task: "green",
            document: "blue",
            reminder: "amber",
            profile: "purple",
            account: "purple"
        };

        elements.activityList.innerHTML = activity.map((item) => `
            <div class="activity-item">
                <span class="activity-icon ${icons[item.activity_type] || "green"}">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 12.5 4 4 8-9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                <div>
                    <p class="activity-title">${escape(item.title)}</p>
                    <p class="activity-time">${escape(SettleSmart.timeAgo(item.created_at))}</p>
                </div>
            </div>
        `).join("");
    }

    function renderReminders(reminders) {
        if (!reminders.length) {
            elements.reminderList.innerHTML =
                '<p class="list-empty">No reminders coming up. <a href="reminders.html">Create one</a>.</p>';
            return;
        }

        elements.reminderList.innerHTML = reminders.map((reminder) => `
            <div class="reminder-item">
                <span class="reminder-dot ${reminder.urgency}"></span>
                <span class="reminder-name">${escape(reminder.title)}</span>
                <span class="reminder-date">${escape(SettleSmart.formatDate(reminder.reminder_date))}</span>
            </div>
        `).join("");
    }

    function renderResources(resources) {
        elements.resourceGrid.innerHTML = resources.map((resource) => `
            <a class="card resource-card" href="${escape(resource.official_link)}" target="_blank" rel="noopener">
                <span class="resource-emoji">${escape(resource.emoji || "🔗")}</span>
                <span class="resource-text">
                    <span class="resource-name">${escape(resource.resource_name)}</span>
                    <span class="resource-desc">${escape(resource.description || "")}</span>
                </span>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 3h6v6M10 14 21 3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
        `).join("");
    }

    /* ---------- Actions ---------- */

    async function completeTask(button) {
        button.disabled = true;
        button.classList.add("is-checking");

        try {
            await SettleSmart.api.put("/api/tasks/update", {
                user_id: user.user_id,
                task_id: Number(button.dataset.taskId),
                status: "Completed"
            });

            SettleSmart.toast("Task marked complete");
            await load();
        } catch (error) {
            button.disabled = false;
            button.classList.remove("is-checking");
            SettleSmart.toast(error.message, "error");
        }
    }

    /* ---------- Load ---------- */

    async function load() {
        try {
            const data = await SettleSmart.api.get(`/api/dashboard/${user.user_id}`);

            renderProgress(data.progress, data.attention_count);
            renderStats(data.stats);
            renderCategories(data.categories);
            renderPendingTasks(data.pending_tasks);
            renderActivity(data.activity);
            renderReminders(data.reminders);
            renderResources(data.resources);
        } catch (error) {
            console.error(error);
            elements.subtitle.textContent = "Couldn't load your progress";
            SettleSmart.toast(
                "Couldn't reach the server. Is python3 backend/app.py running?",
                "error"
            );
        }
    }

    load();
})();
