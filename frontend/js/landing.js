/* =========================================================
   SettleSmart — landing page

   Fades sections in as they scroll into view, and skips the
   page entirely for anyone who is already logged in.
   ========================================================= */

(function () {
    "use strict";

    // Someone with a session shouldn't be shown the sign-up pitch again.
    if (SettleSmart.getUser()) {
        window.location.replace("pages/dashboard.html");
        return;
    }

    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    // Older browsers, or a reader who prefers no motion: just show everything.
    const prefersLessMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersLessMotion || !("IntersectionObserver" in window)) {
        items.forEach((item) => item.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (!entry.isIntersecting) return;

            // A small stagger so a row of cards arrives one after another.
            setTimeout(() => entry.target.classList.add("visible"), index * 90);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

    items.forEach((item) => observer.observe(item));
})();
