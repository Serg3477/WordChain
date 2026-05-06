import { state } from "../../core/state.js";
import { CurriculumMenu } from "./curriculum.js";
import { UserMenu } from "./userMenu.js";
import { NavbarButton } from "../../ui/buttons/navbar/navbarButtons.js";

export class ModalBase {
  constructor() {
    this.root = null;
    this.curriculumMenu = null;
    this.userMenu = null
  }

  create() {
    this.root = document.createElement("div");
    this.root.className = "modal-base";

    this.root.innerHTML = `
      <header class="navbar">
        <div class="navbar-left">
          <img id="logo" class="logo"></img>
        </div>

        <nav class="navbar-center">
          
        </nav>

        <div class="navbar-right">
          <span id="nickname" class="user-name">Guest</span>
          <img id="avatar" class="avatar"></img>
        </div>
      </header>

      <div class="modal-container"></div>
    `;

    document.body.appendChild(this.root);

    const logoEl = document.getElementById("logo");
    logoEl.src = "../assets/icons/Beige2.png";

    const navbarCenter = this.root.querySelector(".navbar-center");

    // Curriculum
    const curriculumBtn = new NavbarButton({
      label: "Curriculum",
      type: "nav-btn ui-nav-btn",
      icon: "📘",
      action: "click",
      handler: () => this.curriculumMenu.toggle()  // ← curriculum.js
    }).render();

    // Progress
    const progressBtn = new NavbarButton({
      label: "Progress",
      type: "nav-btn ui-nav-btn",
      icon: "📊",
      action: "click"
    }).render();

    // Options
    const optionsBtn = new NavbarButton({
      label: "Options",
      type: "nav-btn ui-nav-btn",
      icon: "⚙️",
      action: "click"
    }).render();

    navbarCenter.appendChild(curriculumBtn);
    navbarCenter.appendChild(progressBtn);
    navbarCenter.appendChild(optionsBtn);

    // подключаем меню Curriculum
    this.curriculumMenu = new CurriculumMenu(this.root);

    // ВАЖНО: передаём кнопку в меню
    this.curriculumMenu.button = curriculumBtn;

    // подключаем меню userMenu
    this.userMenu = new UserMenu(this.root);

    const avatarEl = document.getElementById("avatar");
    const nicknameEl = document.getElementById("nickname");

    // ВАЖНО: передаём кнопку в меню
    this.userMenu.button = avatarEl;

    avatarEl.addEventListener("click", () => this.userMenu.toggle());

    // Функция обновления UI
    function updateNavbar(user) {
      if (!user) return;

      nicknameEl.textContent = user.nickname || "Guest";
      avatarEl.src = `/assets/icons/${user.avatar_url || "default.png"}`;
    }

    // Подписываемся на изменения user
    state.on("user", updateNavbar);

    // Инициализация при загрузке страницы
    updateNavbar(state.user);
  }

  mountModal(modalElement) {
    const container = this.root.querySelector(".modal-container");
    // container.innerHTML = "";
    container.appendChild(modalElement);
  }
  

}
