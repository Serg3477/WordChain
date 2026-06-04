import { setState } from "./state.js";

export function detectLayout() {
  // primary: по ширине вьюпорта
  if (window.matchMedia && window.matchMedia("(max-width: 600px)").matches) {
    return "mobile";
  }
  // fallback по userAgent (на случай, если viewport не применился)
  const uaMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  return uaMobile ? "mobile" : "desktop";
}

export function initLayoutWatcher() {
  function update() {
    const layout = detectLayout();
    setState({ layout });
  }

  // слушаем изменения ширины
  if (window.matchMedia) {
    const mq = window.matchMedia("(max-width: 600px)");
    // modern browsers
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
  }
  window.addEventListener("resize", update);
  // сразу вычисляем
  update();
}

