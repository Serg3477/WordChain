import { state } from "../../core/state.js";
import { apiRequest } from "../core/api.js";
import { logInfo, logError } from "../utils/logger/logger.js";


function setActiveUser(user, token) {
  state.setUser({
    ...user,
    token,
  });
}

async function fetchMeByToken(token) {
  return apiRequest("/me", { token });
}

// Создать/восстановить гостя (guest_token живет постоянно)
export async function ensureGuestSession() {
  let guestToken = localStorage.getItem("guest_token");

  if (guestToken) {
    try {
      logInfo("Guest token exists");
      const guestUser = await fetchMeByToken(guestToken);
      if (guestUser) logInfo("Check guest user");
      setActiveUser(guestUser, guestToken);
      logInfo("Guest user defined {user}")
      return { user: guestUser, token: guestToken };
    } catch (e) {
      // guest_token битый/просрочен/пользователь удален -> создаем нового гостя
      logError("Guest user undefined.");
      localStorage.removeItem("guest_token");
      guestToken = null;
    }
  }

  try {
    const data = await apiRequest("/guest", { method: "POST" });
    guestToken = data.access_token; // как в твоем /guest
    logInfo("Guest create request sent", { status: data.status });
    localStorage.setItem("guest_token", guestToken);

    setActiveUser(data.user, guestToken);
    return { user: data.user, token: guestToken };
  } catch (e) {
    logError("Guest create request failed", { error: e.message });
  }
}

// Главная инициализация при старте приложения
export async function initSession() {
  const userToken = localStorage.getItem("token") || sessionStorage.getItem("token"); // токен зарегистрированного юзера

  if (userToken) {
    try {
      const user = await fetchMeByToken(userToken);
      logInfo("Init user success", { user });
      setActiveUser(user, userToken);
      return;
    } catch (e) {
      // пользовательский токен невалиден -> удаляем и падаем в гостя
      logError("Init user failed", { error: e.message });
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  }

  // fallback на гостевую сессию
  await ensureGuestSession();
}

// Выход из зарегистрированного аккаунта -> возврат в того же гостя
export async function logoutToGuest() {
  try {
    localStorage.removeItem("token");
    await ensureGuestSession();
    logInfo("Log out success");
  } catch (e) {
    logError("Guest request failed", { error: e.message });
  }
}

