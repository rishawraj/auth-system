import { IncomingMessage, ServerResponse } from "http";
import userRoutes from "./users.routes.js";
import adminRoutes from "./admin.routes.js";
import twoFactorAuthRoutes from "./twoFactorAuth.routes.js";
import { send } from "../utils/helpers.js";

export default async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/health") {
    send(res, 200, { status: "OK", message: "Server is healthy" });
    return true;
  }

  if (pathname.startsWith("/admin")) {
    return adminRoutes(req, res);
  } else if (pathname.startsWith("/2fa")) {
    return twoFactorAuthRoutes(req, res);
  } else {
    return userRoutes(req, res);
  }
};
