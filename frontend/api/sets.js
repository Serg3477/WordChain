import { apiRequest } from '../core/api.js';
import { state } from "../../core/state.js";
import { API_URL } from "../core/config.js";
import { logInfo, logError } from "../utils/logger/logger.js";


export async function getSets() {

  try {
    const response = await apiRequest('/get_sets', {
      method: 'POST',
      body: {
        name: state.user.nickname,
      },
    });
    logInfo(`Get sets of ${state.user.nickname} request sent`, { status: response.status });
    
    return {
      sets: response.sets ?? [],
      unassigned_words: response.unassigned_words ?? [],
    };

  } catch (e) {
    logError(`Get sets of ${state.user.nickname} request failed`, { error: e.message });
    return {
      sets: [],
      unassigned_words: []
    } 
  }
}

export async function getWordsFromSet(set) {

  try {
    const wordIds = Array.isArray(set?.word_ids) ? set.word_ids : [];
    const response = await apiRequest('/get_words', {
      method: "POST",
      body: {word_ids: wordIds},
    })
  logInfo(`Get words from ${set.name} request sent`, { status: response.status });
    
      return response.word_list ?? [];

  } catch (e) {
    logError(`Get words from ${set.name} request failed`, { error: e.message });
    return [];
  } 

}