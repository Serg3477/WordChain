import { ensureGuest } from "./features/user/guest.js";
import { windowManager } from "./core/windowManager.js";
import { createTranslateModal } from "./modals/translateModal.js";

document.addEventListener("DOMContentLoaded", async () => {
  await ensureGuest();

  windowManager.init();
  windowManager.register("translateModal", createTranslateModal);

  // Делаем доступным в консоли
  window.windowManager = windowManager;

  // Открывать модалку автоматически
  windowManager.open("translateModal");

  // const btn = document.createElement("button");
  // btn.textContent = "Open Translator";
  // btn.onclick = () => windowManager.open("translateModal");

  // document.getElementById("app").appendChild(btn);

});

