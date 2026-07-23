// ===============================
// APP MENU — меню кнопки Logo
// ===============================
import { state } from "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js";
import { renderSets } from "./sets.js";
import { renderExercise } from "./exercise.js"
import { renderSettings } from "./settings.js";
import { t } from "../../../shared/i18n/index.js";

export class CurriculumMenu {
  constructor(baseRoot) {
    this.baseRoot = baseRoot;
    this.button = null;
    this.dropdown = null;

    this.render();               // первый рендер
    this.attachGlobalClose();    // закрытие при клике вне меню
    this.subscribeToLanguage();  // реактивность
  }


  // Реактивная подписка на язык
  subscribeToLanguage() {
    state.on("interface", () => {
      this.reRender();           // пересоздание меню
    });
  }


  // Перерисовка меню
  reRender() {
    if (this.dropdown) {
      this.dropdown.remove();    // удалить старый DOM
    }
    this.render();               // создать новый DOM
  }

  // Шаблон меню
  template() {
    return `
      <div class="menu-item" data-action="translation">
        <span><img class="icon" src="/assets/icons/Text.png"></span>
        ${t("appMenu", "translation_label")}
      </div>

      <div class="menu-item" data-action="sets">
        <span><img class="icon" src="/assets/icons/books.png"></span>
        ${t("appMenu", "sets_label")}
      </div>

      <div class="menu-item" data-action="exercise">
        <span><img class="icon" src="/assets/icons/Fire.png"></span>
        ${t("appMenu", "exercise_label")}
      </div>

      <div class="menu-item" data-action="exams">
        <span><img class="icon" src="/assets/icons/Shield.png"></span>
        ${t("appMenu", "exams_label")}
      </div>

      <div class="menu-item" data-action="options">
        <span><img class="icon" src="/assets/icons/Settings.png"></span>
        ${t("appMenu", "settings_label")}
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
    this.dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".menu-item");
      if (!item) return;

      const action = item.dataset.action;
      this.hide();

      if (action === "translation") {
        windowManager.pushScreen("translator");
      }

      if (action === "sets") {
        windowManager.pushScreen("sets");
        renderSets();
      }

      if (action === "exercise") {
        windowManager.pushScreen("exercise");
        renderExercise();
      }

      if (action === "exams") {
        windowManager.open("examsModal");
      }

      if (action === "options") {
        windowManager.pushScreen("settings");
        renderSettings();
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
    this.dropdown.style.left = rect.left + "px";
    this.dropdown.style.top = rect.bottom + "px";
  }

  hide() {
    this.dropdown.classList.add("hidden");
  }

  // Установка кнопки
  setButton(btn) {
    this.button = btn;
  }
}
