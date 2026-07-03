import { state } from "../../core/state.js";
import { translations } from "./translations.js";


export function t(section, key) {
  const lang = state.userInterface.ui_language || "en";
  return translations[lang]?.[section]?.[key] || translations["en"][section][key];
}
