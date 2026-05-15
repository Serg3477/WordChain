const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach(fn => fn(state));
}
