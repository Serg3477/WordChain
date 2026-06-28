import { state } from "../../../core/state.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { tipModal } from "../../../ui/tipModal/tipModal.js";
import { translateWord } from "../../../api/translate.js";
import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { textRequest } from "../../../api/text.js";
import { voiceWord } from "../../../../api/audio.js"
import { audio, doVoice, doPause } from "../../../../utils/voice.js";



export async function renderText(set, words) {
  logInfo("Sets screen render start");

  const screen = document.querySelector('[data-screen="text"]');
  if (!screen) {
    logError("Text screen not found");
    return;
  }

  screen.innerHTML = `
    <h3 class="ui-title">${set.name} set</h3>

    <div class="label">Current words:</div>
    <ul class="word-list"></ul><br>

    <div class="label-text hidden">Text with current words:</div><br>
    <div class="text"></div><br>

    <div class="btn-block hidden">
      <button class="voice-btn">
        <img class="voice-icon" src="/assets/icons/megaphone1.png" alt="🔊">
      </button>
      <button class="change-btn">
        <img class="change-icon" src="/assets/icons/Exchange.png" alt="🔊">
      </button>
    </div>

    <div class="label-text-translation hidden">Text translation:</div><br>
    <div class="text-translation"></div>
  `;

  const list = screen.querySelector(".word-list");
  const labelText = screen.querySelector(".label-text")
  const labelTextTrans = screen.querySelector(".label-text-translation")
  const text = screen.querySelector(".text");
  const textTranslation = screen.querySelector(".text-translation")
  const buttons = screen.querySelector(".btn-block");
  const voiceBtn = screen.querySelector(".voice-btn");
  const changeBtn = screen.querySelector(".change-btn");
  const voiceIcon = screen.querySelector(".voice-icon");

  // Рендерим слова
  const wordsArray = []
  words.forEach(w => {
    const li = document.createElement("li");
    li.className = "word-item";
    li.textContent = w.word;
    li.dataset.word = w.word;
    wordsArray.push(w.word);
    list.appendChild(li);
  });

  await loadText();

  // Клик по слову → tipModal
  list.addEventListener("click", async (event) => {
    const li = event.target.closest(".word-item");
    if (!li) return;

    const translationResult = await translateWord({
          word: li.dataset.word,
          sourceLang: state.sourceLang,
          targetLang: state.targetLang
        });

    await tipModal({
      text: translationResult.translation,
      target: li
    });
  });

  // Обработчик озвучки
  let isPlaying = false;
  voiceBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!isPlaying) {
      // PLAY
      const voiceResult = await voiceWord(text.innerText, state.sourceLang, "text");
      state.setVoice(voiceResult?.audio_data || null);

      voiceIcon.src = "/assets/icons/pause.png";
      doVoice();
      setTimeout(() => {
        if (audio) {
          audio.onended = () => {
            voiceIcon.src = "/assets/icons/megaphone1.png";
            isPlaying = false;
          };
        }
      }, 0);
    } else {
      // PAUSE
      voiceIcon.src = "/assets/icons/megaphone1.png";
      doPause();
    };
    isPlaying = !isPlaying;
  });

  // Обработчик changeBtn смена текста
  changeBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await loadText();
    logInfo(`Get Another Text for Set: ${set.name} success`);
    Notification.show({ type: "success", message: `Update text success for set "${set.name}"` });
  });

  async function loadText() {
    try {
      const textResult = await textRequest({ 
        endpoint: "/get_text",
        method: "POST",
        set_id: set.id,
        words: wordsArray
      });

      // Обновляем текст
      if (textResult.text.length) labelText.classList.remove("hidden");
      const rawText = textResult.text;
      const highLightText = highlightWords(rawText, wordsArray);
      text.innerHTML = highLightText;

      // Обновляем перевод
      if (textResult.text_translation.length) {
        labelTextTrans.classList.remove("hidden");
        buttons.classList.remove("hidden");
      }
      textTranslation.innerHTML = textResult.text_translation;

      const voiceResult = await voiceWord(textResult.text, state.sourceLang, "text");
      state.setVoice(voiceResult?.audio_data || null);


      Notification.show({ type: "success", message: `Resolve text success for set "${set.name}"` });
    } catch (e) {
      logError(`Get Text for Set: ${set.name} failed`, { error: e.message });
      Notification.show({ type: "error", message: `Failed to fetch text for set "${set.name}"` });
    }
  }
};

// Выделение слов в тексте
function highlightWords(text, words) {
  // Экранируем спецсимволы для RegExp
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  // Создаём регэксп: \b(word1|word2|word3)\b
  const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

  return text.replace(regex, match => {
    return `<span class="highlight">${match}</span>`;
  });
}



