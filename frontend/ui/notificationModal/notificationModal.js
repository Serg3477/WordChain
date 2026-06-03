// notification.js
export const Notification = (() => {
    const ICONS = {
        success: `<img class="notify-image" src="/assets/icons/Check.png" alt="✔️">`,
        error: "❌",
        warning: "⚠️",
        info: "ℹ️"
    };

    let container = null;

    function ensureContainer() {
        if (!container) {
            container = document.createElement("div");
            container.className = "notify-container";
            document.body.appendChild(container);
        }
    }

    function show({ type = "info", message = "" }) {
        ensureContainer();

        const el = document.createElement("div");
        el.className = `notify wc-notify-${type}`;

        const icon = document.createElement("span");
        icon.className = "notify-icon";
        icon.innerHTML = ICONS[type] || ICONS.info;

        const text = document.createElement("span");
        text.className = "notify-text";
        text.textContent = message;

        el.appendChild(icon);
        el.appendChild(text);
        container.appendChild(el);

        // Trigger animation
        requestAnimationFrame(() => {
            el.classList.add("show");
        });

        // Auto-remove
        setTimeout(() => {
            el.classList.remove("show");
            el.addEventListener("transitionend", () => el.remove());
        }, 3000);
    }

    return { show };
})();

export default Notification;
