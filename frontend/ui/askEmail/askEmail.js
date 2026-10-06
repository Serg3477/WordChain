import { t } from "../../shared/i18n/index.js";
import { tipModal } from "../tipModal/tipModal.js";


let modalEl = null;


export function askEmailModal(email = "") {
    return new Promise((resolve) => {

        if (modalEl) {
            modalEl.remove();
        }

        modalEl = document.createElement("div");
        modalEl.className = "ask-overlay";

        modalEl.innerHTML = `
            <div class="ask-window">
                <div class="ask-title">
                    ${t("login", "ask_email_title")}
                </div>
                <div class="ask-content">
                    <div class="ask-text">
                        ${t("login", "ask_email_text")}
                    </div>
                    <input
                        class="ask-input-placeholder"
                        type="email"
                        placeholder="${t("login", "ask_email_placeholder")}"
                    >
                    <div class="ask-buttons">
                        <button
                            type="button"
                            class="ask-btn ask-yes">
                            ${t("login", "ask_ok_button")}
                        </button>
                        <button
                            type="button"
                            class="ask-btn ask-cancel">
                            ${t("login", "ask_cancel_button")}
                        </button>
                    </div>
                </div>    
            </div>
        `;

        document.body.appendChild(modalEl);

        const input =
            modalEl.querySelector(".ask-input-placeholder");

        // безопаснее, чем вставлять email прямо в HTML value=
        input.value = email || "";


        function closeModal() {
            if (!modalEl) return;

            const el = modalEl;
            modalEl = null;

            el.classList.add("hide");

            setTimeout(() => {
                if (el.parentNode) {
                    el.remove();
                }
            }, 200);
        }

        modalEl.querySelector(".ask-yes").onclick = async () => {
            if (input.value) {
                const value = input.value.trim();
                closeModal();
                resolve(value);
            } else {
                await tipModal({
                    text: t("login", "email_required"),
                    mode: "error",
                    target: input
                });
            }
        };

        modalEl.querySelector(".ask-cancel").onclick = () => {
            closeModal();
            resolve(null);
        }

    });
}