import { API_URL } from "../api/config.js";  

export async function ensureGuest() {
  let token = localStorage.getItem("guest_token");
  if (!token) {
    const res = await fetch(`${API_URL}/guest`, { method: "POST" });
    const data = await res.json();
    localStorage.setItem("guest_token", data.access_token);

    console.log("URL:", `${API_URL}/guest`);
    console.log("Status:", res.status);
    console.log("Raw:", await res.text());

  }
}

