import { ensureGuestSession, initSession } from "./features/user/guest.js";
import { windowManager } from "./core/windowManager.js";
import { createTranslateModal } from "./modals/translateModal.js";
import { createRegistrationModal } from "./modals/registrationModal.js";
import { createLoginModal } from "./modals/loginModal.js";
import { createProfileModal } from "./modals/profileModal.js";
import { createDeleteAccountModal, createSignOutModal } from "./modals/accountActionModals.js";



document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initSession();
  } catch (error) {
    console.error("Session init failed:", error);
    try {
      await ensureGuestSession();
    } catch (guestError) {
      console.error("Guest session fallback failed:", guestError);
    }
  }

  windowManager.init();
  windowManager.register("translateModal", createTranslateModal);
  windowManager.register("registrationModal", createRegistrationModal);
  windowManager.register("loginModal", createLoginModal);
  windowManager.register("profileModal", createProfileModal);
  windowManager.register("signOutModal", createSignOutModal);
  windowManager.register("deleteAccountModal", createDeleteAccountModal);

  // Делаем доступным в консоли
  window.windowManager = windowManager;

  // Открывать модалку автоматически
  windowManager.open("translateModal");
});
