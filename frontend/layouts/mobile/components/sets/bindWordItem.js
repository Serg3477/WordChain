import { getWordFromItem } from "./utils.js";
import { voiceWordItem } from "./voiceWordItem.js";

export function bindWordItem(item, { onMove, onDelete }) {
  const word = getWordFromItem(item);

  item.querySelector("[data-action='voice']").onclick = async (e) => {
    e.stopPropagation();
    await voiceWordItem(word.word);
  };

  item.querySelector("[data-action='move']").onclick = async (e) => {
    e.stopPropagation();
    await onMove(item, word);
  };

  item.querySelector("[data-action='delete']").onclick = async (e) => {
    e.stopPropagation();
    await onDelete(item, word);
  };

  return word;
}
