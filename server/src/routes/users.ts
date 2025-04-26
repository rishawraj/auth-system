import { IncomingMessage, ServerResponse } from "http";
import {
  getAllUsers,
  handleRegister,
  handleLogin,
  handleProfile,
  handleVerify,
  handleLogut,
} from "../controllers/userController.ts";
import { send } from "../utils/helpers.ts";

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "OPTIONS") {
    console.log("/options");
    res.writeHead(204); // Respond with 204 No Content for successful preflight
    res.end();
    return true; // Stop further processing for OPTIONS requests
  }

  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { status: "OK", message: "Server is healthy" });
  }

  if (req.method === "GET" && req.url === "/users") {
    await getAllUsers(req, res);
    return true; // indicate router handled the request
  }

  if (req.method === "POST" && req.url === "/register") {
    await handleRegister(req, res);
    return true;
  }

  if (req.method === "POST" && req.url === "/login") {
    await handleLogin(req, res);
    return true;
  }

  if (req.method === "GET" && req.url === "/profile") {
    await handleProfile(req, res);
    return true;
  }
  if (req.method === "POST" && req.url === "/logout") {
    handleLogut(req, res);
    return true;
  }
  if (req.method === "POST" && req.url === "/verify") {
    handleVerify(req, res);
    return true;
  }

  return false;
};
