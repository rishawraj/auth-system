import { sendDisable2FAOtpEmail } from "./sendDisable2FA.email.js";
import { sendExistingAccountEmail } from "./sendExistingAccountNotice.email.js";
import { sendRegenerate2FABackupCodesOTPEmail } from "./sendRegenerate2FAOTP.email.js";
import { sendResetPasswordEmail } from "./sendResetPassowrd.email.js";
import { sendVerificationEmail } from "./sendVerification.email.js";
import { sendNewDeviceLoginEmail } from "./sendNewDeviceLogin.email.js";
import { sendMagicLinkEmail } from "./sendMagicLink.email.js";

export async function dispatchEmail(
  template: string,
  to: string,
  payload: Record<string, unknown>
) {
  switch (template) {
    case "verification_code":
      return sendVerificationEmail(to, payload.code as string);

    case "reset_password":
      return sendResetPasswordEmail(to, payload.resetLink as string);

    case "disable_2fa_otp":
      return sendDisable2FAOtpEmail(to, payload.code as string);

    case "regenerate_2fa_backup_codes_otp":
      return sendRegenerate2FABackupCodesOTPEmail(to, payload.code as string);

    case "existing_account_notice":
      return sendExistingAccountEmail(to);

    case "new_device_login":
      return sendNewDeviceLoginEmail(
        to,
        payload.ip as string,
        payload.userAgent as string,
        payload.time as string
      );

    case "magic_link":
      return sendMagicLinkEmail(to, payload.magicLink as string);

    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}
