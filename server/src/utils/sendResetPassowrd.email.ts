import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import "dotenv/config";

export async function sendResetPasswordEmail(to: string, link: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: '"Auth System" <rishawraj0703@gmail.com>',
    to: to,
    subject: "Your Password Reset Email",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>Reset your password</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; margin: 12px 0;">
        <a href=${link}> reset your password </a>
        </div>
        <p>This code will expire in 60 minutes.</p>
        <p>If you did not request this ignore this message.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: " + info.response);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}
