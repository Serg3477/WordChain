export class CloseButton {
  constructor({ action = "click", handler = null }) {
    this.el = document.createElement("button");
    this.el.className = "ui-close-btn";
    this.el.innerHTML = "✕";

    if (handler) {
      this.el.addEventListener(action, handler);
    }
  }

  render() {
    return this.el;
  }
}
