import { BaseButton } from "../../../ui/baseButton/baseButton.js";
import { EraseInputButton } from "../../../ui/erase/eraseInputButton.js";
import { state } from "../../../core/state.js";
import { registerUser } from "../../../api/user.js";
import { windowManager } from "../../../core/windowManager.js"
import { logInfo, logError } from "../../../utils/logger/logger.js";
import { apiRequest } from "../../../core/api.js";
import { loginUser } from "../../../api/user.js";



export function renderLogin(state) {
    logInfo("Login screen render start");
    const screen = document.querySelector('[data-screen="login"]');
    logInfo("Login screen node", { found: !!screen });
    if (!screen) {
        logError("Login screen not found");
        return;
    }
    screen.innerHTML = `
   
        <h3 class="ui-title">Sign in</h3>
            
        <div class="user-body">
            <!-- EMAIL LOGIN FORM -->
            <form class="user-form" name="login">
                <label class="ui-label" for="login-email">Email</label>
                <input class="input-word" type="email" name="email" required placeholder="you@example.com">

                <label class="ui-label" for="login-pass">Password</label>
                <input class="input-word" type="password" name="password" required placeholder="••••••••">

                <div class="login-row">
                    <label class="ui-checkbox">
                        <input type="checkbox" name="remember_me">
                        <span>Remember me</span>
                    </label><br>

                    <a class="ui-user-link" data-action="forgot-password">Forgot password?</a>
                </div>

                <div class="login-submit-slot">

                </div>
            </form>

            <div class="divider">
                <span>or</span>
            </div>

            <div class="login-google-slot">
        
            </div>
        </div><br>

        <div class="modal-footer">
            <span>Don't have an account?</span>
            <a class="ui-user-link" data-action="open-register">Create one</a>
        </div>
    `;


    const formLog = screen.querySelector('form[name="login"]');
    logInfo("Login form node", { found: !!formLog });
    if (!formLog) {
        logError("Login form not found");
        return;
    }

    const submitSlot = screen.querySelector(".login-submit-slot");
    const googleSlot = screen.querySelector(".login-google-slot");

    const loginAccountBtn = new BaseButton({
        label: "Sign In",
        type: "ui-user-btn",
        icon: "",
        action: "click",
        handler: () => {
            logInfo("Login button clicked");
            formLog.requestSubmit() // запускает submit-listener формы
        }
    }).render();

    const googleBtn = new BaseButton({
        label: "Continue with Google",
        type: "ui-user-btn oauth-btn",
        icon: `<img src="./assets/icons/google.png">`,
        action: "click",
        handler: () => {
            logInfo("Login with Google button clicked");
            console.log("Google auth click");
        }
    }).render();

    submitSlot.appendChild(loginAccountBtn);
    googleSlot.appendChild(googleBtn);

    formLog.addEventListener("submit", async (event) => {
        logInfo("Login submit fired");
        event.preventDefault();
        if (!formLog.reportValidity()) {
            logError("Login validation failed", { reason: "reportValidity_false" });
            throw new Error ('Lost reportValidity');
            return
        }
        const data = { email: formLog.email.value, password: formLog.password.value, remember_me: formLog.remember_me.checked };
        try {
            const res = await loginUser(data);
        
            if (formLog.remember_me.checked) localStorage.setItem("token", res.token)
            else sessionStorage.setItem("token", res.token);
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
            logError("Login request failed", { error: e.message });
        };
    });
}
