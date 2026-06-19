import fs from "fs/promises";
import path from "path";
import process from "process";
import { pool } from "../src/config/db.config.js";

type MigrationRow = {
  name: string;
};

async function migrate() {
  const client = await pool.connect();
  let failed = false;

  try {
    // await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.resolve(process.cwd(), "migrations");

    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const { rows } = await client.query<MigrationRow>(
      "SELECT name FROM migrations"
    );

    const executed = new Set(rows.map((row) => row.name));

    for (const file of files) {
      if (executed.has(file)) {
        console.log(`✅ Skipping ${file}`);
        continue;
      }
      console.log(`➡️ RUnning ${file}`);

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf-8");

      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`✅ Completed ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("✅ All migratiosn completed");
  } catch (error) {
    console.error("Migrations failed: ", error);
    failed = true;
  } finally {
    client.release();
  }

  // pool.end() can hang 3s
  await Promise.race([
    pool.end(),
    new Promise<void>((resolve) => setTimeout(resolve, 3000)),
  ]);

  process.exit(failed ? 1 : 0);
}

migrate();
