import { translateWord, saveWord } from "../features/translator/translate.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";
import { TranslateButton } from "../ui/buttons/translate/translateButton.js";
import { CloseButton } from "../ui/buttons/close/closeButton.js";


export function createTranslateModal() {
  const root = document.createElement("div");
  root.className = "translate-modal";

  root.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">Translate</span>
      <div data-role="close-btn"></div>

    </div>

    <div class="modal-body">
      <input data-role="word" class="input-word" placeholder="Enter word...">

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
    type: "translate ui-btn btn btn-translate",
    icon: "🌐",
    action: "click",
    handler: doTranslate
  }).render();

  const saveBtn = new TranslateButton({
    label: "Save",
    type: "translate ui-btn btn btn-save",
    icon: "💾",
    action: "click",
    handler: doSave
  }).render();

  buttonsRow.appendChild(translateBtn);
  buttonsRow.appendChild(saveBtn);

  // ---------------------------
  // КНОПКА ЗАКРЫТИЯ
  // ---------------------------
  const closeBtn = new CloseButton({
    action: "click",
    handler: closeWithScatter
  }).render();

  function closeWithScatter() {
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
