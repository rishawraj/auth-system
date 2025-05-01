import { IncomingMessage, ServerResponse } from "http";
import userRoutes from "./users.routes.ts";
import adminRoutes from "./admin.routes.ts";
import { checkSuperUser } from "../middleware/checkSuperUser.ts";

export default async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith("/admin")) {
    return adminRoutes(req, res);
  } else {
    return userRoutes(req, res);
  }
};
