export function initBottomSheet(history, { onSelect } = {}) {
  const sheet = document.querySelector(".bottom-sheet");
  const header = sheet.querySelector(".bs-header");
  const content = sheet.querySelector(".bs-content");

  const HEIGHTS = {
    collapsed: 60,
    half: 200,
    full: window.innerHeight - 80
  };

  let current = "collapsed";
  let startY = 0;
  let startHeight = 0;
  let dragging = false;

  // ---- История ----
  let offset = 0;
  const limit = 30;
  let loading = false;

  function renderChunk() {
    if (loading) return;
    loading = true;

    const slice = history.slice(offset, offset + limit);

    slice.forEach(word => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.textContent = word;

      div.onclick = () => onSelect?.(word);

      content.appendChild(div);
    });

    offset += slice.length;
    loading = false;
  }

  content.addEventListener("scroll", () => {
    if (content.scrollTop + content.clientHeight >= content.scrollHeight - 50) {
      renderChunk();
    }
  });

  function resetHistory() {
    offset = 0;
    content.innerHTML = "";
  }

  function setState(state) {
    current = state;
    sheet.style.height = HEIGHTS[state] + "px";

    if (state === "half" || state === "full") {
      if (offset === 0) renderChunk();
    }

    if (state === "collapsed") {
      resetHistory();
    }
  }

  // ---- DRAG + CLICK (единый цикл pointer-событий) ----
  function onMove(e) {
    // движение больше порога считаем перетаскиванием
    if (Math.abs(startY - e.clientY) > 6) dragging = true;

    const dy = startY - e.clientY;
    let newHeight = startHeight + dy;
    newHeight = Math.max(HEIGHTS.collapsed, Math.min(newHeight, HEIGHTS.full));
    sheet.style.height = newHeight + "px";
  }

  function refresh() {
  const wasOpen = current !== "collapsed";

  resetHistory();

  if (wasOpen) {
    renderChunk();
  }
}


  function onUp(e) {
    header.releasePointerCapture(e.pointerId);
    header.removeEventListener("pointermove", onMove);
    header.removeEventListener("pointerup", onUp);
    header.style.cursor = "grab";

    // не двигали → обычный клик-тоггл
    if (!dragging) {
      if (current === "collapsed") setState("half");
      else setState("collapsed");
      return;
    }

    // двигали → защёлкиваем по итоговой высоте
    const finalHeight = sheet.offsetHeight;
    if (finalHeight < (HEIGHTS.half + HEIGHTS.collapsed) / 2) {
      setState("collapsed");
    } else if (finalHeight < (HEIGHTS.full + HEIGHTS.half) / 2) {
      setState("half");
    } else {
      setState("full");
    }
  }

  header.addEventListener("pointerdown", (e) => {
    dragging = false;
    startY = e.clientY;
    startHeight = sheet.offsetHeight;
    header.setPointerCapture(e.pointerId);   // захват на ТОМ ЖЕ элементе, что и слушатели
    header.style.cursor = "grabbing";

    header.addEventListener("pointermove", onMove);
    header.addEventListener("pointerup", onUp);
  });

  setState("collapsed");

  return {
    update(newHistory) {
      history = newHistory;
      offset = 0;
      refresh();
    }
  };
}
