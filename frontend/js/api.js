/* =========================================================
   SettleSmart — shared frontend helpers

   Every page loads this file first. It knows where the backend
   lives, who is logged in, and how to talk to the API.
   ========================================================= */

const SettleSmart = (function () {
    "use strict";

    /* ---------- Where is the backend? ----------

       The pages work three ways: served by Flask itself, served by a
       live-preview server such as VS Code Live Server, or opened straight
       off the disk. Only the first one can assume the API is at the same
       address, so for the other two we try each likely port until one
       answers, and remember the winner.

       Guessing a single port isn't enough: on macOS the AirPlay Receiver
       sits on port 5000 and replies to requests, so the backend often ends
       up on 5001 instead.                                                   */

    const CANDIDATE_PORTS = [5000, 5001, 5050, 8000, 8080];
    const REMEMBERED_KEY = "settlesmart-api-found";

    let apiBase = null;        // set once we know a server really answers
    let lookup = null;         // the in-flight search, shared by all callers

    /* A real SettleSmart backend answers /api/health with JSON. AirPlay and
       other servers on the same port do not, so this tells them apart. */
    async function isBackend(base) {
        try {
            const response = await fetch(`${base}/api/health`, { method: "GET" });
            if (!response.ok) return false;

            const data = await response.json();
            return data.success === true;
        } catch (error) {
            return false;
        }
    }

    async function findBackend() {
        const { protocol, hostname, port, origin } = window.location;
        const host = hostname || "localhost";

        const tries = [];

        // 1. An address you set by hand always wins:
        //    localStorage.setItem("settlesmart-api", "http://192.168.0.5:5001")
        const override = localStorage.getItem("settlesmart-api");
        if (override) tries.push(override);

        // 2. The address that worked last time.
        const remembered = localStorage.getItem(REMEMBERED_KEY);
        if (remembered) tries.push(remembered);

        // 3. Whoever served this page, unless it was a preview server.
        const previewPorts = ["3000", "5500", "5501", "8081"];
        if (protocol.startsWith("http") && !previewPorts.includes(port)) {
            tries.push(origin);
        }

        // 4. Otherwise work through the ports the backend commonly uses.
        CANDIDATE_PORTS.forEach((candidate) => tries.push(`http://${host}:${candidate}`));

        for (const base of [...new Set(tries)]) {
            if (await isBackend(base)) {
                localStorage.setItem(REMEMBERED_KEY, base);
                return base;
            }
        }

        localStorage.removeItem(REMEMBERED_KEY);
        return null;
    }

    function getBase() {
        if (apiBase) return Promise.resolve(apiBase);

        if (!lookup) {
            lookup = findBackend().then((base) => {
                lookup = null;

                if (!base) {
                    showServerBanner();
                    throw new Error(
                        "Can't reach the SettleSmart server. Start it with: python3 backend/app.py"
                    );
                }

                apiBase = base;
                hideServerBanner();
                return base;
            });
        }

        return lookup;
    }

    /* ---------- Requests ---------- */

    async function request(method, path, body) {
        const base = await getBase();

        const options = { method, headers: {} };

        if (body !== undefined) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        const response = await fetch(base + path, options);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || `Request failed (${response.status})`);
        }

        return data;
    }

    const api = {
        get: (path) => request("GET", path),
        post: (path, body) => request("POST", path, body),
        put: (path, body) => request("PUT", path, body),
        remove: (path) => request("DELETE", path),

        /* File uploads send a FormData body, so no JSON header here. */
        async upload(path, formData) {
            const base = await getBase();

            const response = await fetch(base + path, {
                method: "POST",
                body: formData
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Upload failed");
            }

            return data;
        },

        /* Only called once documents have loaded, so the address is known. */
        fileUrl: (documentId, download) =>
            `${apiBase || ""}/api/documents/file/${documentId}${download ? "?download=1" : ""}`
    };

    /* ---------- "The server isn't running" banner ---------- */

    function showServerBanner() {
        if (document.getElementById("settlesmartServerBanner")) return;

        const banner = document.createElement("div");
        banner.id = "settlesmartServerBanner";

        // Styled here rather than in a stylesheet so the warning still looks
        // right on the login and landing pages, whatever CSS they load.
        banner.style.cssText = [
            "position:fixed", "top:0", "left:0", "right:0", "z-index:300",
            "padding:12px 18px", "background:#b91c1c", "color:#fff",
            "font-family:Poppins,system-ui,sans-serif", "font-size:14px",
            "text-align:center", "box-shadow:0 2px 10px rgba(0,0,0,.18)"
        ].join(";");

        banner.innerHTML =
            "<strong>The SettleSmart server isn't running.</strong> " +
            "Start it in a terminal with " +
            "<code style=\"background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px\">" +
            "python3 backend/app.py</code>, then reload this page.";

        document.body.prepend(banner);
    }

    function hideServerBanner() {
        const banner = document.getElementById("settlesmartServerBanner");
        if (banner) banner.remove();
    }

    /* ---------- Who is logged in ---------- */

    function getUser() {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch (error) {
            return null;
        }
    }

    function setUser(user) {
        localStorage.setItem("user", JSON.stringify(user));
    }

    function clearUser() {
        localStorage.removeItem("user");
    }

    /* Send anyone who isn't logged in back to the login page. */
    function requireUser() {
        const user = getUser();

        if (!user || !user.user_id) {
            window.location.href = "login.html";
            return null;
        }

        return user;
    }

    /* ---------- Formatting ---------- */

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);
        if (isNaN(date)) return "—";

        return date.toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    /* "3 days ago", "Just now" — used by the activity feed. */
    function timeAgo(value) {
        if (!value) return "";

        const then = new Date(String(value).replace(" ", "T"));
        if (isNaN(then)) return "";

        const seconds = Math.floor((Date.now() - then.getTime()) / 1000);

        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 172800) return "Yesterday";

        return `${Math.floor(seconds / 86400)} days ago`;
    }

    function formatFileSize(bytes) {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    function initials(fullName) {
        return String(fullName || "Student")
            .split(" ")
            .filter(Boolean)
            .map((part) => part.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }

    /* Anything from the database goes through here before it reaches innerHTML. */
    function escapeHtml(value) {
        if (value === null || value === undefined) return "";

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /* ---------- Small on-screen message ---------- */

    function toast(message, type) {
        let holder = document.getElementById("settlesmartToast");

        if (!holder) {
            holder = document.createElement("div");
            holder.id = "settlesmartToast";
            holder.className = "toast";
            document.body.appendChild(holder);
        }

        holder.textContent = message;
        holder.className = `toast show ${type === "error" ? "toast-error" : "toast-success"}`;

        clearTimeout(holder.hideTimer);
        holder.hideTimer = setTimeout(() => {
            holder.className = "toast";
        }, 3200);
    }

    return {
        /* Where the backend was found. Null until the first request lands. */
        get apiBase() { return apiBase; },
        findBackend: getBase,
        api,
        getUser,
        setUser,
        clearUser,
        requireUser,
        formatDate,
        timeAgo,
        formatFileSize,
        initials,
        escapeHtml,
        toast
    };
})();
