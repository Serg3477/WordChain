import { wordRequest } from "../../../../api/word.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { logError } from "../../../../utils/logger/logger.js";
import { normalizeList } from "../../../../shared/wordHelpers.js";
import { t } from "../../../../shared/i18n/index.js"

export function renderAntonyms(result) {
  const list = normalizeList(result?.antonyms);
  document.querySelector(".result-value-antonyms").textContent = list.join(", ");
  if (list.length) {
    document.querySelector(".result-label-antonyms")?.classList.remove("hidden");
  }
}

export function createAntonymsBtn(appState, id) {
  return new BaseButton({
    label: t("word", "antonyms_btn"),
    type: "word-nav-btn ui-btn",
    icon: `<img src="/assets/icons/Exchange.png" alt="🌐">`,
    action: "click",
    handler: async () => {
      try {
        const res = await wordRequest({
          endpoint: "/get_antonyms",
          method: "POST",
          id,
          user_id: appState.user.id,
        });
        renderAntonyms(res);
        appState.setField("antonyms", res.antonyms);
      } catch (e) {
        logError("Antonyms fetch failed", { error: e.message });
        return;
      }
    },
  }).render();
}
