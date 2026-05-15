/* ===============================
   Кнопка очистки поля ввода
   =============================== 
*/
export class EraseInputButton {
  constructor({ action = "click", handler = null }) {
    this.el = document.createElement("button");
    this.el.className = "ui-erase-btn";
    this.el.innerHTML = "↺"; // символ Backspace

    if (handler) {
      this.el.addEventListener(action, handler);
    }
  }

  render() {
    return this.el;
  }
}
