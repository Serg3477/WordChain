import { state } from "../../core/state.js";
import { getSets, getWordsFromSet } from "../features/sets/getSets.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";
import { BaseButton } from "../ui/buttons/baseButton/baseButton.js";
import { CloseButton } from "../ui/buttons/close/closeButton.js";
import { setupWordInput } from "../ui/inputs/wordInput/wordInput.js";
import { EraseInputButton } from "../ui/buttons/erase/eraseInput.js";


// ============================================================================
//  МОДАЛКА
// ============================================================================
export function createSetModal() {
  const root = document.createElement("div");
  root.className = "overall-modal set-modal ui-modal";

  root.innerHTML = `
    <div class="modal-header ui-modal-header">
      <span class="modal-title ui-modal-title">${state.user.nickname} Sets</span>
      <div class="ui-modal-btn" data-role="close-btn"></div>
    </div>

    <div data-role="sets" class="modal-body ui-modal-body"></div>
  `;

  // Загружаем список сетов
  loadSets(root.querySelector('[data-role="sets"]'));

  // ---------------------------
  // КНОПКА ЗАКРЫТИЯ
  // ---------------------------
  const closeBtnContainer = root.querySelector('[data-role="close-btn"]');

  const closeBtn = new CloseButton({
    action: "click",
    handler: closeWithScale
  }).render();

  function closeWithScale() {
    root.classList.add("modal-scale-out");
    setTimeout(() => {
      windowManager.close("setsModal");
    }, 350);
  }

  closeBtnContainer.appendChild(closeBtn);

  // ---------------------------
  // УТИЛИТЫ
  // ---------------------------
  const header = root.querySelector(".modal-header");
  makeDraggable(root, header);
  makeResizable(root);

  return root;
}


// ============================================================================
//  ЗАГРУЗКА СПИСКА СЕТОВ
// ============================================================================


async function loadSets(container) {
  const sets = await getSets();

  if (!sets.length) {
    container.innerHTML = "<p>No sets yet</p>";
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "sets-list";

  sets.forEach(set => {
    const li = document.createElement("li");
    li.className = "set-item";
    li.textContent = set.name;

    li.addEventListener("click", () => onSetClick(set, container));

    ul.appendChild(li);
  });

  const title = document.createElement("span");
  title.textContent =`Sets for ${state.user.nickname}`;
  title.className = "set-title";
  container.appendChild(title);
  container.appendChild(ul);
}

// ============================================================================
//  ЗАГРУЗКА СПИСКА СЛОВ ИЗ СЕТА
// ============================================================================

async function onSetClick(set, container) {
  container.innerHTML = "";
  const setWords = await getWordsFromSet(set);

  const ul = document.createElement("ul");
  ul.className = "words-list";

  setWords.forEach (word => {
    const li = document.createElement("li");
    li.className = "word-item";
    li.textContent = word.word;

    li.addEventListener("click", () => onWordClick(word.id, container));

    ul.appendChild(li);
  });

const title = document.createElement("span");
title.textContent = `Words from ${set.name}`;
title.className = "set-title";
container.appendChild(title);
container.appendChild(ul)
}



