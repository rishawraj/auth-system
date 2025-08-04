import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import "dotenv/config";

export async function sendRegenerate2FABackupCodesOTPEmail(
  to: string,
  code: string
) {
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
    subject: "Regenerate 2FA Backup Codes - OTP Code",
    text: `Your OTP to regenerate 2FA backup codes is: ${code}. WARNING: This action will invalidate all existing backup codes. This OTP expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>Regenerate 2FA Backup Codes Request</h2>
        <p>You have requested to regenerate your two-factor authentication (2FA) backup codes.</p>
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 12px 0;">
          <strong>Warning:</strong> This action will invalidate all your existing backup codes. Make sure you have access to your authenticator app before proceeding.
        </div>
        <p>Your OTP code is:</p>
        <div style="font-size: 24px; font-weight: bold; margin: 12px 0; padding: 12px; background-color: #f8f9fa; border-radius: 4px; text-align: center;">
          ${code}
        </div>
        <p style="color: #dc3545;"><strong>This code will expire in 10 minutes.</strong></p>
        <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">If you did not request this, please change your password immediately and contact support.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Regenerate 2FA backup codes OTP email sent: " + info.response);
  } catch (error) {
    console.error(
      "Error sending regenerate 2FA backup codes OTP email:",
      error
    );
  }
}
