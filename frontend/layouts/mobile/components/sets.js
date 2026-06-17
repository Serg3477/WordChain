import { state } from "../../../core/state.js";
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { getSets, getWordsFromSet, setDeleteRequest, setRenameRequest } from "../../../api/sets.js";
import { voiceWord } from "../../../api/translate.js"
import { wordMoveRequest } from "../../../api/word.js";
import { wordDeleteRequest } from "../../../api/word.js";
import { renderWord } from "./word.js";
import { renderText } from "./text.js";
import { windowManager } from "../../../core/windowManager.js";
import { Notification } from "../../../ui/notificationModal/notificationModal.js";
import { questionModal } from "../../../ui/questionModal/questionModal.js";
import { selectModal } from "../../../ui/selectModal/selectModal.js";
import { renameModal } from "../../../ui/renameModal/renameModal.js";
import { doVoice } from "../../../utils/voice.js";




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
          <button class="set-actions-btn" data-action="work"><img class="set-icon" src="/assets/icons/bookmark.png" alt="📤"></button>
          <button class="set-actions-btn danger" data-action="rename"><img class="set-icon" src="/assets/icons/pencil.png" alt="✏️"></button>
          <button class="set-actions-btn" data-action="delete"><img class="set-icon" src="/assets/icons/trash.png" alt="🗑"></button>
        </div>
        <ul class="set-words hidden"></ul>
      `;

      const header = li.querySelector(".set-header");
      const actions = li.querySelector(".set-actions");
      const wordsList = li.querySelector(".set-words");
      const setName = li.querySelector(".set-name");
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

          // кешируем слова в объекте сета (для renderText)
          set._words = words;

          wordsList.innerHTML = words
            .map(w => `
              <li class="word-item" data-word-id="${w.id}" data-word="${w.word}">
                <span class="word-text">${w.word}</span>

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
            `)
            .join("");


          wordsList.dataset.loaded = "true";

          // Обработчики кнопок слов
          wordsList.querySelectorAll(".word-item").forEach(item => {
          const word = {
            id: item.dataset.wordId,
            word: item.dataset.word
          };

          item.querySelector("[data-action='voice']").onclick = async (e) => {
            e.stopPropagation();
            const voiceResult = await voiceWord(word.word, state.sourceLang);
            state.setVoice(voiceResult?.audio_data || null);
            doVoice();
          };

          item.querySelector("[data-action='move']").onclick = async (e) => {
            e.stopPropagation();
            const mov = await moveWordItem(item, sets, set, wordsList, { setItem: li });
          };

          item.querySelector("[data-action='delete']").onclick = async (e) => {
            e.stopPropagation();
            await deleteWordItem(item, { wordsList, setItem: li });
          };
        });
          
        }
        actions.classList.remove("hidden");
        wordsList.classList.remove("hidden");
      });

      actions.querySelector("[data-action='work']").onclick = () => onTextClick(set);
      actions.querySelector("[data-action='rename']").onclick = () => renameSetItem(set, li);
      actions.querySelector("[data-action='delete']").onclick = () => deleteSetItem(set, li);

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
              <button class="word-action-btn" data-action="voice">
                <img class="word-icon" src="/assets/icons/megaphone1.png" alt="↗">
              </button>

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

        // если клик был по кнопке — не открываем слово
        if (event.target.closest(".word-action-btn")) return;

        await onWordClick({
          id: wordItem.dataset.wordId,
          word: wordItem.dataset.word
        });
      });

      unassignedList.querySelectorAll(".word-item").forEach(item => {
        const word = {
          id: item.dataset.wordId,
          word: item.dataset.word
        };

        item.querySelector("[data-action='voice']").onclick = async (e) => {
            e.stopPropagation();
            const voiceResult = await voiceWord(word.word, state.sourceLang);
            state.setVoice(voiceResult?.audio_data || null);
            doVoice();
          };

        item.querySelector("[data-action='move']").addEventListener("click", async (e) => {
          e.stopPropagation();
          const mov = await moveWordItem(item, sets, { wordsList: unassignedList });
        });

        item.querySelector("[data-action='delete']").addEventListener("click", async (e) => {
          e.stopPropagation();
          await deleteWordItem(item, { parentBlock: unassignedBlock });
        });
      });

      container.appendChild(unassignedBlock);
    }
  }

  // Обработчик клика по кнопке "Текст" сета
  async function onTextClick(set) {
    const name = set.name;
    try {
      logInfo(`Set ${ name } button "Text" clicked`);
      windowManager.pushScreen("text"); 
      const words = set._words;
      const data = await renderText(set, words);
      logInfo("Set Text loaded", { name, hasData: !!data });

    } catch (e) {
      logError("Set Text details request failed", { name, error: e.message });
    }
  }

  // Обработчик клика по слову
  async function onWordClick({ id, word }) {
    try {
      logInfo(`Word ${ word } clicked`, { word });
      windowManager.pushScreen("word"); 
      const data = await renderWord(state, id, word);
      logInfo("Word details loaded", { word, hasData: !!data });

    } catch (e) {
      logError("Word details request failed", { word, error: e.message });
    }
  }

  async function deleteWordItem(item, { wordsList = null, setItem = null, parentBlock = null } = {}) {
    const wordText = item.dataset.word;
    const ok = await questionModal({
      icon: "/assets/icons/Flash.png",
      text: `Do you want to delete "${wordText}"?`
    });
    if (ok) {
      
      try {
        const result = await wordDeleteRequest({
          endpoint: "/delete_word",
          method: "POST",
          id: Number(item.dataset.wordId),
          user_id: state.user.id,
          word: wordText,
        });
        logInfo(`Delete Word ${wordText} success`, { result });
        Notification.show({ type: "success", message: `Word "${wordText}" deleted successfully!` });
        item.remove();

        if (wordsList && !wordsList.querySelector(".word-item")) {
          delete wordsList.dataset.loaded;
          if (setItem) {
            setItem.remove();
            if (!container.querySelector(".set-item, .unassigned-block")) {
              container.innerHTML = "<p>No sets yet</p>";
            }
          }
        }

        if (parentBlock && !parentBlock.querySelector(".word-item")) {
          parentBlock.remove();
          if (!container.querySelector(".set-item, .unassigned-block")) {
            container.innerHTML = "<p>No sets yet</p>";
          }
        }
      } catch (e) {
        logError(`Delete Word ${wordText} failed`, { error: e.message });
        Notification.show({ type: "error", message: `Failed to delete "${wordText}"` });
      }
      console.log("Удаляем:", wordText);
    } else {
      console.log("Отмена удаления слова.");
    }
  }

  // Функция удаления сета с обращением к ui/questionModal модалке вопроса
  async function deleteSetItem(set, setItem) {
    const ok = await questionModal({
      icon: "/assets/icons/Flash.png",
      text: `Do you want to delete "${set.name}"?\nThis will delete your words in set.\nYou may remove words before deleting.`
    });

    if (ok) {
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
          message: `Set "${result.name}" deleted (${result.deleted_words_count} words)`,
        });
        setItem.remove();
        if (!container.querySelector(".set-item, .unassigned-block")) {
          container.innerHTML = "<p>No sets yet</p>";
        }
      } catch (e) {
        logError(`Delete Set ${setText} failed`, { error: e.message });
        Notification.show({ type: "error", message: `Failed to delete "${setText}"` });
      }
      console.log("Удаляем:", set.name);
    } else {
      console.log("Отмена удаления сета.");
    }
  }


  // Функция перемещения слова с обращением к ui/selectModal модалке вопроса
  async function moveWordItem(item, sets, set, { wordsList = null, setItem = null } = {}) {
    const currentWord = item.dataset.word;
    const currentWordId = item.dataset.wordId;
    const currentSetId = set.id;

    const items = [
      ...sets.filter(s => s.id !== currentSetId).map(s => ({ label: s.name, value: s.id })),
      ...(currentSetId !== null ? [{ label: "Beyong sets", value: null }] : []),
    ];
    console.log("Items: ", items);
    const target = await selectModal({ title: "Move to...", items });
    console.log("Target: ", target)
    if (target !== null || currentSetId !== null) {
      try {
          const result = await wordMoveRequest({
            endpoint: "/move_word",
            method: "POST",
            word_id: currentWordId,
            user_id: state.user.id,
            word: currentWord,
            move_to_set: target,
            move_from_set: currentSetId,
          });
          
          // 1. Удаляем слово из DOM
          item.remove();

          // 2. Проверяем, пустой ли список
          if (wordsList && !wordsList.querySelector(".word-item")) {
            delete wordsList.dataset.loaded;
            if (setItem) {
              
              // 1. Удаляем сет из DOM
              setItem.remove();
              logInfo(`Set ${setText} is empty. Delete Set ${setText} success`, { result });
              Notification.show({type: "success", message: `Set "${emptySet.name}" deleted because it's empty (${emptySet.deleted_words_count} words)`,
              });
            }
          }

      } catch (e) {
        logError(`Move Word ${currentWord} failed`, { error: e.message });
        Notification.show({ type: "error", message: `Failed to delete "${currentWord}"` });
      }
      logInfo(`Move Word ${currentWord} from ${currentSetId} to ${target} success`);
      Notification.show({ type: "success", message: `Word "${currentWord}" moved successfully!` });
      // обновляем весь экран
      renderSets();
      
      console.log("Moving:", currentWord);
    } else {
      console.log("Word moving rejection");
    }
  }


  // Функция переименования сета с обращением к ui/renameModal модалке вопроса
  async function renameSetItem(set, setItem) {
    const newName = await renameModal({
      setName: set.name,
      text: `Do you want to rename it?`
    });

    if (newName) {
      const setText = set.name;
      try {
        const result = await setRenameRequest({
          endpoint: "/rename_set",
          method: "PATCH",
          set_id: set.id,
          name: newName,
          user_id: state.user.id,
        });
        logInfo(`Rename Set ${setText} success - `, { result });
        Notification.show({
          type: "success",
          message: `Set "${setText}" renamed to ${result}`,
        });

      } catch (e) {
        logError(`Rename Set ${setText} failed`, { error: e.message });
        Notification.show({ type: "error", message: `Failed to rename "${setText}"` });
      }
      renderSets();
      console.log("Rename:", set.name);
    } else {
      console.log("Отмена удаления сета.");
    }
  }
}

