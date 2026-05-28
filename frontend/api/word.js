import { state } from "../core/state.js";
import { apiRequest } from "../core/api.js";
import { logInfo, logError } from "../utils/logger/logger.js";


export async function wordRequest ({endpoint, method, word, user_id}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: method,
      hasEndpoint: !!endpoint,
      hasWord: !!word,
      hasUser: !!user_id
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: { word, user_id },
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

export async function betterTransRequest ({endpoint, method, word, sourceLang, targetLang}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: method,
      hasEndpoint: !!endpoint,
      hasWord: !!word,
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: { 
          word, 
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
      const res = await apiRequest(endpoint, {
        method: method,
        body: currentWord,
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