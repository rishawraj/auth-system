import { IncomingMessage, ServerResponse } from "http";
import {
  generateAccessToken,
  generateRefreshToken,
  generateSixDigitCodeWithExpiry,
  hashToken,
  parseCookies,
  readBody,
  send,
  setServerCookie,
} from "../utils/helpers.js";
import { z } from "zod";
import { pool } from "../config/db.config.js";
import {
  sendResetPasswordEmailWorker,
  sendVerificationEmailWorker,
} from "../workers/sendEmail.Worker.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { User } from "../models/user.model.js";
import { UAParser } from "ua-parser-js";
import crypto, { randomUUID } from "crypto";
import { Secret, TOTP } from "otpauth";
import qrcode from "qrcode";

// import { RegisterResponse } from "../../../shared/src/types/auth.js";
import { env } from "../config/env.js";

const SECRET = env.ACCESS_TOKEN_SECRET;
const FRONTEND_URL = env.FRONTEND_URL;

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
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

    const existingOauthUserResult = await pool.query(
      "SELECT id FROM users where email = $1 and oauth_provider is not null",
      [email]
    );

    if (existingOauthUserResult.rows.length > 0) {
      return send(res, 400, {
        message:
          "This account was created with Google. Please use Google login instead.",
      });
    }

    if (existingUserResult.rows.length > 0) {
      return send(res, 400, { error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const CodeWithExpiry = generateSixDigitCodeWithExpiry();
    const verificationCode = CodeWithExpiry.code;
    const verification_code_expiry_time = CodeWithExpiry.expiresAt;

    const ua = new UAParser(req.headers["user-agent"] || "");
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress ||
      null;
    const browser = ua.getBrowser().name || null;
    const os = ua.getOS().name || null;
    const device = ua.getDevice().model || "unknown";

    // const last_location = null;
    // const last_country = null;
    // const last_city = null;
    const last_login = new Date();

    const hashedEmail = crypto
      .createHash("sha256")
      .update(email.toLowerCase().trim())
      .digest("hex");
    const profile_pic = `https://api.dicebear.com/7.x/adventurer/png?seed=${hashedEmail}`;

    // 2fa
    const secret = new Secret({ size: 20 });
    const secretBase32 = secret.base32;
    console.log(secretBase32);

    const newUserResult = await pool.query(
      `INSERT INTO users (
    name, email, password, verification_code, verification_code_expiry_time,
    last_login, last_ip, last_browser, last_os, last_device,
    profile_pic, tmp_two_factor_secret
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
   RETURNING id, name, email, is_active, registration_date`,
      [
        name,
        email,
        hashedPassword,
        verificationCode,
        verification_code_expiry_time,
        last_login,
        ip,
        browser,
        os,
        device,
        profile_pic,
        secretBase32,
      ]
    );

    const newUser = newUserResult.rows[0];

    const accessToken = generateAccessToken({
      email: newUser.email,
      is_super_user: newUser.is_super_user,
    });

    // generate QRCode 2fa
    const totp = new TOTP({
      issuer: "auth-system",
      label: newUser.email,
      secret: secretBase32,
      digits: 6,
      period: 30,
    });

    const OtpAuthUri = totp.toString();
    const qrcodeImageUrl = await qrcode.toDataURL(OtpAuthUri);

    setImmediate(() => sendVerificationEmailWorker(email, verificationCode));

    const response = {
      message: "User registered successfully",
      user: newUser,
      accessToken,
      qrcodeImageUrl,
    };

    send(res, 201, response);
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
    console.log({ user });

    if (!user) {
      console.log("user not found");
      return send(res, 401, { error: "Invalid credentials" });
    }

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

    // ! ======

    const accessToken = generateAccessToken({
      email: user.email,
      is_super_user: user.is_super_user,
    });

    const jti = randomUUID();
    const refreshTokenPayload = {
      email: user.email,
      jti,
    };

    const refreshToken = generateRefreshToken(refreshTokenPayload);
    const refreshTokenHash = hashToken(refreshToken);

    // Set the refresh token in the database
    // hash the refresh token

    const refreshTokenExpiry = env.REFRESH_TOKEN_EXPIRY;
    if (isNaN(refreshTokenExpiry)) {
      throw new Error("REFRESH_TOKEN_EXPIRY must be a valid number");
    }

    const expiryTime = new Date(
      // 1ms  * 1000 = 1s
      Date.now() + env.REFRESH_TOKEN_EXPIRY * 1000
    );

    try {
      await pool.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, jti) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3, jti = $4 returning *",
        [user.id, refreshTokenHash, expiryTime, jti]
      );
    } catch (error) {
      console.error("Error inserting refresh token:", error);
      return send(res, 500, { error: "Internal server error" });
    }

    // "last_login_method": null,

    // res.setHeader("Set-Cookie", [
    //   `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${refreshTokenExpiry}; SameSite=None; Secure=false; Domain=${
    //     env.DOMAIN
    //   }`,
    // ]);

    setServerCookie({
      name: "refreshToken",
      value: refreshToken,
      res,
      maxAge: env.REFRESH_TOKEN_EXPIRY,
      path: "/",
      isProduction: process.env.NODE_ENV === "production",
    });

    send(res, 200, {
      message: "Login successful",
      accessToken,
      type: "email",
      isTwoFactorEnabled: user.is_two_factor_enabled,
    });
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
        const userResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [decoded.email]
        );

        const user = userResult.rows[0];

        send(res, 200, { user });
      } else {
        send(res, 400, { error: "Invalid token payload" });
      }
    } catch (error) {
      console.log(error);
      send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.error("Profile error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function handleMe(req: IncomingMessage, res: ServerResponse) {
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
        const userResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [decoded.email]
        );

        const user = userResult.rows[0];

        send(res, 200, {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          is_super_user: user.is_super_user,
          is_two_factor_enabled: user.is_two_factor_enabled,
        });
      } else {
        send(res, 400, { error: "Invalid token payload" });
      }
    } catch (error) {
      console.log(error);
      send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.error("Profile error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function handleLogout(req: IncomingMessage, res: ServerResponse) {
  const body = await readBody<{ type: string }>(req);

  const type = body?.type;

  if (type === "email") {
    return handleEmailLogout(req, res);
  } else if (type === "google") {
    return handleGoogleLogout(req, res);
  } else {
    return send(res, 400, { error: "Invalid logout type" });
  }
}

async function handleEmailLogout(req: IncomingMessage, res: ServerResponse) {
  const cookies = parseCookies(req);
  const refreshToken = cookies["refreshToken"];

  if (!refreshToken) {
    return send(res, 204, { message: "no token to logout" });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET!);
  } catch (error) {
    console.log(error);

    send(res, 401, { error: "Invalid or expired refresh token" });
    return;
  }

  const { jti } = decoded;

  if (!jti) {
    send(res, 401, { error: "Invalid or expired refresh token" });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM refresh_tokens WHERE jti = $1",
      [jti]
    );

    if (result.rowCount === 0) {
      console.log("refresh token not found");
      return send(res, 401, { error: "Invalid or expired refresh token" });
    }

    // clear cookie on client
    // res.setHeader("Set-Cookie", "refreshToken=; httpOnly; Path=/;Max-Age=0");
    setServerCookie({
      name: "refreshToken",
      value: "",
      res,
      maxAge: 0,
      path: "/",
    });
    res.writeHead(200, { "content-type": "application/json" });

    res.end(JSON.stringify({ message: "Logged out successfully" }));
  } catch (error) {
    console.error("Logout error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function handleGoogleLogout(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  console.log("Starting Google logout process");

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return send(res, 401, { error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return send(res, 401, { error: "Invalid authorization format" });
    }

    let email: string | null = null;
    let userId: string | null = null;

    try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        email = decoded.email as string;

        // Get user ID for refresh token deletion
        const userResult = await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [email]
        );

        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
        }
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      clearCookies(res);
      return send(res, 401, { error: "Invalid or expired token" });
    }

    if (!email) {
      return send(res, 400, { error: "Unable to extract email from token" });
    }

    try {
      // Begin transaction
      await pool.query("BEGIN");

      // Clear OAuth tokens
      const updateResult = await pool.query(
        `UPDATE users 
         SET oauth_access_token = NULL, 
             oauth_refresh_token = NULL, 
             oauth_token_expires_at = NULL,
             last_login_method = NULL
         WHERE email = $1`,
        [email]
      );

      console.log(updateResult);

      // Delete refresh tokens if user exists
      if (userId) {
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
          userId,
        ]);
      }

      await pool.query("COMMIT");

      console.log(`User ${email} logged out successfully, tokens cleared`);
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("Database operation failed:", error);
      // Continue to clear cookies even if DB update fails
    }

    clearCookies(res);
    send(res, 200, { message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    clearCookies(res);
    send(res, 500, { error: "Internal server error during logout" });
  }
}

// Helper function to clear cookies
function clearCookies(res: ServerResponse) {
  res.setHeader("Set-Cookie", [
    "refreshToken=; HttpOnly; Path=/; Max-Age=0",
    "token=; HttpOnly; Path=/; Max-Age=0",
    `accessToken=; HttpOnly; Path=/; Max-Age=0; Domain=${env.DOMAIN}`,
  ]);
}

export async function handleVerify(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await readBody<{ token: string; code: string }>(req);

    const { token, code } = body;
    console.log({ token, code });

    if (!token || !code) {
      return send(res, 400, { error: "Missing token or verification code" });
    }

    // interface DecodedToken {
    //   email: string;
    //   [key: string]: any; // for any additional JWT claims
    // }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, SECRET);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return send(res, 401, { error: "Invalid or expired token" });
    }
    console.log(decodedToken);

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

    // Update the last login time
    await pool.query("UPDATE users SET last_login = $1 WHERE email = $2", [
      new Date(),
      email,
    ]);

    // Generate a new access token
    const accessToken = generateAccessToken({
      email: user.email,
      is_super_user: user.is_super_user,
    });

    const jti = randomUUID();
    const refreshTokenPayload = {
      email: user.email,
      jti,
    };

    const refreshToken = generateRefreshToken(refreshTokenPayload);
    const refreshTokenHash = hashToken(refreshToken);

    // Set the refresh token in the database
    // hash the refresh token

    const refreshTokenExpiry = env.REFRESH_TOKEN_EXPIRY;
    if (isNaN(refreshTokenExpiry)) {
      throw new Error("REFRESH_TOKEN_EXPIRY must be a valid number");
    }

    const expiryTime = new Date(
      // 1ms  * 1000 = 1s
      Date.now() + env.REFRESH_TOKEN_EXPIRY * 1000
    );

    try {
      await pool.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, jti) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET token_hash = $2, expires_at = $3, jti = $4 returning *",
        [user.id, refreshTokenHash, expiryTime, jti]
      );
    } catch (error) {
      console.error("Error inserting refresh token:", error);
      return send(res, 500, { error: "Internal server error" });
    }

    // "last_login_method": null,

    // res.setHeader("Set-Cookie", [
    //   `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${refreshTokenExpiry}; SameSite=None; Secure=false; Domain=${
    //     env.DOMAIN
    //   }`,
    // ]);
    setServerCookie({
      name: "refreshToken",
      value: refreshToken,
      res,
      maxAge: env.REFRESH_TOKEN_EXPIRY,
      path: "/",
      isProduction: process.env.NODE_ENV === "production",
    });

    send(res, 200, {
      message: "Account verified successfully",
      email: email,
      accessToken,
      type: "email",
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

export async function handleTokenRefresh(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  console.log("refresh token in here.");
  try {
    const cookies = parseCookies(req);
    // console.log(cookies);
    const refreshToken = cookies["refreshToken"];
    // console.log(refreshToken);

    if (!refreshToken) {
      return send(res, 400, { error: "Refresh token is required" });
    }

    // 1. Decode and verify token
    let decoded;

    try {
      decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET!);
    } catch (error) {
      console.log(error);
      send(res, 401, { error: "Invalid or expired refresh token" });
      return;
    }

    console.log({ decoded });
    const { email, jti } = decoded;

    try {
      const incomingTokenHash = hashToken(refreshToken);

      const tokenResult = await pool.query(
        "SELECT * FROM refresh_tokens WHERE jti = $1 AND token_hash = $2",
        [jti, incomingTokenHash]
      );

      const storedToken = tokenResult.rows[0];
      console.log(storedToken);

      if (!storedToken) {
        return send(res, 401, { error: "Invalid or expired refresh token" });
      }

      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      const user = userResult.rows[0];

      if (!user || user.email !== email) {
        console.log(`User mismatch for refresh token jti ${jti}`);
        await pool.query("DELETE FROM tokens WHERE jti = $1", [jti]);
        return send(res, 401, { error: "Invalid or expired refresh token" });
      }

      if (new Date() > new Date(storedToken.expires_at)) {
        console.log("token expired");
        await pool.query("DELETE FROM tokens WHERE jti = $1", [jti]);
        return send(res, 401, { error: "Invalid or expired refresh token" });
      }

      const accessTokenPayload = {
        email: user.email,
        is_super_user: user.is_super_user,
      };

      const newAccessToken = generateAccessToken(accessTokenPayload);

      // send(res, 200, { accessToken: newAccessToken });
      send(res, 200, {
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error("Token verification failed:", error);
      return send(res, 401, { error: "Invalid or expired refresh token" });
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    send(res, 500, { error: "Internal server error during token refresh" });
  }
}

export async function testRefreshToken(
  req: IncomingMessage,
  res: ServerResponse
) {
  console.log("test refresh token");
  const cookies = parseCookies(req);
  const refreshToken = cookies["refreshToken"];
  console.log({ refreshToken });

  // get token from bearer token

  const token = req.headers.authorization?.split(" ")[1];
  console.log({ token });

  // check expiration of token

  send(res, 200, { message: "refresh token working" });
}
