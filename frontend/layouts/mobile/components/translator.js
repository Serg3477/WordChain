// layouts/mobile/components/translator.js

import { translateWord, saveWord } from "../../../api/translate.js";
import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { EraseInputButton } from "../../../ui/erase/eraseInputButton.js";
import { state } from "../../../core/state.js";




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
  const screen = document.querySelector('[data-screen="translator"]');

  screen.innerHTML = `
    <div class="translator-screen">

      <!-- INPUT FIELD -->
      <div class="input-container">
        <div class="input-placeholder">Enter a word...</div>
        <button class="erase-container"></button>
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
      currentWord = "";
      placeholder.textContent = "Enter a word...";
      placeholder.classList.remove("active");
      eraseBtn.classList.add("hidden");
      output.textContent = "";
    }
  }).render();

  eraseContainer.appendChild(eraseBtn);
  eraseBtn.classList.add("hidden");

  // ---------------------------
  // ОБРАБОТКА ВВОДА (клик по placeholder)
  // ---------------------------
  placeholder.addEventListener("click", () => {
    const word = prompt("Enter a word:");
    if (!word) return;

    currentWord = word;
    placeholder.textContent = word;
    placeholder.classList.add("active");
    eraseBtn.classList.remove("hidden");
  });

  // ---------------------------
  // КНОПКА TRANSLATE
  // ---------------------------
  const translateBtn = new BaseButton({
    label: "Translate",
    type: "trans-btn trans-btn-translate",
    icon: "🌐",
    handler: async () => {
      if (!currentWord) return;

      const result = await translateWord({
        word: currentWord,
        sourceLang: state.sourceLang,
        targetLang: state.targetLang,
      });

      const targetLanguageLabel = getLanguageLabel(state.targetLang);

      if (result?.translation) {
        output.innerHTML = `
      <div class="result-item">
        <div class="result-label">Translation: ${targetLanguageLabel}:</div>
        <div class="result-value result-value-strong">${result.translation ?? ""}</div>
      </div>
      <div class="result-item">
        <div class="result-label">Transcription:</div>
        <div class="result-value">${result.transcription ?? ""}</div>
      </div>
      <div class="result-item">
        <div class="result-label">Part of speech:</div>
        <div class="result-value">${result.part_of_speech ?? ""}</div>
      </div>
    `;
      }
    }
  }).render();



  // ---------------------------
  // КНОПКА SAVE
  // ---------------------------
  const saveBtn = new BaseButton({
    label: "Save",
    type: "trans-btn trans-btn-save",
    icon: "💾",
    handler: async () => {
      if (!currentWord || !output.textContent) return;

      await saveWord(currentWord, {
        translation: output.textContent,
        transcription: "",
        part_of_speech: "",
      });
    }
  }).render();

  buttonsRow.appendChild(translateBtn);
  buttonsRow.appendChild(saveBtn);

  // ---------------------------
  // ПЕРЕКЛЮЧЕНИЕ ЯЗЫКОВ
  // ---------------------------
  const leftBtn = screen.querySelector("#lang-left");
  const rightBtn = screen.querySelector("#lang-right");

  leftBtn.addEventListener("click", () => {
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
