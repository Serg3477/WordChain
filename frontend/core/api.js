import { API_URL } from "./config.js";
import { state } from "./state.js";

export async function apiRequest(endpoint, { method, body, token } = {}) {
  // Используем переданный токен или ищем в state
  const authToken = token ?? state.user?.token;
  const url = `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });


 if (!res.ok) {
    let data = {};

    try {
        data = await res.json();
    } catch {
        // backend вернул не JSON
    }

    console.error("API ERROR:", res.status, data);

    const error = new Error(
        data.detail
            ? JSON.stringify(data.detail)
            : `API error ${res.status}`
    );

    error.status = res.status;
    error.detail = data.detail;

    throw error;
}

  return res.json();
}

