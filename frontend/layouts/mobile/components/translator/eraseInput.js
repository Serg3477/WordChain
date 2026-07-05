import { EraseInputButton } from "../../../../ui/erase/eraseInputButton.js";

export function setupEraseInput(placeholder, eraseContainer) {
  const eraseBtn = new EraseInputButton({
    handler: () => {
      placeholder.value = "";
      placeholder.classList.remove("clearable");
      placeholder.focus();
    },
  }).render();

  eraseContainer.appendChild(eraseBtn);
  eraseBtn.classList.add("is-invisible");

  placeholder.addEventListener("input", () => {
    const hasValue = placeholder.value.trim().length > 0;
    eraseBtn.classList.toggle("is-invisible", !hasValue);
  });

  return eraseBtn;
}
