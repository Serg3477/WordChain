import { renderMobileNavbar } from "./components/navbar.js";
import { renderTranslator } from "./components/translator.js";

export function renderMobile(state) {
  const content = document.getElementById("content-root");

  // Navbar рендерится в navbar-root
  renderMobileNavbar();

  // Контейнер для экранов mobile
  content.innerHTML = `
    <div id="mobile-screens">
      <div data-screen="translator"></div>
      <div data-screen="sets" style="display:none"></div>
      <div data-screen="exams" style="display:none"></div>
    </div>
  `;

  // Рендерим первый экран
  renderTranslator(state);
}