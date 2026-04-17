export function setupWordInput(inputEl) {
  inputEl.addEventListener("input", () => {
    if (inputEl.value.length > 0) {
      inputEl.classList.add("clearable");
    } else {
      inputEl.classList.remove("clearable");
    }
  });

  inputEl.addEventListener("click", (e) => {
    const rect = inputEl.getBoundingClientRect();
    const clickX = e.clientX;

    // если клик по области кнопки Х
    if (clickX > rect.right - 32) {
      inputEl.value = "";
      inputEl.classList.remove("clearable");
      inputEl.focus();
    }
  });
}

