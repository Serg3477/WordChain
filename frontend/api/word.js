import { state } from "../core/state.js";
import { apiRequest } from "../core/api.js";
import { logInfo, logError } from "../utils/logger/logger.js";



  // export async function getWord ({ word, user_id }) {
  //   logInfo("get_word request shape", {
  //     endpoint: "/get_word",
  //     method: "POST",
  //     hasToken: !!word
  //   });

  //   try {
  //     const res = await apiRequest("/get_word", {
  //       method: "POST",
  //       body: { word, user_id },
  //     });
  //     logInfo("getWord response shape", {
  //       keys: res ? Object.keys(res) : [],
  //     });
  //     return res;
  //   } catch (e) {
  //     logError("get_word request failed", { error: e.message });
  //     throw e;
  //   }
  // }


export async function wordRequest ({endpoint, word, user_id}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: "POST",
      hasEndpoint: !!endpoint,
      hasWord: !!word,
      hasUser: !!user_id
    });

    try {
      const res = await apiRequest(endpoint, {
        method: "POST",
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

export async function betterTransRequest ({endpoint, word, sourceLang, targetLang}) {

    logInfo(`${endpoint.slice(1)} request shape`, {
      endpoint: endpoint,
      method: "POST",
      hasEndpoint: !!endpoint,
      hasWord: !!word,
    });

    try {
      const res = await apiRequest(endpoint, {
        method: "POST",
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


// export async function getBetterTranslation ({ word, user_id }) {
//   logInfo("get_better request shape", {
//     endpoint: "/get_better",
//     method: "POST",
//     hasToken: !!word
//   });

//   try {
//     const res = await apiRequest("/get_better", {
//       method: "POST",
//       body: { word, user_id },
//     });
//     logInfo("getBetterTranslation response shape", {
//       keys: res ? Object.keys(res) : [],
//     });
//     return res;
//   } catch (e) {
//     logError("get_better request failed", { error: e.message });
//     throw e;
//   }
// }

// export async function getSynonyms ({ word, user_id }) {
//   logInfo("get_synonyms request shape", {
//     endpoint: "/get_synonyms",
//     method: "POST",
//     hasToken: !!word
//   });

//   try {
//     const res = await apiRequest("/get_synonyms", {
//       method: "POST",
//       body: { word, user_id },
//     });
//     logInfo("getSynonyms response shape", {
//       keys: res ? Object.keys(res) : [],
//     });
//     return res;
//   } catch (e) {
//     logError("get_synonyms request failed", { error: e.message });
//     throw e;
//   }
// }

// export async function getAntonyms ({ word, user_id }) {
//   logInfo("get_antonyms request shape", {
//     endpoint: "/get_antonyms",
//     method: "POST",
//     hasToken: !!word
//   });

//   try {
//     const res = await apiRequest("/get_antonyms", {
//       method: "POST",
//       body: { word, user_id },
//     });
//     logInfo("getAntoonyms response shape", {
//       keys: res ? Object.keys(res) : [],
//     });
//     return res;
//   } catch (e) {
//     logError("get_antoonyms request failed", { error: e.message });
//     throw e;
//   }
// }

// export async function getSentences ({ word, user_id }) {
//   logInfo("get_sentences request shape", {
//     endpoint: "/get_sentences",
//     method: "POST",
//     hasToken: !!word
//   });

//   try {
//     const res = await apiRequest("/get_sentences", {
//       method: "POST",
//       body: { word, user_id },
//     });
//     logInfo("getSentences response shape", {
//       keys: res ? Object.keys(res) : [],
//     });
//     return res;
//   } catch (e) {
//     logError("get_sentences request failed", { error: e.message });
//     throw e;
//   }
// }
