import { CurriculumMenu } from "./curriculum.js";

export class ModalBase {
  constructor() {
    this.root = null;
    this.curriculumMenu = null;
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

    // подключаем меню Curriculum
    this.curriculumMenu = new CurriculumMenu(this.root);
  }

  mountModal(modalElement) {
    const container = this.root.querySelector(".modal-container");
    container.innerHTML = "";
    container.appendChild(modalElement);
  }
}
