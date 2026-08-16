import { pool } from "../config/db.config.js";
import { env } from "../config/env.js";
import { dispatchEmail } from "../utils/dsipatchEmail.js";
import { workerLogger } from "../utils/logger.js";

const BATCH_SIZE = 20;

export async function processEmailOutbox() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT * FROM email_outbox
         WHERE status = 'pending' AND next_attempt_at <= now()
         ORDER BY id
         LIMIT $1
         FOR UPDATE SKIP LOCKED
        `,
      [BATCH_SIZE]
    );

    for (const row of rows) {
      try {
        await dispatchEmail(row.template, row.to_email, row.payload);

        workerLogger.info(
          { outboxId: row.id, template: row.template, recipient: row.to_email },
          `Dispatched email outbox #${row.id}`
        );

        await client.query(
          `UPDATE email_outbox SET status = 'sent', updated_at = now() WHERE id = $1`,
          [row.id]
        );
      } catch (error) {
        workerLogger.error(
          { err: error, outboxId: row.id, template: row.template },
          `Failed to dispatch email outbox #${row.id}`
        );
        const attempts = row.attempts + 1;
        const exhausted = attempts >= row.max_attempts;

        const backoffConfig = {
          baseDelaySeconds: 60,
          multiplier: 2,
          maxDelaySeconds: 3600,
          isTestMode: env.NODE_ENV !== "production",
        };

        const getBackoff = (
          attempts: number,
          config: typeof backoffConfig,
        ) => {
          if (config.isTestMode) return 0.1; // 100 milliseconds for instant test execution

          const { baseDelaySeconds, multiplier, maxDelaySeconds } = config;
          return Math.min(
            baseDelaySeconds * multiplier ** attempts,
            maxDelaySeconds
          );
        };

        // Usage:
        const backoffSeconds = getBackoff(attempts, backoffConfig);

        await client.query(
          `UPDATE email_outbox
           SET attempts = $1,
               status = $2,
               last_error = $3,
               next_attempt_at = now() + ($4 || ' seconds')::interval,
               updated_at = now()
            WHERE id = $5
          `,
          [
            attempts,
            exhausted ? "failed" : "pending",
            String(error),
            backoffSeconds,
            row.id,
          ]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    workerLogger.error({ err: error }, "Outbox batch processing transaction failed");
  } finally {
    client?.release();
  }
}

