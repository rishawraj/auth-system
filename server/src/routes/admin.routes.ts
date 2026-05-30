import { IncomingMessage, ServerResponse } from "http";
import { readBody, send } from "../utils/helpers.js";
import {
  getAdminLogs,
  getAdminOverviewStats,
  getAllUsers,
  getPaginatedUsers,
  getRecentActivity,
  getUserById,
  logAdminActions,
  softDeleteUser,
  updateUserStatus,
} from "../controllers/admin.controller.js";
import { checkSuperUser } from "../middleware/checkSuperUser.js";

// import { setTimeout } from "timers/promises";

interface SuperUser {
  id: string;
  email: string;
  is_super_user: boolean;
}

export default async (
  req: IncomingMessage & { user?: SuperUser },
  res: ServerResponse
) => {
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
  // req has user info req.user.is_superuser?
  if (req.method === "PATCH" && getUserByIdMatch) {
    const userId = getUserByIdMatch[1];

    try {
      const body = (await readBody(req)) as { is_active: boolean };
      const { is_active } = body;

      const updateUser = await updateUserStatus(userId, { is_active });

      if (updateUser) {
        logAdminActions({
          adminId: req.user.id,
          userId: userId,
          action: `${is_active ? "ACTIVATE" : "DEACTIVATE"}`,
        });

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
        logAdminActions({
          adminId: req.user.id,
          userId: userId,
          action: "DELETE",
        });
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

  if (req.method === "GET" && pathname === "/admin/paginated-users") {
    try {
      const page = parseInt(parsedUrl.searchParams.get("page") || "1");
      const limit = parseInt(parsedUrl.searchParams.get("limit") || "10");
      const search = parsedUrl.searchParams.get("search") || "";

      const result = await getPaginatedUsers(page, limit, search);

      send(res, 200, {
        status: "OK",
        message: "Users fetched successfully",
        data: {
          users: result.users,
          pagination: {
            currentPage: page,
            totalPages: result.totalPages,
            totalCount: result.totalCount,
            hasNextPage: page < result.totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Pagination error:", error);
      send(res, 500, { status: "Error", message: "Failed to fetch users" });
    }
    return true;
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

  if (req.method === "GET" && pathname === "/admin/admin-audit-logs") {
    try {
      const limit = parseInt(parsedUrl.searchParams.get("limit") || "10");
      const cursor = parsedUrl.searchParams.get("cursor") || null;

      console.log({ limit, cursor });

      const result = await getAdminLogs(cursor, limit);

      // await setTimeout(2000);

      send(res, 200, {
        status: "OK",
        message: "Admin logs fetched successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error getting logs", error);
      send(res, 500, {
        status: "Internal Server Error",
        message: "Failed to get admin logs",
      });
    }
  }

  return false; // Add this line to indicate no routes matched
};
