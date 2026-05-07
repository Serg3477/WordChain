import { apiRequest } from '../api/apiClient.js';
import { state } from "../../core/state.js";
import { API_URL } from "../api/config.js";
import { logInfo, logError } from "../../core/logger/logger.js";


export async function translateWord({ word, sourceLang, targetLang }) {

  try {
    const data = await apiRequest('/translate', {
      method: 'POST',
      body: {
        word,
        source_lang: state.sourceLang,
        target_lang: state.targetLang,
      },
    });
    logInfo("Translation request sent", { status: data.status });
    // Сохраняем в state
      state.addToHistory(word);

      console.log('Data:', data);
      return data;

  } catch (e) {
    logError("Translation request failed", { error: e.message });
  }
}

export async function saveWord(word, result) {
  try {
    console.log('URL:', `${API_URL}/saveWord`);

    return await apiRequest('/saveWord', {
      method: 'POST',
      body: {
        word,
        translation: result.translation,
        transcription: result.transcription,
        part_of_speech: result.part_of_speech,
      },
    });
    logInfo("SaveWord request sent", { status: data.status });
  } catch (e) {
    logError("SaveWord request failed", { error: e.message });
  }
}
