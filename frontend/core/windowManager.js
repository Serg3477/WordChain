import { destroyScrollButtonsArea } from "../ui/scrollButtonsArea/scrollButtonsArea.js"

let screenStack = [];
let modalContainer = null;
const modalRegistry = {};
let topZ = 1000;

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

    // если уходим с word — уничтожаем панель кнопок
    if (id !== "word") {
      destroyScrollButtonsArea();
    }
  },

  // Добавление в список посещений скринов, исключая повторения
  pushScreen(id) {
    if (screenStack[screenStack.length - 1] !== id) {
      screenStack.push(id);
    }
    this.showScreen(id);
  },

  currentScreen() {
    return screenStack[screenStack.length - 1] ?? null;
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
  register(name, factory) {
    modalRegistry[name] = { factory, instances: [] };
  },

  open(name) {
    const record = modalRegistry[name];
    if (!record || !modalContainer) return;

    const modal = record.factory();
    modal.style.zIndex = String(++topZ);
    record.instances.push(modal);
    modalContainer.appendChild(modal);
  },

  close(name) {
    const record = modalRegistry[name];
    if (!record || record.instances.length === 0) return;

    const modal = record.instances.pop();
    modal.remove();
  },

  // Совместимость со старым API
  openModal(element) {
    if (!modalContainer || !element) return;
    element.style.zIndex = String(++topZ);
    modalContainer.appendChild(element);
  },

  closeModal(element) {
    if (!modalContainer || !element) return;
    element.remove();
  }
};

