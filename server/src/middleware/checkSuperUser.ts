import jwt from "jsonwebtoken";
import { pool } from "../config/db.config.js";
import "dotenv/config";
import { IncomingMessage } from "node:http";
import { env } from "../config/env.js";

const SECRET = env.ACCESS_TOKEN_SECRET;

type AuthenticatedUser = {
  id: string;
  email: string;
  is_super_user: boolean;
};

interface AuthenticatedRequest extends IncomingMessage {
  user?: AuthenticatedUser;
}

/**
 * Authentication middleware that checks if a user has super user privileges
 * Returns an object with authentication result and appropriate status codes
 */
export async function checkSuperUser(req: AuthenticatedRequest) {
  console.log("Middleware checkSuperUser");

  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);

  if (!authHeader) {
    return {
      isAuthenticated: false,
      statusCode: 401,
      message: "No authorization token provided",
    };
  }

  const [authType, token] = authHeader.split(" ");

  if (authType !== "Bearer" || !token) {
    return {
      isAuthenticated: false,
      statusCode: 401,
      message: "Invalid authorization format",
    };
  }

  try {
    const decoded = jwt.verify(token, SECRET);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("email" in decoded)
    ) {
      return {
        isAuthenticated: false,
        statusCode: 401,
        message: "Invalid token payload",
      };
    }

    const email = decoded.email as string;
    const userResult = await pool.query(
      "SELECT id, email, is_super_user FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return {
        isAuthenticated: false,
        statusCode: 401,
        message: "User not found",
      };
    }

    if (!user.is_super_user) {
      return {
        isAuthenticated: false,
        statusCode: 403,
        message: "User is not authorized for admin access",
      };
    }

    // Attach user info to request for later use
    req.user = {
      id: user.id,
      email: user.email,
      is_super_user: user.is_super_user,
    };

    // console.log(req.user);

    return {
      isAuthenticated: true,
      statusCode: 200,
      message: "Authentication successful",
    };
  } catch (err) {
    console.error(
      "JWT verification error:",
      err instanceof Error ? err.message : err
    );
    return {
      isAuthenticated: false,
      statusCode: 401,
      message: "Invalid or expired token",
    };
  }
}
