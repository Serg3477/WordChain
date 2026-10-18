import os
from dotenv import load_dotenv
import resend


load_dotenv()

api_key = os.getenv("RESEND_API_KEY")

print(
    "RESEND_API_KEY:",
    "loaded" if api_key else "NOT LOADED",
    f"prefix={api_key[:3]!r}" if api_key else "",
    f"length={len(api_key)}" if api_key else "",
)

resend.api_key = api_key

RESEND_FROM = os.getenv(
    "RESEND_FROM",
    "WordChain <onboarding@resend.dev>",
)


async def send_password_reset_email(
    to_email: str,
    reset_url: str,
) -> None:

    params: resend.Emails.SendParams = {
        "from": RESEND_FROM,
        "to": [to_email],
        "subject": "Reset your WordChain password",
        "html": f"""
            <h2>Reset your WordChain password</h2>

            <p>
                We received a request to reset your password.
            </p>

            <p>
                <a href="{reset_url}">
                    Reset password
                </a>
            </p>

            <p>
                This link is valid for 15 minutes.
            </p>

            <p>
                If you did not request a password reset,
                you can ignore this email.
            </p>
        """,
        "text": (
            "We received a request to reset your WordChain password.\n\n"
            f"Reset password:\n{reset_url}\n\n"
            "This link is valid for 15 minutes.\n\n"
            "If you did not request a password reset, "
            "you can ignore this email."
        ),
    }

    await resend.Emails.send_async(params)

