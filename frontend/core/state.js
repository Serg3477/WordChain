export const state = {
  // --- USER ---
  user: {
    id: null,
    nickname: null,
    avatar_url: null,
    email: null,
    is_guest: true,
    is_premium: false,
    token: null
  },

  setUser(user) {
    this.user = { ...this.user, ...user };
    this.notify("user");
  },

  // --- LANGUAGES ---
  sourceLang: "en",
  targetLang: "ru",

  setLanguages(src, tgt) {
    this.sourceLang = src;
    this.targetLang = tgt;
    this.notify("languages");
  },

  // --- WORD --- 
  // Полное UI-состояние слова. Для API обновления payload собирается отдельно через helper ниже.
  currentWord: {
    "id": "",
    "user_id": "",
    "word": "",
    "translation": "",
    "transcription": "",
    "part_of_speech": "",
    "translation_json": {
      "definite_translation": [],
      "plural": "-",
      "verb_forms": [],
      "passive_form": "-",
      "phrasal_verbs": []
    },
    "examples": [],
    "synonyms": [],
    "antonyms": []
  },
  setField(key, value) {
    this.currentWord[key] = value;
  },

  // Строгий payload для /update_word: только поля, которые сервер реально ожидает.
  getCurrentWordUpdatePayload(currentWord = this.currentWord) {
    const {
      id,
      user_id,
      translation,
      translation_json,
      part_of_speech,
      transcription,
      examples,
      synonyms,
      antonyms
    } = currentWord;

    return {
      id,
      user_id,
      translation,
      translation_json,
      part_of_speech,
      transcription,
      examples,
      synonyms,
      antonyms
    };
  },

  // --- HISTORY ---
  history: [],

  addToHistory(word) {
    if (!word) return;
    const i = this.history.indexOf(word);
    if (i !== -1) this.history.splice(i, 1);
    this.history.unshift(word);
    this.notify("history");
  },

  // --- OLD LISTENERS (per-key) ---
  listeners: {},

  on(key, fn) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(fn);
  },

  notify(key) {
    (this.listeners[key] || []).forEach(fn => fn(this[key]));
  }
};

// ===============================
// NEW GLOBAL REACTIVE SYSTEM
// ===============================

let globalListeners = [];

export function subscribe(fn) {
  globalListeners.push(fn);
}

export function setState(patch) {
  let changed = false;

  for (const key of Object.keys(patch)) {
    if (state[key] !== patch[key]) {
      changed = true;
      state[key] = patch[key];
    }
  }

  if (changed) {
    globalListeners.forEach(fn => fn(state));
  }
}

window.state = state;
