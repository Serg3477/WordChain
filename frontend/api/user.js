import { apiRequest } from "../core/api.js";
import { logInfo, logError } from "../utils/logger/logger.js";

export async function registerUser(data) {
  const requestBody = {
    name: data.name,
    email: data.email,
    password: data.password,
  };

  logInfo("Register request shape", {
    endpoint: "/register",
    method: "POST",
    bodyShape: Object.keys(requestBody),
    bodyPreview: { ...requestBody, password: "***" }, // не светим пароль
  });

  try {
    const res = await apiRequest("/register", {
      method: "POST",
      body: requestBody,
    });
    console.log("Register:  ", res);

    logInfo("Register response shape", {
      status: res?.status ?? null,
      keys: res ? Object.keys(res) : [],
      hasToken: !!res?.token,
      hasEmail: !!res?.email,
      hasNickname: !!res?.nickname,
    });

    return res;
  } catch (e) {
    logError("Register request failed", {
      endpoint: "/register",
      method: "POST",
      error: e.message,
    });
    throw e;
  }
}


export async function loginUser(data) {
  const requestBody = {
    email: data.email,
    password: data.password,
    remember_me: data.remember_me
  };

  logInfo("Login request shape", {
    endpoint: "/login",
    method: "POST",
    bodyShape: Object.keys(requestBody),
    bodyPreview: { ...requestBody, password: "***" }, // не светим пароль
  });

  try {
    const res = await apiRequest("/login", {
      method: "POST",
      body: requestBody,
    });
    console.log("Login:  ", res);

    logInfo("Login response shape", {
      status: res?.status ?? null,
      keys: res ? Object.keys(res) : [],
      hasToken: !!res?.token,
      hasEmail: !!res?.email,
      hasNickname: !!res?.nickname,
    });

    return res;
  } catch (e) {
    logError("Login request failed", {
      endpoint: "/login",
      method: "POST",
      error: e.message,
    });
    throw e;
  }
}

export async function deleteUser(data) {
  const requestBody = {
    email: data.email
  };

  logInfo("Delete account request shape", {
    endpoint: "/delete",
    method: "POST",
    bodyShape: Object.keys(requestBody),
    bodyPreview: { ...requestBody, password: "***" }, // не светим пароль
  });

  try {
    const res = await apiRequest("/delete", {
      method: "POST",
      body: requestBody,
    });
    console.log("Login:  ", res);

    logInfo("Delete account response shape", {
      status: res?.status ?? null,
      keys: res ? Object.keys(res) : [],
    });

    return res;
  } catch (e) {
    logError("Delete account request failed", {
      endpoint: "/delete",
      method: "POST",
      error: e.message,
    });
    throw e;
  }
}
