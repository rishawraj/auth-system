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
  updateProfile,
  handleUpdateEmail,
  handleResendCode,
  handleResendVerifyEmailCode,
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

  if (req.method === "PATCH" && pathname === "/profile") {
    await updateProfile(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/verify-email") {
    await handleUpdateEmail(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/resend-verify-email-code") {
    await handleResendVerifyEmailCode(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/resend-code") {
    await handleResendCode(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/me") {
    await handleMe(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/logout") {
    await handleLogout(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/verify") {
    await handleVerify(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/forgot-password") {
    await handleForgotPassword(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/reset-password") {
    await handleResetPassword(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/auth/google") {
    await handleGoogleAuth(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/auth/google/callback") {
    await handleGoogleCallback(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/auth/google/refresh-token") {
    console.log("google refresh token");
    await handleGoogleRefreshToken(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/refresh-token") {
    await handleTokenRefresh(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/test-refresh-token") {
    await testRefreshToken(req, res);
    return true;
  }

  return false;
};

//todo
// A much cleaner users.routes.ts
// const routes: Record<string, Function> = {
//   "POST:/register": handleRegister,
//   "POST:/login": handleLogin,
//   "GET:/profile": handleProfile,
//   "PATCH:/profile": updateProfile,
//   "POST:/logout": handleLogout, // Make sure all these are actually async in the controller
//   // ... etc
// };

// export default async (req: IncomingMessage, res: ServerResponse) => {
//   const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
//   const routeKey = `${req.method}:${parsedUrl.pathname}`;

//   const handler = routes[routeKey];

//   if (handler) {
//     await handler(req, res);
//     return true; // Handled
//   }

//   return false; // Not handled, falls back to 404 in server.ts
// };
