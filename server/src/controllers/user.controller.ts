import { IncomingMessage, ServerResponse } from "http";
import {
  generateSixDigitCodeWithExpiry,
  readBody,
  send,
} from "../utils/helpers.ts";
import { z } from "zod";
import { pool } from "../config/db.config.ts";
import {
  sendResetPasswordEmailWorker,
  sendVerificationEmailWorker,
} from "../workers/sendEmail.Worker.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { User } from "../models/user.model.ts";
import { OAuth2Client, TokenPayload } from "google-auth-library";

const SECRET = process.env.SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const verifySchema = z.object({
  code: z.string().length(6, "Code is a 6 digit number"),
});

export async function handleRegister(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const body = await readBody<{ token: string; code: string }>(req);
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { name, email, password } = result.data;
    console.log({ name, email, password });

    if (!email || !password) {
      return send(res, 400, { error: "Email and password are required" });
    }

    const existingUserResult = await pool.query(
      "SELECT id FROM users where email = $1",
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return send(res, 400, { error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const CodeWithExpiry = generateSixDigitCodeWithExpiry();
    const verificationCode = CodeWithExpiry.code;
    const verification_code_expiry_time = CodeWithExpiry.expiresAt;

    const newUserResult = await pool.query(
      "INSERT INTO users (name, email, password, verification_code, verification_code_expiry_time) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, is_active, registration_date",
      [
        name,
        email,
        hashedPassword,
        verificationCode,
        verification_code_expiry_time,
      ]
    );
    const newUser = newUserResult.rows[0];

    const token = jwt.sign({ email: newUser.email }, SECRET, {
      expiresIn: "1d",
    });

    // fire and forget
    setImmediate(() => sendVerificationEmailWorker(email, verificationCode));

    send(res, 201, {
      message: "User registered successfully",
      user: newUser,
      token: token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function handleLogin(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const body = await readBody(req);
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { email, password } = result.data;
    console.log({ email, password });

    if (!email || !password) {
      return send(res, 400, { error: "Email and password are required" });
    }

    const userResult = await pool.query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];
    console.log(user);

    if (!user) return send(res, 401, { error: "Invalid credentials" });

    // Check if this is an OAuth user with no password
    if (user.oauth_provider && !user.password) {
      console.log("OAuth user detected");
      return send(res, 400, {
        error:
          "This account was created with Google. Please use Google login instead.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) return send(res, 401, { error: "Invalid credentials" });

    const token = jwt.sign(
      { email: user.email, is_super_user: user.is_super_user },
      SECRET,
      {
        expiresIn: "1d",
      }
    );

    // update last login time
    await pool.query("UPDATE users SET last_login = $1 WHERE email = $2", [
      new Date(),
      email,
    ]);

    send(res, 200, { message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function handleProfile(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];

    if (!token) {
      return send(res, 401, { error: "Invalid authorization format" });
    }

    try {
      const decoded = jwt.verify(token, SECRET);

      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [
          decoded.email,
        ]);

        send(res, 200, { message: user.rows[0] });
      } else {
        send(res, 400, { error: "Invalid token payload" });
      }
    } catch (error) {
      send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.error("Profile error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function handleLogut(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Set-Cookie", "token=; httpOnly; Path=/;Max-Age=0");
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "Logged out successfully" }));
}

export async function handleVerify(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await readBody<{ token: string; code: string }>(req);

    const { token, code } = body;
    console.log({ token, code });

    if (!token || !code) {
      return send(res, 400, { error: "Missing token or verification code" });
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, SECRET);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return send(res, 401, { error: "Invalid or expired token" });
    }

    const { email } = decodedToken;

    // Query the database to check verification code
    const userQuery =
      "SELECT id, verification_code, verification_code_expiry_time FROM users WHERE email = $1";
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return send(res, 404, { error: "User not found" });
    }
    const user = userResult.rows[0];
    const currentTime = new Date();

    // Check if verification code is valid and not expired
    if (user.verification_code !== code) {
      return send(res, 400, { error: "Invalid verification code" });
    }

    if (
      user.verification_code_expiry_time &&
      new Date(user.verification_code_expiry_time) < currentTime
    ) {
      return send(res, 400, { error: "Verification code has expired" });
    }

    // Update user account to active status
    const updateQuery = `
      UPDATE users 
      SET is_active = TRUE, 
          verification_code = NULL, 
          verification_code_expiry_time = NULL 
      WHERE id = $1
    `;

    await pool.query(updateQuery, [user.id]);
    // Send success response
    send(res, 200, {
      message: "Account verified successfully",
      email: email,
    });
  } catch (error) {
    console.error("Verification error: ", error);
    send(res, 500, { error: "Internal server error duing verification" });
  }
}

export async function handleForgotPassword(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const body = await readBody<{ email: string }>(req);
    const { email } = body;
    if (!email) {
      return send(res, 400, { error: "Email is required" });
    }

    const userResult = await pool.query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];
    console.log(user);
    if (!user) {
      console.log("user not found");
      return send(res, 404, { error: "User not found" });
    }

    //  send email with token
    const token = jwt.sign({ email: user.email }, SECRET);
    const resetEmailLink = `${FRONTEND_URL}/reset-password?token=${token}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1hr

    const passWordResetResult = await pool.query(
      "UPDATE users SET reset_password_token = $1, reset_passsword_token_expiry_time = $2 WHERE email = $3 RETURNING *",
      [token, expiresAt, email]
    );

    const userId = passWordResetResult.rows[0];
    console.log(userId);

    // fire and forget
    setImmediate(() => sendResetPasswordEmailWorker(email, resetEmailLink));

    send(res, 200, {
      message: "Password reset email sent successfully",
      userId: userId,
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function handleResetPassword(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    console.log("Reset password");
    const body = await readBody<{ token: string; password: string }>(req);
    const { token, password } = body;

    if (!token || !password) {
      return send(res, 400, { error: "Token and new password are required" });
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, SECRET);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return send(res, 401, { error: "Invalid or expired token" });
    }

    const { email } = decodedToken;
    console.log({ email });

    // Query the database to check reset password token
    const userQuery =
      "SELECT id, reset_password_token, reset_passsword_token_expiry_time FROM users WHERE email = $1";
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return send(res, 404, { error: "User not found" });
    }
    const user = userResult.rows[0];
    const currentTime = new Date();

    // Check if reset password token is valid and not expired
    if (user.reset_password_token !== token) {
      return send(res, 400, { error: "Invalid reset password token" });
    }

    if (
      user.reset_passsword_token_expiry_time &&
      new Date(user.reset_passsword_token_expiry_time) < currentTime
    ) {
      return send(res, 400, { error: "Reset password token has expired" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password in the database
    const updateQuery = `
      UPDATE users 
      SET password = $1, 
          reset_password_token = NULL, 
          reset_passsword_token_expiry_time = NULL 
      WHERE id = $2
    `;

    await pool.query(updateQuery, [hashedPassword, user.id]);

    // Send success response
    send(res, 200, { message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    send(res, 500, { error: "Internal server error during password reset" });
  }
}

// export async function verifyJWT(
//   req: IncomingMessage
// ): Promise<{ userId: number; email: string } | null> {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return null;
//     }

//     const token = authHeader.substring(7); // Remove 'Bearer ' prefix
//     const decoded = jwt.verify(token, SECRET) as { email: string; id: number };

//     // Check if user exists and is active
//     const userResult = await pool.query<User>(
//       "SELECT id FROM users WHERE id = $1 AND is_active = true",
//       [decoded.id]
//     );

//     if (userResult.rows.length === 0) {
//       return null;
//     }

//     return { userId: decoded.id, email: decoded.email };
//   } catch (error) {
//     console.error("JWT verification error:", error);
//     return null;
//   }
// }
