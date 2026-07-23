import { apiRequest } from '../core/api.js';
import { state } from "../../core/state.js";
import { API_URL } from "../core/config.js";
import { logInfo, logError } from "../utils/logger/logger.js";


export async function engineRequest ({endpoint, method, level, intent, tense, language}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      method: method,
      hasEndpoint: !!endpoint,
      hasLevel: !!level,
      hasIntent: !!intent,
      hasTense: !!tense,
      hasLang: !!language
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: {
          level,
          intent,
          tense,
          language
        },
      });
      logInfo(`${endpoint.slice(1)} response shape`, {
        keys: res ? Object.keys(res) : [],
      });
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
      return;
    }
}
