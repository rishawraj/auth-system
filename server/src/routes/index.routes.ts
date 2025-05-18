import { IncomingMessage, ServerResponse } from "http";
import userRoutes from "./users.routes.js";
import adminRoutes from "./admin.routes.js";

export default async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith("/admin")) {
    return adminRoutes(req, res);
  } else {
    return userRoutes(req, res);
  }
};
