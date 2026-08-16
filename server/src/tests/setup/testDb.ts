import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { pool } from "../../config/db.config.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../utils/helpers.js";

export interface TestUserOptions {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
  is_super_user?: boolean;
  is_two_factor_enabled?: boolean;
  two_factor_secret?: string | null;
  pending_email?: string | null;
  verification_code?: string | null;
  verification_code_expiry_time?: Date | null;
  oauth_provider?: string | null;
  oauth_id?: string | null;
  is_deleted?: boolean;
}

export async function cleanDatabase(): Promise<void> {
  const tables = [
    "two_fa_backup_codes",
    "magic_link_tokens",
    "refresh_tokens",
    "email_outbox",
    "rate_limits",
    "failed_login_attempts",
  ];

  for (const table of tables) {
    try {
      await pool.query(`DELETE FROM ${table};`);
    } catch {
      // ignore table permission errors if specific grant is missing
    }
  }

  // Ensure migration 007 (multi-device support) is applied by dropping unique_user_id constraint if present
  try {
    await pool.query(
      "ALTER TABLE public.refresh_tokens DROP CONSTRAINT IF EXISTS unique_user_id CASCADE;"
    );
    await pool.query(
      "ALTER TABLE public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_key CASCADE;"
    );
    await pool.query("DROP INDEX IF EXISTS public.unique_user_id;");
  } catch {
    // ignore if not table owner
  }

  // Nullify foreign key references that don't have CASCADE
  try {
    await pool.query("UPDATE login_activity SET user_id = NULL;");
  } catch {
    // ignore
  }

  try {
    await pool.query("DELETE FROM admin_audit_logs;");
  } catch {
    try {
      await pool.query(
        "UPDATE admin_audit_logs SET target_user_id = NULL, admin_id = NULL;"
      );
    } catch {
      // ignore
    }
  }

  try {
    await pool.query("DELETE FROM login_activity;");
  } catch {
    // ignore
  }

  // Clean test users
  try {
    await pool.query(
      "DELETE FROM users WHERE email LIKE '%@example.com' OR pending_email LIKE '%@example.com' OR email IS NULL;"
    );
  } catch (err) {
    console.error("Failed to delete test users:", err);
  }
}

/**
 * Create an active verified user in the database
 */
export async function createTestUser(options: TestUserOptions = {}) {
  const id = options.id || randomUUID();
  const name = options.name || "Test User";
  const email =
    options.email ||
    `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@example.com`;
  const rawPassword = options.password || "Password123!";
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const isActive = options.is_active !== undefined ? options.is_active : true;
  const isSuperUser = options.is_super_user || false;
  const is2FAEnabled = options.is_two_factor_enabled || false;
  const twoFactorSecret = options.two_factor_secret || null;
  const pendingEmail = options.pending_email || null;
  const verificationCode = options.verification_code || null;
  const verificationExpiry = options.verification_code_expiry_time || null;
  const oauthProvider = options.oauth_provider || null;
  const oauthId = options.oauth_id || null;
  const isDeleted = options.is_deleted || false;

  const query = `
    INSERT INTO users (
      id, name, email, password, is_active, is_super_user,
      is_two_factor_enabled, two_factor_secret, pending_email,
      verification_code, verification_code_expiry_time,
      oauth_provider, oauth_id, is_deleted, registration_date
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
    )
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    id,
    name,
    email,
    passwordHash,
    isActive,
    isSuperUser,
    is2FAEnabled,
    twoFactorSecret,
    pendingEmail,
    verificationCode,
    verificationExpiry,
    oauthProvider,
    oauthId,
    isDeleted,
  ]);

  const user = rows[0];

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    is_super_user: user.is_super_user,
  });

  return {
    user,
    rawPassword,
    accessToken,
  };
}

/**
 * Create a SuperUser (Admin) in the database
 */
export async function createTestSuperUser(options: TestUserOptions = {}) {
  return createTestUser({
    name: "Admin User",
    email: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@example.com`,
    is_super_user: true,
    is_active: true,
    ...options,
  });
}

/**
 * Create an unverified user with pending_email and verification code
 */
export async function createTestPendingUser(options: TestUserOptions = {}) {
  const pendingEmail =
    options.pending_email || `pending-${Date.now()}@example.com`;
  const verificationCode = options.verification_code || "123456";
  const verificationExpiry =
    options.verification_code_expiry_time ||
    new Date(Date.now() + 60 * 60 * 1000);

  return createTestUser({
    email: null as unknown as string,
    pending_email: pendingEmail,
    verification_code: verificationCode,
    verification_code_expiry_time: verificationExpiry,
    is_active: false,
    ...options,
  });
}

/**
 * Create an active refresh token session for a user
 */
export async function createTestSession(
  userOrId: { id: string; email?: string } | string,
  options: {
    email?: string;
    jti?: string;
    userAgent?: string;
    ipAddress?: string;
    expiresInSeconds?: number;
    revoked?: boolean;
  } = {}
) {
  const userId = typeof userOrId === "string" ? userOrId : userOrId.id;
  let email =
    options.email ||
    (typeof userOrId === "object" ? userOrId.email : undefined);

  if (!email) {
    const u = await pool.query("SELECT email FROM users WHERE id = $1", [
      userId,
    ]);
    email = u.rows[0]?.email;
  }

  const jti = options.jti || randomUUID();
  const rawToken = generateRefreshToken({ id: userId, email, jti });
  const tokenHash = hashToken(rawToken);
  const userAgent =
    options.userAgent ||
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0";
  const ipAddress = options.ipAddress || "127.0.0.1";
  const expiresInSeconds = options.expiresInSeconds || 7 * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const revoked = options.revoked || false;

  const query = `
    INSERT INTO refresh_tokens (
      id, jti, token_hash, user_id, expires_at, issued_at, last_used_at, ip_address, user_agent, revoked
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), $5, $6, $7
    )
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    jti,
    tokenHash,
    userId,
    expiresAt,
    ipAddress,
    userAgent,
    revoked,
  ]);

  return {
    session: rows[0],
    rawToken,
    jti,
  };
}

/**
 * Helper to fetch outbox emails from DB
 */
export async function getEmailOutboxEntries(toEmail?: string) {
  if (toEmail) {
    const { rows } = await pool.query(
      "SELECT * FROM email_outbox WHERE to_email = $1 ORDER BY created_at DESC",
      [toEmail]
    );
    return rows;
  }
  const { rows } = await pool.query(
    "SELECT * FROM email_outbox ORDER BY created_at DESC"
  );
  return rows;
}
