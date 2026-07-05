import { t } from "../../../../shared/i18n/index.js";

export function getWordFromItem(item) {
  return {
    id: item.dataset.wordId,
    word: item.dataset.word,
  };
}

export function showEmptySetsMessage(container) {
  container.innerHTML = `<p>${t("sets", "no_sets_yet")}</p>`;
}

export function clearEmptySetsIfNeeded(container) {
  if (!container.querySelector(".set-item, .unassigned-block")) {
    showEmptySetsMessage(container);
  }
}

export function removeEmptySetFromDom({ wordsList, setItem, container }) {
  if (!wordsList?.querySelector(".word-item")) {
    delete wordsList?.dataset.loaded;
    setItem?.remove();
    clearEmptySetsIfNeeded(container);
  }
}
