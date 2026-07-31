import { RateLimiterPostgres } from "rate-limiter-flexible";
import { pool } from "../config/db.config.js";

// Tier 3: Global API DoS Protection (Generous: 200 req / 15 mins)
export const standardApiLimiter = new RateLimiterPostgres({
  storeClient: pool,
  tableName: "rate_limits",
  points: 200,
  duration: 15 * 60,
  keyPrefix: "api_standard",
  tableCreated: true,
});

// Tier 2: Passwords & 2FA Codes (Anti-Brute Force: 7 req / 15 mins)
export const bruteForceLimiter = new RateLimiterPostgres({
  storeClient: pool,
  tableName: "rate_limits",
  points: 7,
  duration: 15 * 60,
  keyPrefix: "brute_force",
  tableCreated: true,
});

// Tier 1: Outbound Emails (Cost Protection: 4 req / 1 hour)
export const emailLimiter = new RateLimiterPostgres({
  storeClient: pool,
  tableName: "rate_limits",
  points: 4,
  duration: 60 * 60,
  keyPrefix: "email_out",
  tableCreated: true,
});

export const registerLimiter = new RateLimiterPostgres({
  storeClient: pool,
  tableName: "rate_limits",
  points: 5,
  duration: 60 * 60,
  keyPrefix: "register_fail",
  tableCreated: true,
});

export const loginLimiter = new RateLimiterPostgres({
  storeClient: pool,
  tableName: "rate_limits",
  points: 5,
  duration: 15 * 60,
  keyPrefix: "login_fail",
  tableCreated: true,
});
