//  ==========================================
//  Минимальный singleton API для ленты кнопок
//  ==========================================
 
// BUTTON NAVBAR

let _instance = null;

function _makeInstance({ id } = {}) {
  const containerId = id || "global-scroll-buttons-area";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "scroll-buttons-area";
    container.innerHTML = `<div class="scroll-buttons-track" tabindex="0" role="toolbar" aria-label="Buttons track"></div>`;
    document.body.appendChild(container);
  }
  const track = container.querySelector(".scroll-buttons-track");

  // глобальный key handler
  function onKey(e) {
    if (e.key === "ArrowLeft") {
      track.scrollBy({ left: -120, behavior: "smooth" });
    } else if (e.key === "ArrowRight") {
      track.scrollBy({ left: 120, behavior: "smooth" });
    }
  }
  function globalKeyHandler(e) {
    const active = document.activeElement;
    const tag = active && active.tagName ? active.tagName.toLowerCase() : null;
    if (tag === "input" || tag === "textarea" || active?.isContentEditable) return;
    onKey(e);
  }
  window.addEventListener("keydown", globalKeyHandler);

  // убрать залипание фокуса
  const pointerUpHandler = () => track.blur();
  track.addEventListener("pointerup", pointerUpHandler);
  track.addEventListener("touchend", pointerUpHandler);

  const api = {
    containerEl: container,
    trackEl: track,
    mount(target = document.body) {
      if (container.parentElement !== target) target.appendChild(container);
    },
    addButton(el) {
      track.appendChild(el);
    },
    focus() {
      track.focus();
    },
    _cleanup() {
      window.removeEventListener("keydown", globalKeyHandler);
      track.removeEventListener("pointerup", pointerUpHandler);
      track.removeEventListener("touchend", pointerUpHandler);
    },
    destroy() {
      try { api._cleanup(); } catch (e) { /* ignore */ }
      if (container.parentElement) container.remove();
    }
  };

  return api;
}

// Создаёт инстанс, если ещё нет, и возвращает его
export function createScrollButtonsArea(opts = {}) {
  if (!_instance) {
    _instance = _makeInstance(opts);
  }
  return _instance;
}

// Возвращает текущий инстанс или null
export function getScrollButtonsArea() {
  return _instance;
}

// Уничтожает инстанс (cleanup + remove DOM) и обнуляет ссылку
export function destroyScrollButtonsArea() {
  if (!_instance) return;
  try {
    _instance.destroy();
  } finally {
    _instance = null;
  }
}
