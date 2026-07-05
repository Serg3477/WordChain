import { windowManager } from "../../../../core/windowManager.js";
import { state } from "../../../../core/state.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { renderWord } from "../word.js";

export async function onWordClick({ id, word }) {
  try {
    logInfo(`Word ${word} clicked`, { word });
    windowManager.pushScreen("word");
    const data = await renderWord(state, id, word);
    logInfo("Word details loaded", { word, hasData: !!data });
  } catch (e) {
    logError("Word details request failed", { word, error: e.message });
  }
}
