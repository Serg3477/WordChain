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
  currentWord: {
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

  // --- HISTORY ---
  history: [],

  addToHistory(word) {
    if (!word) return;
    this.history.push(word);
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
  Object.assign(state, patch);
  globalListeners.forEach(fn => fn(state));
}

window.state = state;
