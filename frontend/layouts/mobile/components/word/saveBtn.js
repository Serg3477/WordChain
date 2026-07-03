import { wordUpdateRequest } from "../../../../api/word.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { t } from "../../../../shared/i18n/index.js"


export function createSaveBtn(appState) {
  return new BaseButton({
    label: t("word", "save_btn"),
    type: "word-nav-btn ui-btn",
    icon: "💾",
    action: "click",
    handler: async () => {
      try {
        const result = await wordUpdateRequest({
          endpoint: "/update_word",
          method: "PUT",
          currentWord: appState.currentWord,
        });
        logInfo("Update Word success", { result });
        Notification.show({ type: "success", message: t("word", "notification_save") });
      } catch (e) {
        logError("Update Word failed", { error: e.message });
      }
    },
  }).render();
}
