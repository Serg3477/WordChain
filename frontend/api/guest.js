import { state } from "../core/state.js";
import { apiRequest } from "../core/api.js";
import { logInfo, logError } from "../utils/logger/logger.js";
import { newSettings, getSettings } from "./settings.js";


// 1. Проверяем guest_token в localStorage
// 2. Если есть → проверяем /me
// 3. Если /me OK → грузим настройки
// 4. Если настроек нет → создаём дефолтные
// 5. Если guest_token нет → создаём гостя
// 6. Создаём дефолтные настройки


function setActiveUser(user, token) {
  state.setUser({ ...user, token });
}

async function fetchMeByToken(token) {
  logInfo("Me request shape", {
    endpoint: "/me",
    method: "GET",
    hasToken: !!token
  });

  try {
    const res = await apiRequest("/me", { token });
    logInfo("Me response shape", {
      keys: res ? Object.keys(res) : [],
      isGuest: !!res?.is_guest
    });
    return res;
  } catch (e) {
    logError("Me request failed", { error: e.message });
    throw e;
  }
}

// --- 1. Есть токен гостя → пробуем загрузить ---
export async function ensureGuestSession() {
  let guestToken = localStorage.getItem("guest_token");

  if (guestToken) {
    try {
      const guestUser = await fetchMeByToken(guestToken);
      setActiveUser(guestUser, guestToken);

      // Пытаемся загрузить настройки из БД
      console.log(guestUser.id);
      const settings = await fetchSettings(guestUser.id);

      // Если нет settings в БД - устанавливаем дефолтные
      if (!settings) {
        logInfo("Settings not loaded and set default settings into state  - guest.js function ensureGuestSession")
        settings = await createDefaultSettings(guestUser.id);
      }
      
      // Сохраняем в state
      if (settings) {
        logInfo("Settings loaded and set into state (1) - guest.js function ensureGuestSession");
        state.setLanguages( settings.input_lang, settings.output_lang );
        state.setUserSkill( settings.user_level, settings.text_size, settings.examples_count );
        state.setUserInterface( settings.ui_lang, settings.ui_theme, settings.voice_type );
      }

      return { user: guestUser, token: guestToken };
    } catch (e) {
      logError("Guest token invalid - guest.js function ensureGuestSession", { error: e.message });
      localStorage.removeItem("guest_token");
      guestToken = null;
    }
  }

  // --- 2. Токена нет → создаём нового гостя ---
  logInfo("Create Guest request shape - guest.js function ensureGuestSession", {
    endpoint: "/guest",
    method: "POST",
    bodyShape: []
  });

  try {
    const data = await apiRequest("/guest", { method: "POST" });
    logInfo("Guest create response shape - guest.js function ensureGuestSession", {
      keys: data ? Object.keys(data) : [],
      hasAccessToken: !!data?.access_token,
      hasUser: !!data?.user
    });

    guestToken = data.access_token;
    localStorage.setItem("guest_token", guestToken);
    setActiveUser(data.user, guestToken);

    // Создаём дефолтные настройки для нового гостя
    logInfo("Set default settings into state (1) - guest.js function ensureGuestSession")
    const settingsNew = await createDefaultSettings(data.user.id);
    
    // Сохраняем в state
    if (settingsNew) {
      logInfo("Settings loaded for new guest and set into state - guest.js function ensureGuestSession");
      state.setLanguages(settingsNew.input_lang, settingsNew.output_lang);
      state.setUserSkill( settingsNew.user_level, settingsNew.text_size, settingsNew.examples_count ) ;
      state.setUserInterface( settingsNew.ui_lang, settingsNew.ui_theme, settingsNew.voice_type );
    }
    
    return { user: data.user, token: guestToken };
  } catch (e) {
    logError("Guest create request failed - guest.js function ensureGuestSession", { error: e.message });
    return null;
    throw e;
  }
}

export async function initSession() {
  const userToken = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (userToken) {
    try {
      const user = await fetchMeByToken(userToken);
      logInfo("Init user success - guest.js function initSession", { hasUser: !!user });
      setActiveUser(user, userToken);
      return;
    } catch (e) {
      logError("Init user failed - guest.js function initSession", { error: e.message });
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  }
  await ensureGuestSession();
}

export async function logoutToGuest() {
  try {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    await ensureGuestSession();
    logInfo("Logout to guest success - guest.js function logoutToGuest");
  } catch (e) {
    logError("Logout to guest failed - guest.js function logoutToGuest", { error: e.message });
    throw e;
  }
}

// получение settings гостя из БД по user_id
async function fetchSettings(user_id) {
  logInfo("Fetch settings request shape - guest.js function fetchSettings", {
    endpoint: "/get_settings",
    method: "POST",
    user_id
  });

  try {
    const res = await getSettings({
      endpoint: "/get_settings", 
      method: "POST",
      user_id
    });
    logInfo("Settings loaded - guest.js function fetchSettings", { keys: Object.keys(res || {}) });
    return res;
  } catch (e) {
    logError("Fetch settings failed - guest.js function fetchSettings", { error: e.message });
    return null;
  }
}

// создание дефолтных настроек нового гостя по user_id
async function createDefaultSettings(user_id) {
  logInfo("Create default settings request shape - guest.js function createDefaultSettings", {
    endpoint: "/new_settings",
    method: "POST",
    user_id
  });

  try {
    const res = await newSettings({
      endpoint: "/new_settings", 
      method: "POST",
      currentSettings: { user_id: user_id }
    });
    logInfo("Default settings created", { keys: Object.keys(res || {}) });
    return res;
  } catch (e) {
    logError("Create default settings failed - guest.js function createDefaultSettings", { error: e.message });
    return null;
  }
}


