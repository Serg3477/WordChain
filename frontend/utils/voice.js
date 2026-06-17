import { state } from "../../../core/state.js";
import { logInfo, logError } from "./logger/logger.js";



export async function doVoice() {
    logInfo("Voice button clicked");
    if (!state.voice) {
      logError("Voice: empty audio_data");
    }
    playTtsAudio(state.voice);
  }

  // ---------------------------
  // ПРОИГРЫВАТЕЛЬ АУДИО
  // ---------------------------
  function playTtsAudio(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audio.play();
      }