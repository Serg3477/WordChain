import { t } from "../../shared/i18n/index.js";
import { tipModal } from "../tipModal/tipModal.js";


let modalEl = null;


export function resetPasswordModal() {
    // console.log("1. resetPassword ENTER");
    return new Promise((resolve) => {
        // console.log("2. Promise executor");

        if (modalEl) {
            modalEl.remove();
        }

        modalEl = document.createElement("div");
        modalEl.className = "reset-overlay";

        // console.log("3. modal created", modalEl);

        modalEl.innerHTML = `
            <div class="reset-window">
                <div class="reset-title">
                    ${t("login", "reset_title")}
                </div>
                <div class="reset-content">
                    <div class="reset-text">
                        ${t("login", "reset_text")}
                    </div>
                    <input
                        class="reset-input-placeholder"
                        type="password"
                        autocomplete="off"
                        placeholder="••••••••"
                    >
                    <div class="reset-text">
                        ${t("login", "reset_confirm_text")}
                    </div>
                    <input
                        class="reset-confirm-placeholder"
                        type="password"
                        autocomplete="off"
                        placeholder="••••••••"
                    >
                    <br>
                    <div class="reset-buttons">
                        <button
                            type="button"
                            class="reset-btn reset-ok">
                            ${t("login", "reset_confirm_button")}
                        </button>
                        <button
                            type="button"
                            class="reset-btn reset-cancel">
                            ${t("login", "ask_cancel_button")}
                        </button>
                    </div>
                </div>    
            </div>
        `;

        document.body.appendChild(modalEl);

        // console.log("4. modal appended");
        // console.log("IN DOM:", document.body.contains(modalEl));
        // console.log(
        //     "STYLE:",
        //     getComputedStyle(modalEl).position,
        //     getComputedStyle(modalEl).display,
        //     getComputedStyle(modalEl).visibility,
        //     getComputedStyle(modalEl).opacity,
        //     getComputedStyle(modalEl).zIndex
        // );
        // console.log("RECT:",  modalEl.getBoundingClientRect());

        const input =
            modalEl.querySelector(".reset-input-placeholder");
        const confirm =
            modalEl.querySelector(".reset-confirm-placeholder");


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

        modalEl.querySelector(".reset-ok").onclick = async () => {
            if (!input.value) {
                await tipModal({
                    text: t("login", "password_required"),
                    mode: "error",
                    target: input
                });
            }
            if (!confirm.value) {
                await tipModal({
                    text: t("register", "confirm_password_required"),
                    mode: "error",
                    target: confirm
                });
            }
            if (input.value !== confirm.value) {
                await tipModal({
                    text: t("register", "notification_mismatch"),
                    mode: "error",
                    target: confirm
                });
            }
            const password = input.value.trim();
            const passwordConfirmation = confirm.value.trim();
            closeModal();
            resolve({
                password,
                passwordConfirmation
            });
        };

        modalEl.querySelector(".reset-cancel").onclick = () => {
            closeModal();
            resolve(null);
        }

        // modalEl.addEventListener("click", (e) => {
        //     if (e.target === modalEl) {
        //         closeModal();
        //         resolve(null);
        //     }
        // });
    });
}


