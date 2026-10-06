import { forgotPasswordRequest } from "../../../../api/user.js";
import { logError, logInfo } from "../../../../utils/logger/logger.js";

import { tipModal } from "../../../../ui/tipModal/tipModal.js";
import { t  } from "../../../../shared/i18n/index.js";
import { Notification } from "../../../../ui/notificationModal/notificationModal.js";
import { askEmailModal } from "../../../../ui/askEmail/askEmail.js";



export async function forgotPassword (enteredEmail, emailInput) {

    const checkEmail = await askEmailModal(enteredEmail);
    if (!checkEmail.trim()) {
        await tipModal({
                text: t("login", "email_required"),
                mode: "error",
                target: emailInput
            });
            return;
    }
    try {
    const res = await forgotPasswordRequest(checkEmail.trim());
    logInfo(`Fetch Email ${checkEmail} success - `, { res });
  } catch (e) {
    logError(`Fetch Email ${checkEmail} failed`, { error: e.message });
    throw e;
  }
}

