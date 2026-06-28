import { apiRequest } from "../core/api.js";
import { state } from "../core/state.js";
import { logInfo, logError } from "../utils/logger/logger.js";




export async function newSettings ({ endpoint, method, currentSettings }) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: method,
      hasEndpoint: !!endpoint,
      hasId: !!currentSettings.user_id,
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: currentSettings
      });
      logInfo(`${endpoint.slice(1)} response shape`);
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
    }
}


export async function getSettings ({ endpoint, method, user_id }) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: method,
      hasEndpoint: !!endpoint,
      hasId: !!user_id,
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: { user_id },
      });
      logInfo(`${endpoint.slice(1)} response shape`);
      return res;
    } catch (e) {
      logError(`${endpoint.slice(1)} request failed`, { error: e.message });
      throw e;
    }
  
}

export async function updateSettings ({endpoint, method, currentSettings }) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      method: method,
      hasEndpoint: !!endpoint,
      hasUser: !!currentSettings.user_id,
    });

    try {
      const res = await apiRequest(endpoint, {
        method: method,
        body: currentSettings
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

