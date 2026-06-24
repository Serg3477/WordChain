import { state } from "../../../../core/state.js";
import { wordRequest } from "../../../../api/word.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { logError } from "../../../../utils/logger/logger.js";
import { voiceWord } from "../../../../api/translate.js"
import { doVoice } from "../../../../utils/voice.js";



export function resultSentences(result, appState) {
  const examples = result?.examples;
  if (!Array.isArray(examples) || !examples.length) return;

  const container = document.querySelector(".result-value-examples");
  if (!container) return;

  container.innerHTML = "";

  const ul = document.createElement("ul");
  for (const item of examples) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = String(item).trim();

    // Кнопка озвучки
    const btn = document.createElement("button");
    btn.className = "word-action-btn";
    btn.innerHTML = `
      <img class="word-icon" src="/assets/icons/megaphone1.png" alt="🔊">
    `;

    // Обработчик озвучки
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const voiceResult = await voiceWord(item, state.sourceLang, "sentence");
      state.setVoice(voiceResult?.audio_data || null);
      doVoice();
    });

    li.appendChild(span);
    li.appendChild(btn);
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
