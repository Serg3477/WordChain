import { state } from "../../../../core/state.js";
import { logInfo } from "../../../../utils/logger/logger.js";

function swapLanguages(leftBtn, rightBtn) {
  logInfo("Language swap clicked", {
    sourceLang: state.sourceLang,
    targetLang: state.targetLang,
  });

  const tmp = state.sourceLang;
  state.sourceLang = state.targetLang;
  state.targetLang = tmp;

  leftBtn.textContent = state.sourceLang;
  rightBtn.textContent = state.targetLang;
}

export function setupLangSwitcher(screen) {
  const leftBtn = screen.querySelector("#lang-left");
  const rightBtn = screen.querySelector("#lang-right");

  leftBtn.addEventListener("click", () => swapLanguages(leftBtn, rightBtn));
  rightBtn.addEventListener("click", () => swapLanguages(leftBtn, rightBtn));
}
