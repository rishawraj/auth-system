import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { workerLogger } from "./logger.js";
import "dotenv/config";

export async function sendMagicLinkEmail(to: string, magicLink: string) {
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
    subject: "Your Magic Sign-In Link",
    text: `Sign in to your account by visiting the following link:\n\n${magicLink}\n\nThis link is valid for 15 minutes and can only be used once.\nIf you did not request this email, you can safely ignore it.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; max-width: 560px; margin: 0 auto; background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Sign in to Auth System</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #475569; margin-bottom: 24px;">
          Click the button below to sign in instantly. This magic link is valid for <strong>15 minutes</strong> and can only be used once.
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${magicLink}" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Sign in to your account
          </a>
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-top: 24px; word-break: break-all;">
          Or copy and paste this URL into your browser:<br />
          <a href="${magicLink}" style="color: #2563eb; text-decoration: underline;">${magicLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
          If you did not request this sign-in link, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  workerLogger.info({ recipient: to, response: info.response }, "Magic link email sent");
}
