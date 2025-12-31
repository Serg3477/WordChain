import { translateWord } from "../../features/translator/translate.js";
import { windowManager } from "../../core/windowManager.js";

export function createTranslateModal() {
  const root = document.createElement("div");
  root.className = "modal"; // без hidden, этим управляет windowManager

  root.innerHTML = `
    <div class="modal-content">
      <h3>Translate word</h3>

      <input data-role="word" placeholder="Word">
      <input data-role="source-lang" placeholder="From language" value="English">
      <input data-role="target-lang" placeholder="To language" value="Russian">

      <button data-role="translate-btn">Translate</button>

      <div data-role="result"></div>

      <button data-role="close-btn">Close</button>
    </div>
  `;

  const wordInput = root.querySelector('[data-role="word"]');
  const sourceInput = root.querySelector('[data-role="source-lang"]');
  const targetInput = root.querySelector('[data-role="target-lang"]');
  const translateBtn = root.querySelector('[data-role="translate-btn"]');
  const resultDiv = root.querySelector('[data-role="result"]');
  const closeBtn = root.querySelector('[data-role="close-btn"]');

  translateBtn.addEventListener("click", async () => {
    const word = wordInput.value.trim();
    const source = sourceInput.value.trim();
    const target = targetInput.value.trim();
    if (!word) return;

    const result = await translateWord({ word, sourceLang: source, targetLang: target });
    resultDiv.textContent = result.translation ?? result;
  });

  closeBtn.addEventListener("click", () => {
    windowManager.close("translateModal");
  });

  return root;
}

