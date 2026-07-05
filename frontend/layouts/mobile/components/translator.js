import { state } from "../../../core/state.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { t } from "../../../shared/i18n/index.js";
import { getLanguageLabel, escapeHtml } from "../../../shared/wordHelpers.js";

import { setupEraseInput } from "./translator/eraseInput.js";
import { createTranslateAction } from "./translator/translateAction.js";
import { createTranslateBtn } from "./translator/translateBtn.js";
import { createSaveBtn } from "./translator/saveBtn.js";
import { createAnyWordBtn } from "./translator/anyWordBtn.js";
import { createVoiceBtn } from "./translator/voiceBtn.js";
import { setupLangSwitcher } from "./translator/langSwitcher.js";
import { setupHistorySheet } from "./translator/historySheet.js";

let isRendering = false;

function renderTranslationOutput(output, result, inputWord, targetLang) {
  if (!result?.translation) return;

  const targetLanguageLabel = getLanguageLabel(targetLang);
  const isSameWord = result.word === inputWord;
  const correctLabel = isSameWord
    ? t("translator", "correct_label_true")
    : t("translator", "correct_label_false");
  const correctWord = isSameWord ? inputWord : result.word;

  output.innerHTML = `
    <div class="result-item">
      <div class="result-label">${escapeHtml(correctLabel)}</div>
      <div class="result-value result-value-strong">${escapeHtml(correctWord ?? "")}</div>
    </div><br>
    <div class="result-item">
      <div class="result-label">${escapeHtml(t("translator", "translation"))} ${escapeHtml(targetLanguageLabel)}:</div>
      <div class="result-value result-value-strong">${escapeHtml(result.translation ?? "")}</div>
    </div><br>
    <div class="result-item">
      <div class="result-label">${escapeHtml(t("translator", "transcription"))}</div>
      <div class="result-value">${escapeHtml(result.transcription ?? "")}</div>
    </div><br>
    <div class="result-item">
      <div class="result-label">${escapeHtml(t("translator", "part_of_speech"))}</div>
      <div class="result-value">${escapeHtml(result.part_of_speech ?? "")}</div>
    </div><br>
  `;
}

export function renderTranslator() {
  logInfo("Translate screen render start");
  if (isRendering) return;
  isRendering = true;

  try {
    const screen = document.querySelector('[data-screen="translator"]');
    logInfo("Translate screen node", { found: !!screen });

    if (!screen) {
      logError("Translate screen not found");
      return;
    }

    screen.innerHTML = `
      <div class="translator-screen">
        <div class="input-container">
          <input class="input-placeholder" placeholder="${t("translator", "input_placeholder")}">
          <div class="erase-container"></div>
        </div>
        <div class="buttons-row"></div>
        <div class="output-container">
          <div id="translation-output" class="output-text"></div>
        </div>
        <div class="lang-switcher">
          <button id="lang-left" class="lang-btn">${state.sourceLang}</button>
          <span class="lang-arrow">↔</span>
          <button id="lang-right" class="lang-btn">${state.targetLang}</button>
        </div>
      </div>
      <div class="bottom-sheet">
        <div class="bs-header">
          <div class="bs-grabber"></div>
          <div class="bs-title">${t("translator", "words_history")}</div>
        </div>
        <div class="bs-content"></div>
      </div>
    `;

    const placeholder = screen.querySelector(".input-placeholder");
    const eraseContainer = screen.querySelector(".erase-container");
    const output = screen.querySelector("#translation-output");
    const buttonsRow = screen.querySelector(".buttons-row");
    const translationState = { result: null };

    const doTranslate = createTranslateAction({
      placeholder,
      output,
      translationState,
      renderTranslationOutput,
    });

    const sheet = setupHistorySheet(state.history, {
      onSelect: (word) => {
        placeholder.value = word;
        doTranslate();
      },
    });

    state.on("interface", () => renderTranslator());
    state.on("history", () => sheet.update(state.history));

    setupEraseInput(placeholder, eraseContainer);

    buttonsRow.appendChild(createTranslateBtn(doTranslate));
    buttonsRow.appendChild(createSaveBtn(translationState));
    buttonsRow.appendChild(createAnyWordBtn({ placeholder, doTranslate }));
    buttonsRow.appendChild(createVoiceBtn(placeholder));

    setupLangSwitcher(screen);
  } finally {
    isRendering = false;
  }
}
