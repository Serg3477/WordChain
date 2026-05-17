// layouts/mobile/components/translator.js

import { translateWord, saveWord } from "../../../api/translate.js";
import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { EraseInputButton } from "../../../ui/erase/eraseInputButton.js";
import { state } from "../../../core/state.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";




const LANGUAGE_LABELS = {
  en: "English",
  ru: "Russian",
  uk: "Ukrainian",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pl: "Polish"
};

function getLanguageLabel(langCode) {
  if (!langCode) return "Target language";
  return LANGUAGE_LABELS[langCode] ?? String(langCode).toUpperCase();
}


export function renderTranslator(state) {
  logInfo("Translate screen render start");

  const screen = document.querySelector('[data-screen="translator"]');
  logInfo("Translate screen node", { found: !!screen });

    if (!screen) {
        logError("Translate screen not found");
        return;
    }
  screen.innerHTML = `
    <div class="translator-screen">

      <!-- INPUT FIELD -->
      <div class="input-container">
        <input class="input-placeholder" placeholder="Enter word...">
        <div class="erase-container"></div>
      </div>

      <!-- BUTTONS ROW -->
      <div class="buttons-row"></div>

      <!-- OUTPUT FIELD -->
      <div class="output-container">
        <div id="translation-output" class="output-text"></div>
      </div>

      <!-- LANGUAGE SWITCHER -->
      <div class="lang-switcher">
        <button id="lang-left" class="lang-btn">${state.sourceLang}</button>
        <span class="lang-arrow">↔</span>
        <button id="lang-right" class="lang-btn">${state.targetLang}</button>
      </div>

    </div>
  `;

  // ---------------------------
  // ЭЛЕМЕНТЫ
  // ---------------------------
  const inputContainer = screen.querySelector(".input-container");
  const placeholder = screen.querySelector(".input-placeholder");
  const eraseContainer = screen.querySelector(".erase-container");
  const output = screen.querySelector("#translation-output");
  const buttonsRow = screen.querySelector(".buttons-row");

  // Внутреннее состояние поля ввода
  let currentWord = "";

  // ---------------------------
  // КНОПКА ОЧИСТКИ
  // ---------------------------
  const eraseBtn = new EraseInputButton({
    handler: () => {
      placeholder.value = "";
      placeholder.classList.remove("clearable");
      placeholder.focus();
    }
  }).render();

  eraseContainer.appendChild(eraseBtn);
  eraseBtn.classList.add("is-invisible");
  placeholder.addEventListener("input", () => {
    const hasValue = placeholder.value.trim().length > 0;
    eraseBtn.classList.toggle("is-invisible", !hasValue);
  });


  let result = null;
  // ---------------------------
  // КНОПКА TRANSLATE
  // ---------------------------
  const translateBtn = new BaseButton({
    label: "Translate",
    type: "trans-btn trans-btn-translate ui-btn",
    icon: "🌐",
    action: "click",
    handler: doTranslate
  }).render();

  async function doTranslate() {
    logInfo("Translate button clicked");
    const word = placeholder.value.trim();
    if (!word) {
      logInfo("Translate aborted: empty input");
      return;
    }

    try {
      logInfo("Translate request start", {
        word,
        sourceLang: state.sourceLang,
        targetLang: state.targetLang
      });
      result = await translateWord({
        word,
        sourceLang: "en",
        targetLang: "ru"
      });
      logInfo("Translate request success", {
        hasTranslation: !!result?.translation
      });
    } catch (e) {
      logError("Translate request failed in UI", { error: e.message });
    }

      const targetLanguageLabel = getLanguageLabel(state.targetLang);

      if (result?.translation) {
        output.innerHTML = `
      <div class="result-item">
        <div class="result-label">Translation: ${targetLanguageLabel}:</div>
        <div class="result-value result-value-strong">${result.translation ?? ""}</div>
      </div><br>
      <div class="result-item">
        <div class="result-label">Transcription:</div>
        <div class="result-value">${result.transcription ?? ""}</div>
      </div><br>
      <div class="result-item">
        <div class="result-label">Part of speech:</div>
        <div class="result-value">${result.part_of_speech ?? ""}</div>
      </div><br>
    `;
      }
  }
 
  // ---------------------------
  // КНОПКА SAVE
  // ---------------------------
  const saveBtn = new BaseButton({
    label: "Save",
    type: "trans-btn trans-btn-save ui-btn",
    icon: "💾",
    action: "click",
    handler: doSave
  }).render();

  async function doSave() {
    logInfo("Save button clicked", { hasResult: !!result });
    if (!result) return;
    try {
      await saveWord(placeholder.value.trim(), result);
      logInfo("Save request success");
    } catch (e) {
      logError("Save request failed in UI", { error: e.message });
    }
  }

  buttonsRow.appendChild(translateBtn);
  buttonsRow.appendChild(saveBtn);

  // ---------------------------
  // ПЕРЕКЛЮЧЕНИЕ ЯЗЫКОВ
  // ---------------------------
  const leftBtn = screen.querySelector("#lang-left");
  const rightBtn = screen.querySelector("#lang-right");

  leftBtn.addEventListener("click", () => {
    logInfo("Language swap clicked", {
      sourceLang: state.sourceLang,
      targetLang: state.targetLang
    });
    const tmp = state.sourceLang;
    state.sourceLang = state.targetLang;
    state.targetLang = tmp;

    leftBtn.textContent = state.sourceLang;
    rightBtn.textContent = state.targetLang;
  });

  rightBtn.addEventListener("click", () => {
    const tmp = state.sourceLang;
    state.sourceLang = state.sourceLang;
    state.targetLang = state.targetLang;

    leftBtn.textContent = state.sourceLang;
    rightBtn.textContent = state.targetLang;
  });
}
