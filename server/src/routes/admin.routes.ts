import { IncomingMessage, ServerResponse } from "http";
import { send } from "../utils/helpers.ts";
import { getAllUsers, getUserById } from "../controllers/admin.controller.ts";
import { checkSuperUser } from "../middleware/checkSuperUser.ts";

export default async (req: IncomingMessage, res: ServerResponse) => {
  // parse url
  const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight requests first, before authentication
  if (req.method === "OPTIONS") {
    console.log(`OPTIONS ${pathname}`);
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return true;
  }

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
      const user = await getUserById(+userId);
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

  // get a user by id
  // if (req.method === "GET" && pathname === "/admin/users/:id") {
  //   send(res, 200, {
  //     status: "OK",
  //     message: "User fetched successfully",
  //     data: { id: 1, name: "John Doe", email: "r" },
  //   });
  //   return true; // Add this line to indicate the route was handled
  // }

  return false; // Add this line to indicate no routes matched
};
