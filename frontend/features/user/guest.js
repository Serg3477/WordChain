import { API_URL } from "../api/config.js";
import { state } from "../../core/state.js";

export async function initGuest() {
  let token = localStorage.getItem("guest_token");

  // Если токена нет — создаём гостя
  if (!token) {
    const res = await fetch(`${API_URL}/guest`, { method: "POST" });
    const data = await res.json();

    token = data.access_token;
    localStorage.setItem("guest_token", token);

    state.setUser({
      ...data.user,
      token
    });

    return;
  }

  // Если токен есть — пытаемся получить данные пользователя
  const res = await fetch(`${API_URL}/me`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  if (res.status === 200) {
    const user = await res.json();
    state.setUser({
      ...user,
      token
    });
  } else {
    // Токен просрочен → создаём нового гостя
    localStorage.removeItem("guest_token");
    return initGuest();
  }
}


