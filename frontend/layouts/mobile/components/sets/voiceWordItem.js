import { state } from "../../../../core/state.js";
import { voiceWord } from "../../../../api/audio.js";
import { doVoice } from "../../../../shared/voice.js";

export async function voiceWordItem(word) {
  const voiceResult = await voiceWord(word, state.sourceLang, "word");
  state.setVoice(voiceResult?.audio_data || null);
  doVoice();
}
