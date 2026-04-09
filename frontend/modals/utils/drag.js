// ===============================
// DRAG UTILITY — перетаскивание модалок
// ===============================

export function makeDraggable(modal, handle) {
  let offsetX = 0;
  let offsetY = 0;
  let isDown = false;

  handle.style.cursor = "grab";

  handle.addEventListener("mousedown", (e) => {
    isDown = true;
    offsetX = e.clientX - modal.offsetLeft;
    offsetY = e.clientY - modal.offsetTop;
    handle.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDown) return;

    modal.style.left = e.clientX - offsetX + "px";
    modal.style.top = e.clientY - offsetY + "px";
    modal.style.position = "absolute";
  });

  document.addEventListener("mouseup", () => {
    isDown = false;
    handle.style.cursor = "grab";
  });
}
