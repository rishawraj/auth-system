import { IncomingMessage, ServerResponse } from "http";
import { readBody, send } from "../utils/helpers.js";
import {
  getAdminOverviewStats,
  getAllUsers,
  getRecentActivity,
  getUserById,
  softDeleteUser,
  updateUserStatus,
} from "../controllers/admin.controller.js";
import { checkSuperUser } from "../middleware/checkSuperUser.js";

export default async (req: IncomingMessage, res: ServerResponse) => {
  // parse url
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/admin/health") {
    send(res, 200, { status: "OK", message: "Server is healthy" });
    return true; // indicate router handled the request
  }

  // For all other admin routes, check authentication
  const authResult = await checkSuperUser(req);
  if (!authResult.isAuthenticated) {
    console.log(`Authentication failed: ${authResult.message}`);
    send(res, authResult.statusCode, {
      status: "Error",
      message: authResult.message,
    });
    return true;
  }

  const getUserByIdMatch = RegExp(/^\/admin\/users\/([^/]+)$/).exec(pathname);

  // get user by id
  if (req.method === "GET" && getUserByIdMatch) {
    const userId = getUserByIdMatch[1];
    console.log("userId", userId);
    try {
      const user = await getUserById(userId);
      if (user) {
        send(res, 200, {
          status: "OK",
          message: "User fetched successfully",
          data: user,
        });
      } else {
        send(res, 404, {
          status: "Not Found",
          message: "User not found",
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      send(res, 500, {
        status: "Internal Server Error",
        message: "Error fetching user data",
      });
    }
    return true; // Add this line to indicate the route was handled
  }

  // todo prevent deactivation of super user
  if (req.method === "PATCH" && getUserByIdMatch) {
    console.log("spider");
    const userId = getUserByIdMatch[1];

    try {
      const body = (await readBody(req)) as { is_active: boolean };
      const { is_active } = body;

      const updateUser = await updateUserStatus(userId, { is_active });
      if (updateUser) {
        send(res, 200, {
          status: "OK",
          message: `User ${is_active ? "activated" : "blocked"} successfully`,
        });
      } else {
        send(res, 404, { status: "Not Found", message: "User not found" });
      }
    } catch (error) {
      send(res, 500, {
        status: `Error ${error}`,
        message: "Failed to update user status",
      });
    }
    return true;
  }

  // Soft Delete user by id (Set is_deleted to true)
  // todo prevent deletion of super user
  if (req.method === "DELETE" && getUserByIdMatch) {
    const userId = getUserByIdMatch[1];
    try {
      const deletedUser = await softDeleteUser(userId);

      if (deletedUser) {
        send(res, 200, {
          status: "OK",
          message: "User marked as deleted successfully",
        });
      } else {
        send(res, 404, { status: "Not Found", message: "User not found" });
      }
    } catch (error) {
      send(res, 500, {
        status: `Error: ${error}`,
        message: "Failed to delete user",
      });
    }
    return true;
  }

  if (req.method === "GET" && pathname === "/admin/users") {
    const usersList = await getAllUsers();
    send(res, 200, {
      status: "OK",
      message: "Users fetched successfully",
      data: usersList,
    });

    return true; // Add this line to indicate the route was handled
  }

  if (req.method === "GET" && pathname === "/admin/stats/overview") {
    try {
      const stats = await getAdminOverviewStats();

      send(res, 200, {
        status: "OK",
        message: "Admin overview stats fetched successfully",
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);

      send(res, 500, {
        status: "Internal Server Error",
        message: "Failed to fetch admin stats",
      });
    }

    return true;
  }

  if (req.method === "GET" && pathname === "/admin/recent-activity") {
    try {
      const result = await getRecentActivity();

      send(res, 200, {
        status: "OK",
        message: "Recent Activity fetched successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error fetching recent acitvity", error);

      send(res, 500, {
        status: "Internal Server Error",
        message: "Failed to fetch recent activity",
      });
    }
  }

  // if (req.method === "GET" && pathname === "/admin/admin-audit-logs") {}

  return false; // Add this line to indicate no routes matched
};
