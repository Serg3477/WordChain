// ===============================
// USERMENU — меню аватара и никнейма
// ===============================
import { state } from "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js";
import { renderRegister } from "./register.js";
import { renderLogin } from "./login.js";
import { renderProfile } from "./profile.js";
import { t } from "../../../shared/i18n/index.js";

export class UserMenu {
  constructor(baseRoot) {
    this.baseRoot = baseRoot;
    this.button = null;
    this.dropdown = null;

    this.render();          // ← первый рендер
    this.attachGlobalClose();
    this.subscribeToLanguage();  // ← реактивность
  }


  // Реактивная подписка на язык
  subscribeToLanguage() {
    state.on("interface", () => {
      this.reRender();      // ← пересоздание меню
    });
  }

  // Перерисовка меню
  reRender() {
    if (this.dropdown) {
      this.dropdown.remove();   // удалить старый DOM
    }
    this.render();              // создать новый DOM
  }


  // Шаблон меню
  template() {
    return `
      <div class="menu-item" data-action="profile">
        <span><img class="icon" src="/assets/icons/default.png"></span>
        ${t("userMenu", "profile_label")}
      </div>

      <div class="menu-item" data-action="registerAccount">
        <span><img class="icon" src="/assets/icons/Key.png"></span>
        ${t("userMenu", "sign_up_label")}
      </div>

      <div class="menu-item" data-action="loginAccount">
        <span><img class="icon" src="/assets/icons/Fingerprint.png"></span>
        ${t("userMenu", "sign_in_label")}
      </div>

      <div class="menu-item" data-action="quitAccount">
        <span><img class="icon" src="/assets/icons/Error.png"></span>
        ${t("userMenu", "sign_out_label")}
      </div>

      <div class="menu-item" data-action="deleteAccount">
        <span><img class="icon" src="/assets/icons/Bomb.png"></span>
        ${t("userMenu", "delete_label")}
      </div>
    `;
  }


  // Создание DOM меню
  render() {
    this.dropdown = document.createElement("div");
    this.dropdown.className = "dropdown-menu hidden";
    this.dropdown.innerHTML = this.template();

    document.body.appendChild(this.dropdown);

    this.attachHandlers();
  }


  // Обработчики кликов
  attachHandlers() {
    this.dropdown.addEventListener("click", async (e) => {
      const item = e.target.closest(".menu-item");
      if (!item) return;

      const action = item.dataset.action;
      this.hide();

      if (action === "profile") {
        windowManager.pushScreen("profile");
        renderProfile(state);
      }
      if (action === "registerAccount") {
        windowManager.pushScreen("register");
        renderRegister(state);
      }
      if (action === "loginAccount") {
        windowManager.pushScreen("login");
        renderLogin(state);
      }
      if (action === "quitAccount") {
        windowManager.open("signOutModal");
      }
      if (action === "deleteAccount") {
        windowManager.open("deleteAccountModal");
      }
    });
  }


  // Глобальное закрытие
  attachGlobalClose() {
    document.addEventListener("click", (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.button) {
        this.hide();
      }
    });
  }


  // Показ / скрытие меню
  toggle() {
    this.dropdown.classList.toggle("hidden");

    const rect = this.button.getBoundingClientRect();
    const menuRect = this.dropdown.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom;

    // Если меню выходит за правый край — сдвигаем влево на 10px
    const rightEdge = left + menuRect.width;
    const viewportWidth = window.innerWidth;

    if (rightEdge > viewportWidth - 10) {
      left = viewportWidth - menuRect.width - 10;
    }

    this.dropdown.style.left = left + "px";
    this.dropdown.style.top = top + "px";
  }

  hide() {
    this.dropdown.classList.add("hidden");
  }


  // Установка кнопки
  setButton(btn) {
    this.button = btn;
  }
}
