// ui/itemsMenu/itemsMenu.js

let menuEl = null;
let hideTimeout = null;

export const itemsMenu = {
  show({ x, y, items }) {
    this.hide();

    menuEl = document.createElement("div");
    menuEl.className = "items-menu";

    menuEl.innerHTML = `
      <div class="items-menu-inner">
        ${items.map(item => `
          <div class="items-menu-item ${item.danger ? "danger" : ""}">
            ${item.icon ? `<img class="items-menu-icon" src="${item.icon}">` : ""}
            <span>${item.label}</span>
          </div>
        `).join("")}
      </div>
    `;

    document.body.appendChild(menuEl);

    // позиционирование
    const rect = menuEl.getBoundingClientRect();
    menuEl.style.left = Math.min(x, window.innerWidth - rect.width - 8) + "px";
    menuEl.style.top = Math.min(y, window.innerHeight - rect.height - 8) + "px";

    // обработчики
    menuEl.querySelectorAll(".items-menu-item").forEach((el, i) => {
      el.addEventListener("click", () => {
        items[i].action?.();
        this.hide();
      });
    });

    // закрытие при клике вне
    setTimeout(() => {
      document.addEventListener("click", this._outsideClick);
    }, 0);
  },

  hide() {
    if (!menuEl) return;
    menuEl.classList.add("hide");
    setTimeout(() => {
      menuEl?.remove();
      menuEl = null;
    }, 150);
    document.removeEventListener("click", this._outsideClick);
  },

  _outsideClick(e) {
    if (!menuEl) return;
    if (!menuEl.contains(e.target)) itemsMenu.hide();
  }
};
