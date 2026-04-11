import { translateWord, saveWord } from "../features/translator/translate.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";



export function createTranslateModal() {
  const root = document.createElement("div");
  root.className = "translate-modal";

  root.innerHTML = `
    <div class="modal-header">
      <span class="modal-title">Translate</span>
      <button class="modal-close">✕</button>
    </div>

    <div class="modal-body">
      <input data-role="word" class="input-word" placeholder="Enter word...">

      <div class="buttons-row">
        <button data-role="translate-btn" class="btn primary">Translate</button>
        <button data-role="save-btn" class="btn secondary">Save</button>
      </div>

      <div class="result-container">
        <div data-role="result" class="results"></div>
      </div>
    </div>
  `;

  const wordInput = root.querySelector('[data-role="word"]');
  const translateBtn = root.querySelector('[data-role="translate-btn"]');
  const saveBtn = root.querySelector('[data-role="save-btn"]');
  const resultDiv = root.querySelector('[data-role="result"]');

  let result = null;

  translateBtn.addEventListener("click", async () => {
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

    // --- АВТОРАСШИРЕНИЕ МОДАЛКИ ПОСЛЕ ПЕРЕВОДА ---
    // даём браузеру дорисовать DOM
    requestAnimationFrame(() => {
      const body = root.querySelector(".modal-body");

      // реальная нужная высота по контенту
      const neededHeight = body.scrollHeight
        + parseInt(getComputedStyle(root).paddingTop)
        + parseInt(getComputedStyle(root).paddingBottom)
        + root.querySelector(".modal-header").offsetHeight;

      // текущая высота модалки
      const currentHeight = root.offsetHeight;

      // если контента стало больше, чем текущая высота — расширяем
      if (neededHeight > currentHeight) {
        root.style.height = neededHeight + "px";
      }

      // фиксируем минимальную высоту контента для resize.js
      root._minContentHeight = neededHeight;
    });
  });

  saveBtn.addEventListener("click", async () => {
    if (!result) return;
    await saveWord(wordInput.value.trim(), result);
  });

  root.querySelector(".modal-close").onclick = () => {
    windowManager.close("translateModal");
  };

  // Подключаем утилиты
  const header = root.querySelector(".modal-header");
  makeDraggable(root, header);
  makeResizable(root);

  return root;
}
