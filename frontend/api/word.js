import { apiRequest } from "../core/api.js";
import { state } from "../core/state.js";
import { logInfo, logError } from "../utils/logger/logger.js";


export async function wordRequest ({endpoint, method, id, user_id}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: method,
      hasEndpoint: !!endpoint,
      hasId: !!id,
      hasUser: !!user_id
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: { id, user_id },
      });
      logInfo(`${endpoint.slice(1)} response shape`, {
        keys: res ? Object.keys(res) : [],
      });
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
    }
  
}

export async function betterTransRequest ({endpoint, method, id, user_id, sourceLang, targetLang}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: method,
      hasEndpoint: !!endpoint,
      hasId: !!id,
      hasUser: !!user_id,
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: { 
          id,
          user_id,
          source_lang: sourceLang, 
          target_lang: targetLang 
        },
      });
      logInfo(`${endpoint.slice(1)} response shape`, {
        keys: res ? Object.keys(res) : [],
      });
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
    }
  
}


export async function wordUpdateRequest ({endpoint, method, currentWord}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      method: method,
      hasEndpoint: !!endpoint,
      hasCurrentWord: !!currentWord,
    });

    try {
      const requestBody = state.getCurrentWordUpdatePayload
        ? state.getCurrentWordUpdatePayload(currentWord)
        : {
            id: currentWord?.id,
            user_id: currentWord?.user_id,
            translation: currentWord?.translation,
            translation_json: currentWord?.translation_json,
            part_of_speech: currentWord?.part_of_speech,
            transcription: currentWord?.transcription,
            examples: currentWord?.examples,
            synonyms: currentWord?.synonyms,
            antonyms: currentWord?.antonyms,
          };

      const res = await apiRequest(endpoint, {
        method: method,
        body: requestBody,
      });
      logInfo(`${endpoint.slice(1)} response shape`, {
        keys: res ? Object.keys(res) : [],
      });
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
    }
  
}

export async function wordDeleteRequest ({endpoint, method, id, user_id, word}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      method: method,
      hasEndpoint: !!endpoint,
      hasCurrentWord: !!word,
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: { 
          id: id,
          user_id: user_id,
          word: word
        },
      });
      logInfo(`${endpoint.slice(1)} response shape`, {
        keys: res ? Object.keys(res) : [],
      });
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
    }
  
}
