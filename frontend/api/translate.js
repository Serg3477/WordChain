import { apiRequest } from '../core/api.js';
import { state } from "../../core/state.js";
import { API_URL } from "../core/config.js";
import { logInfo, logError } from "../utils/logger/logger.js";

export async function translateWord({ word, sourceLang, targetLang }) {
  const requestBody = {
    word,
    source_lang: state.sourceLang,
    target_lang: state.targetLang,
  };

  // Форма запроса (что отправляем)
  logInfo("Translate request shape", {
    endpoint: "/translate",
    method: "POST",
    bodyShape: Object.keys(requestBody),
    bodyPreview: requestBody
  });

  try {
    const data = await apiRequest('/translate', {
      method: 'POST',
      body: requestBody,
    });
    console.log("Translate:  ", data);

    // Форма ответа (что получили)
    logInfo("Translate response shape", {
      status: data?.status ?? null,
      keys: data ? Object.keys(data) : [],
      hasTranslation: !!data?.translation,
      hasTranscription: !!data?.transcription,
      hasPartOfSpeech: !!data?.part_of_speech
    });

    if (state.addToHistory) state.addToHistory(word);
    return data;
  } catch (e) {
    logError("Translate request failed", {
      endpoint: "/translate",
      method: "POST",
      error: e.message
    });
    throw e;
  }
}

export async function saveWord(word, result) {
  const requestBody = {
    word,
    translation: result?.translation,
    transcription: result?.transcription,
    part_of_speech: result?.part_of_speech,
  };

  logInfo("SaveWord request shape", {
    endpoint: "/saveWord",
    method: "POST",
    bodyShape: Object.keys(requestBody),
    bodyPreview: requestBody
  });

  try {
    const data = await apiRequest('/saveWord', {
      method: 'POST',
      body: requestBody,
    });
    console.log("Save:  ", data);

    logInfo("SaveWord response shape", {
      status: data?.status ?? null,
      keys: data ? Object.keys(data) : []
    });

    return data;
  } catch (e) {
    logError("SaveWord request failed", {
      endpoint: "/saveWord",
      method: "POST",
      error: e.message
    });
    throw e;
  }
}