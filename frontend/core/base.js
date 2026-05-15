export function createBaseLayout() {
  const root = document.getElementById("app");

  root.innerHTML = `
    <div id="navbar-root"></div>

    <div id="content-root"></div>

    <div id="modal-root"></div>
  `;
}
