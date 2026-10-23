const GOOGLE_CLIENT_ID =
    "742906170821-jd5lbvl5s0u9gdvoaulmjo64rq0507ie.apps.googleusercontent.com";

let googleInitialized = false;

const credentialHandlers = new Map();


function waitForGoogle(timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();

        const check = () => {
            if (window.google?.accounts?.id) {
                resolve();
                return;
            }

            if (Date.now() - startedAt >= timeoutMs) {
                reject(
                    new Error("Google Identity Services not loaded")
                );
                return;
            }

            setTimeout(check, 50);
        };

        check();
    });
}


export async function renderGoogleButton({
    slot,
    flow,
    text = "signin_with",
    locale = "en",
    onCredential
}) {
    if (!slot) {
        throw new Error("Google button slot not found");
    }

    await waitForGoogle();

    // Для каждого экрана храним свой обработчик.
    credentialHandlers.set(flow, onCredential);

    // initialize вызываем только один раз.
    if (!googleInitialized) {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,

            callback: async (response) => {
                const handler =
                    credentialHandlers.get(response.state);

                if (!handler) {
                    console.error(
                        "Google credential handler not found:",
                        response.state
                    );
                    return;
                }

                try {
                    await handler(response);
                } catch (error) {
                    console.error(
                        "Google credential handler failed:",
                        error
                    );
                }
            },

            ux_mode: "popup",
            auto_select: false
        });

        googleInitialized = true;
    }

    slot.innerHTML = "";

    const slotWidth =
        Math.round(slot.getBoundingClientRect().width) || 300;

    const buttonWidth = Math.min(slotWidth, 400);



    window.google.accounts.id.renderButton(
        slot,
        {
            type: "standard",
            theme: "outline",
            size: "large",
            text: text,
            shape: "rectangular",
            logo_alignment: "left",
            width: String(buttonWidth),
            locale: locale,
            state: flow
        }
    );
}

