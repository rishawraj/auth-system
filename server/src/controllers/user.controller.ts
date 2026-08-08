import { IncomingMessage, ServerResponse } from "http";
import {
  generateAccessToken,
  generateRefreshToken,
  generateSixDigitCodeWithExpiry,
  hashToken,
  logLoginAttempt,
  normalizeIP,
  parseCookies,
  readBody,
  send,
  setServerCookie,
} from "../utils/helpers.js";
import { pool } from "../config/db.config.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { User } from "../models/user.model.js";
import { UAParser } from "ua-parser-js";
import crypto, { randomUUID } from "crypto";
import { Secret, TOTP } from "otpauth";
import qrcode from "qrcode";

import { env } from "../config/env.js";
import busboy from "busboy";
import { uploadToR2 } from "../utils/uploadToR2.js";
import { PoolClient } from "pg";

import { api, models } from "@auth-system/shared";
import {
  emailLimiter,
  bruteForceLimiter,
  isRateLimiterRejection,
} from "../utils/rateLimiter.js";

const REFRESH_TOKEN_EXPIRY_SECONDS = Number(env.REFRESH_TOKEN_EXPIRY);
if (Number.isNaN(REFRESH_TOKEN_EXPIRY_SECONDS)) {
  throw new Error("REFRESH_TOKEN_EXPIRY must be a valid number");
}

const RESEND_COOLDOWN_SECONDS = 60;

function isPgError(err: unknown): err is { code: string; message: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

export async function handleRegister(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown_ip";

  try {
    await emailLimiter.consume(ip);
  } catch (err) {
    if (isRateLimiterRejection(err)) {
      res.setHeader("Retry-After", Math.round(err.msBeforeNext / 1000));

      res.setHeader("X-RateLimit-Limit", 5);
      res.setHeader("X-RateLimit-Remaining", err.remainingPoints);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(Date.now() + err.msBeforeNext).toISOString()
      );

      return send(res, 429, {
        error: "Too many requests. Please try again later.",
      });
    }

    console.error("Rate limiter failure:", err);
    return send(res, 500, { error: "Internal server error" });
  }

  let client: PoolClient | undefined;
  let inTransaction = false;

  try {
    const body = await readBody<api.RegisterRequest>(req);

    const result = api.RegisterRequestSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { name, password } = result.data;
    const email = result.data.email.toLocaleLowerCase().trim();

    client = await pool.connect();

    const existingUserResult = await client.query(
      "SELECT id, oauth_provider FROM users where email = $1",
      [email]
    );

    const existingUser: models.User = existingUserResult.rows[0];

    if (existingUser) {
      await client.query(
        `INSERT INTO email_outbox (to_email, template, payload)
         VALUES ($1, $2, $3)`,
        [
          email,
          "existing_account_notice",
          JSON.stringify({ provider: existingUser.oauth_provider }),
        ]
      );

      const dummySecret = new Secret({ size: 20 }).base32;
      const dummyTotp = new TOTP({
        issuer: "auth-system",
        label: email,
        secret: dummySecret,
        digits: 6,
        period: 30,
      });
      const qrcodeImageUrl = await qrcode.toDataURL(dummyTotp.toString());

      const response = api.RegisterResponseSchema.parse({
        message: "If the email is valid, a verification code has been sent.",
        pending_email: email,
        qrcodeImageUrl,
      });

      return send(res, 201, response);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { code: verificationCode, expiresAt: verification_code_expiry_time } =
      generateSixDigitCodeWithExpiry();

    const ua = new UAParser(req.headers["user-agent"] || "");
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress ||
      null;
    const browser = ua.getBrowser().name || null;
    const os = ua.getOS().name || null;
    const device = ua.getDevice().model || "unknown";
    const last_login = new Date();

    const hashedEmail = crypto
      .createHash("sha256")
      .update(email.toLowerCase().trim())
      .digest("hex");

    const profile_pic = `https://api.dicebear.com/7.x/adventurer/png?seed=${hashedEmail}`;

    // 2fa
    const secret = new Secret({ size: 20 });
    const secretBase32 = secret.base32;

    try {
      await client.query("BEGIN");
      inTransaction = true;

      const newUserResult = await client.query(
        `INSERT INTO users (
         name, pending_email, password, verification_code, verification_code_expiry_time,
         last_login, last_ip, last_browser, last_os, last_device,
         profile_pic, tmp_two_factor_secret
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
   RETURNING id, name, pending_email, is_active, registration_date`,
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

      const newUser: models.User = newUserResult.rows[0];

      // generate QRCode 2fa
      const totp = new TOTP({
        issuer: "auth-system",
        label: newUser.pending_email,
        secret: secretBase32,
        digits: 6,
        period: 30,
      });

      const OtpAuthUri = totp.toString();
      const qrcodeImageUrl = await qrcode.toDataURL(OtpAuthUri);

      await client.query(
        `INSERT INTO email_outbox (to_email, template, payload)
         VALUES ($1, $2, $3)
      `,
        [email, "verification_code", JSON.stringify({ code: verificationCode })]
      );

      await client.query("COMMIT");
      inTransaction = false;

      const response = api.RegisterResponseSchema.parse({
        message: "If the email is valid, a verification code has been sent.",
        pending_email: newUser.pending_email,
        qrcodeImageUrl,
      });

      send(res, 201, response);
    } catch (error) {
      if (inTransaction) {
        await client.query("ROLLBACK");
      }

      if (error instanceof Error && "code" in error && error.code === "23505") {
        const dummyTotp = new TOTP({
          issuer: "auth-system",
          label: email,
          secret: new Secret({ size: 20 }).base32,
        });
        const qrcodeImageUrl = await qrcode.toDataURL(dummyTotp.toString());

        return send(res, 201, {
          message: "If the email is valid, a verification code has been sent.",
          pending_email: email,
          qrcodeImageUrl,
        });
      }

      console.error("Registration error:", error);
      send(res, 500, { error: "Internal server error" });
    }
  } catch (error) {
    console.error(error);
    send(res, 500, { error: "Internal server error" });
  } finally {
    client?.release();
  }
}
//  ================== Login =======================

export async function handleLogin(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const rawIp =
      (Array.isArray(req.headers["x-forwarded-for"])
        ? req.headers["x-forwarded-for"][0]
        : req.headers["x-forwarded-for"]?.split(",")[0]) ||
      req.socket.remoteAddress ||
      "unknown_ip";

    const ip_address = normalizeIP(rawIp);
    const userAgent = req.headers["user-agent"];

    const body = await readBody(req);
    const result = api.LoginRequestSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const email = result.data.email.toLowerCase().trim();
    const password = result.data.password;

    try {
      await Promise.all([
        bruteForceLimiter.consume(rawIp),
        bruteForceLimiter.consume(email),
      ]);
    } catch (err) {
      if (isRateLimiterRejection(err)) {
        return send(res, 429, {
          error: "Too many requests. Please try again later",
        });
      }
      console.error("Rate limiter failure:", err);
      return send(res, 500, { error: "Internal server error" });
    }

    const userResult = await pool.query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      await logLoginAttempt({
        userId: null,
        email,
        success: false,
        ip: ip_address,
        userAgent,
      });
      console.log("user not found");
      return send(res, 401, { error: "Invalid credentials" });
    }

    if (user.is_deleted) {
      console.log("Attempted login to deleted account");
      return send(res, 401, { error: "Invalid credentials" });
    }

    // Check if this is an OAuth user with no password
    if (user.oauth_provider && !user.password) {
      await logLoginAttempt({
        userId: user.id,
        email,
        success: false,
        ip: ip_address,
        userAgent,
      });
      console.log("OAuth user detected");
      return send(res, 400, {
        error:
          "This account was created with Google. Please use Google login instead.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      await logLoginAttempt({
        userId: user.id,
        email,
        success: false,
        ip: ip_address,
        userAgent,
      });

      return send(res, 401, { error: "Invalid credentials" });
    }

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

    setServerCookie({
      name: "refreshToken",
      value: refreshToken,
      res,
      maxAge: env.REFRESH_TOKEN_EXPIRY,
      path: "/",
      isProduction: process.env.NODE_ENV === "production",
    });

    // ! log login activity
    if (!user.is_two_factor_enabled) {
      logLoginAttempt({
        userId: user.id,
        email,
        success: true,
        ip: ip_address,
        userAgent,
      });
    }

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
//  ================== Login ========================

//  ================= Handle Profile ================
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
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

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

export async function updateProfile(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  let client: PoolClient | undefined;

  try {
    // ---- auth ----
    const authHeader = req.headers.authorization;
    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return send(res, 401, { error: "Invalid authorization format" });

    let userEmail: string;
    try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        userEmail = decoded.email as string;
      } else {
        return send(res, 400, { error: "Invalid token payload" });
      }
    } catch {
      return send(res, 401, { error: "Invalid token" });
    }

    client = await pool.connect();

    const userResult = await client.query(
      "SELECT * FROM users WHERE email = $1 AND is_deleted = false",
      [userEmail]
    );
    if (userResult.rows.length === 0) {
      return send(res, 404, { error: "User not found" });
    }
    const user = userResult.rows[0];
    const isOauthUser = !!user.oauth_provider;

    // ---- parse multipart body ----
    const fields: Record<string, string> = {};
    let profilePicUrl: string | null = null;
    let uploadError: Error | null = null;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_MIME: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };

    await new Promise<void>((resolve, reject) => {
      const bb = busboy({
        headers: req.headers,
        limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      });

      const filePromises: Promise<void>[] = [];

      bb.on("field", (name, value) => {
        fields[name] = value;
      });

      bb.on("file", (fieldname, stream, info) => {
        if (fieldname !== "profile_pic") {
          stream.resume();
          return;
        }

        if (!ALLOWED_MIME[info.mimeType]) {
          uploadError = new Error("Unsupported image type");
          stream.resume();
          return;
        }

        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(chunk));

        filePromises.push(
          new Promise<void>((resolveFile, rejectFile) => {
            stream.on("limit", () => {
              uploadError = new Error("Profile picture exceeds 5MB limit");
              rejectFile(uploadError);
            });
            stream.on("end", async () => {
              try {
                if (uploadError) return resolveFile();
                const buffer = Buffer.concat(chunks);
                const ext = ALLOWED_MIME[info.mimeType];
                const key = `avatar/user-${user.id}.${ext}`;
                profilePicUrl = await uploadToR2(buffer, key, info.mimeType);
                resolveFile();
              } catch (error) {
                rejectFile(error as Error);
              }
            });
          })
        );
      });

      bb.on("finish", () => {
        Promise.all(filePromises)
          .then(() => resolve())
          .catch(reject);
      });
      bb.on("error", reject);

      req.pipe(bb);
    });

    if (uploadError) {
      return send(res, 400, { error: uploadError.message });
    }

    // ============================================================
    // PHASE 1 — validate every requested field, write nothing yet
    // ============================================================

    let wantsEmailChange = false;
    let newEmail = "";

    let wantsPasswordChange = false;
    let hashedNewPassword = "";

    let wantsNameChange = false;
    const trimmedName = fields.name?.trim();

    if (trimmedName) wantsNameChange = true;

    if (!isOauthUser && fields.email?.trim()) {
      newEmail = fields.email.trim().toLowerCase();

      if (newEmail === user.email?.toLowerCase()) {
        return send(res, 400, {
          error: "New email is the same as current email.",
        });
      }

      const emailTaken = await client.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [newEmail, user.id]
      );
      if (emailTaken.rows.length > 0) {
        return send(res, 400, { error: "Email is already in use." });
      }

      wantsEmailChange = true;
    }

    if (!isOauthUser && fields.new_password) {
      if (!fields.password) {
        return send(res, 400, {
          error: "Current password is required to set a new one.",
        });
      }
      const passwordMatch = await bcrypt.compare(
        fields.password,
        user.password
      );
      if (!passwordMatch) {
        return send(res, 400, { error: "Current password is incorrect." });
      }
      hashedNewPassword = await bcrypt.hash(fields.new_password, 10);
      wantsPasswordChange = true;
    }

    const hasAnyChange =
      wantsNameChange ||
      wantsEmailChange ||
      wantsPasswordChange ||
      !!profilePicUrl;

    if (!hasAnyChange) {
      console.log("no valid changes!");
      return send(res, 400, { error: "No valid fields to update." });
    }

    console.log({ hasAnyChange });

    // ============================================================
    // PHASE 2 — everything validated, now write it all atomically
    // ============================================================

    let emailVerificationPending = false;

    try {
      await client.query("BEGIN");

      // direct fields on `users` — only built from what actually changed
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;
      const append = (col: string, val: unknown) => {
        updates.push(`${col} = $${idx++}`);
        values.push(val);
      };

      if (wantsNameChange) append("name", trimmedName);
      if (wantsPasswordChange) append("password", hashedNewPassword);
      if (profilePicUrl) append("profile_pic", profilePicUrl);

      let updatedUser = user;

      if (updates.length > 0) {
        values.push(user.id);
        const result = await client.query(
          `UPDATE users
           SET ${updates.join(", ")}
           WHERE id = $${idx}
           RETURNING id, name, email, profile_pic, oauth_provider`,
          values
        );
        updatedUser = result.rows[0];
      }

      if (wantsEmailChange) {
        const { code, expiresAt } = generateSixDigitCodeWithExpiry();

        await client.query(
          `UPDATE users
           SET pending_email = $1,
               verification_code = $2,
               verification_code_expiry_time = $3
           WHERE id = $4`,
          [newEmail, code, expiresAt, user.id]
        );

        await client.query(
          `INSERT INTO email_outbox (to_email, template, payload)
           VALUES ($1, $2, $3)`,
          [newEmail, "verification_code", JSON.stringify({ code })]
        );

        emailVerificationPending = true;
      }

      await client.query("COMMIT");

      return send(res, 200, {
        message: "Profile updated successfully.",
        user: updatedUser,
        ...(emailVerificationPending && {
          status: "email_verification_required",
        }),
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  } catch (error) {
    console.error(error);
    return send(res, 500, { message: "Internal Server Error" });
  } finally {
    client?.release();
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
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

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
  console.log("in here email logout");
  const cookies = parseCookies(req);
  const refreshToken = cookies["refreshToken"];

  if (!refreshToken) {
    return send(res, 200, {
      message: "Already logged out",
    });
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

export async function handleUpdateEmail(
  req: IncomingMessage,
  res: ServerResponse
) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown_ip";

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    const body = await readBody<{ token: string; code: string }>(req);

    const { code } = body;

    if (!token || !code) {
      return send(res, 400, { error: "Missing token or verification code" });
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return send(res, 401, { error: "Invalid or expired token" });
    }

    const { email } = decodedToken;

    try {
      await Promise.all([
        bruteForceLimiter.consume(ip),
        bruteForceLimiter.consume(email),
      ]);
    } catch (err) {
      if (isRateLimiterRejection(err)) {
        return send(res, 429, {
          error: "Too many requests. Please try again later",
        });
      }
      console.error("Rate limiter failure:", err);
      return send(res, 500, { error: "Internal server error" });
    }

    // Query the database to check verification code
    const userQuery =
      "SELECT id, verification_code, verification_code_expiry_time, pending_email, is_super_user FROM users WHERE email = $1";

    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return send(res, 404, { error: "User not found" });
    }
    const user = userResult.rows[0];
    const currentTime = new Date();

    if (!user.pending_email) {
      return send(res, 400, { error: "No pending email" });
    }

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
      SET email = $1, 
          verification_code = NULL, 
          verification_code_expiry_time = NULL,
          pending_email = NULL
      WHERE id = $2
    `;

    await pool.query(updateQuery, [user.pending_email, user.id]);

    // todo use user_id as token identity instead of email.
    // for now re-issue tokens
    const newAccessToken = generateAccessToken({
      email: user.pending_email,
      is_super_user: user.is_super_user,
    });

    const jti = randomUUID();
    const refreshToken = generateRefreshToken({
      email: user.pending_email,
      jti,
    });
    const refreshTokenHash = hashToken(refreshToken);

    const expiryTime = new Date(
      // 1ms  * 1000 = 1s
      Date.now() + env.REFRESH_TOKEN_EXPIRY * 1000
    );

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at,jti)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET token_hash = $2, expires_at = $3, jti = $4`,
      [user.id, refreshTokenHash, expiryTime, jti]
    );

    setServerCookie({
      name: "refreshToken",
      value: refreshToken,
      res,
      maxAge: env.REFRESH_TOKEN_EXPIRY,
      path: "/",
      isProduction: process.env.NODE_ENV === "production",
    });

    send(res, 200, { message: "email updated", accessToken: newAccessToken });
  } catch (err) {
    console.error("Logout error:", err);
    clearCookies(res);
    send(res, 500, { error: "Internal server error during logout" });
  }
}

export async function handleVerify(req: IncomingMessage, res: ServerResponse) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown_ip";

  // let client: PoolClient | undefined;

  console.log("wtttttt");

  try {
    const body = await readBody(req);
    const result = api.VerifyRequestSchema.safeParse(body);

    if (!result.success) {
      return send(res, 400, { message: "Invalid request body" });
    }

    const { pending_email, code } = result.data;

    try {
      await Promise.all([
        bruteForceLimiter.consume(ip),
        bruteForceLimiter.consume(pending_email),
      ]);
    } catch (err) {
      if (isRateLimiterRejection(err)) {
        return send(res, 429, {
          error: "Too many requests. Please try again later",
        });
      }
      console.error("Rate limiter failure:", err);
      return send(res, 500, { error: "Internal server error" });
    }

    const userQuery = `
    SELECT id, is_super_user, verification_code, verification_code_expiry_time 
      FROM users 
      WHERE pending_email = $1
    `;

    const { rows } = await pool.query(userQuery, [pending_email]);

    const user = rows[0];

    // Check if verification code is valid and not expired
    if (!user || user.verification_code !== code) {
      return send(res, 400, { message: "Invalid verification code" });
    }

    if (
      user.verification_code_expiry_time &&
      new Date(user.verification_code_expiry_time) < new Date()
    ) {
      return send(res, 400, { message: "Verification code has expired" });
    }

    // Generate a new access token
    const accessToken = generateAccessToken({
      email: pending_email,
      is_super_user: user.is_super_user,
    });

    const jti = randomUUID();
    const refreshToken = generateRefreshToken({ email: pending_email, jti });
    const refreshTokenHash = hashToken(refreshToken);
    const expiryTime = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRY * 1000);

    // One atomic statement — UPDATE + INSERT via CTE, re-validates code/expiry
    // in the WHERE clause. No pool.connect(), no explicit BEGIN/COMMIT.

    const { rows: writeRows } = await pool.query(
      `WITH updated AS (
         UPDATE users
         SET is_active = TRUE,
             verification_code = NULL,
             verification_code_expiry_time = NULL,
             email = $1,
             pending_email = NULL,
             last_login = NOW()
         WHERE pending_email = $1
           AND verification_code = $2
           AND (verification_code_expiry_time IS NULL OR verification_code_expiry_time > NOW())
         RETURNING id
       )
       INSERT INTO refresh_tokens (user_id, token_hash, expires_at, jti)
       SELECT id, $3, $4, $5 FROM updated
       ON CONFLICT (user_id) DO UPDATE
         SET token_hash = EXCLUDED.token_hash,
             expires_at = EXCLUDED.expires_at,
             jti = EXCLUDED.jti
       RETURNING user_id`,
      [pending_email, code, refreshTokenHash, expiryTime, jti]
    );

    if (writeRows.length === 0) {
      return send(res, 400, { message: "Invalid verification code" });
    }

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
      email: pending_email,
      accessToken,
      type: "email",
    });
  } catch (error) {
    if (isPgError(error)) {
      switch (error.code) {
        case "57014": // query_canceled (statement_timeout)
        case "08000":
        case "08003":
        case "08006": // connection failures
          console.error("DB unavailable during verify:", error);
          return send(res, 503, { error: "Service temporarily unavailable" });
        default:
          console.error("DB error during verify:", error);
          return send(res, 500, { error: "Internal server error" });
      }
    }
    console.error("Verification error: ", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function handleResendVerifyEmailCode(
  req: IncomingMessage,
  res: ServerResponse
) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown_ip";

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return send(res, 401, { error: "No token provided" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return send(res, 401, { error: "Invalid or expired token" });
    }

    const { email } = decodedToken;

    try {
      await Promise.all([
        emailLimiter.consume(ip),
        emailLimiter.consume(email),
      ]);
    } catch (err) {
      if (isRateLimiterRejection(err)) {
        res.setHeader("Retry-After", Math.round(err.msBeforeNext / 1000));
        res.setHeader("X-RateLimit-Limit", 5);
        res.setHeader("X-RateLimit-Remaining", err.remainingPoints);
        res.setHeader(
          "X-RateLimit-Reset",
          new Date(Date.now() + err.msBeforeNext).toISOString()
        );
        return send(res, 429, {
          error: "Too many requests. Please try again later.",
        });
      }
      console.error("Rate limiter failure:", err);
      return send(res, 500, { error: "Internal server error" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `SELECT id, pending_email, verification_code_expiry_time, last_code_sent_at
         FROM users
         WHERE email = $1
         FOR UPDATE`,
        [email]
      );

      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return send(res, 404, { error: "User not found" });
      }

      const user = rows[0];

      if (!user.pending_email) {
        await client.query("ROLLBACK");
        return send(res, 400, { error: "No pending email change" });
      }

      if (user.last_code_sent_at) {
        const secondsSinceLastSend =
          (Date.now() - new Date(user.last_code_sent_at).getTime()) / 1_000;

        if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
          await client.query("ROLLBACK");
          return send(res, 429, {
            message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)}s before requesting another code.`,
          });
        }
      }

      const MINUTES_VALID = 15;
      const result = generateSixDigitCodeWithExpiry(MINUTES_VALID);

      await client.query(
        `UPDATE users
        SET verification_code = $1,
            verification_code_expiry_time = $2,
            last_code_sent_at = NOW()
        WHERE id = $3`,
        [result.code, result.expiresAt, user.id]
      );

      await client.query(
        `INSERT INTO email_outbox (to_email, template, payload)
             VALUES ($1, $2, $3)`,
        [user.pending_email, "verification_code", JSON.stringify({ code: result.code })]
      );

      await client.query("COMMIT");

      return send(res, 200, {
        message: "A new verification code has been sent to your new email.",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error resending verification code: ", error);
      return send(res, 500, { message: "Failed to resend code" });
    } finally {
      client?.release();
    }
  } catch (error) {
    console.error("Error in handleResendVerifyEmailCode:", error);
    return send(res, 500, { message: "Internal server error" });
  }
}

export async function handleResendCode(
  req: IncomingMessage,
  res: ServerResponse
) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown_ip";
  const body = await readBody<{ email: string }>(req);
  const { email } = body;
  if (!email) {
    return send(res, 400, { message: "Email is required" });
  }

  try {
    await Promise.all([emailLimiter.consume(ip), emailLimiter.consume(email)]);
  } catch (err) {
    if (isRateLimiterRejection(err)) {
      res.setHeader("Retry-After", Math.round(err.msBeforeNext / 1000));

      res.setHeader("X-RateLimit-Limit", 5);
      res.setHeader("X-RateLimit-Remaining", err.remainingPoints);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(Date.now() + err.msBeforeNext).toISOString()
      );

      return send(res, 429, {
        error: "Too many requests. Please try again later.",
      });
    }

    console.error("Rate limiter failure:", err);
    return send(res, 500, { error: "Internal server error" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT id, verification_code_expiry_time, last_code_sent_at
       FROM users
       WHERE pending_email = $1
       FOR UPDATE
      `,
      [email]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return send(res, 200, {
        message:
          "If that email is pending verification, a new code has been sent.",
      });
    }

    const user = rows[0];
    console.log({ user });

    // ! add last_code_sent_at

    if (user.last_code_sent_at) {
      const secondsSinceLastSend =
        (Date.now() - new Date(user.last_code_sent_at).getTime()) / 1_000;

      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        await client.query("ROLLBACK");
        return send(res, 429, {
          message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)}s before requesting another code.`,
        });
      }
    }

    const MINUTES_VALID = 15;
    const result = generateSixDigitCodeWithExpiry(MINUTES_VALID);

    await client.query(
      `UPDATE users
      SET verification_code = $1,
          verification_code_expiry_time = $2,
          last_code_sent_at = NOW()
      WHERE id = $3`,
      [result.code, result.expiresAt, user.id]
    );

    await client.query(
      `INSERT INTO email_outbox (to_email, template, payload)
           VALUES ($1, $2, $3)`,
      [email, "verification_code", JSON.stringify({ code: result.code })]
    );

    await client.query("COMMIT");

    return send(res, 200, {
      message:
        "If that email is pending verification, a new code has been sent.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error resending verification code: ", error);
    return send(res, 500, { message: "Failed to resend code" });
  } finally {
    client?.release();
  }
}

export async function handleForgotPassword(
  req: IncomingMessage,
  res: ServerResponse
) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown_ip";

  try {
    await emailLimiter.consume(ip);
  } catch (err) {
    if (isRateLimiterRejection(err)) {
      res.setHeader("Retry-After", Math.round(err.msBeforeNext / 1000));

      res.setHeader("X-RateLimit-Limit", 5);
      res.setHeader("X-RateLimit-Remaining", err.remainingPoints);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(Date.now() + err.msBeforeNext).toISOString()
      );

      return send(res, 429, {
        error: "Too many requests. Please try again later.",
      });
    }

    console.error("Rate limiter failure:", err);
    return send(res, 500, { error: "Internal server error" });
  }

  let client: PoolClient | undefined;

  try {
    const body = await readBody<{ email: string }>(req);
    const email = body.email.trim().toLowerCase();

    if (!email) {
      return send(res, 400, { error: "Email is required" });
    }

    client = await pool.connect();

    const userResult = await client.query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    const genericResponse = {
      message:
        "If an account exists for that email, a reset link has been sent.",
    };

    if (!user) {
      return send(res, 404, genericResponse);
    }

    //  send email with token
    //  send email with token
    //  send email with token

    const token = jwt.sign({ email: user.email }, env.RESET_PASSWORD_SECRET);
    //todo hash the token
    const resetEmailLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    // const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1hr
    const expiresAt = new Date(Date.now() + env.RESET_PASSWORD_EXPIRY * 1000);

    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE users 
         SET reset_password_token = $1, reset_password_token_expiry_time = $2
         WHERE email = $3 RETURNING *`,
        [token, expiresAt, email]
      );

      await client.query(
        `INSERT INTO email_outbox (to_email, template, payload, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [
          email,
          "reset_password",
          JSON.stringify({ resetLink: resetEmailLink }),
          expiresAt,
        ]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
    send(res, 200, genericResponse);
  } catch (error) {
    console.error("Error in forgot password:", error);
    send(res, 500, { error: "Internal server error" });
  } finally {
    client?.release();
  }
}

export async function handleResetPassword(
  req: IncomingMessage,
  res: ServerResponse
) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown_ip";

  try {
    console.log("Reset password");
    const body = await readBody<{ token: string; password: string }>(req);
    const { token, password } = body;

    if (!token || !password) {
      return send(res, 400, { error: "Token and new password are required" });
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, env.RESET_PASSWORD_SECRET);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return send(res, 401, { error: "Invalid or expired token" });
    }

    const { email } = decodedToken;

    try {
      await Promise.all([
        bruteForceLimiter.consume(ip),
        bruteForceLimiter.consume(email),
      ]);
    } catch (err) {
      if (isRateLimiterRejection(err)) {
        return send(res, 429, {
          error: "Too many requests. Please try again later",
        });
      }
      console.error("Rate limiter failure:", err);
      return send(res, 500, { error: "Internal server error" });
    }

    // Query the database to check reset password token
    const userQuery =
      "SELECT id, reset_password_token, reset_password_token_expiry_time FROM users WHERE email = $1";
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
      user.reset_password_token_expiry_time &&
      new Date(user.reset_password_token_expiry_time) < currentTime
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
          reset_password_token_expiry_time = NULL 
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
  try {
    const cookies = parseCookies(req);

    const refreshToken = cookies["refreshToken"];

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

    const { email, jti } = decoded;

    try {
      const incomingTokenHash = hashToken(refreshToken);

      const tokenResult = await pool.query(
        "SELECT * FROM refresh_tokens WHERE jti = $1 AND token_hash = $2",
        [jti, incomingTokenHash]
      );

      const storedToken = tokenResult.rows[0];

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
