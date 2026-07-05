const LANGUAGE_LABELS = {
  en: "English",
  ru: "Russian",
  uk: "Ukrainian",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pl: "Polish",
};

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

export function getLanguageLabel(langCode) {
  if (!langCode) return "Target language";
  return LANGUAGE_LABELS[langCode] ?? String(langCode).toUpperCase();
}

export function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(",").map((s) => s.trim()).filter(Boolean);
}
