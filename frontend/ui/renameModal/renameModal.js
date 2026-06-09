let modalEl = null;

export function renameModal({ setName, text }) {
  return new Promise(resolve => {
    if (modalEl) modalEl.remove();

    modalEl = document.createElement("div");
    modalEl.className = "rm-overlay";

    modalEl.innerHTML = `
      <div class="qm-window">
        <div class="rm-text">${setName}</div>
        <div class="rm-text">${text}</div>

        <input class="rm-input-placeholder" placeholder="${setName}">

        <div class="qm-buttons">
          <button class="rm-btn rm-yes">Yes</button>
          <button class="rm-btn rm-no">No</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const inputPlaceholder = modalEl.querySelector(".rm-input-placeholder")

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

    modalEl.querySelector(".rm-yes").onclick = () => {
      closeModal();
      resolve(inputPlaceholder.value);
    };

    modalEl.querySelector(".rm-no").onclick = () => {
      closeModal();
      resolve = null;
    };

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) {
        closeModal();
        resolve = null;
      }
    });
  });
}
