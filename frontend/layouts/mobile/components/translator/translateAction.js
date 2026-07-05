import { state } from "../../../../core/state.js";
import { translateWord } from "../../../../api/translate.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { t } from "../../../../shared/i18n/index.js";
import { normalizePartOfSpeech } from "./utils.js";

export function createTranslateAction({ placeholder, output, translationState, renderTranslationOutput }) {
  return async function doTranslate() {
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
        targetLang: state.targetLang,
      });

      const translationResult = await translateWord({
        word,
        sourceLang: state.sourceLang,
        targetLang: state.targetLang,
      });
      Notification.show({ type: "success", message: t("translator", "notification_translate") });

      if (!translationResult?.word) {
        logError("Translate returned invalid payload", { translationResult });
        return;
      }

      translationResult.part_of_speech = normalizePartOfSpeech(translationResult.part_of_speech);
      translationState.result = translationResult;

      renderTranslationOutput(output, translationResult, word, state.targetLang);
      placeholder.value = translationResult.word;
      state.addToHistory(word);

      logInfo("Translate request success", {
        hasTranslation: !!translationResult.translation,
      });
    } catch (e) {
      logError("Translate request failed in UI", { error: e.message });
    }
  };
}
