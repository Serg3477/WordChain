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
}

