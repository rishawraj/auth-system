import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), "server", ".env.development"),
});
dotenv.config({
  path: path.resolve(process.cwd(), ".env.development"),
});

import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { TOTP } from "otpauth";
import { pool } from "../../server/src/config/db.config.js";

export function getUniqueEmail(prefix = "e2e-user"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`;
}

export function generateTotp(secretBase32: string): string {
  const totp = new TOTP({
    issuer: "auth-system",
    label: "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secretBase32,
  });
  return totp.generate();
}

export async function cleanDatabase(): Promise<void> {
  const tables = [
    "two_fa_backup_codes",
    "refresh_tokens",
    "email_outbox",
    "rate_limits",
    "failed_login_attempts",
  ];

  for (const table of tables) {
    try {
      await pool.query(`DELETE FROM ${table};`);
    } catch {
      // ignore table permission error
    }
  }

  // Nullify foreign key references that don't have ON DELETE CASCADE
  try {
    await pool.query("UPDATE login_activity SET user_id = NULL;");
  } catch {
    // ignore
  }

  try {
    await pool.query(
      "UPDATE admin_audit_logs SET target_user_id = NULL, admin_id = NULL;"
    );
  } catch {
    // ignore
  }

  try {
    await pool.query(
      "DELETE FROM users WHERE email LIKE '%@example.com' OR pending_email LIKE '%@example.com' OR email IS NULL;"
    );
  } catch {
    // ignore
  }
}

export async function getVerificationCode(pendingEmail: string): Promise<string | null> {
  const result = await pool.query(
    "SELECT verification_code FROM users WHERE pending_email = $1 LIMIT 1;",
    [pendingEmail]
  );
  if (result.rows.length > 0 && result.rows[0].verification_code) {
    return result.rows[0].verification_code;
  }

  // Fallback check email_outbox
  const outbox = await pool.query(
    "SELECT payload FROM email_outbox WHERE recipient_email = $1 ORDER BY created_at DESC LIMIT 1;",
    [pendingEmail]
  );
  if (outbox.rows.length > 0) {
    const payload = outbox.rows[0].payload;
    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    return parsed.code || null;
  }

  return null;
}

export async function createTestUser(options: {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
  is_super_user?: boolean;
  is_two_factor_enabled?: boolean;
  two_factor_secret?: string | null;
}) {
  const id = options.id || randomUUID();
  const email = options.email || getUniqueEmail();
  const name = options.name || "Test User";
  const password = options.password || "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const isSuperUser = options.is_super_user || false;
  const is2FA = options.is_two_factor_enabled || false;
  const secret = options.two_factor_secret || null;

  const result = await pool.query(
    `INSERT INTO users (
      id, name, email, password, is_active, is_super_user,
      is_two_factor_enabled, two_factor_secret, registration_date
    ) VALUES ($1, $2, $3, $4, true, $5, $6, $7, NOW())
    RETURNING id, name, email, is_super_user, is_two_factor_enabled, two_factor_secret;`,
    [id, name, email, passwordHash, isSuperUser, is2FA, secret]
  );

  return { ...result.rows[0], plainPassword: password };
}
