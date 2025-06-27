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
  handleMe,
} from "../controllers/user.controller.js";
import {
  handleGoogleAuth,
  handleGoogleCallback,
  handleGoogleRefreshToken,
} from "../controllers/google-auth.controller.js";

export default async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

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

  if (req.method === "GET" && pathname === "/me") {
    await handleMe(req, res);
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
