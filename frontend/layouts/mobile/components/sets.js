import { state } from "../../../core/state.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { getSets, getWordsFromSet } from "../../../api/sets.js";

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

  // ============================================================================
  //  ЗАГРУЗКА СПИСКА СЕТОВ
  // ============================================================================
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
          // свернуть
          wordsList.classList.add("hidden");
          arrow.classList.remove("open");
          return;
        }

        // раскрыть
        arrow.classList.add("open");

        // если слова ещё не загружены — грузим
        if (!wordsList.dataset.loaded) {
          const words = await getWordsFromSet(set);

          wordsList.innerHTML = words
            .map(w => `<li class="word-item">${w.word}</li>`)
            .join("");

          wordsList.dataset.loaded = "true";
        }

        wordsList.classList.remove("hidden");
      });

      list.appendChild(li);
    });

    container.appendChild(list);
  }
}
