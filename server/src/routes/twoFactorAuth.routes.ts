import { IncomingMessage, ServerResponse } from "node:http";
import {
  DisableTwoFactorAuth,
  EnableTwofactorAuth,
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
    console.log("thiss dude");

    VerifyTwoFactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/disable") {
    console.log("dissable");

    DisableTwoFactorAuth(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/2fa/validate") {
    ValidateTwoFactorAuth(req, res);
    return true;
  }

  return false;
};
