import { ModalBase } from "../modals/modalBase.js";

const registry = {};
let base = null;

export const windowManager = {
  init() {
    base = new ModalBase();
    base.create();
  },

  register(name, factory) {
    registry[name] = { factory, instance: null };
  },

  open(name) {
    const record = registry[name];
    if (!record) return;

    record.instance = record.factory();
    base.mountModal(record.instance);
  },

  close(name) {
    const record = registry[name];
    if (!record || !record.instance) return;

    record.instance.remove();
    record.instance = null;
  }
};

