// ============================================================
// ============================================================
// RESIZE UTILITY — корректное изменение размеров модалок
// Учитывает размеры .modal-body, не даёт "ползти вниз"
// ============================================================

export function makeResizable(modal) {
  const resizer = document.createElement("div");
  resizer.className = "modal-resizer";
  modal.appendChild(resizer);

  let isResizing = false;

  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const rect = modal.getBoundingClientRect();

    // Находим контейнер контента
    const body = modal.querySelector(".modal-body");

    // Минимальные размеры = размеры контента
    const minWidth = body.scrollWidth + 32;   // + padding
    const minHeight = body.scrollHeight + 32; // + padding

    // Новые размеры
    let newWidth = e.clientX - rect.left;
    let newHeight = e.clientY - rect.top;

    // Ограничения
    if (newWidth < minWidth) newWidth = minWidth;
    if (newHeight < minHeight) newHeight = minHeight;

    modal.style.width = newWidth + "px";
    modal.style.height = newHeight + "px";
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
  });
}
