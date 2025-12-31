import { API_URL } from "../api/config.js"; 

export async function translateWord({ word, sourceLang, targetLang }) {
  const token = localStorage.getItem("guest_token");

  console.log("URL:", `${API_URL}/translate`);

  const res = await fetch(`${API_URL}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    },
    body: JSON.stringify({
      word,
      source_lang: sourceLang,
      target_lang: targetLang
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

  console.log("Data:", data);

  return data;
}
