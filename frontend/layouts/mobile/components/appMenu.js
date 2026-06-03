// ===============================
// APP MENU — меню кнопки Logo
// ===============================
import { windowManager } from "../../../core/windowManager.js";
import { renderSets } from "./sets.js";

export class CurriculumMenu {
  constructor(baseRoot) {
    this.baseRoot = baseRoot;
    this.dropdown = null;
    this.button = null; // кнопка будет передана извне

    this.createDropdown();
  }

  toggle() {
    this.dropdown.classList.toggle("hidden");

    const rect = this.button.getBoundingClientRect();
    this.dropdown.style.left = rect.left + "px";
    this.dropdown.style.top = rect.bottom + "px";
  }

  createDropdown() {
    this.dropdown = document.createElement("div");
    this.dropdown.className = "dropdown-menu hidden";

    this.dropdown.innerHTML = `
      <div class="menu-item" data-action="translation">
        <span>
          <img class="icon" src="/assets/icons/Text.png">
        </span> Translation
      </div>
      <div class="menu-item" data-action="sets">
        <span>
          <img class="icon" src="/assets/icons/books.png">
        </span> Sets
      </div>
      <div class="menu-item" data-action="exams">
        <span>
          <img class="icon" src="/assets/icons/Shield.png">
        </span> Exams
      </div>
      <div class="menu-item" data-action="options">
        <span>
          <img class="icon" src="/assets/icons/Settings.png">
        </span> Settings
      </div>
    `;

    document.body.appendChild(this.dropdown);

    // логика выбора пункта меню
    this.dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".menu-item");
      if (!item) return;

      const action = item.dataset.action;
      this.dropdown.classList.add("hidden");

      if (action === "translation") windowManager.pushScreen("translator");
      if (action === "sets") {windowManager.pushScreen("sets"); renderSets();};
      if (action === "exams") windowManager.open("examsModal");
      if (action === "settings") windowManager.open("settingsModal");
    });

    // закрытие при клике вне меню
    document.addEventListener("click", (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.button) {
        this.dropdown.classList.add("hidden");
      }
    });
  }
}
