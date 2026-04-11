export class ModalBase {
  constructor() {
    this.root = null;
    this.dropdown = null;
  }

  create() {
    this.root = document.createElement("div");
    this.root.className = "modal-base";

    this.root.innerHTML = `
      <header class="navbar">
        <div class="navbar-left">
          <div class="logo">LOGO</div>
        </div>

        <nav class="navbar-center">
          <button class="nav-btn" data-action="curriculum">Curriculum</button>
          <button class="nav-btn" data-action="progress">Progress</button>
          <button class="nav-btn" data-action="options">Options</button>
        </nav>

        <div class="navbar-right">
          <span class="user-name">Guest</span>
          <div class="avatar"></div>
        </div>
      </header>

      <div class="modal-container"></div>
    `;

    document.body.appendChild(this.root);

    // === ДОБАВЛЯЕМ DROPDOWN ===
    this.createDropdown();
    this.attachMenuLogic();
  }

  // --- создаём меню ---
  createDropdown() {
    this.dropdown = document.createElement("div");
    this.dropdown.className = "dropdown-menu hidden";

    this.dropdown.innerHTML = `
      <div class="menu-item" data-action="translation">Translation</div>
      <div class="menu-item" data-action="sets">Sets</div>
      <div class="menu-item" data-action="exams">Exams</div>
    `;

    document.body.appendChild(this.dropdown);
  }

  // --- логика меню ---
  attachMenuLogic() {
    const curriculumBtn = this.root.querySelector('[data-action="curriculum"]');

    curriculumBtn.addEventListener("click", () => {
      this.dropdown.classList.toggle("hidden");

      const rect = curriculumBtn.getBoundingClientRect();
      this.dropdown.style.left = rect.left + "px";
      this.dropdown.style.top = rect.bottom + "px";
    });

    // закрытие при клике вне меню
    document.addEventListener("click", (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== curriculumBtn) {
        this.dropdown.classList.add("hidden");
      }
    });

    // обработка пунктов меню
    this.dropdown.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      this.dropdown.classList.add("hidden");

      if (action === "translation") {
        windowManager.open("translateModal");
      }

      if (action === "sets") {
        windowManager.open("setsModal");
      }

      if (action === "exams") {
        windowManager.open("examsModal");
      }
    });
  }

  mountModal(modalElement) {
    const container = this.root.querySelector(".modal-container");
    container.innerHTML = "";
    container.appendChild(modalElement);
  }
}
