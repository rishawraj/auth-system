import { sendVerificationEmail } from "../utils/sendEmail.ts";

export async function sendEmailWorker(email: string, code: string) {
  try {
    await sendVerificationEmail(email, code);
    console.log("Worker: Email sent");
  } catch (error) {
    console.error("Worker: Failed to send email", error);
  }
}
