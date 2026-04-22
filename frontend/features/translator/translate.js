import { API_URL } from "../api/config.js";
import { state } from "../../core/state.js";

export async function translateWord({ word, sourceLang, targetLang }) {
  const token = state.user.token;

  console.log("URL:", `${API_URL}/translate`);

  const res = await fetch(`${API_URL}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    },
    body: JSON.stringify({
      word,
      source_lang: state.sourceLang,
      target_lang: state.targetLang
    })
  });

  console.log("Status:", res.status);

  let data;
  try {
    data = await res.json();
  } catch (e) {
    const raw = await res.text();
    console.log("Raw response:", raw);
    throw e;
  }

  // сохраняем в state
  state.addToHistory(word);

  console.log("Data:", data);

  return data;
}

export async function saveWord(word, result) {
  const token = state.user.token;

  console.log("URL:", `${API_URL}/saveWord`);

  const res = await fetch(`${API_URL}/saveWord`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    },
    body: JSON.stringify({
      word,
      translation: result.translation,
      part_of_speech: result.part_of_speech,
      examples: result.examples
    })
  });
}
