export class TranslateButton {
  constructor({ 
    label, 
    type = type, 
    icon = null, 
    action = null, 
    handler = null 
  }) {
    this.el = document.createElement("button");
    this.el.className = `${type}`;

    this.el.innerHTML = `
      ${icon ? `<span class="ui-btn-icon">${icon}</span>` : ""}
      <span class="ui-btn-label">${label}</span>
    `;

    if (handler) {
      this.el.addEventListener(action, handler);
    }
  }

  render() {
    return this.el;
  }
}

