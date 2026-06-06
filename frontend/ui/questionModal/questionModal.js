// ui/questionModal/questionModal.js

let modalEl = null;

export function questionModal({ icon, text }) {
  return new Promise(resolve => {
    if (modalEl) modalEl.remove();

    modalEl = document.createElement("div");
    modalEl.className = "qm-overlay";

    modalEl.innerHTML = `
      <div class="qm-window">
        <img class="qm-icon" src="${icon}" alt="">
        <div class="qm-text">${text}</div>

        <div class="qm-buttons">
          <button class="qm-btn qm-yes">Yes</button>
          <button class="qm-btn qm-no">No</button>
        </div>
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

    modalEl.querySelector(".qm-yes").onclick = () => {
      closeModal();
      resolve(true);
    };

    modalEl.querySelector(".qm-no").onclick = () => {
      closeModal();
      resolve(false);
    };

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) {
        closeModal();
        resolve(false);
      }
    });
  });
}
