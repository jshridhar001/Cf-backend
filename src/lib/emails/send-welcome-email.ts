import { sendEmail } from "./send-email.js";

type User = {
  name: string;
  email: string;
};

export async function sendWelcomeEmail(user: User) {
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const signInUrl = `${clientOrigin}/auth/login`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome, ${user.name}!</h2>
      <p>We're thrilled to have you on board. Your account has been successfully created.</p>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
        <p style="margin: 0 0 5px 0;">Email: ${user.email}</p>
      </div>

      <p style="font-size: 14px; color: #666;">
        <em>Security Notice: If this is a temporary password, please log in and change it immediately. Never share your password with anyone.</em>
      </p>

      <a href="${signInUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Sign In to Your Account
      </a>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Welcome to Bhatti Agritech, ${user.name}!`,
    html,
  });
}
