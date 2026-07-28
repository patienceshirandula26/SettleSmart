/* =========================================================
   SettleSmart — Settlement checklist
   Handles category filtering and ticking tasks off.
   State is in-page only; wire to the backend later.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    var chips = document.querySelectorAll(".chip");
    var groups = document.querySelectorAll(".task-group");
    var emptyState = document.querySelector(".empty-state");

    /* ---------- Filter by category ---------- */

    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {

            chips.forEach(function (c) { c.classList.remove("active"); });
            chip.classList.add("active");

            var filter = chip.dataset.filter;
            var visible = 0;

            groups.forEach(function (group) {
                var show = filter === "all" || group.dataset.category === filter;
                group.style.display = show ? "" : "none";
                if (show) { visible++; }
            });

            emptyState.classList.toggle("show", visible === 0);
        });
    });

    /* ---------- Tick a task off ---------- */

    document.querySelectorAll(".task-box").forEach(function (box) {
        box.addEventListener("click", function () {
            var item = box.closest(".task-item");
            item.classList.toggle("done");
            updateCount(item.closest(".task-group"));
        });
    });

    /* Recalculate the "x of y done" label for one group */
    function updateCount(group) {
        var done = group.querySelectorAll(".task-item.done").length;
        group.querySelector(".done-count").textContent = done;
    }

});