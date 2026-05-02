import { ModalBase } from "../modals/modalBase/modalBase.js";

const registry = {};
let base = null;

let topZ = 1000;

export const windowManager = {
  init() {
    base = new ModalBase();
    base.create();
  },

  bringToFront(modal) {
    if (!modal) return;
    modal.style.zIndex = ++topZ;
  },

  register(name, factory) {
    registry[name] = { factory, instances: [] };
  },

  open(name) {
    const record = registry[name];
    if (!record) return;

    const modal = record.factory();

    this.bringToFront(modal);
    // общий обработчик для всех модалок
    modal.addEventListener("mousedown", () => this.bringToFront(modal));

    record.instances.push(modal);
    base.mountModal(modal);

    /* Ориентация в mobile portrait */
    const isPortraitMobile =
      window.matchMedia("(max-width: 767px) and (orientation: portrait)").matches;

    if (isPortraitMobile) {
      const openCount = Object.values(registry)
        .reduce((acc, r) => acc + r.instances.length, 0);

      const navbar = document.querySelector(".navbar");
      const navbarBottom = navbar ? navbar.getBoundingClientRect().bottom : 56;

      const baseTop = Math.round(navbarBottom + 10);
      const step = 50;

      modal.style.top = `${baseTop + openCount * step}px`;
    }
  },

  close(name) {
    const record = registry[name];
    if (!record || record.instances.length === 0) return;

    const modal = record.instances.pop();
    modal.remove();
  }
};

