import cron from "node-cron";
import { pool } from "../config/db.config.js";

async function cleanupUnverifiedUsers() {
  try {
    await pool.query("SELECT cleanup_unverified_users()");
    console.log("[Cron] Unverified user cleanup completed.");
  } catch (error) {
    console.error("[Cron] Failed to cleanup unverified users:", error);
  }
}

export function startCronJobs() {
  // run on startup
  void cleanupUnverifiedUsers();
  // Run every day at midnight
  cron.schedule("0 0 * * *", () => {
    void cleanupUnverifiedUsers();
  });

  console.log("[Cron] Scheduled unverified user cleanup (daily at 00:00).");
}
