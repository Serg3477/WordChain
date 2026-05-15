let screenStack = [];
let modalContainer = null;

export const windowManager = {
  init() {
    modalContainer = document.getElementById("modal-root");
  },

  // -----------------------------
  // ЭКРАНЫ (mobile)
  // -----------------------------
  showScreen(id) {
    document.querySelectorAll("[data-screen]").forEach(el => {
      el.style.display = "none";
    });

    const screen = document.querySelector(`[data-screen="${id}"]`);
    if (screen) screen.style.display = "block";
  },

  pushScreen(id) {
    screenStack.push(id);
    this.showScreen(id);
  },

  back() {
    if (screenStack.length > 1) {
      screenStack.pop();
      const id = screenStack[screenStack.length - 1];
      this.showScreen(id);
    }
  },

  // -----------------------------
  // МОДАЛКИ (универсальные)
  // -----------------------------
  openModal(element) {
    if (!modalContainer) return;
    modalContainer.appendChild(element);
  },

  closeModal(element) {
    if (!modalContainer) return;
    element.remove();
  }
};
