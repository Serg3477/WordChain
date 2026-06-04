import { wordRequest } from "../../../../api/word.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { logError } from "../../../../utils/logger/logger.js";
import { normalizeList } from "./utils.js";

export function renderSynonyms(result) {
  const list = normalizeList(result?.synonyms);
  document.querySelector(".result-value-synonyms").textContent = list.join(", ");
  if (list.length) {
    document.querySelector(".result-label-synonyms")?.classList.remove("hidden");
  }
}

export function createSynonymsBtn(appState, id) {
  return new BaseButton({
    label: "Synonyms",
    type: "word-nav-btn ui-btn",
    icon: `<img src="/assets/icons/Link.png" alt="💾">`,
    action: "click",
    handler: async () => {
      try {
        const res = await wordRequest({
          endpoint: "/get_synonyms",
          method: "POST",
          id,
          user_id: appState.user.id,
        });
        renderSynonyms(res);
        appState.setField("synonyms", res.synonyms);
      } catch (e) {
        logError("Synonyms fetch failed", { error: e.message });
      }
    },
  }).render();
}
