import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import "dotenv/config";

export async function sendVerificationEmail(to: string, code: string) {
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
    subject: "Your Verification Code",
    text: `Your verification code is: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; margin: 12px 0;">
          ${code}
        </div>
        <p>This code will expire in 60 minutes.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent: " + info.response);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}
