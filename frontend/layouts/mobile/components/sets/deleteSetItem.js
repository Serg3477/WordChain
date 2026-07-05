import { state } from "../../../../core/state.js";
import { setDeleteRequest } from "../../../../api/sets.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { questionModal } from "../../../../ui/questionModal/questionModal.js";
import { t } from "../../../../shared/i18n/index.js";
import { clearEmptySetsIfNeeded } from "./utils.js";

export async function deleteSetItem(set, setItem, { container, reload }) {
  const ok = await questionModal({
    icon: "/assets/icons/Flash.png",
    text: `${t("sets", "delete_set_question1")} "${set.name}"?\n${t("sets", "delete_set_question2")}\n${t("sets", "delete_set_question3")}`,
  });
  if (!ok) return;

  const setText = set.name;
  try {
    const result = await setDeleteRequest({
      endpoint: "/delete_set",
      method: "POST",
      set_id: set.id,
      name: set.name,
      user_id: state.user.id,
      word_ids: set.word_ids,
    });
    logInfo(`Delete Set ${setText} success`, { result });
    Notification.show({
      type: "success",
      message: `${t("sets", "notification_set_delete")} "${result.name}" - (${result.deleted_words_count} words)`,
    });
    setItem.remove();
    clearEmptySetsIfNeeded(container);
    reload?.();
  } catch (e) {
    logError(`Delete Set ${setText} failed`, { error: e.message });
    Notification.show({ type: "error", message: `Failed to delete "${setText}"` });
  }
}
