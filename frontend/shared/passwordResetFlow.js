// Запрос смены пароля, если забыл

import { resetPasswordModal } from "../ui/resetPassword/resetPassword.js";
import { resetPasswordRequest } from "../api/user.js";
import { Notification } from "../ui/notificationModal/notificationModal.js";
import { logInfo, logError } from "../utils/logger/logger.js";


export async function handlePasswordResetFromUrl() {

    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("reset_token");


    if (!resetToken) {
        return;
    }

    logInfo("Password reset token found in URL");

    const result = await resetPasswordModal();

    // пользователь закрыл модалку
    if (!result) {
        return;
    }

    const { password, passwordConfirmation } = result;

    try {
        const res = await resetPasswordRequest(
            resetToken,
            password,
            passwordConfirmation
        );

        logInfo("Password reset success", { res });
        Notification.show({type: "success", message: "Password changed successfully"});

        // Убираем секретный token из адресной строки.
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    } catch (e) {
        logError(
            "Password reset failed",
            {
                error: e.message,
                detail: e.detail
            }
        );

        if (e.detail === "reset_token_invalid") {
            Notification.show({
                type: "error",
                message: "The reset link is invalid or has expired."
            });
        }
    }
}