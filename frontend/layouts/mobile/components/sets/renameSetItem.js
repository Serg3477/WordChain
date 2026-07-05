import { state } from "../../../../core/state.js";
import { setRenameRequest } from "../../../../api/sets.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { renameModal } from "../../../../ui/renameModal/renameModal.js";
import { t } from "../../../../shared/i18n/index.js";

export async function renameSetItem(set, { reload }) {
  const newName = await renameModal({
    setName: set.name,
    text: t("sets", "rename_set_question"),
  });
  if (!newName) return;

  const setText = set.name;
  try {
    await setRenameRequest({
      endpoint: "/rename_set",
      method: "PATCH",
      set_id: set.id,
      name: newName,
      user_id: state.user.id,
    });
    logInfo(`Rename Set ${setText} success - `, { newName });
    Notification.show({
      type: "success",
      message: `${t("sets", "notification_set_rename")} "${setText}" to "${newName}"`,
    });
    reload?.();
  } catch (e) {
    logError(`Rename Set ${setText} failed`, { error: e.message });
    Notification.show({ type: "error", message: `Failed to rename "${setText}"` });
  }
}
