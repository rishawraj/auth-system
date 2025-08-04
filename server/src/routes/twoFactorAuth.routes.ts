import { IncomingMessage, ServerResponse } from "node:http";
import {
  DisableTwoFactorAuth,
  DisableTwoFactorAuthSendOTP,
  DisableTwoFactorAuthVerifyOTP,
  EnableTwofactorAuth,
  RegenerateBackupCodesEmailUser,
  RegenerateBackupCodesGoogleUser,
  RegenerateBackupCodesSendOTPGoogleUser,
  ValidateBackupCode,
  ValidateTwoFactorAuth,
  VerifyTwoFactorAuth,
} from "../controllers/2FA.controller.js";

export default async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/2fa/enable") {
    console.log("enable lold");
    await EnableTwofactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/verify") {
    await VerifyTwoFactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/disable") {
    await DisableTwoFactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/validate") {
    await ValidateTwoFactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/validate-backup") {
    await ValidateBackupCode(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/disable-2fa-send-otp") {
    console.log("send otp");
    await DisableTwoFactorAuthSendOTP(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/disable-2fa-verify-otp") {
    console.log("verify otp");
    await DisableTwoFactorAuthVerifyOTP(req, res);
    return true;
  }

  if (
    req.method === "POST" &&
    pathname === "/2fa/regenerate-backup-codes-email"
  ) {
    await RegenerateBackupCodesEmailUser(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/send-otp-google-user") {
    console.log("send otp");
    await RegenerateBackupCodesSendOTPGoogleUser(req, res);
    return true;
  }

  if (
    req.method === "POST" &&
    pathname === "/2fa/regenerate-backup-codes-google"
  ) {
    console.log("[ROUTER] regenerate backup codes google");
    await RegenerateBackupCodesGoogleUser(req, res);
    return true;
  }

  return false;
};
