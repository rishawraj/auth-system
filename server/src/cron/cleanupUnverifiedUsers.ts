import cron from "node-cron";
import { pool } from "../config/db.config.js";
import { cronLogger } from "../utils/logger.js";

async function cleanupUnverifiedUsers() {
  try {
    await pool.query("SELECT cleanup_unverified_users()");
    cronLogger.info("Unverified user cleanup completed successfully");
  } catch (error) {
    cronLogger.error({ err: error }, "Failed to cleanup unverified users");
  }
}

export function startCronJobs() {
  // run on startup
  void cleanupUnverifiedUsers();
  // Run every day at midnight
  cron.schedule("0 0 * * *", () => {
    void cleanupUnverifiedUsers();
  });

  cronLogger.info("Scheduled unverified user cleanup (daily at 00:00)");
}

