import { apiRequest } from "../api/apiClient.js";
import { state } from "../../core/state.js";

export async function registerUser(data) {
    const res = await apiRequest('/register', {
        method: "POST", 
        body: {
            name: data.name,
            email: data.email,
            password: data.password
        }
    })
    return res;
}


