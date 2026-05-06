// import { API_URL } from "../api/config.js";
// import { state } from "../../core/state.js";
// import { apiRequest } from "../api/apiClient.js";

// export async function initGuest() {
//   let token = localStorage.getItem("guest_token");

//   // Если токена нет — создаём гостя
//   if (!token) {
//     const data = await apiRequest('/guest', { method: "POST" });

//     token = data.access_token;
//     localStorage.setItem("guest_token", token);

//     state.setUser({
//       ...data.user,
//       token
//     });

//     return;
//   }

//   // Если токен есть — пытаемся получить данные пользователя
//   const res = await apiRequest('/me', { token: token });
 

//   if (res.status === 200) {
//     const user = await res.json();
//     state.setUser({
//       ...user,
//       token
//     });
//   } else {
//     // Токен просрочен → создаём нового гостя
//     localStorage.removeItem("guest_token");
//     return initGuest();
//   }
// }


import { state } from "../../core/state.js";
import { apiRequest } from "../api/apiClient.js";


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
      const guestUser = await fetchMeByToken(guestToken);
      setActiveUser(guestUser, guestToken);
      return { user: guestUser, token: guestToken };
    } catch (e) {
      // guest_token битый/просрочен/пользователь удален -> создаем нового гостя
      localStorage.removeItem("guest_token");
      guestToken = null;
    }
  }

  const data = await apiRequest("/guest", { method: "POST" });
  guestToken = data.access_token; // как в твоем /guest
  localStorage.setItem("guest_token", guestToken);

  setActiveUser(data.user, guestToken);
  return { user: data.user, token: guestToken };
}

// Главная инициализация при старте приложения
export async function initSession() {
  const userToken = localStorage.getItem("token") || sessionStorage.getItem("token"); // токен зарегистрированного юзера

  if (userToken) {
    try {
      const user = await fetchMeByToken(userToken);
      setActiveUser(user, userToken);
      return;
    } catch (e) {
      // пользовательский токен невалиден -> удаляем и падаем в гостя
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  }

  // fallback на гостевую сессию
  await ensureGuestSession();
}

// Выход из зарегистрированного аккаунта -> возврат в того же гостя
export async function logoutToGuest() {
  localStorage.removeItem("token");
  await ensureGuestSession();
}
