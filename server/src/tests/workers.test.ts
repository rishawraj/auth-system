import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { pool } from "../config/db.config.js";
import { cleanDatabase } from "./setup/testDb.js";
import { processEmailOutbox } from "../workers/emailOutbox.worker.js";
import { setupEmailMock } from "./setup/mocks.js";

describe("Background Workers & Cron Tests (processEmailOutbox)", () => {
  let emailMock: ReturnType<typeof setupEmailMock>;

  beforeAll(async () => {
    emailMock = setupEmailMock();
    await cleanDatabase();
  });

  afterAll(async () => {
    emailMock.restore();
    await cleanDatabase();
  });

  beforeEach(async () => {
    emailMock.clearSentEmails();
    await cleanDatabase();
  });

  test("processes pending email in outbox and marks status as 'sent'", async () => {
    const toEmail = `worker-test-${Date.now()}@example.com`;

    // 1. Insert pending email into email_outbox
    await pool.query(
      `INSERT INTO email_outbox (to_email, template, payload, status, next_attempt_at)
       VALUES ($1, 'verification_code', '{"code": "123456"}'::jsonb, 'pending', NOW() - INTERVAL '1 minute')`,
      [toEmail]
    );

    // 2. Run email worker
    await processEmailOutbox();

    // 3. Verify mock email was sent
    expect(emailMock.sentEmails.length).toBe(1);
    expect(emailMock.sentEmails[0].to).toBe(toEmail);

    // 4. Verify DB status updated to 'sent'
    const { rows } = await pool.query(
      "SELECT status, attempts FROM email_outbox WHERE to_email = $1",
      [toEmail]
    );
    expect(rows[0].status).toBe("sent");
  });

  test("handles dispatch failure by incrementing attempts and setting backoff", async () => {
    const toEmail = `failing-test-${Date.now()}@example.com`;

    // Insert pending email with unknown template to trigger error
    await pool.query(
      `INSERT INTO email_outbox (to_email, template, payload, status, attempts, max_attempts, next_attempt_at)
       VALUES ($1, 'invalid_template_xyz', '{}'::jsonb, 'pending', 0, 3, NOW() - INTERVAL '1 minute')`,
      [toEmail]
    );

    // Run email worker
    await processEmailOutbox();

    // Verify DB recorded error and incremented attempts
    const { rows } = await pool.query(
      "SELECT status, attempts, last_error FROM email_outbox WHERE to_email = $1",
      [toEmail]
    );
    expect(rows[0].attempts).toBe(1);
    expect(rows[0].last_error).toContain("Unknown email template");
  });
});
