import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { parseDevice } from "./deviceParser.js";
import "dotenv/config";

export async function sendNewDeviceLoginEmail(
  to: string,
  ip: string,
  userAgent: string,
  time: string
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_APP_PASSWORD,
    },
  });

  const { browser, os, device } = parseDevice(userAgent);

  const mailOptions = {
    from: '"Auth System" <rishawraj0703@gmail.com>',
    to: to,
    subject: "Security Alert: New device sign-in",
    text: `We noticed a new sign-in to your account from a new device.\n\nBrowser: ${browser}\nOS: ${os}\nDevice: ${device}\nIP Address: ${ip}\nTime: ${new Date(time).toLocaleString()}\n\nIf this was you, you can ignore this email. If this wasn't you, please reset your password and revoke the session immediately.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 16px; max-width: 600px; margin: 0 auto;">
        <h2>Security Alert: New device sign-in</h2>
        <p>We noticed a new sign-in to your account from an unrecognized device.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Browser:</strong> ${browser}</p>
          <p style="margin: 4px 0;"><strong>OS:</strong> ${os}</p>
          <p style="margin: 4px 0;"><strong>Device:</strong> ${device}</p>
          <p style="margin: 4px 0;"><strong>IP Address:</strong> ${ip}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${new Date(time).toLocaleString()}</p>
        </div>
        <p>If this was you, you can safely ignore this email.</p>
        <p>If you don't recognize this activity, please reset your password and revoke the session from your dashboard immediately.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("New device login email sent: " + info.response);
}
