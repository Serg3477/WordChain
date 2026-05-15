/* ===============================
   Кнопка BaseButton
   =============================== 
*/


export class BaseButton {
  constructor({ 
    label, 
    type = "", 
    icon = null, 
    action = "click", 
    handler = null 
  }) {
    this.el = document.createElement("button");
    this.el.className = `${type} ui-btn`;   // добавляем ui-btn для общего стиля
    this.el.type = "button";

    // Вставляем SVG или текстовую иконку
    this.el.innerHTML = `
      ${icon ? `<span class="ui-btn-icon">${icon}</span>` : ""}
      <span class="ui-btn-label">${label}</span>
    `;

    // Ripple-эффект
    this.el.addEventListener("pointerdown", (e) => this.createRipple(e));

    // Mobile-friendly: отключаем залипание
    this.el.addEventListener("touchend", () => {
      this.el.classList.remove("active");
    });

    // Обработчик клика
    if (handler) {
      this.el.addEventListener(action, handler);
    }
  }

  createRipple(event) {
    const rect = this.el.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ui-ripple";

    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;

    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    this.el.appendChild(ripple);

    ripple.addEventListener("animationend", () => ripple.remove());
  }

  render() {
    return this.el;
  }
}


