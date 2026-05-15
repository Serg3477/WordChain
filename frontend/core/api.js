import { API_URL } from "./config.js";
import { state } from "./state.js";

export async function apiRequest(endpoint, { method = 'GET', body, token } = {}) {
  // Используем переданный токен или ищем в state
  const authToken = token ?? state.user?.token;
  const url = `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}
