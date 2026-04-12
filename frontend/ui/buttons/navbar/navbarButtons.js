export class NavbarButton {
  constructor({
    label,
    type = "",
    icon = null,
    action = null,
    handler = null,
    dataAction = null
  }) {
    this.el = document.createElement("button");

    // классы передаются как строка
    this.el.className = type;

    // data-action для CurriculumMenu
    if (dataAction) {
      this.el.dataset.action = dataAction;
    }

    this.el.innerHTML = `
      ${icon ? `<span class="nav-btn-icon">${icon}</span>` : ""}
      <span class="nav-btn-label">${label}</span>
    `;

    if (handler) {
      this.el.addEventListener(action, handler);
    }
  }

  render() {
    return this.el;
  }
}
