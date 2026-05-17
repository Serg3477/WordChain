// ===============================
// CURRICULUM — меню кнопки Curriculum
// ===============================
import { windowManager } from "../../../core/windowManager.js";

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
        <span class="icon">🌐</span> Translation
      </div>
      <div class="menu-item" data-action="sets">
        <span class="icon">📚</span> Sets
      </div>
      <div class="menu-item" data-action="exams">
        <span class="icon">📝</span> Exams
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
      if (action === "sets") windowManager.open("setsModal");
      if (action === "exams") windowManager.open("examsModal");
    });

    // закрытие при клике вне меню
    document.addEventListener("click", (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.button) {
        this.dropdown.classList.add("hidden");
      }
    });
  }
}
