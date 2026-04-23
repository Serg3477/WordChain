import { state } from "../../core/state.js";
import { translateWord, saveWord } from "../features/translator/translate.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";
import { TranslateButton } from "../ui/buttons/translate/translateButton.js";
import { CloseButton } from "../ui/buttons/close/closeButton.js";
import { setupWordInput } from "../ui/inputs/wordInput/wordInput.js";
import { EraseInputButton } from "../ui/buttons/erase/eraseInput.js";



export function createTranslateModal() {
  const root = document.createElement("div");
  root.className = "translate-modal ui-modal";

  root.innerHTML = `
    <div class="modal-header ui-modal-header">
      <span class="modal-title ui-modal-title">Translate</span>
      <div class="ui-modal-btn" data-role="close-btn"></div>

    </div>

    <div class="modal-body ui-modal-body">
      <div class="input-row">
        <input data-role="word" class="input-word" placeholder="Enter word...">
        <div data-role="erase-container"></div>
      </div>

      <div class="buttons-row" data-role="buttons-row"></div>

      <div class="result-container">
        <div data-role="result" class="results"></div>
      </div>
    </div>
  `;

  const wordInput = root.querySelector('[data-role="word"]');
  const resultDiv = root.querySelector('[data-role="result"]');
  const buttonsRow = root.querySelector('[data-role="buttons-row"]');
  const closeBtnContainer = root.querySelector('[data-role="close-btn"]');
  const eraseContainer = root.querySelector('[data-role="erase-container"]');

 
  setupWordInput(wordInput);
  wordInput.addEventListener("enterPressed", doTranslate);
  wordInput.addEventListener("arrowDownPressed", () => listTranslations("down"));
  wordInput.addEventListener("arrowUpPressed", () => listTranslations("up"));


  let result = null;

  // ---------------------------
  // ФУНКЦИЯ ПЕРЕВОДА
  // ---------------------------
  async function doTranslate() {
    const word = wordInput.value.trim();
    if (!word) return;

    result = await translateWord({
      word,
      sourceLang: "en",
      targetLang: "ru"
    });

    resultDiv.innerHTML = `
      <div><b>${result.translation ?? ""}</b></div>
      <div>${result.part_of_speech ?? ""}</div>
      <div>${result.examples?.join("<br>") ?? ""}</div>
    `;

    // Авторасширение модалки
    requestAnimationFrame(() => {
      const body = root.querySelector(".modal-body");

      const neededHeight =
        body.scrollHeight +
        parseInt(getComputedStyle(root).paddingTop) +
        parseInt(getComputedStyle(root).paddingBottom) +
        root.querySelector(".modal-header").offsetHeight;

      if (neededHeight > root.offsetHeight) {
        root.style.height = neededHeight + "px";
      }

      root._minContentHeight = neededHeight;
    });
  }

  // ---------------------------
  // ФУНКЦИЯ СОХРАНЕНИЯ
  // ---------------------------
  async function doSave() {
    if (!result) return;
    await saveWord(wordInput.value.trim(), result);
  }

  // ---------------------------
  // КНОПКИ ЧЕРЕЗ TranslateButton
  // ---------------------------

  const translateBtn = new TranslateButton({
    label: "Translate",
    type: "ui-btn btn btn-translate",
    icon: "🌐",
    action: "click",
    handler: doTranslate
  }).render();

  const saveBtn = new TranslateButton({
    label: "Save",
    type: "ui-btn btn btn-save",
    icon: "💾",
    action: "click",
    handler: doSave
  }).render();

  buttonsRow.appendChild(translateBtn);
  buttonsRow.appendChild(saveBtn);

  // ---------------------------
  // КНОПКА ОЧИСТКИ ПОЛЯ ВВОДА
  // ---------------------------
  const eraseBtn = new EraseInputButton({
    handler: () => {
      wordInput.value = "";
      wordInput.classList.remove("clearable");
      wordInput.focus();
    }
  }).render();

eraseContainer.appendChild(eraseBtn);

  // ---------------------------
  // КНОПКА ВВЕРХ ВНИЗ
  // ---------------------------
  let historyIndex = null;

  function listTranslations(key) {
    const history = state.history;
    if (history.length === 0) return;

    // первый вызов — ставим на последний элемент
    if (historyIndex === null) {
      historyIndex = history.length - 1;
    } else {
      if (key === "down") historyIndex--;
      if (key === "up") historyIndex++;
    }
    if (historyIndex < 0) historyIndex = 0;
    if (historyIndex >= history.length) historyIndex = history.length - 1;

    wordInput.value = history[historyIndex];
  }


  // ---------------------------
  // КНОПКА ЗАКРЫТИЯ
  // ---------------------------
  const closeBtn = new CloseButton({
    action: "click",
    handler: closeWithScale
  }).render();

  function closeWithScale() {
    root.classList.add("modal-scale-out");
    setTimeout(() => {
      windowManager.close("translateModal");
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
