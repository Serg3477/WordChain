import { renderMobileNavbar } from "./components/navbar.js";
import { renderTranslator } from "./components/translator.js";
import { windowManager } from "../../core/windowManager.js";



export function renderMobile(state) {
  const content = document.getElementById("content-root");

  // Navbar рендерится в navbar-root
  renderMobileNavbar();

  // Контейнер для экранов mobile
  content.innerHTML = `
    <div id="mobile-screens">
      <div data-screen="translator"></div>
      <div data-screen="profile" style="display:none"></div>
      <div data-screen="register" style="display:none"></div>
      <div data-screen="login" style="display:none"></div>
      <div data-screen="sets" style="display:none"></div>
      <div data-screen="exams" style="display:none"></div>
      <div data-screen="word" style="display:none"></div>
      <div data-screen="text" style="display:none"></div>
      <div data-screen="settings" style="display:none"></div>
    </div>
  `;

  // Рендерим первый экран
  renderTranslator();
  windowManager.pushScreen("translator");
}