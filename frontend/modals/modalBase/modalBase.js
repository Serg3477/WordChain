import { CurriculumMenu } from "./curriculum.js";
import { NavbarButton } from "../../ui/buttons/navbar/navbarButtons.js";

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
          
        </nav>

        <div class="navbar-right">
          <span class="user-name">Guest</span>
          <div class="avatar"></div>
        </div>
      </header>

      <div class="modal-container"></div>
    `;

    document.body.appendChild(this.root);

    const navbarCenter = this.root.querySelector(".navbar-center");

    // Curriculum
    const curriculumBtn = new NavbarButton({
      label: "Curriculum",
      type: "nav-btn navbar ui-btn",
      icon: "📘",
      action: "click",
      handler: () => this.curriculumMenu.toggle()  // ← curriculum.js
    }).render();

    // Progress
    const progressBtn = new NavbarButton({
      label: "Progress",
      type: "nav-btn ui-btn",
      icon: "📊",
      dataAction: "progress"
    }).render();

    // Options
    const optionsBtn = new NavbarButton({
      label: "Options",
      type: "nav-btn ui-btn",
      icon: "⚙️",
      dataAction: "options"
    }).render();

    navbarCenter.appendChild(curriculumBtn);
    navbarCenter.appendChild(progressBtn);
    navbarCenter.appendChild(optionsBtn);

    // подключаем меню Curriculum
    this.curriculumMenu = new CurriculumMenu(this.root);

    // ВАЖНО: передаём кнопку в меню
    this.curriculumMenu.button = curriculumBtn;
  }

  mountModal(modalElement) {
    const container = this.root.querySelector(".modal-container");
    container.innerHTML = "";
    container.appendChild(modalElement);
  }
}