import { wordRequest } from "../../../../api/word.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { logError } from "../../../../utils/logger/logger.js";

export function resultSentences(result, appState) {
  const examples = result?.examples;
  if (!Array.isArray(examples) || !examples.length) return;

  const container = document.querySelector(".result-value-examples");
  if (!container) return;

  container.innerHTML = "";

  const ul = document.createElement("ul");
  for (const item of examples) {
    const li = document.createElement("li");
    li.textContent = String(item).trim();
    ul.appendChild(li);
  }
  container.appendChild(ul);
  document.querySelector(".result-label-sentences")?.classList.remove("hidden");

  appState.setField("examples", examples);
}

export function createSentencesBtn(appState, id) {
  return new BaseButton({
    label: "Sentences",
    type: "word-nav-btn ui-btn",
    icon: `<img src="/assets/icons/List.png" alt="🌐">`,
    action: "click",
    handler: async () => {
      try {
        const res = await wordRequest({
          endpoint: "/get_sentences",
          method: "POST",
          id,
          user_id: appState.user.id,
        });
        resultSentences(res, appState);
      } catch (e) {
        logError("Sentences fetch failed", { error: e.message });
      }
    },
  }).render();
}
