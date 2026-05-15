import { UserMenu } from "./userMenu.js";
import { CurriculumMenu } from "./appMenu.js";

export function renderMobileNavbar() {
  const root = document.getElementById("navbar-root");

  root.innerHTML = `
    <div class="navbar">
      <button id="app-menu-btn" class="navbar-btn">☰</button>
      <div class="navbar-title">WordChain</div>
      <button id="user-menu-btn" class="navbar-btn">👤</button>
    </div>
  `;

  const appMenuBtn = document.getElementById("app-menu-btn");
  const appMenu = new CurriculumMenu(root);
  appMenu.button = appMenuBtn;
  appMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    appMenu.toggle();
  });

  const userMenuBtn = document.getElementById("user-menu-btn");
  const userMenu = new UserMenu(root);
  userMenu.button = userMenuBtn;
  userMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.toggle();
  });
}
