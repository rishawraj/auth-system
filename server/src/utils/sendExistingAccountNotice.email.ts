import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { workerLogger } from "./logger.js";
import "dotenv/config";

export async function sendExistingAccountEmail(to: string) {
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
    subject: "Account Already Exists",
    text: `An account with this email address already exists.

If you created this account before, you can sign in using your existing credentials.

If you forgot your password, you can reset it from the password reset page.

If you did not try to create an account, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 16px; line-height: 1.6;">
        <h2>Account Already Exists</h2>

        <p>
          An account with this email address already exists.
        </p>

        <p>
          If you created this account before, you can sign in using your
          existing credentials.
        </p>

        <p>
          If you forgot your password, you can reset it from the
          password reset page.
        </p>

        <p>
          If you did not try to create an account, you can safely ignore
          this email.
        </p>

        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          This is an automated message from Auth System.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  workerLogger.info({ recipient: to, response: info.response }, "Existing account email sent");
}
