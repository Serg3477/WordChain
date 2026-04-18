export class NavbarButton {
  constructor({
    label,
    type = "",
    icon = null,
    action = null,
    handler = null
  }) {
    this.el = document.createElement("button");
    this.el.className = `${type}`;

    this.el.innerHTML = `
      ${icon ? `<span class="nav-btn-icon">${icon}</span>` : ""}
      <span class="nav-btn-label">${label}</span>
    `;

    // поддержка массива событий
    if (Array.isArray(action)) {
      action.forEach(evt => this.el.addEventListener(evt, handler));
    } else if (handler && action) {
      this.el.addEventListener(action, handler);
    }
  }

  render() {
    return this.el;
  }
}
