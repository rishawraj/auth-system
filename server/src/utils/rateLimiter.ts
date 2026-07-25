import { RateLimiterPostgres } from "rate-limiter-flexible";
import { pool } from "../config/db.config.js";

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
