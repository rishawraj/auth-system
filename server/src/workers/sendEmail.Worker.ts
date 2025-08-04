import { sendDisable2FAOtpEmail } from "../utils/sendDisable2FA.email.js";
import { sendRegenerate2FABackupCodesOTPEmail } from "../utils/sendRegenerate2FAOTP.email.js";
import { sendResetPasswordEmail } from "../utils/sendResetPassowrd.email.js";
import { sendVerificationEmail } from "../utils/sendVerification.email.js";

export async function sendVerificationEmailWorker(email: string, code: string) {
  try {
    await sendVerificationEmail(email, code);
    console.log("Worker: Verification Email sent");
  } catch (error) {
    console.error("Worker: Failed to send email", error);
  }
}

export async function sendResetPasswordEmailWorker(
  email: string,
  link: string
) {
  try {
    await sendResetPasswordEmail(email, link);
    console.log("Worker: Reset Password email sent");
  } catch (error) {
    console.error("Worker: Failed to send email", error);
  }
}

export async function sendDisable2FAOtpEmailWorker(
  email: string,
  code: string
) {
  try {
    await sendDisable2FAOtpEmail(email, code);
    console.log("Worker: Verification Email sent");
  } catch (error) {
    console.error("Worker: Failed to send email", error);
  }
}

export async function sendRegenerate2FABackupCodesOTPEmailWorker(
  email: string,
  code: string
) {
  try {
    await sendRegenerate2FABackupCodesOTPEmail(email, code);
  } catch (error) {
    console.error("Worker: Failed to send email", error);
  }
}
