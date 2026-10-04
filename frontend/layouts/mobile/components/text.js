import { state } from "../../../core/state.js";
import { windowManager } from "../../../core/windowManager.js";
import { translateWord } from "../../../api/translate.js";
import { tipModal } from "../../../ui/tipModal/tipModal.js";
import { textRequest, textSave } from "../../../api/text.js";
import { voiceWord } from "../../../../api/audio.js"
import { audio, doVoice, doPause } from "../../../shared/voice.js";
import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { t } from "../../../shared/i18n/index.js"
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { createScrollButtonsArea } from "../../../ui/scrollButtonsArea/scrollButtonsArea.js";
import {BaseButton} from "../../../ui/baseButton/baseButton.js";



export async function renderText(set, words) {
  logInfo("Sets screen render start");

  const screen = document.querySelector('[data-screen="text"]');
  if (!screen) {
    logError("Text screen not found");
    return;
  }

  screen.innerHTML = `
    <div class="word-back">
        <button class="word-back-btn">
          <img src="/assets/icons/Arrows.png" class="word-back-icon" alt="←">
          <span>Back</span>
        </button>
    </div>
    <h3 class="ui-title">${set.name} set</h3>

    <div class="label">${t("text", "current_words")}</div>
    <ul class="word-list"></ul><br>

    <div class="label-text hidden">${t("text", "text_current_words")}</div><br>
    <div class="text"></div><br>

    <div class="btn-block hidden">
      <button class="voice-btn">
        <img class="voice-icon" src="/assets/icons/megaphone1.png" alt="🔊">
      </button>
      <button class="change-btn">
        <img class="change-icon" src="/assets/icons/Exchange.png" alt="🔊">
      </button>
    </div>

    <div class="label-text-translation hidden">${t("text", "text_translation")}</div><br>
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

  screen.querySelector(".word-back-btn").onclick = () => {
    windowManager.pushScreen("sets");
  };
  
  // Рендерим слова
  const wordsArray = []
  words.forEach(w => {
    const li = document.createElement("li");
    li.className = "word-item";
    li.dataset.word = w.word;

    const span = document.createElement("span");
    span.className = "word-label";
    span.textContent = w.word;

    li.appendChild(span);
    wordsArray.push(w.word);
    list.appendChild(li);
  });

  await loadText();

  // Клик по слову → tipModal
  list.addEventListener("click", async (event) => {
    const li = event.target.closest(".word-item");
    if (!li) return;

    const wordEl = li.querySelector(".word-label");

    const translationResult = await translateWord({
          word: li.dataset.word,
          sourceLang: state.sourceLang,
          targetLang: state.targetLang
        });

    await tipModal({
      text: translationResult.translation,
      mode: "info",
      target: wordEl
    });
  });

  // Обработчик озвучки
  let isPlaying = false;
  voiceBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!isPlaying) {
      // PLAY
      // const voiceResult = await voiceWord(text.innerText, state.sourceLang, "text");
      // state.setVoice(voiceResult?.audio_data || null);

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
    const renewText = await textRequest({
        endpoint: "/renew_text",
        method: "POST",
        set_id: set.id,
        words: wordsArray
      });
    const voiceResult = await voiceWord(text.innerText, state.sourceLang, "text");
    state.setVoice(voiceResult?.audio_data || null);
    logInfo(`Get Another Text for Set: ${set.name} success`);
    Notification.show({ type: "success", message: t("text", "notification_update_text") });
    const rawRenewText = renewText.text;
    const highLightRenewText = highlightWords(rawRenewText, wordsArray);
    text.innerHTML = highLightRenewText;
    textTranslation.innerHTML = renewText.text_translation;
  });

  // первичный запрос текста по кнопке текст сета
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

      // озвучка текста
      const voiceResult = await voiceWord(textResult.text, state.sourceLang, "text");
      state.setVoice(voiceResult?.audio_data || null);


      Notification.show({ type: "success", message: t("text", "notification_text") });
    } catch (e) {
      logError(`Get Text for Set: ${set.name} failed`, { error: e.message });
      return;
    }
  }
  // Добавление нижнего scroll меню с кнопкой Save
  const area = createScrollButtonsArea({ id: "global-scroll-buttons-area" });
  area.mount();
  // area.trackEl.innerHTML = "";
  // const currentText = text.innerHTML;
  // const currentTranslation = textTranslation.innerHTML;
  // const set_id = set.id;
  area.addButton(createSaveTextBtn(set.id, text, textTranslation));
}

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

// Сохранение текста и перевода в таблице сета для юзера
function createSaveTextBtn(set_id, textEl, textTranslationEl) {
  return new BaseButton({
    label: t("word", "save_btn"),
    type: "word-nav-btn ui-btn",
    icon: "💾",
    action: "click",
    handler: async () => {
      try {
        const result = await textSave({
          endpoint: "/save_text",
          method: "PUT",
          set_id: set_id,
          text: textEl.innerText,
          textTranslation: textTranslationEl.innerText
        });
        logInfo("Save Text success", { result });
        Notification.show({ type: "success", message: t("text", "notification_save") });
      } catch (e) {
        logError("Save Text failed", { error: e.message });
      }
    },
  }).render();
}

