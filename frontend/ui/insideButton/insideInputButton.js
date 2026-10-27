
/* ===============================
   Универсальная кнопка внутри input
   ===============================
*/
export class insideInputButton {
  constructor({
    action = "click",
    handler = null,
    icon = icon
  }) {
    this.el = document.createElement("button");

    this.el.type = "button";
    this.el.className = "ui-erase-btn";

    this.el.innerHTML = `
      <img
        class="ui-erase-btn-icon"
        src="${icon}"
        alt=""
      >
    `;

    if (handler) {
      this.el.addEventListener(action, handler);
    }
  }

  render() {
    return this.el;
  }
}
