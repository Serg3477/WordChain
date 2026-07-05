import { state } from "../../../core/state.js";
import { getSets, getWordsFromSet } from "../../../api/sets.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { t } from "../../../shared/i18n/index.js";
import { escapeHtml } from "../../../shared/wordHelpers.js";

import { showEmptySetsMessage } from "./sets/utils.js";
import { bindWordItem } from "./sets/bindWordItem.js";
import { onWordClick } from "./sets/onWordClick.js";
import { onTextClick } from "./sets/onTextClick.js";
import { deleteWordItem } from "./sets/deleteWordItem.js";
import { deleteSetItem } from "./sets/deleteSetItem.js";
import { moveWordItem } from "./sets/moveWordItem.js";
import { renameSetItem } from "./sets/renameSetItem.js";



export function renderSets() {
  logInfo("Sets screen render start");

  const screen = document.querySelector('[data-screen="sets"]');
  if (!screen) {
    logError("Sets screen not found");
    return;
  }

  screen.innerHTML = `
    <h3 class="ui-title">${escapeHtml(state.user.nickname)}${t("sets", "sets_title")}</h3>
    <div class="sets-container"></div>
  `;

  const container = screen.querySelector(".sets-container");
  loadSets(container);

  async function loadSets(container) {
    const { sets, unassigned_words } = await getSets();
    logInfo("Sets payload", {
      setsCount: sets.length,
      unassignedCount: unassigned_words.length,
      unassigned_words,
    });

    container.innerHTML = "";
    const ctx = { container, reload: () => renderSets() };

    if (!sets.length && !unassigned_words.length) {
      showEmptySetsMessage(container);
      return;
    }

    if (sets.length) {
      const list = document.createElement("ul");
      list.className = "sets-list";

      sets.forEach((set) => {
        const li = document.createElement("li");
        li.className = "set-item";
        li.innerHTML = `
          <div class="set-header">
            <span class="set-name">${escapeHtml(set.name)}</span>
            <span class="set-arrow">▶</span>
          </div>
          <div class="set-actions hidden">
            <button class="set-actions-btn" data-action="work"><img class="set-icon" src="/assets/icons/bookmark.png" alt="📤"></button>
            <button class="set-actions-btn danger" data-action="rename"><img class="set-icon" src="/assets/icons/pencil.png" alt="✏️"></button>
            <button class="set-actions-btn" data-action="delete"><img class="set-icon" src="/assets/icons/trash.png" alt="🗑"></button>
          </div>
          <ul class="set-words hidden"></ul>
        `;

        const header = li.querySelector(".set-header");
        const actions = li.querySelector(".set-actions");
        const wordsList = li.querySelector(".set-words");
        const arrow = li.querySelector(".set-arrow");

        header.addEventListener("click", async () => {
          const isOpen = !wordsList.classList.contains("hidden");

          if (isOpen) {
            actions.classList.add("hidden");
            wordsList.classList.add("hidden");
            arrow.classList.remove("open");
            return;
          }

          arrow.classList.add("open");

          if (!wordsList.dataset.loaded) {
            const words = await getWordsFromSet(set);
            set._words = words;
            wordsList.innerHTML = words.map(buildWordItemHtml).join("");
            wordsList.dataset.loaded = "true";

            wordsList.querySelectorAll(".word-item").forEach((item) => {
              bindWordItem(item, {
                onMove: () => moveWordItem(item, sets, set, { ...ctx, wordsList, setItem: li }),
                onDelete: () => deleteWordItem(item, { ...ctx, wordsList, setItem: li }),
              });
            });
          }

          actions.classList.remove("hidden");
          wordsList.classList.remove("hidden");
        });

        // Кнопки у сета
        actions.querySelector("[data-action='work']").onclick = () => onTextClick(set);
        actions.querySelector("[data-action='rename']").onclick = () => renameSetItem(set, ctx);
        actions.querySelector("[data-action='delete']").onclick = () => deleteSetItem(set, li, ctx);

        wordsList.addEventListener("click", async (event) => {
          const wordItem = event.target.closest(".word-item");
          if (!wordItem) return;
          if (event.target.closest(".word-action-btn")) return;
          await onWordClick({ id: wordItem.dataset.wordId, word: wordItem.dataset.word });
        });

        list.appendChild(li);
      });

      container.appendChild(list);
    }
    // Если есть слова вне сетов, то рендерим их в отдельный блок
    if (unassigned_words.length) {
      const unassignedBlock = document.createElement("div");
      unassignedBlock.className = "unassigned-block";
      unassignedBlock.innerHTML = `<div class="unassigned-list"></div>`;

      const unassignedList = unassignedBlock.querySelector(".unassigned-list");
      unassignedList.innerHTML = unassigned_words.map(buildWordItemHtml).join("");

      unassignedList.addEventListener("click", async (event) => {
        const wordItem = event.target.closest(".word-item");
        if (!wordItem) return;
        if (event.target.closest(".word-action-btn")) return;
        await onWordClick({ id: wordItem.dataset.wordId, word: wordItem.dataset.word });
      });

      unassignedList.querySelectorAll(".word-item").forEach((item) => {
        bindWordItem(item, {
          onMove: () => moveWordItem(item, sets, undefined, { ...ctx, wordsList: unassignedList }),
          onDelete: () => deleteWordItem(item, { ...ctx, parentBlock: unassignedBlock }),
        });
      });

      container.appendChild(unassignedBlock);
    }
  }
}
// Кнопки у слов
function buildWordItemHtml(w) {
  return `
    <li class="word-item" data-word-id="${w.id}" data-word="${escapeHtml(w.word)}">
      <span class="word-text">${escapeHtml(w.word)}</span>
      <div class="word-actions">
        <button class="word-action-btn" data-action="voice">
          <img class="word-icon" src="/assets/icons/megaphone1.png" alt="🔊">
        </button>
        <button class="word-action-btn" data-action="move">
          <img class="word-icon" src="/assets/icons/Arrows.png" alt="↗">
        </button>
        <button class="word-action-btn danger" data-action="delete">
          <img class="word-icon" src="/assets/icons/trash.png" alt="🗑">
        </button>
      </div>
    </li>
  `;
}

