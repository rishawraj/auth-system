import { sendResetPasswordEmail } from "../utils/sendResetPassowrd.email.ts";
import { sendVerificationEmail } from "../utils/sendVerification.email.ts";

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
