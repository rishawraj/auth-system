import { IncomingMessage, ServerResponse } from "http";
import { send } from "../utils/helpers.js";
import {
  handleGetAdminLogs,
  handleGetAdminOverviewStats,
  handleGetPaginatedUsers,
  handleGetRecentActivity,
  handleGetUserActiveSessions,
  handleRevokeUserSessions,
  handleSoftDeleteUser,
  handleUpdateUserStatus,
  SuperUser,
} from "../controllers/admin.controller.js";
import { checkSuperUser } from "../middleware/checkSuperUser.js";

export default async (
  req: IncomingMessage & { user?: SuperUser },
  res: ServerResponse
) => {
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/admin/health") {
    send(res, 200, { status: "OK", message: "Server is healthy" });
    return true;
  }

  // SuperUser authentication check for all /admin/* endpoints
  const authResult = await checkSuperUser(req);
  if (!authResult.isAuthenticated) {
    send(res, authResult.statusCode, {
      status: "Error",
      message: authResult.message,
    });
    return true;
  }

  if (req.method === "GET" && pathname === "/admin/stats/overview") {
    await handleGetAdminOverviewStats(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/admin/recent-activity") {
    await handleGetRecentActivity(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/admin/paginated-users") {
    await handleGetPaginatedUsers(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/admin/admin-audit-logs") {
    await handleGetAdminLogs(req, res);
    return true;
  }

  if (
    req.method === "GET" &&
    /^\/admin\/users\/[^/]+\/sessions$/.test(pathname)
  ) {
    await handleGetUserActiveSessions(req, res);
    return true;
  }

  if (
    req.method === "POST" &&
    /^\/admin\/users\/[^/]+\/revoke-sessions$/.test(pathname)
  ) {
    await handleRevokeUserSessions(req, res);
    return true;
  }

  if (req.method === "PATCH" && /^\/admin\/users\/[^/]+$/.test(pathname)) {
    await handleUpdateUserStatus(req, res);
    return true;
  }

  if (req.method === "DELETE" && /^\/admin\/users\/[^/]+$/.test(pathname)) {
    await handleSoftDeleteUser(req, res);
    return true;
  }

  return false;
};
