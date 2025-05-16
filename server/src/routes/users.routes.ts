import { IncomingMessage, ServerResponse } from "http";
import {
  handleRegister,
  handleLogin,
  handleProfile,
  handleVerify,
  handleForgotPassword,
  handleResetPassword,
  handleTokenRefresh,
  testRefreshToken,
  handleLogout,
} from "../controllers/user.controller.js";
import { send } from "../utils/helpers.js";
import {
  handleGoogleAuth,
  handleGoogleCallback,
  handleGoogleRefreshToken,
} from "../auth/google-auth.js";

export default async (req: IncomingMessage, res: ServerResponse) => {
  // parse url
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/health") {
    send(res, 200, { status: "OK", message: "Server is healthy" });
    return true; // indicate router handled the request
  }

  if (req.method === "POST" && pathname === "/register") {
    await handleRegister(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/login") {
    await handleLogin(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/profile") {
    await handleProfile(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/logout") {
    handleLogout(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/verify") {
    handleVerify(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/forgot-password") {
    handleForgotPassword(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/reset-password") {
    handleResetPassword(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/auth/google") {
    handleGoogleAuth(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/auth/google/callback") {
    handleGoogleCallback(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/auth/google/refresh-token") {
    console.log("google refresh token");
    handleGoogleRefreshToken(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/refresh-token") {
    handleTokenRefresh(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/test-refresh-token") {
    testRefreshToken(req, res);
    return true;
  }

  return false;
};
