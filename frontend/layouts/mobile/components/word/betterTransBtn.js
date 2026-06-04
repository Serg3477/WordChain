import { betterTransRequest } from "../../../../api/word.js";
import { BaseButton } from "../../../../ui/baseButton/baseButton.js";
import { logError } from "../../../../utils/logger/logger.js";

const EMPTY_TRANSLATION_JSON = {
  definite_translation: [],
  plural: "-",
  verb_forms: [],
  passive_form: "-",
  phrasal_verbs: [],
};

function makeLabel(text) {
  const label = document.createElement("label");
  label.classList.add("result-label");
  label.textContent = text;
  return label;
}

function makeItem(text) {
  const div = document.createElement("div");
  div.classList.add("result-item");
  div.textContent = text;
  return div;
}

function hasBetterTranslationContent(translationJson) {
  return (
    (Array.isArray(translationJson.definite_translation) && translationJson.definite_translation.length) ||
    (Array.isArray(translationJson.verb_forms) && translationJson.verb_forms.length) ||
    (Array.isArray(translationJson.phrasal_verbs) && translationJson.phrasal_verbs.length) ||
    (translationJson.plural && translationJson.plural !== "-") ||
    (translationJson.passive_form && translationJson.passive_form !== "-")
  );
}

export function resultBetterTrans(result, appState) {
  const container = document.querySelector(".result-value-better-translation");
  if (!container) return;

  container.innerHTML = "";

  const tj = result?.translation_json ?? EMPTY_TRANSLATION_JSON;

  if (Array.isArray(tj.definite_translation) && tj.definite_translation.length) {
    container.appendChild(makeLabel("Translation by parts of speech:"));
    const ul = document.createElement("ul");
    for (const part of tj.definite_translation) {
      const li = document.createElement("li");
      li.textContent = part;
      ul.appendChild(li);
    }
    container.appendChild(ul);
  }

  if (tj.plural && tj.plural !== "-") {
    container.appendChild(makeLabel("Plural form:"));
    container.appendChild(makeItem(tj.plural));
  }

  if (Array.isArray(tj.verb_forms) && tj.verb_forms.length) {
    container.appendChild(makeLabel("Verb forms:"));
    container.appendChild(makeItem(tj.verb_forms.join(", ")));
  }

  if (tj.passive_form && tj.passive_form !== "-") {
    container.appendChild(makeLabel("Passive form:"));
    container.appendChild(makeItem(tj.passive_form));
  }

  if (Array.isArray(tj.phrasal_verbs) && tj.phrasal_verbs.length) {
    container.appendChild(makeLabel("Phrasal verbs:"));
    const ul = document.createElement("ul");
    for (const pv of tj.phrasal_verbs) {
      const li = document.createElement("li");
      li.textContent = pv;
      ul.appendChild(li);
    }
    container.appendChild(ul);
  }

  if (result?.translation_json && hasBetterTranslationContent(result.translation_json)) {
    document.querySelector(".result-label-better-translation")?.classList.remove("hidden");
  }

  if (result?.translation_json) {
    appState.setField("translation_json", result.translation_json);
  }
}

export function createBetterTransBtn(appState, id) {
  return new BaseButton({
    label: "Better translation",
    type: "word-nav-btn ui-btn",
    icon: `<img src="/assets/icons/Fire.png" alt="◀">`,
    action: "click",
    handler: async () => {
      try {
        const result = await betterTransRequest({
          endpoint: "/get_better_translation",
          method: "POST",
          id,
          user_id: appState.user.id,
          sourceLang: appState.sourceLang,
          targetLang: appState.targetLang,
        });
        resultBetterTrans(result, appState);
      } catch (e) {
        logError("Better translation failed", { error: e.message });
      }
    },
  }).render();
}
