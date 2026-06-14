let tipEl = null;

export function tipModal({ text, target }) {
  return new Promise(resolve => {
    if (tipEl) tipEl.remove();

    tipEl = document.createElement("div");
    tipEl.className = "tip-popup";
    tipEl.textContent = text;

    document.body.appendChild(tipEl);

    // Позиционирование возле слова
    const rect = target.getBoundingClientRect();

    const popupRect = tipEl.getBoundingClientRect();

    const top = rect.top - popupRect.height - 6;   // над словом
    const left = rect.left + (rect.width - popupRect.width) / 2;

    tipEl.style.top = `${Math.max(top, 4)}px`;
    tipEl.style.left = `${Math.max(left, 4)}px`;

    // Закрытие при клике вне
    function close() {
      if (!tipEl) return;
      tipEl.remove();
      tipEl = null;
      resolve();
      document.removeEventListener("click", onDocClick);
    }

    function onDocClick(e) {
      if (!tipEl) return;
      if (!tipEl.contains(e.target) && e.target !== target) {
        close();
      }
    }

    document.addEventListener("click", onDocClick, { capture: true });
  });
}

