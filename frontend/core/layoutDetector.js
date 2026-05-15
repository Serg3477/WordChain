// core/layoutDetector.js
import { setState } from "./state.js";

export function detectLayout() {
  const w = window.innerWidth;
  return w < 600 ? "mobile" : "desktop";
}

export function initLayoutWatcher() {
  function update() {
    const layout = detectLayout();
    setState({ layout });
  }

  window.addEventListener("resize", update);
  update();
}
