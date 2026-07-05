import { state } from "../../../../core/state.js";
import { voiceWord } from "../../../../api/audio.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { logInfo, logError } from "../../../../utils/logger/logger.js";
import { doVoice } from "../../../../shared/voice.js";
import { t } from "../../../../shared/i18n/index.js";

export function createVoiceBtn(placeholder) {
  return new BaseButton({
    label: t("translator", "voice_btn"),
    type: "ui-btn",
    icon: `<img src="/assets/icons/megaphone.png">`,
    action: "click",
    handler: async () => {
      const word = placeholder.value.trim();
      if (!word) {
        logInfo("Voice aborted: empty input");
        return;
      }

      try {
        const voiceResult = await voiceWord(word, state.sourceLang, "word");
        state.setVoice(voiceResult?.audio_data || null);
        doVoice();
      } catch (e) {
        logError("Voice request failed in UI", { error: e.message });
      }
    },
  }).render();
}
