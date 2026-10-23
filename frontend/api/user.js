import { apiRequest } from "../core/api.js";
import { logInfo, logError } from "../utils/logger/logger.js";
import {t} from "../shared/i18n/index.js";
import { Notification } from "../ui/notificationModal/notificationModal.js";

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
      detail: e.detail
    });
    throw e;  // Пробрасывает ошибку дальше
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
  const requestBody = data;

  logInfo("Delete account request shape", {
    endpoint: "/delete",
    method: "POST",
    bodyShape: Object.keys(requestBody),
    bodyPreview: { ...requestBody, password: "***" }, // не светим пароль
  });

  try {
    const res = await apiRequest("/delete", {
      method: "DELETE",
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

export async function googleAuthUser({
    credential,
    mode,
    terms_accepted = false
}) {
    const requestBody = {
        credential,
        mode,
        terms_accepted
    };

    logInfo("Google auth request shape", {
        endpoint: "/auth/google",
        method: "POST",
        mode,
        termsAccepted: terms_accepted,
        hasCredential: !!credential
    });

    try {
        const res = await apiRequest("/auth/google", {
            method: "POST",
            body: requestBody
        });

        logInfo("Google auth response shape", {
            keys: res ? Object.keys(res) : [],
            hasToken: !!res?.token,
            hasEmail: !!res?.email
        });

        return res;

    } catch (e) {
        logError("Google auth request failed", {
            error: e.message,
            detail: e.detail
        });

        throw e;
    }
}

export async function forgotPasswordRequest (checkEmail){
     logInfo("Forgot password request shape", {
         endpoint: "/forgot_password",
         method: "POST",
         email: checkEmail,
     });

     try {
         const res = await apiRequest("/forgot_password", {
            method: "POST",
            body: {
                email: checkEmail
            }
         });

         logInfo(`Fetch Email to /forgot_password request success  ${res.message}`);

         return res;
     } catch (e) {
         logError("Fetch Email to /forgot_password request failed", {error: e.message});
     }
}

export async function resetPasswordRequest(token, password, passwordConfirmation) {
    logInfo("Reset password request shape", {
        endpoint: "/reset_password",
        method: "POST",
        hasToken: !!token
    });

    try {
        const res = await apiRequest(
            "/reset_password",
            {
                method: "POST",
                body: {
                    token: token,
                    password: password,
                    password_confirmation: passwordConfirmation
                }
            }
        );

        logInfo("Reset password request success", { res });
        return res;

    } catch (e) {
        logError("Reset password request failed", {error: e.message, detail: e.detail});
        throw e;
    }
}

