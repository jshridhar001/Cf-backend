import { sendEmail } from "./send-email.js";

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Verify Your Email</h2>
      <p>Thank you for registering. Please verify your email address to get started:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Verify Email
      </a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    html,
  });
}
