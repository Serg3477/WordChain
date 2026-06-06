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
        <div class="set-actions hidden">
          <button class="set-actions-btn" data-action="rename"><img class="set-icon" src="/assets/icons/bookmark.png" alt="📤"></button>
          <button class="set-actions-btn danger" data-action="delete"><img class="set-icon" src="/assets/icons/pencil.png" alt="✏️"></button>
          <button class="set-actions-btn" data-action="export"><img class="set-icon" src="/assets/icons/trash.png" alt="🗑"></button>
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

          wordsList.innerHTML = words
            .map(w => `
              <li class="word-item" data-word-id="${w.id}" data-word="${w.word}">
                <span class="word-text">${w.word}</span>

                <div class="word-actions">
                  <button class="word-action-btn" data-action="move">
                    <img class="word-icon" src="/assets/icons/Arrows.png" alt="↗">
                  </button>

                  <button class="word-action-btn danger" data-action="delete">
                    <img class="word-icon" src="/assets/icons/trash.png" alt="🗑">
                  </button>
                </div>
              </li>
            `)
            .join("");


          wordsList.dataset.loaded = "true";

          // Обработчики кнопок слов
          wordsList.querySelectorAll(".word-item").forEach(item => {
          const word = {
            id: item.dataset.wordId,
            word: item.dataset.word
          };

          item.querySelector("[data-action='move']").onclick = (e) => {
            e.stopPropagation();
            console.log("move", word);
          };

          item.querySelector("[data-action='delete']").onclick = (e) => {
            e.stopPropagation();
            console.log("delete", word);
          };
        });
          
        }
        actions.classList.remove("hidden");
        wordsList.classList.remove("hidden");
      });

      // обработчики кнопок
      actions.querySelector("[data-action='rename']").onclick = () => console.log("rename", set);
      actions.querySelector("[data-action='delete']").onclick = () => console.log("delete", set);
      actions.querySelector("[data-action='export']").onclick = () => console.log("export", set);

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
        .map(w => `
          <li class="word-item" data-word-id="${w.id}" data-word="${w.word}">
            <span class="word-text">${w.word}</span>

            <div class="word-actions">
              <button class="word-action-btn" data-action="move">
                <img class="word-icon" src="/assets/icons/Arrows.png" alt="↗">
              </button>

              <button class="word-action-btn danger" data-action="delete">
                <img class="word-icon" src="/assets/icons/trash.png" alt="🗑">
              </button>
            </div>
          </li>
        `)
        .join("");


      unassignedList.addEventListener("click", async (event) => {
        const wordItem = event.target.closest(".word-item");
        if (!wordItem) return;

        await onWordClick({ id: wordItem.dataset.wordId, word: wordItem.dataset.word });

      unassignedList.querySelectorAll(".word-item").forEach(item => {
        const word = {
          id: item.dataset.wordId,
          word: item.dataset.word
        };

        item.querySelector("[data-action='move']").onclick = (e) => {
          e.stopPropagation();
          console.log("move", word);
        };

        item.querySelector("[data-action='delete']").onclick = (e) => {
          e.stopPropagation();
          console.log("delete", word);
        };
      });
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
