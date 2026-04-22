export const state = {
  // --- USER ---
  user: {
    id: null,
    nickname: null,
    avatar_url: null,
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
    // this.notify("languages");
  },

  // --- HISTORY ---
  history: [],

  addToHistory(word) {
    if (!word) return;
    this.history.push(word);
    // this.notify("history");
  },

  listeners: {},

    on(key, fn) {
        if (!this.listeners[key]) this.listeners[key] = [];
        this.listeners[key].push(fn);
    },

    notify(key) {
        (this.listeners[key] || []).forEach(fn => fn(this[key]));
    }

};



window.state = state;
