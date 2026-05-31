import { translateWord, saveWord, anyWord } from "../../../api/translate.js";
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
    type: "ui-btn",
    icon:  `<img src="/assets/icons/Text.png" alt="🌐">`,
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

    const translationResult = await translateWord({
      word,
      sourceLang: "en",
      targetLang: "ru"
    });

    if (!translationResult || !translationResult.word) {
      logError("Translate returned invalid payload", { translationResult });
      return;
    }

    translationResult.part_of_speech = String(translationResult.part_of_speech ?? "")
      .split("\n")[0]
      .replace(/[^a-zA-Zа-яА-ЯёЁ]/g, " ")
      .trim()
      .toLowerCase();

    result = translationResult;

    const targetLanguageLabel = getLanguageLabel(state.targetLang);
    const isSameWord = result.word === word;
    const correctLabel = isSameWord
      ? "Translation of:"
      : "The correct spelling of this word is:";
    const correctWord = isSameWord ? word : result.word;

    placeholder.value = result.word;

    if (result.translation) {
      output.innerHTML = `
        <div class="result-item">
          <div class="result-label">${correctLabel}</div>
          <div class="result-value result-value-strong">${correctWord ?? ""}</div>
        </div><br>
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

    logInfo("Translate request success", {
      hasTranslation: !!result.translation
    });
  } catch (e) {
    logError("Translate request failed in UI", { error: e.message });
    return;
  }
}
 
  // ---------------------------
  // КНОПКА SAVE
  // ---------------------------
  const saveBtn = new BaseButton({
    label: "Save",
    type: "ui-btn",
    icon:  `<img src="/assets/icons/Check.png" alt="💾">`,
    action: "click",
    handler: doSave
  }).render();

  async function doSave() {
    logInfo("Save button clicked", { hasResult: !!result });
    if (!result) return;
    try {
      await saveWord(result);
      logInfo("Save request success");
    } catch (e) {
      logError("Save request failed in UI", { error: e.message });
    }
  }

  // ---------------------------
  // КНОПКА ANY WORD
  // ---------------------------
  const anyWordBtn = new BaseButton({
    label: "Any Word",
    type: "ui-btn",
    icon: `<img src="/assets/icons/Magnifier.png">`,
    action: "click",
    handler: doAnyWord
  }).render();

  async function doAnyWord() {
    logInfo("Any Word button clicked", { hasResult: !!result });
    const language = getLanguageLabel(state.sourceLang);
    try {
      const data = await anyWord(language);
      logInfo("Any Word request success");
      placeholder.value = data.word;
    } catch (e) {
      logError("Any Word request failed in UI", { error: e.message });
    }
  }

  buttonsRow.appendChild(translateBtn);
  buttonsRow.appendChild(saveBtn);
  buttonsRow.appendChild(anyWordBtn)

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

// универсальный debug: ловим любые focus/blur на документе
// document.addEventListener('touchstart', function t(e){
//   const x = e.touches[0].clientX, y = e.touches[0].clientY;
//   console.log('touch at', x, y, 'elementFromPoint:', document.elementFromPoint(x,y));
//   document.removeEventListener('touchstart', t);
// }, {passive:true});


