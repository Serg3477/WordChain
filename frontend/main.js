import { initGuest } from "./features/user/guest.js";
import { windowManager } from "./core/windowManager.js";
import { createTranslateModal } from "./modals/translateModal.js";
import { createRegistrationModal } from "./modals/registrationModal.js";
import { createLoginModal } from "./modals/loginModal.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initGuest();

  windowManager.init();
  windowManager.register("translateModal", createTranslateModal);
  windowManager.register("registrationModal", createRegistrationModal);
  windowManager.register("loginModal", createLoginModal);

  // Делаем доступным в консоли
  window.windowManager = windowManager;

  // Открывать модалку автоматически
  windowManager.open("translateModal");

});



