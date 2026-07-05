import { windowManager } from "../../../core/windowManager.js";
import { wordRequest } from "../../../api/word.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { createScrollButtonsArea } from "../../../ui/scrollButtonsArea/scrollButtonsArea.js";

import { escapeHtml, getLanguageLabel } from "../../../shared/wordHelpers.js";
import { createSaveBtn } from "./word/saveBtn.js";
import { createBetterTransBtn, resultBetterTrans } from "./word/betterTransBtn.js";
import { createSynonymsBtn, renderSynonyms } from "./word/synonymsBtn.js";
import { createAntonymsBtn, renderAntonyms } from "./word/antonymsBtn.js";
import { createSentencesBtn, resultSentences } from "./word/sentencesBtn.js";
import { t } from "../../../shared/i18n/index.js"



export async function renderWord(appState, id, word) {
  logInfo("Word screen render start");

  const screen = document.querySelector('[data-screen="word"]');
  logInfo("Word screen node", { found: !!screen });

  if (!screen) {
    logError("Word screen not found");
    return;
  }

  if (id == null) {
    logInfo("Word request aborted: no id in the base");
    return;
  }

  let result;
  try {
    logInfo("Word request start", {
      endpoint: "/get_word",
      method: "POST",
      id,
      user_id: appState.user.id,
    });

    result = await wordRequest({
      endpoint: "/get_word",
      method: "POST",
      id,
      user_id: appState.user.id,
    });

    appState.setField("id", result.id);
    appState.setField("user_id", appState.user.id);
    appState.setField("word", result.word ?? word ?? "");
    appState.setField("translation", result.translation);
    appState.setField("transcription", result.transcription);
    appState.setField("part_of_speech", result.part_of_speech);
    appState.setField("translation_json", result.translation_json);
    appState.setField("synonyms", result.synonyms);
    appState.setField("antonyms", result.antonyms);
    appState.setField("examples", result.examples);
  } catch (e) {
    logError("Word request failed in UI", { error: e.message });
    return;
  }

  const targetLanguageLabel = getLanguageLabel(appState.targetLang);

  screen.innerHTML = `
    <div class="word-screen">
        <div class="word-back">
          <button class="word-back-btn">
            <img src="/assets/icons/Arrows.png" class="word-back-icon" alt="←">
            <span>Back</span>
          </button>
        </div>
        <div class="result-item">
          <div class="result-label">${t("word", "translation_of_label")}</div>
          <div class="result-value result-value-strong">${escapeHtml(result.word ?? word ?? "")}</div>
        </div><br>
        <div class="result-item">
          <div class="result-label">${t("word", "translation_label")} ${escapeHtml(targetLanguageLabel)}:</div>
          <div class="result-value result-value-strong">${escapeHtml(result.translation ?? "")}</div>
        </div><br>
        <div class="result-item">
          <div class="result-label">${t("word", "transcription_label")}</div>
          <div class="result-value">${escapeHtml(result.transcription ?? "")}</div>
        </div><br>
        <div class="result-item">
          <div class="result-label">${t("word", "part_of_speech_label")}</div>
          <div class="result-value">${escapeHtml(result.part_of_speech ?? "")}</div>
        </div><br>
        <div class="result-item">
          <div class="result-label-synonyms hidden">${t("word", "synonyms_label")}</div>
          <div class="result-value result-value-synonyms"></div>
        </div><br>
        <div class="result-item">
          <div class="result-label-antonyms hidden">${t("word", "antonyms_label")}</div>
          <div class="result-value result-value-antonyms"></div>
        </div><br>
        <div class="result-item">
          <div class="result-label-sentences hidden">${t("word", "sentences_label")}</div>
          <div class="result-value result-value-examples"></div>
        </div><br>
        <div class="result-item">
          <div class="result-label-better-translation hidden">${t("word", "better_translation_label")}</div>
          <div class="result-value result-value-better-translation"></div>
        </div><br>
    </div>
  `;

  renderSynonyms(result);
  renderAntonyms(result);
  resultBetterTrans(result, appState);
  resultSentences(result, appState);

  const area = createScrollButtonsArea({ id: "global-scroll-buttons-area" });
  area.mount();
  area.trackEl.innerHTML = "";

  screen.querySelector(".word-back-btn").onclick = () => {
    windowManager.pushScreen("sets");
  };

  area.addButton(createSaveBtn(appState));
  area.addButton(createBetterTransBtn(appState, id));
  area.addButton(createSynonymsBtn(appState, id));
  area.addButton(createAntonymsBtn(appState, id));
  area.addButton(createSentencesBtn(appState, id));

  return result;
}
