import { windowManager } from "../../../../core/windowManager.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { renderText } from "../text.js";

export async function onTextClick(set) {
  const name = set.name;
  try {
    logInfo(`Set ${name} button "Text" clicked`);
    windowManager.pushScreen("text");
    const words = set._words;
    const data = await renderText(set, words);
    logInfo("Set Text loaded", { name, hasData: !!data });
  } catch (e) {
    logError("Set Text details request failed", { name, error: e.message });
  }
}
