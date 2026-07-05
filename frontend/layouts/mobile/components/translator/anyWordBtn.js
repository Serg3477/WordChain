import { state } from "../../../../core/state.js";
import { anyWord } from "../../../../api/translate.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { getLanguageLabel } from "../../../../shared/wordHelpers.js";
import { t } from "../../../../shared/i18n/index.js";

export function createAnyWordBtn({ placeholder, doTranslate }) {
  return new BaseButton({
    label: t("translator", "any_word_btn"),
    type: "ui-btn",
    icon: `<img src="/assets/icons/Magnifier.png">`,
    action: "click",
    handler: async () => {
      logInfo("Any Word button clicked");
      const language = getLanguageLabel(state.sourceLang);

      try {
        const data = await anyWord(language);
        logInfo("Any Word request success");
        placeholder.value = data.word;
        await doTranslate();
        Notification.show({ type: "success", message: t("translator", "notification_any_word") });
      } catch (e) {
        logError("Any Word request failed in UI", { error: e.message });
      }
    },
  }).render();
}
