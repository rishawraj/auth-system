//todo
// add to package.json

// import { readFileSync, readdirSync } from "fs";
// import { join } from "path";
// import { Client } from "pg";

// const client = new Client({
//   connectionString: "postgres://user:pass@localhost:5432/db",
// });

// async function runMigrations() {
//   await client.connect();

//   // Ensure migrations table exists
//   await client.query(`
//     CREATE TABLE IF NOT EXISTS migrations (
//       id SERIAL PRIMARY KEY,
//       name TEXT UNIQUE,
//       run_on TIMESTAMP DEFAULT now()
//     )
//   `);

//   const files = readdirSync("./migrations")
//     .filter((f) => f.endsWith(".sql"))
//     .sort();

//   for (const file of files) {
//     const alreadyRun = await client.query(
//       "SELECT 1 FROM migrations WHERE name = $1",
//       [file]
//     );
//     if (alreadyRun.rowCount === 0) {
//       const sql = readFileSync(join(__dirname, "../migrations", file), "utf8");
//       console.log(`Running ${file}`);
//       await client.query(sql);
//       await client.query("INSERT INTO migrations(name) VALUES ($1)", [file]);
//     }
//   }

//   await client.end();
// }

// runMigrations().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });
