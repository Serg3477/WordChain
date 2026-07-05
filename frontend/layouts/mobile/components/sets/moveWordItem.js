import { state } from "../../../../core/state.js";
import { wordMoveRequest } from "../../../../api/word.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { selectModal } from "../../../../ui/selectModal/selectModal.js";
import { t } from "../../../../shared/i18n/index.js";
import { removeEmptySetFromDom } from "./utils.js";

export async function moveWordItem(item, sets, set, { container, wordsList = null, setItem = null, reload } = {}) {
  const currentWord = item.dataset.word;
  const currentWordId = item.dataset.wordId;
  const currentSetId = set?.id;

  const items = [
    ...sets.filter((s) => s.id !== currentSetId).map((s) => ({ label: s.name, value: s.id })),
    ...(currentSetId !== undefined ? [{ label: t("sets", "outside_sets"), value: null }] : []),
  ];

  const target = await selectModal({ title: t("sets", "move_to_title"), items });
  if (target === undefined) return;

  try {
    await wordMoveRequest({
      endpoint: "/move_word",
      method: "POST",
      word_id: currentWordId,
      user_id: state.user.id,
      word: currentWord,
      move_to_set: target,
      move_from_set: currentSetId,
    });

    item.remove();
    removeEmptySetFromDom({ wordsList, setItem, container });

    logInfo(`Move Word ${currentWord} from ${currentSetId} to ${target} success`);
    Notification.show({
      type: "success",
      message: `${t("sets", "notification_word_move")} "${currentWord}"`,
    });
    reload?.();
  } catch (e) {
    logError(`Move Word ${currentWord} failed`, { error: e.message });
    Notification.show({ type: "error", message: `Failed to move "${currentWord}"` });
  }
}
