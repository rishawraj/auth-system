import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import "dotenv/config";

export async function sendDisable2FAOtpEmail(to: string, code: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: '"Auth System" <rishawraj0703@gmail.com>',
    to,
    subject: "Disable 2FA OTP Code",
    text: `Your OTP to disable 2FA is: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>Disable 2FA Request</h2>
        <p>You requested to disable two-factor authentication (2FA).</p>
        <p>Your OTP code is:</p>
        <div style="font-size: 24px; font-weight: bold; margin: 12px 0;">
          ${code}
        </div>
        <p>This code will expire in 60 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Disable 2FA OTP email sent: " + info.response);
  } catch (error) {
    console.error("Error sending disable 2FA OTP email:", error);
  }
}
