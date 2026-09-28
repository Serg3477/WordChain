import { EraseInputButton } from "../ui/erase/eraseInputButton.js";

export function passwordVisible (passwordInput, buttonContainer) {

  const showPasswordBtn = new EraseInputButton({
    icon: "/assets/icons/eye.png",

    handler: () => {
      const isHidden = passwordInput.type === "password";

      passwordInput.type = isHidden
        ? "text"
        : "password";

      passwordInput.focus();
    },
  }).render();

  buttonContainer.appendChild(showPasswordBtn);

  return showPasswordBtn;
}