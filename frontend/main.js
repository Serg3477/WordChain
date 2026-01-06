import { ensureGuest } from "./features/user/guest.js";
import { windowManager } from "./core/windowManager.js";
import { createTranslateModal } from "./modals/translateModal.js";




// Пример кнопки для открытия модалки (может быть в UI)
document.addEventListener("DOMContentLoaded", async() => {

  // Инициализация гостя
  await ensureGuest();

  // Регистрация модалок
  windowManager.register("translateModal", createTranslateModal);
  const app = document.getElementById("app");

  // Пример кнопки для теста
  const btn = document.createElement("button");
  btn.textContent = "Open Translator";
  btn.addEventListener("click", () => {
    windowManager.open("translateModal");
  });

  app.appendChild(btn);
});

// 4. (опционально) глобальные события, роутинг, загрузка UI и т.д.
