import { apiRequest } from '../api/apiClient.js';  // Добавить импорт

export async function translateWord({ word, sourceLang, targetLang }) {

  const data = await apiRequest('/translate', {
    method: 'POST',
    body: {
      word,
      source_lang: state.sourceLang,
      target_lang: state.targetLang,
    },
  });

  // Сохраняем в state
  state.addToHistory(word);

  console.log('Data:', data);
  return data;
}

export async function saveWord(word, result) {
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
}