export function normalizePartOfSpeech(value) {
  return String(value ?? "")
    .split("\n")[0]
    .replace(/[^a-zA-Zа-яА-ЯёЁ]/g, " ")
    .trim()
    .toLowerCase();
}
