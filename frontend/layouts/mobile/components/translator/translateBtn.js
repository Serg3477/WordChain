import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { t } from "../../../../shared/i18n/index.js";

export function createTranslateBtn(doTranslate) {
  return new BaseButton({
    label: t("translator", "translate_btn"),
    type: "ui-btn",
    icon: `<img src="/assets/icons/Text.png" alt="🌐">`,
    action: "click",
    handler: doTranslate,
  }).render();
}
