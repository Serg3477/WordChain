import { UserMenu } from "./userMenu.js";
import { CurriculumMenu } from "./appMenu.js";
import { state } from "../../../core/state.js";
import {getAvatarSrc} from "../../../shared/getAvatar.js";


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
  appMenu.setButton(logoEl);
  logoEl.addEventListener("click", (e) => {
    e.stopPropagation();
    // Закрываем UserMenu
    userMenu.hide();

    // Открываем / закрываем AppMenu
    appMenu.toggle();
  });

  const userMenu = new UserMenu(root);
  userMenu.setButton(avatarEl);
  avatarEl.addEventListener("click", (e) => {
    e.stopPropagation();
    // Закрываем AppMenu
    appMenu.hide();

    // Открываем / закрываем UserMenu
    userMenu.toggle();
  });
  userMenu.setButton(nicknameEl);
  nicknameEl.addEventListener("click", (e) => {
    e.stopPropagation();
    // Закрываем AppMenu
    appMenu.hide();

    // Открываем / закрываем UserMenu
    userMenu.toggle();
  });

  function updateNavbar(user) {
    if (!user) return;
    if (!nicknameEl || !avatarEl) return;
    nicknameEl.textContent = user.nickname || "Guest";
    avatarEl.src = getAvatarSrc(state.user.avatar_url);
  }

    // Подписываемся на изменения user
  state.on("user", (user) => {
    if (!user) return;
    if (!nicknameEl || !avatarEl) return;
    nicknameEl.textContent = user.nickname || "Guest";
    avatarEl.src = getAvatarSrc(state.user.avatar_url);
  });

    // Инициализация при загрузке страницы
  updateNavbar(state.user);
}



