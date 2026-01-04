import { API_URL } from "../api/config.js";  

export async function ensureGuest() {
  let token = localStorage.getItem("guest_token");
  if (!token) {
    const res = await fetch(`${API_URL}/guest`, { method: "POST" });
    const data = await res.json();
    localStorage.setItem("guest_token", data.access_token);
  }
}


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
