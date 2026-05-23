import { state } from "../../../core/state.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { getSets, getWordsFromSet } from "../../../api/sets.js";
import { renderWord } from "./word.js";
import { windowManager } from "../../../core/windowManager.js";

export function renderSets(state) {
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
    const sets = await getSets();

    if (!sets.length) {
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
            .map(w => `<li class="word-item" data-word="${w.word}">${w.word}</li>`)
            .join("");

          wordsList.dataset.loaded = "true";
        }

        wordsList.classList.remove("hidden");
      });

      wordsList.addEventListener("click", async (event) => {
        const wordItem = event.target.closest(".word-item");
        if (!wordItem) return;

        const word = wordItem.dataset.word;
        await onWordClick(word);
      });

      list.appendChild(li);
    });

    container.appendChild(list);
  }

  async function onWordClick(word) {
    try {
      logInfo(`Word ${ word } clicked`, { word });
      windowManager.pushScreen("word"); 
      const data = await renderWord(state, word);
      logInfo("Word details loaded", { word, hasData: !!data });

      // Здесь дальше делай нужное отображение ответа
      // console.log("Word details:", data);
    } catch (e) {
      logError("Word details request failed", { word, error: e.message });
    }
  }
}