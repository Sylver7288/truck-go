import { logger } from "./logger";

const RESEND_API_URL = "https://api.resend.com/emails";

type VerificationEmailInput = {
  to: string;
  name: string;
  verifyUrl: string;
};

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "TruckGo <onboarding@resend.dev>";
}

export async function sendVerificationEmail({ to, name, verifyUrl }: VerificationEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn({ to, verifyUrl }, "RESEND_API_KEY is not set; verification email was not sent");
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to,
      subject: "Verify your TruckGo email",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h1 style="font-size:22px;margin-bottom:12px">Verify your TruckGo email</h1>
          <p>Hi ${name},</p>
          <p>Confirm this email address to finish setting up your TruckGo account.</p>
          <p><a href="${verifyUrl}" style="display:inline-block;background:#f48525;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Verify email</a></p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>This link expires in 24 hours.</p>
        </div>
      `,
      text: `Hi ${name},\n\nConfirm this email address to finish setting up your TruckGo account.\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, "Failed to send verification email with Resend");
    throw new Error("Verification email could not be sent");
  }
}
