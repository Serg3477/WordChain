import { createBaseLayout } from "./core/base.js";
import { windowManager } from "./core/windowManager.js";
import { subscribe, state } from "./core/state.js";
import { initLayoutWatcher } from "./core/layoutDetector.js";

import { renderMobile } from "./layouts/mobile/index.js";



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
