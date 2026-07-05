// ===============================
// Универсальное окно выбора.
// ===============================
import { t } from "../../shared/i18n/index.js"


export function selectModal({ title = "Select...", items = [] }) {
  return new Promise(resolve => {
    
    let modalEl = document.createElement("div");
    modalEl.className = "sm-overlay";

    if (modalEl) modalEl.remove();

    const optionsHtml = items
      .map((item, i) => `<button class="sm-option" data-index="${i}">${item.label}</button>`)
      .join("");

    const emptySets = t("selectModal", "nowhere_to_move");
    modalEl.innerHTML = `
      <div class="sm-window">
        <div class="sm-title">${title}</div>
        <div class="sm-options">${optionsHtml || '<div class="sm-empty">${emptyText}</div>'}</div>
      </div>
    `;

    document.body.appendChild(modalEl);

    function closeModal() {
      if (!modalEl) return;

      const el = modalEl;   // фиксируем ссылку
      modalEl = null;       // сбрасываем глобальную переменную

      el.classList.add("hide");

      // гарантированное удаление
      setTimeout(() => {
        if (el && el.parentNode) {
          el.remove();
        }
      }, 200);
    }

    modalEl.querySelectorAll(".sm-option").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.index);
        closeModal();
        resolve(items[idx].value);
      };
    });

    // клик по фону — отмена
    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) {
        closeModal();
        resolve(undefined);
      }
    });
  });
}