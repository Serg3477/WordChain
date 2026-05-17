import { state } from "../core/state.js";
import { apiRequest } from "../core/api.js";
import { logInfo, logError } from "../utils/logger/logger.js";

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

export async function ensureGuestSession() {
  let guestToken = localStorage.getItem("guest_token");

  if (guestToken) {
    try {
      const guestUser = await fetchMeByToken(guestToken);
      setActiveUser(guestUser, guestToken);
      return { user: guestUser, token: guestToken };
    } catch (e) {
      logError("Guest token invalid", { error: e.message });
      localStorage.removeItem("guest_token");
      guestToken = null;
    }
  }

  logInfo("Guest create request shape", {
    endpoint: "/guest",
    method: "POST",
    bodyShape: []
  });

  try {
    const data = await apiRequest("/guest", { method: "POST" });
    logInfo("Guest create response shape", {
      keys: data ? Object.keys(data) : [],
      hasAccessToken: !!data?.access_token,
      hasUser: !!data?.user
    });

    guestToken = data.access_token;
    localStorage.setItem("guest_token", guestToken);
    setActiveUser(data.user, guestToken);

    return { user: data.user, token: guestToken };
  } catch (e) {
    logError("Guest create request failed", { error: e.message });
    throw e;
  }
}

export async function initSession() {
  const userToken = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (userToken) {
    try {
      const user = await fetchMeByToken(userToken);
      logInfo("Init user success", { hasUser: !!user });
      setActiveUser(user, userToken);
      return;
    } catch (e) {
      logError("Init user failed", { error: e.message });
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
    logInfo("Logout to guest success");
  } catch (e) {
    logError("Logout to guest failed", { error: e.message });
    throw e;
  }
}