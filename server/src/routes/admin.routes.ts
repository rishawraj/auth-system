import { IncomingMessage, ServerResponse } from "http";
import { send } from "../utils/helpers.js";
import { getAllUsers, getUserById } from "../controllers/admin.controller.js";
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

  // get user by id
  const getUserByIdMatch = pathname.match(/^\/admin\/users\/([^/]+)$/);
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

  if (req.method === "GET" && pathname === "/admin/users") {
    const usersList = await getAllUsers();
    send(res, 200, {
      status: "OK",
      message: "Users fetched successfully",
      data: usersList,
    });

    return true; // Add this line to indicate the route was handled
  }

  return false; // Add this line to indicate no routes matched
};
