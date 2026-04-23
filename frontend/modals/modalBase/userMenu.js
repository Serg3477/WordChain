// ===============================
// USERMENU — меню аватара и никнейма
// ===============================
import { windowManager } from "../../core/windowManager.js";

export class UserMenu {
  constructor(baseRoot) {
    this.baseRoot = baseRoot;
    this.dropdown = null;
    this.button = null; // кнопка будет передана извне

    this.createDropdown();
  }

  // показать/спрятать меню
  toggle() {
    this.dropdown.classList.toggle("hidden");

    // Берём координаты и размеры кнопки (аватара или никнейма), к которой привязано меню.
    // rect содержит: top, left, right, bottom, width, height — в координатах окна.
    const rect = this.button.getBoundingClientRect();
    const menuRect = this.dropdown.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom;

    // Если меню выходит за правый край — сдвигаем влево
    if (left + menuRect.width > window.innerWidth) {
      left = window.innerWidth - menuRect.width - 10;
    }

    this.dropdown.style.left = left + "px";
    this.dropdown.style.top = top + "px";
  }

  // создание меню
  createDropdown() {
    this.dropdown = document.createElement("div");
    this.dropdown.className = "dropdown-menu hidden";

    this.dropdown.innerHTML = `
      <div class="menu-item" data-action="profile">
        <span class="icon">👤</span> Profile
      </div>
      <div class="menu-item" data-action="registerAccount">
        <span class="icon">➕</span> Sign Up
      </div>
      <div class="menu-item" data-action="loginAccount">
        <span class="icon">➡️</span> Sign In
      </div>
      <div class="menu-item" data-action="quitAccount">
        <span class="icon">↩️</span> Sign Out
      </div>
      <div class="menu-item" data-action="deleteAccount">
        <span class="icon">🗑️</span> Delete Account
      </div>
    `;

    document.body.appendChild(this.dropdown);

    // логика выбора пункта меню
    this.dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".menu-item");
      if (!item) return;

      const action = item.dataset.action;
      this.dropdown.classList.add("hidden");

      if (action === "profile") windowManager.open("profileModal");
      if (action === "registerAccount") windowManager.open("registerModal");
      if (action === "loginAccount") windowManager.open("loginModal");
      if (action === "quitAccount") windowManager.open("quitModal");
      if (action === "deleteAccount") windowManager.open("loginModal");
    });

    // закрытие при клике вне меню
    document.addEventListener("click", (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.button) {
        this.dropdown.classList.add("hidden");
      }
    });
  }
}
