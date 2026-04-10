export function makeResizable(modal) {
  const resizer = document.createElement("div");
  resizer.className = "modal-resizer";
  modal.appendChild(resizer);

  let isResizing = false;

  // Дадим возможность модалке хранить минимальную высоту контента
  modal._minContentHeight = 0;

  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const rect = modal.getBoundingClientRect();

    let newWidth = e.clientX - rect.left;
    let newHeight = e.clientY - rect.top;

    // CSS-минимумы
    const cssMinWidth = parseInt(getComputedStyle(modal).minWidth);
    const cssMinHeight = parseInt(getComputedStyle(modal).minHeight);

    if (newWidth < cssMinWidth) newWidth = cssMinWidth;
    if (newHeight < cssMinHeight) newHeight = cssMinHeight;

    // Фиксированный минимум контента
    if (modal._minContentHeight && newHeight < modal._minContentHeight) {
      newHeight = modal._minContentHeight;
    }

    modal.style.width = newWidth + "px";
    modal.style.height = newHeight + "px";
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
  });
}
