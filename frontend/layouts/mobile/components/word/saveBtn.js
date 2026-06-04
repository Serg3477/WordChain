import { wordUpdateRequest } from "../../../../api/word.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";

export function createSaveBtn(appState) {
  return new BaseButton({
    label: "Save",
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
        Notification.show({ type: "success", message: "Word updation success!" });
      } catch (e) {
        logError("Update Word failed", { error: e.message });
      }
    },
  }).render();
}
