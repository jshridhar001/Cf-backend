import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (process.env.DISABLE_AUTH_EMAILS === "true") {
    console.log(`[email skipped] to=${to} subject=${subject}`);
    return { success: true as const, messageId: "disabled" };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Bhatti Agritech" <no-reply@example.com>',
      to,
      subject,
      html,
    });
    return { success: true as const, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error instanceof Error ? error : new Error("Failed to send email");
  }
}
