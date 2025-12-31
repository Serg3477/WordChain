const registry = {};

export const windowManager = {
  register(name, factory) {
    registry[name] = { factory, instance: null };
  },

  open(name, props = {}) {
    const record = registry[name];
    if (!record) return;

    if (!record.instance) {
      record.instance = record.factory(props);
      document.body.appendChild(record.instance);
    }

    record.instance.classList.add("modal--visible");
  },

  close(name) {
    const record = registry[name];
    if (!record || !record.instance) return;
    record.instance.classList.remove("modal--visible");
  }
};
