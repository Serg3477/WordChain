import {logError, logInfo} from "../utils/logger/logger.js";
import {apiRequest} from "../core/api.js";
import {state} from "../core/state.js";


export async function sentenceQuizRequest () {

    try {
      const res = await apiRequest("/quiz_sentence", {
        method: "POST",
        body: {
            level: state.userSkill.level,
            source_lang: state.sourceLang,
        },
      });
      logInfo("Sentence Quiz response shape", {
          status: res?.status ?? null,
          keys: res ? Object.keys(res) : [],
          hasSentence: !!res?.sentence,
          hasAnswers: !!res?.answers,
        });
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
    }
}


