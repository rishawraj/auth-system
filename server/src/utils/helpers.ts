import { IncomingMessage, ServerResponse } from "http";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { pool } from "../config/db.config.js";

type CodeWithExpiry = {
  code: string;
  expiresAt: Date;
};

export function generateSixDigitCodeWithExpiry(
  minutesValid = 60
): CodeWithExpiry {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + minutesValid * 60 * 1000); // e.g. 60 minutes from now
  return { code, expiresAt };
}

export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function readBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(
          error instanceof Error ? error : new Error("Failed to parse JSON")
        );
      }
    });
    req.on("error", (error) => reject(error));
  });
}

export function send(
  res: ServerResponse,
  statusCode: number,
  data: object
): void {
  res.writeHead(statusCode, { "Content-type": "application/json" });
  res.end(JSON.stringify(data));
}

export function generateAccessToken(payload: object) {
  const secret = env.ACCESS_TOKEN_SECRET;

  return jwt.sign(payload, secret, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(payload: object) {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET!, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY,
  });
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = decodeURIComponent(value);
    });
  }

  return cookies;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

type SetCookieOptions = {
  name: string;
  value: string;
  res: ServerResponse;
  maxAge?: number; // in seconds
  path?: string;
  isProduction?: boolean;
};

export function setServerCookie({
  name,
  value,
  res,
  maxAge = env.REFRESH_TOKEN_EXPIRY,
  path = "/",
  isProduction = process.env.NODE_ENV === "production",
}: SetCookieOptions) {
  const cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; SameSite=Strict; ${
    isProduction ? "Secure;" : ""
  } Max-Age=${maxAge}`;

  // Append cookie
  res.setHeader("Set-Cookie", cookie);
}

export interface BackupCode {
  raw: string; // shown to user
  hash: string; // stored in DB
}

/**
 * Generate 10 backup codes in format XXXX-XXXX
 */
export async function generateBackupCodes(count = 10): Promise<BackupCode[]> {
  const codes: BackupCode[] = [];

  for (let i = 0; i < count; i++) {
    // e.g., "D8F2-A1B9"
    const raw = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;

    // You can use bcrypt or SHA256. SHA256 is faster for backup codes.
    const hash = crypto.createHash("sha256").update(formatted).digest("hex");

    codes.push({ raw: formatted, hash });
  }

  return codes;
}

export async function deleteBackupCodes(userId: string) {
  console.log(`[DEBUG] Attempting to delete codes for user: ${userId}`);
  try {
    await pool.query("DELETE FROM two_fa_backup_codes WHERE user_id = $1", [
      userId,
    ]);
    console.log(`[DEBUG] Successfully deleted codes for user: ${userId}`); // This log will likely not appear
    return true;
  } catch (error) {
    console.error(
      `[DEBUG] Error deleting backup codes for user: ${userId}`,
      error
    );
    return false;
  }
}

//
export function normalizeIP(ip: string | undefined): string | undefined {
  return ip?.replace("::ffff:", "");
}

export async function logLoginAttempt({
  userId,
  email,
  success,
  ip,
  userAgent,
  oauthProvider = null,
}: {
  userId: string | null;
  email: string;
  success: boolean;
  ip: string | null;
  userAgent?: string;
  oauthProvider?: string | null;
}) {
  try {
    let attemptCount = 1;

    if (userId) {
      await pool.query("BEGIN");

      const result = await pool.query(
        `
        SELECT attempt_count
        FROM login_activity
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [userId]
      );

      const prev = result.rows[0]?.attempt_count ?? 0;
      attemptCount = success ? 1 : prev + 1;
    }

    await pool.query(
      `
      INSERT INTO login_activity
      (user_id, email, success, ip_address, user_agent, oauth_provider, attempt_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [userId, email, success, ip, userAgent, oauthProvider, attemptCount]
    );

    if (userId) {
      await pool.query("COMMIT");
    }
  } catch (error) {
    if (userId) {
      await pool.query("ROLLBACK");
    }

    // never block auth because logging failed.
    console.error("Failed to log login attemp:", error);
  }
}
