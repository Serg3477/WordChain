import { state } from "../../../../core/state.js";
import { wordDeleteRequest } from "../../../../api/word.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { questionModal } from "../../../../ui/questionModal/questionModal.js";
import { t } from "../../../../shared/i18n/index.js";
import { clearEmptySetsIfNeeded } from "./utils.js";

export async function deleteWordItem(item, { container, wordsList = null, setItem = null, parentBlock = null } = {}) {
  const wordText = item.dataset.word;
  const ok = await questionModal({
    icon: "/assets/icons/Flash.png",
    text: `${t("sets", "delete_set_question1")} "${wordText}"?`,
  });
  if (!ok) return;

  try {
    const result = await wordDeleteRequest({
      endpoint: "/delete_word",
      method: "POST",
      id: Number(item.dataset.wordId),
      user_id: state.user.id,
      word: wordText,
    });
    logInfo(`Delete Word ${wordText} success`, { result });
    Notification.show({ type: "success", message: t("sets", "notification_word_delete") });
    item.remove();

    if (wordsList && !wordsList.querySelector(".word-item")) {
      delete wordsList.dataset.loaded;
      if (setItem) {
        setItem.remove();
        clearEmptySetsIfNeeded(container);
      }
    }

    if (parentBlock && !parentBlock.querySelector(".word-item")) {
      parentBlock.remove();
      clearEmptySetsIfNeeded(container);
    }
  } catch (e) {
    logError(`Delete Word ${wordText} failed`, { error: e.message });
    Notification.show({ type: "error", message: `Failed to delete "${wordText}"` });
  }
}
