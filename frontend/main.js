import { initSession, ensureGuestSession } from "./api/guest.js"
import { createBaseLayout } from "./core/base.js";
import { windowManager } from "./core/windowManager.js";
import { subscribe, state } from "./core/state.js";
import { initLayoutWatcher } from "./core/layoutDetector.js";

import { renderMobile } from "./layouts/mobile/index.js";
import { createSignOutModal, createDeleteAccountModal } from "./layouts/mobile/components/accountActionModal.js"



// 1. Создаём DOM
createBaseLayout();

// 2. Инициализируем менеджер окон
windowManager.init();

// 3. Подписываемся на изменения state
subscribe((state) => {
  const contentRoot = document.getElementById("content-root");
  if (!contentRoot) return; // защита

  contentRoot.innerHTML = "";

  // if (state.layout === "desktop") {
  //   renderDesktop(state);
  // } else {
  //   renderMobile(state);
  // }

  // Временный безопасный fallback:
  // пока desktop-ветка не реализована, рендерим mobile для обоих layout.
  renderMobile(state);
});

// 4. Только теперь запускаем layoutDetector
initLayoutWatcher();


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
});

// Модальные окна
windowManager.register("signOutModal", createSignOutModal);
windowManager.register("deleteAccountModal", createDeleteAccountModal);


// универсальный debug: ловим любые focus/blur на документе
// document.addEventListener('focusin', (e) => {
//   console.log('FOCUSIN target:', e.target);
// }, true);

// document.addEventListener('focusout', (e) => {
//   console.log('FOCUSOUT target:', e.target, 'activeElement:', document.activeElement);
//   console.trace();
// }, true);

// console.log('Global focus debug attached');



