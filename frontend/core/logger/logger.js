import { API_URL } from "../../features/api/config.js";
import { apiRequest } from '../../features/api/apiClient.js';


export function logInfo(message, data = {}) {
    sendLog("INFO", message, data);
}

export function logError(message, data = {}) {
    sendLog("ERROR", message, data);
}

async function sendLog(level, message, data) {
    try {
        await apiRequest('/frontend-log', {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: {
                level,
                message,
                data,
                timestamp: new Date().toISOString()
            }
        });
    } catch(e) {logError("Translation request failed", { error: e.message });};
}
