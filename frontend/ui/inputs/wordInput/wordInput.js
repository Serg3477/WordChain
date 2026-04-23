/* ===============================
   поля ввода
   =============================== 
*/
export function setupWordInput(inputEl) {
  
  // Обработчик перевода при нажатии ENTER 
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // вызываем внешний обработчик
      inputEl.dispatchEvent(new CustomEvent("enterPressed"));
    }
  });

  // Обработчик переключения вариантов предыдущего перевода
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown")
      inputEl.dispatchEvent(new CustomEvent("arrowDownPressed"));
    if (e.key === "ArrowUp")
      inputEl.dispatchEvent(new CustomEvent("arrowUpPressed"));
  });
}

