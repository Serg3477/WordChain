import { state } from "../../../core/state.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { getSets, getWordsFromSet } from "../../../api/sets.js";
import { renderWord } from "./word.js";
import { windowManager } from "../../../core/windowManager.js";

export function renderSets() {
  logInfo("Sets screen render start");

  const screen = document.querySelector('[data-screen="sets"]');
  if (!screen) {
    logError("Sets screen not found");
    return;
  }

  screen.innerHTML = `
    <h3 class="ui-title">${state.user.nickname}'s sets</h3>
    <div class="sets-container"></div>
  `;

  const container = screen.querySelector(".sets-container");
  loadSets(container);

  async function loadSets(container) {
    const { sets, unassigned_words } = await getSets();
    logInfo("Sets payload", {
      setsCount: sets.length,
      unassignedCount: unassigned_words.length,
      unassigned_words
    });

    container.innerHTML = "";

    if (!sets.length && !unassigned_words.length) {
      container.innerHTML = "<p>No sets yet</p>";
      return;
    }

    const list = document.createElement("ul");
    list.className = "sets-list";

    sets.forEach(set => {
      const li = document.createElement("li");
      li.className = "set-item";

      li.innerHTML = `
        <div class="set-header">
          <span class="set-name">${set.name}</span>
          <span class="set-arrow">▶</span>
        </div>
        <ul class="set-words hidden"></ul>
      `;

      const header = li.querySelector(".set-header");
      const wordsList = li.querySelector(".set-words");
      const arrow = li.querySelector(".set-arrow");

      header.addEventListener("click", async () => {
        const isOpen = !wordsList.classList.contains("hidden");

        if (isOpen) {
          wordsList.classList.add("hidden");
          arrow.classList.remove("open");
          return;
        }

        arrow.classList.add("open");

        if (!wordsList.dataset.loaded) {
          const words = await getWordsFromSet(set);

          wordsList.innerHTML = words
            .map(w => `<li class="word-item" data-word-id="${w.id}" data-word="${w.word}">${w.word}</li>`)
            .join("");

          wordsList.dataset.loaded = "true";
        }

        wordsList.classList.remove("hidden");
      });

      wordsList.addEventListener("click", async (event) => {
        const wordItem = event.target.closest(".word-item");
        if (!wordItem) return;

        await onWordClick({ id: wordItem.dataset.wordId, word: wordItem.dataset.word });
      });

      list.appendChild(li);
    });

    if (sets.length) {
      container.appendChild(list);
    }

    // Показать нераспределенные в сеты слова
    if (unassigned_words.length) {
      const unassignedBlock = document.createElement("div");
      unassignedBlock.className = "unassigned-block";

      unassignedBlock.innerHTML = `
        <div class="unassigned-list"></div>
      `;

      const unassignedList = unassignedBlock.querySelector(".unassigned-list");

      unassignedList.innerHTML = unassigned_words
        .map(unWord => `<li class="word-item" data-word-id="${unWord.id}" data-word="${unWord.word}">${unWord.word}</li>`)
        .join("");

      unassignedList.addEventListener("click", async (event) => {
        const wordItem = event.target.closest(".word-item");
        if (!wordItem) return;

        await onWordClick({ id: wordItem.dataset.wordId, word: wordItem.dataset.word });
      });

      container.appendChild(unassignedBlock);
    }
  }

  // Обработчик клика по слову
  async function onWordClick({ id, word }) {
    try {
      logInfo(`Word ${ word } clicked`, { word });
      windowManager.pushScreen("word"); 
      const data = await renderWord(state, id, word);
      logInfo("Word details loaded", { word, hasData: !!data });

      // Здесь дальше делай нужное отображение ответа
      // console.log("Word details:", data);
    } catch (e) {
      logError("Word details request failed", { word, error: e.message });
    }
  }
}