import { API_URL } from "../../core/config.js";
import { apiRequest } from '../../core/api.js';


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
