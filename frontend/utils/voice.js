import { state } from "../../../core/state.js";
import { logInfo, logError } from "./logger/logger.js";


export let audio = null;
let lastVoice = null;

export async function doVoice() {
    logInfo("Voice button clicked");
    if (!state.voice) {
      logError("Voice: empty audio_data");
      return
    }
    // Если аудио новое — пересоздаём
    if (state.voice !== lastVoice) {
      lastVoice = state.voice;
      playTtsAudio(state.voice);
      return;
    }

    // Если аудио то же самое и стоит на паузе — продолжаем
    if (audio && audio.paused) {
      audio.play();
      return;
    }
    // Иначе создаём новое
    playTtsAudio(state.voice);
}

export function doPause() {
  if (audio && !audio.paused) {
    audio.pause();
  }
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

        audio = new Audio(url);
        audio.play();
      }


