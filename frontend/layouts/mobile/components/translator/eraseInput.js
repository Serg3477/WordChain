import { insideInputButton } from "../../../../ui/insideButton/insideInputButton.js";

export function setupEraseInput(placeholder, eraseContainer) {

  const eraseBtn = new insideInputButton({
    icon: "/assets/icons/backspace.png",

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

    eraseBtn.classList.toggle(
      "is-invisible",
      !hasValue
    );
  });

  return eraseBtn;
}

