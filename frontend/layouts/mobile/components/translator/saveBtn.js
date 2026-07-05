import { saveWord } from "../../../../api/translate.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { t } from "../../../../shared/i18n/index.js";

export function createSaveBtn(translationState) {
  return new BaseButton({
    label: t("translator", "save_btn"),
    type: "ui-btn",
    icon: `<img src="/assets/icons/Check.png" alt="💾">`,
    action: "click",
    handler: async () => {
      logInfo("Save button clicked", { hasResult: !!translationState.result });
      if (!translationState.result) return;

      try {
        await saveWord(translationState.result);
        logInfo("Save request success");
        Notification.show({ type: "success", message: t("translator", "notification_save") });
      } catch (e) {
        logError("Save request failed in UI", { error: e.message });
      }
    },
  }).render();
}
