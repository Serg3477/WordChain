import { apiRequest } from '../core/api.js';
import { state } from "../../core/state.js";
import { logInfo, logError } from "../utils/logger/logger.js";


export async function voiceWord(word, sourceLang, context) {

    logInfo("'/get_voice' request shape", {
      endpoint: '/get_voice',
      method: 'POST',
      hastext: !!word,
      hasSourceLang: !!sourceLang,
      hasContext: !!context,
    });
    try {
      const voice = await apiRequest('/get_voice', {
        method: 'POST',
        body: {
          word: word,
          source_lang: sourceLang,
          context: context
        }
      });
    logInfo(`'/get_voice' response shape`);
      return voice;
    } catch (e) {
      logError(`'/get_voice' request failed`, { error: e.message });
      throw e;
    }
    console.log("Get voice: OK ");
  }
