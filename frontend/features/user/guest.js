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




// import { API_URL } from "../api/config.js";  

// export async function ensureGuest() {
//   let token = localStorage.getItem("guest_token");
//   if (!token) {
//     const res = await fetch(`${API_URL}/guest`, { method: "POST" });
//     const data = await res.json();
//     localStorage.setItem("guest_token", data.access_token);
//   }
// }


// import { API_URL } from "../api/config.js";  

// export async function ensureGuest() {
//   console.log("ensureGuest() called");

//   let token = localStorage.getItem("guest_token");
//   console.log("Stored token:", token);

//   if (!token || token === "undefined" || !token.includes(".")) {
//     console.log("Requesting new guest token...");

//     const res = await fetch(`${API_URL}/guest`, { method: "POST" });
//     console.log("Status:", res.status);

//     const text = await res.text();
//     console.log("Raw response:", text);

//     let data;
//     try {
//       data = JSON.parse(text);
//     } catch {
//       console.log("JSON parse failed");
//       return;
//     }

//     console.log("Parsed data:", data);

//     localStorage.setItem("guest_token", data.access_token);
//     console.log("Saved token:", data.access_token);
//   }
// }
