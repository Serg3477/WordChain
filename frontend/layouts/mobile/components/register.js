import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { EraseInputButton } from "../../../ui/erase/eraseInputButton.js";
import { state } from "../../../core/state.js";
import { registerUser } from "../../../api/user.js";
import { windowManager } from "../../../core/windowManager.js"
import { logInfo, logError } from "../../../utils/logger/logger.js";




export function renderRegister(state) {
    logInfo("Register screen render start");
    const screen = document.querySelector('[data-screen="register"]');
    logInfo("Register screen node", { found: !!screen });
    if (!screen) {
        logError("Register screen not found");
        return;
    }
    screen.innerHTML = `

        <h3 class="ui-title">Register account</h3>

        <div class = "user-body">
            <!-- EMAIL REGISTRATION FORM -->
            <form class="user-form" name="registration" action="/register">

                <label class="ui-label">Your name</label>
                <input class="input-word" type="text" name="name" required placeholder="or nickname">

                <label class="ui-label">Email</label>
                <input class="input-word" type="email" name="email" required autocomplete="email" placeholder="you@example.com">

                <label class="ui-label">Password</label>
                <input class="input-word" type="password" name="password" required minlength="8" autocomplete="new-password" placeholder="••••••••">

                <label class="ui-label">Confirm Password</label>
                <input class="input-word" type="password" name="passwordConfirmation" required minlength="8" autocomplete="new-password" placeholder="••••••••"><br>

                <label class="ui-checkbox">
                    <input type="checkbox" name="reg-terms" required>
                    <span>I agree to the Terms of Service</span>
                </label><br>

                <div class="register-submit-slot">
                </div>
            </form>

            <!-- DIVIDER -->
            <div class="divider">
                <span>or</span>
            </div>

            <!-- GOOGLE OAUTH -->
            <div class="register-google-slot">  
            </div>

        </div>
        <br>
        <div class="modal-footer">
            <span>Already have an account?</span>
            <a class="ui-user-link" data-action="open-login">Sign In</a>
        </div>
    `;

    const formReg = screen.querySelector('form[name="registration"]');
    logInfo("Register form node", { found: !!formReg });
    if (!formReg) {
        logError("Register form not found");
        return;
    }

    const submitSlot = screen.querySelector(".register-submit-slot");
    const googleSlot = screen.querySelector(".register-google-slot");

    const createAccountBtn = new BaseButton({
        label: "Create account",
        type: "ui-user-btn",
        icon: "🌐",
        action: "click",
        handler: () => {
            logInfo("Register button clicked");
            formReg.requestSubmit() // запускает submit-listener формы
        }
    }).render();

    const googleBtn = new BaseButton({
        label: "Continue with Google",
        type: "ui-user-btn oauth-btn",
        icon: `<img src="./assets/icons/google.png">`,
        action: "click",
        handler: () => {
            logInfo("Register with Google button clicked");
            console.log("Google auth click");
        }
    }).render();

    submitSlot.appendChild(createAccountBtn);
    googleSlot.appendChild(googleBtn);

    formReg.addEventListener("submit", async (event) => {
        logInfo("Register submit fired");
        event.preventDefault();
        if (formReg.password.value != formReg.passwordConfirmation.value) {
            logError("Register validation failed", { reason: "password_mismatch" });
            throw new Error ('Mismatch Password vc Confirm Password');
            return
        }
        if (!formReg.reportValidity()) {
            logError("Register validation failed", { reason: "reportValidity_false" });
            throw new Error ('Lost reportValidity');
            return
        }
        const data = { name: formReg.name.value, email: formReg.email.value, password: formReg.password.value };
        try {
            const res = await registerUser(data);
            localStorage.setItem("token", res.token);
            state.setUser({
                id: res.id,
                nickname: res.nickname,
                avatar_url: res.avatar_url,
                email: res.email,
                token: res.token,
                is_guest: res.is_guest,
                is_premium: res.is_premium
            });
            windowManager.back();
        } catch (e) {
            logError("Register request failed", { error: e.message });
        }
    });
} 


