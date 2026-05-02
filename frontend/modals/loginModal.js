import { state } from "../core/state.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";
import { CloseButton } from "../ui/buttons/close/closeButton.js";
import { apiRequest } from "../features/api/apiClient.js";



export function createLoginModal() {
    const root =document.createElement("div");
    root.className = "overall-modal reg-login-modal ui-modal";
    

    root.innerHTML = `
        <div class="modal-header ui-modal-header">
            <span class="modal-title ui-modal-title">Sign in</span>
            <div class="ui-modal-btn" data-role="close-btn"></div>
        </div>

        <div class="user-body ui-modal-body">
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
                    </label>

                    <a class="ui-link" data-action="forgot-password">Forgot password?</a>
                </div>

                <button type="submit" class="ui-user-btn">
                    Sign In
                </button>
            </form>

            <div class="divider">
                <span>or</span>
            </div>

            <button class="ui-user-btn oauth-btn" id="google-login">
                <img src="../assets/icons/google.png" class="oauth-icon" alt="Google">
                Continue with Google
            </button>
        </div><br>

        <div class="modal-footer">
            <span>Don't have an account?</span>
            <a class="ui-user-link" data-action="open-register">Create one</a>
        </div>
    `;

    const formLog = root.querySelector('form[name="login"]');
    formLog.addEventListener("submit", async (event) => {
        event.preventDefault();
        const res = await apiRequest('/login', { 
            method: "POST",
            body: {
                email: formLog.email.value,
                password: formLog.password.value,
                remember_me: formLog.remember_me.value
            }
        })

        if (formLog.remember_me) localStorage.setItem("token", res.token)
            else sessionStorage.setItem("token", res.token);
        state.setUser({
            nickname: res.nickname,
            avatar_url: res.avatar_url,
            email: res.email,
            token: res.token,
            is_guest: res.is_guest,
            is_premium: res.is_premium
        });
    });
    

    const closeBtnContainer = root.querySelector('[data-role="close-btn"]');
    const openRegisterLink = root.querySelector('[data-action="open-register"]');

    // ---------------------------
    // КНОПКА ЗАКРЫТИЯ
    // ---------------------------
    const closeBtn = new CloseButton({
        action: "click",
        handler: closeWithScale
    }).render();

    function closeWithScale() {
        root.classList.add("modal-scale-out");
        setTimeout(() => {
        windowManager.close("loginModal");
        }, 350);
    }

    closeBtnContainer.appendChild(closeBtn);

    if (openRegisterLink) {
        openRegisterLink.addEventListener("click", (event) => {
            event.preventDefault();
            windowManager.open("registrationModal");
        });
    }

    // ---------------------------
    // УТИЛИТЫ
    // ---------------------------
    const header = root.querySelector(".modal-header");
    makeDraggable(root, header);
    makeResizable(root);

    return root;
}
