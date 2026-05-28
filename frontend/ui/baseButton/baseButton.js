/* ===============================
   Кнопка BaseButton
   =============================== 
*/

// ui/baseButton/base/button.js

export class BaseButton {
  constructor({ 
    label, 
    type = "", 
    icon = null, 
    action = "click", 
    handler = null 
  }) {
    this.el = document.createElement("button");
    this.el.className = `${type} ui-btn`;
    this.el.type = "button";

    // Вставляем SVG или текстовую иконку
    this.el.innerHTML = `
      ${icon ? `<span class="ui-btn-icon">${icon}</span>` : ""}
      <span class="ui-btn-label">${label}</span>
    `;

    // --- Ripple: создаём на pointerdown, не мешаем клику ---
    this.el.addEventListener("pointerdown", (e) => {
      // только для основной кнопки/пальца
      if (e.button === 0 || e.pointerType === "touch" || e.pointerType === "pen") {
        this.createRipple(e);
        // пометить как активную (для стилей), убираем через pointerup/pointercancel
        this.el.classList.add("active");
      }
    });

    // pointerup/pointercancel/touchend — снимаем active и blur (защищённо)
    const clearActive = (e) => {
      this.el.classList.remove("active");

      try {
        const active = document.activeElement;
        const tag = active && active.tagName ? active.tagName.toLowerCase() : null;

        // Если пользователь сейчас вводит текст — не перебиваем фокус
        if (tag === 'input' || tag === 'textarea' || active?.isContentEditable) {
          return;
        }

        // Блурим кнопку только если она действительно в фокусе
        if (document.activeElement === this.el) {
          this.el.blur();
        }
      } catch (err) {
        // безопасно игнорируем ошибки
      }
    };
    this.el.addEventListener("pointerup", clearActive);
    this.el.addEventListener("pointercancel", clearActive);
    this.el.addEventListener("touchend", clearActive);

    // --- Обработчик действия: только click ---
    if (handler) {
      this.el.addEventListener("click", async (ev) => {
        try {
          await handler(ev);
        } catch (err) {
          console.error("Button handler error", err);
        } finally {
          // гарантируем, что кнопка не останется в фокусе,
          // но не отнимаем фокус у поля ввода
          try {
            const active = document.activeElement;
            const tag = active && active.tagName ? active.tagName.toLowerCase() : null;
            if (!(tag === 'input' || tag === 'textarea' || active?.isContentEditable)) {
              if (document.activeElement === this.el) {
                this.el.blur();
              }
            }
          } catch (err) {}
          // и снимаем active (на случай, если pointerup не сработал)
          this.el.classList.remove("active");
        }
      });
    }

    // Для клавиатуры: Enter/Space уже генерируют click, поэтому дополнительных обработчиков не нужно.
  }

  createRipple(event) {
    const rect = this.el.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ui-ripple";

    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;

    // Если event.clientX/Y отсутствуют (например, keyboard), центрируем
    const clientX = event.clientX ?? (rect.left + rect.width / 2);
    const clientY = event.clientY ?? (rect.top + rect.height / 2);

    const x = clientX - rect.left - size / 2;
    const y = clientY - rect.top - size / 2;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    this.el.appendChild(ripple);

    // Удаляем ripple по завершении анимации
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }

  render() {
    return this.el;
  }
}
