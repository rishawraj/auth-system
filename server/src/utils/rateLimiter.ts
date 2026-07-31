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

export function isRateLimiterRejection(err: unknown): boolean {
  // rate-limiter-flexible resolves with a RateLimiterRes-shaped object on
  // an actual rate-limit hit, but throws a real Error on store/connection
  // failures. Don't conflate the two.
  return (
    typeof err === "object" &&
    err !== null &&
    !(err instanceof Error) &&
    "remainingPoints" in err
  );
}
