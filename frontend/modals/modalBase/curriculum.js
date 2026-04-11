import { windowManager } from "../../core/windowManager.js";

export class CurriculumMenu {
  constructor(baseRoot) {
    this.baseRoot = baseRoot;
    this.dropdown = null;

    this.createDropdown();
    this.attachLogic();
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
  }

  attachLogic() {
    const btn = this.baseRoot.querySelector('[data-action="curriculum"]');

    btn.addEventListener("click", () => {
      this.dropdown.classList.toggle("hidden");

      const rect = btn.getBoundingClientRect();
      this.dropdown.style.left = rect.left + "px";
      this.dropdown.style.top = rect.bottom + "px";
    });

    document.addEventListener("click", (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== btn) {
        this.dropdown.classList.add("hidden");
      }
    });

    this.dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".menu-item");
      if (!item) return;

      const action = item.dataset.action;
      this.dropdown.classList.add("hidden");

      if (action === "translation") windowManager.open("translateModal");
      if (action === "sets") windowManager.open("setsModal");
      if (action === "exams") windowManager.open("examsModal");
    });
  }
}
