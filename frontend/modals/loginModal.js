import { state } from "../../core/state.js";
import { windowManager } from "../core/windowManager.js";
import { makeDraggable } from "./utils/drag.js";
import { makeResizable } from "./utils/resize.js";
import { CloseButton } from "../ui/buttons/close/closeButton.js";



export function createLoginModal() {
    const root =document.createElement("div");
    root.className = "overall-modal ui-modal";

    root.innerHTML = `
        <div class="modal-header ui-modal-header">
            <span class="modal-title ui-modal-title">Sign in</span>
            <div class="ui-modal-btn" data-role="close-btn"></div>
        </div>

        <div class="user-body ui-modal-body">
            <!-- EMAIL LOGIN FORM -->
            <form class="user-form">
                <label class="ui-label" for="login-email">Email</label>
                <input class="input-word" type="email" id="login-email" placeholder="you@example.com">

                <label class="ui-label" for="login-pass">Password</label>
                <input class="input-word" type="password" id="login-pass" placeholder="••••••••">

                <div class="login-row">
                    <label class="ui-checkbox">
                        <input type="checkbox" id="remember-me">
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
