import { windowManager } from "../../../core/windowManager.js";
import { state } from "../../../core/state.js";
import { wordRequest, betterTransRequest, wordUpdateRequest } from "../../../api/word.js"
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { translateWord } from "../../../api/translate.js";
import { createScrollButtonsArea } from "../../../ui/scrollButtonsArea/scrollButtonsArea.js"





function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function renderList(value) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value.length ? value.map(v => String(v).trim()).join(", ") : "";
  }
  return String(value);
}

function renderSentences(value) {
  if (!value) return "";
  let arr;
  if (Array.isArray(value)) {
    arr = value.map(s => String(s).trim()).filter(Boolean);
  } else {
    // если пришла строка — разбиваем по переносам или по запятым как fallback
    if (value.includes("\n")) {
      arr = value.split("\n").map(s => s.trim()).filter(Boolean);
    } else {
      arr = String(value).split(/(?:\.\s+)|(?:,)|(?:\n)/).map(s => s.trim()).filter(Boolean);
    }
  }
  // возвращаем HTML с <br> между предложениями, экранируя содержимое
  return arr.map(s => escapeHtml(s)).join("<br>");
}

export async function renderWord(state, word) {
  logInfo("Word screen render start");

  const screen = document.querySelector('[data-screen="word"]');
  logInfo("Word screen node", { found: !!screen });

  if (!screen) {
    logError("Word screen not found");
    return;
  }

  const LANGUAGE_LABELS = {
    en: "English",
    ru: "Russian",
    uk: "Ukrainian",
    de: "German",
    fr: "French",
    es: "Spanish",
    it: "Italian",
    pl: "Polish"
  };

  function getLanguageLabel(langCode) {
    if (!langCode) return "Target language";
    return LANGUAGE_LABELS[langCode] ?? String(langCode).toUpperCase();
  }
  const targetLanguageLabel = getLanguageLabel(state.targetLang);

  let result;
  logInfo("Word request from the base");

  if (!word) {
    logInfo("Word request aborted: no word in the base");
    return;
  }

  try {
    logInfo("Word request start", {
      endpoint: "/get_word",
      method: "POST",
      word: word,
      user_id: state.user.id,
    });

    result = await wordRequest({
      endpoint: "/get_word",
      method: "POST",
      word,
      user_id: state.user.id,
    });
    state.setField('user_id', state.user.id);
    state.setField('word', result.word);
    state.setField('translation', result.translation);
    state.setField('transcription', result.transcription);
    state.setField('part_of_speech', result.part_of_speech);
    state.setField('translation_json', result.translation_json);
    state.setField('synonyms', result.synonyms);
    state.setField('antonyms', result.antonyms);
    state.setField('examples', result.examples);


  } catch (e) {
    logError("Word request failed in UI", { error: e.message });
    return;
  }

  const translationText = result?.translation ?? "";
  const transcriptionText = result?.transcription ?? "";
  const posText = result?.part_of_speech ?? "";
  // const synonymsText = renderList(result?.synonyms);
  // const antonymsText = renderList(result?.antonyms);
  // const examplesHtml = renderSentences(result?.examples);
 

  screen.innerHTML = `
    <div class="word-screen">

        <!-- WORD FIELD -->
        <div class="result-item">
          <div class="result-label">Translation of:</div>
          <div class="result-value result-value-strong">${escapeHtml(word ?? "")}</div>
        </div><br>

        <!-- TRANSLATION FIELD -->
        <div class="result-item">
          <div class="result-label">Translation: ${escapeHtml(targetLanguageLabel)}:</div>
          <div class="result-value result-value-strong">${escapeHtml(translationText)}</div>
        </div><br>

        <!-- TRANSCRIPTION FIELD -->
        <div class="result-item">
          <div class="result-label">Transcription:</div>
          <div class="result-value">${escapeHtml(transcriptionText)}</div>
        </div><br>

        <!-- PART OF SPEECH FIELD -->
        <div class="result-item">
          <div class="result-label">Part of speech:</div>
          <div class="result-value">${escapeHtml(posText)}</div>
        </div><br>

        <!-- SYNONYMS FIELD -->
        <div class="result-item">
          <div class="result-label-synonyms hidden">Synonyms:</div>
          <div class="result-value result-value-synonyms"></div>
        </div><br>

        <!-- ANTONYMS FIELD -->
        <div class="result-item">
          <div class="result-label-antonyms hidden">Antonyms:</div>
          <div class="result-value result-value-antonyms"></div>
        </div><br>

        <!-- SENTENCES FIELD -->
        <div class="result-item">
          <div class="result-label-sentences hidden">Sentences:</div>
          <div class="result-value result-value-examples"></div>
        </div><br>

        <!-- BETTER TRANSLATION FIELD -->
        <div class="result-item">
          <div class="result-label-better-translation hidden">Better translation:</div>
          <div class="result-value result-value-better-translation"></div>
        </div><br>
    </div>
  `;

  // Добавление BOTTOM NAVBAR
  const area = createScrollButtonsArea({ id: "global-scroll-buttons-area" });
  area.mount();

  const saveBtn = new BaseButton({
    label: "Save",
    type: "word-nav-btn ui-btn",
    icon: "💾",
    action: "click",
    handler: async () => {
      try {
        const result = await wordUpdateRequest({
          endpoint: "/update_word",
          method: "PUT",
          currentWord: state.currentWord
        });
        logInfo("Update Word success", { result });

      } catch (e) {
        logError("Update Word failed", { error: e.message });
      }
    }
  }).render();


  const betterTransBtn = new BaseButton({
    label: "Better translation",
    type: "word-nav-btn ui-btn",
    icon: `<img src="/assets/icons/Fire.png" alt="◀">`,
    action: "click",
    handler: async () => {
      try {
        const result = await betterTransRequest({
          endpoint: "/get_better_translation",
          method: "POST",
          word,
          sourceLang: "en",
          targetLang: "ru"
        });
        resultBetterTrans(result);
        state.setField('translation_json', result.translation_json);

      } catch (e) {
        logError("Better translation failed", { error: e.message });
      }
    }
  }).render();

  //  Функция рендера result.teranslation_json (Better Translaion)
  function resultBetterTrans(result) {
    const container = document.querySelector('.result-value-better-translation');
        container.innerHTML = '';

        // helper: create label + item pair
        function makeLabel(text) {
          const label = document.createElement('label');
          label.classList.add('result-label');
          label.textContent = text;
          return label;
        }
        function makeItem(text) {
          const div = document.createElement('div');
          div.classList.add('result-item');
          div.textContent = text;
          return div;
        }

        // safety: ensure translation_json exists
        const tj = result && result.translation_json ? result.translation_json : {
          definite_translation: [],
          plural: '-',
          verb_forms: [],
          passive_form: '-',
          phrasal_verbs: []
        };

        // 1) Translations by POS
        if (Array.isArray(tj.definite_translation) && tj.definite_translation.length) {
          container.appendChild(makeLabel('Translation by parts of speech:'));
          const ul = document.createElement('ul');
          for (const part of tj.definite_translation) {
            const li = document.createElement('li');
            li.textContent = part;
            ul.appendChild(li);
          }
          container.appendChild(ul);
        }

        // 2) Plural
        if (tj.plural && tj.plural !== '-') {
          container.appendChild(makeLabel('Plural form:'));
          container.appendChild(makeItem(tj.plural));
        }

        // 3) Verb forms
        if (Array.isArray(tj.verb_forms) && tj.verb_forms.length) {
          container.appendChild(makeLabel('Verb forms:'));
          // render as comma-separated or as list
          container.appendChild(makeItem(tj.verb_forms.join(', ')));
        }

        // 4) Passive form
        if (tj.passive_form && tj.passive_form !== '-') {
          container.appendChild(makeLabel('Passive form:'));
          container.appendChild(makeItem(tj.passive_form));
        }

        // 5) Phrasal verbs
        if (Array.isArray(tj.phrasal_verbs) && tj.phrasal_verbs.length) {
          container.appendChild(makeLabel('Phrasal verbs:'));
          const ul2 = document.createElement('ul');
          for (const pv of tj.phrasal_verbs) {
            const li = document.createElement('li');
            li.textContent = pv;
            ul2.appendChild(li);
          }
          container.appendChild(ul2);
        }

        state.setField('translation_json', result.translation_json);

        if (
          result?.translation_json &&
          (
            (Array.isArray(result.translation_json.definite_translation) && result.translation_json.definite_translation.length) ||
            (Array.isArray(result.translation_json.verb_forms) && result.translation_json.verb_forms.length) ||
            (Array.isArray(result.translation_json.phrasal_verbs) && result.translation_json.phrasal_verbs.length) ||
            (result.translation_json.plural && result.translation_json.plural !== '-') ||
            (result.translation_json.passive_form && result.translation_json.passive_form !== '-')
          )
        ) {
          document.querySelector('.result-label-better-translation')?.classList.remove('hidden');
        }

        state.setField('translation_json', result.translation_json);
  }

  // Рендер result.translation_json, если есть в БД
  resultBetterTrans(result);

  const synonymsBtn = new BaseButton({
    label: "Synonyms",
    type: "word-nav-btn ui-btn",
    icon: `<img src="/assets/icons/Link.png" alt="💾">`,
    action: "click",
    handler: async () => {
      
      try {
        const res = await wordRequest({
          endpoint: "/get_synonyms",
          method: "POST",
          word,
          user_id: state.user.id,
        });
        const list = Array.isArray(res.synonyms) ? res.synonyms : (res.synonyms ? String(res.synonyms).split(",").map(s => s.trim()) : []);
        document.querySelector('.result-value-synonyms').textContent = list.join(", ");
        document.querySelector('.result-label-synonyms').classList.remove('hidden');

        state.setField('synonyms', res.synonyms);

      } catch (e) {
        logError("Synonyms fetch failed", { error: e.message });
      }
    }
  }).render();

  // Рендер result.synonyms, если есть в БД
  const listSynonyms = Array.isArray(result.synonyms) ? result.synonyms : (result.synonyms ? String(result.synonyms).split(",").map(s => s.trim()) : []);
  document.querySelector('.result-value-synonyms').textContent = listSynonyms.join(", ");
  if(result.synonyms.length > 0) document.querySelector('.result-label-synonyms').classList.remove('hidden');

  const antonymsBtn = new BaseButton({
    label: "Antonyms",
    type: "word-nav-btn ui-btn",
    icon: `<img src="/assets/icons/Exchange.png" alt="🌐">`,
    action: "click",
    handler: async () => {
      
      try {
        const res = await wordRequest({
          endpoint: "/get_antonyms",
          method: "POST",
          word,
          user_id: state.user.id,
        });
        const list = Array.isArray(res.antonyms) ? res.antonyms : (res.antonyms ? String(res.antonyms).split(",").map(s => s.trim()) : []);
        document.querySelector('.result-value-antonyms').textContent = list.join(", ");
        document.querySelector('.result-label-antonyms').classList.remove('hidden');

        state.setField('antonyms', res.antonyms);

      } catch (e) {
        logError("Antonyms fetch failed", { error: e.message });
      }
    }
  }).render();

  // Рендер result.antonyms, если есть в БД
  const listAntonyms = Array.isArray(result.antonyms) ? result.antonyms : (result.antonyms ? String(result.antonyms).split(",").map(s => s.trim()) : []);
  document.querySelector('.result-value-antonyms').textContent = listAntonyms.join(", ");
  if (result.antonyms.length > 0) document.querySelector('.result-label-antonyms').classList.remove('hidden');

  const sentencesBtn = new BaseButton({
    label: "Sentences",
    type: "word-nav-btn ui-btn",
    icon: `<img src="/assets/icons/List.png" alt="🌐">`,
    action: "click",
    handler: async() => {
      try {
        const res = await wordRequest({
          endpoint: "/get_sentences",
          method: "POST",
          word,
          user_id: state.user.id,
        });
        resultSentences(res); 
        state.setField('examples', res.examples);
        
      } catch (e) {
        logError("Sentences fetch failed", { error: e.message });
      }
    }
  }).render();

  //  Функция рендера result.examples (sentences)
  function resultSentences(word) {
    if (!word.examples.length > 0) return
    const container = document.querySelector('.result-value-examples');
        container.innerHTML = ''; // очистить

        const ul = document.createElement('ul');
        for (const item of (word.examples || [])) {
          const li = document.createElement('li');
          li.textContent = String(item).trim();
          ul.appendChild(li);
        }
        container.appendChild(ul);
        document.querySelector('.result-label-sentences').classList.remove('hidden');

        state.setField('examples', word.examples);
  }
  // Рендер result.examples, если есть в БД
  resultSentences(result);

  // Добавление кнопок в BOTTOM NAVBAR
  area.trackEl.innerHTML = ""; // очистить перед добавлением (идемпотентно)
  area.addButton(saveBtn);
  area.addButton(betterTransBtn);
  area.addButton(synonymsBtn);
  area.addButton(antonymsBtn);
  area.addButton(sentencesBtn);

  
}
