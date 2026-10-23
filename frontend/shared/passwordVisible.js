import { insideInputButton } from "../ui/insideButton/insideInputButton.js";

export function passwordVisible (passwordInput, buttonContainer) {

  const showPasswordBtn = new insideInputButton({
    icon: "/assets/icons/eye.png",

    handler: () => {
      const isHidden = passwordInput.type === "password";

      passwordInput.type = isHidden
        ? "text"
        : "password";

      // Переключаем иконку
      const icon = showPasswordBtn.querySelector("img");

      if (icon) {
        icon.src = isHidden
          ? "/assets/icons/icons8-eye-30.png"
          : "/assets/icons/eye.png";
      }

      passwordInput.focus();
    },
  }).render();

  buttonContainer.appendChild(showPasswordBtn);

  return showPasswordBtn;
}
