import { apiRequest } from "../core/api.js";
import { state } from "../core/state.js";
import { logInfo, logError } from "../utils/logger/logger.js";


export async function textRequest ({endpoint, method, set_id, text_size, level, words}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: method,
      hasWords: !!words,
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: { 
            set_id: set_id,
            user_id: state.user.id,
            source_lang: state.sourceLang,
            target_lang: state.targetLang,
            text_size: state.userSkill.text_size,
            level: state.userSkill.level,
            words: words 
        },
      });
      logInfo(`${endpoint.slice(1)} response shape`, res);
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
    }
  
}
