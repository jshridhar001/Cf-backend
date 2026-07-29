import { sendEmail } from "./send-email.js";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Reset Password
      </a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Reset your password",
    html,
  });
}
