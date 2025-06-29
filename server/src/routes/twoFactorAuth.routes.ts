import { IncomingMessage, ServerResponse } from "node:http";
import {
  DisableTwoFactorAuth,
  DisableTwoFactorAuthSendOTP,
  DisableTwoFactorAuthVerifyOTP,
  EnableTwofactorAuth,
  ValidateBackupCode,
  ValidateTwoFactorAuth,
  VerifyTwoFactorAuth,
} from "../controllers/2FA.controller.js";

export default async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/2fa/enable") {
    EnableTwofactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/verify") {
    VerifyTwoFactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/disable") {
    DisableTwoFactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/validate") {
    ValidateTwoFactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/validate-backup") {
    ValidateBackupCode(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/disable-2fa-send-otp") {
    DisableTwoFactorAuthSendOTP(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/disable-2fa-verify-otp") {
    DisableTwoFactorAuthVerifyOTP(req, res);
    return true;
  }

  return false;
};
