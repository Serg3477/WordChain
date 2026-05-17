import { UserMenu } from "./userMenu.js";
import { CurriculumMenu } from "./appMenu.js";
import { state } from "../../../core/state.js";


const user = state.user;

export function renderMobileNavbar() {
  const root = document.getElementById("navbar-root");

  root.innerHTML = `
    <div class="navbar">
      <img id="app-menu-logo" class="navbar-logo"></img>

      <div class="navbar-title">WordChain</div>

      <div class="navbar-right">
        <span id="nickname" class="user-name">Guest</span>
        <img id="user-menu-avatar" class="navbar-avatar"></img>
      </div>
    </div>
  `;

  const avatarEl = document.getElementById("user-menu-avatar");
  const nicknameEl = document.getElementById("nickname");
  const logoEl = document.getElementById("app-menu-logo");
  logoEl.src = "../../../assets/icons/Logo_21.png";
  
  const appMenu = new CurriculumMenu(root);
  appMenu.button = logoEl;
  logoEl.addEventListener("click", (e) => {
    e.stopPropagation();
    appMenu.toggle();
  });

  const userMenu = new UserMenu(root);
  userMenu.button = avatarEl;
  avatarEl.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.toggle();
  });

  function updateNavbar(user) {
    if (!user) return;
    if (!nicknameEl || !avatarEl) return;
    nicknameEl.textContent = user.nickname || "Guest";
    avatarEl.src = `../../../assets/icons/${user.avatar_url || "user-icon.png"}`;
  }

    // Подписываемся на изменения user
  state.on("user", updateNavbar);

    // Инициализация при загрузке страницы
  updateNavbar(state.user);
}



