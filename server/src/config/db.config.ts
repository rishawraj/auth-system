import pkg from "pg";
const { Pool } = pkg;
import { env } from "./env.js";
import { dbLogger } from "../utils/logger.js";
import "dotenv/config";

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

pool
  .connect()
  .then(() => {
    dbLogger.info(
      { host: env.DB_HOST, port: env.DB_PORT, database: env.DB_NAME },
      "Connected to PostgreSQL database"
    );
  })
  .catch((err) => {
    dbLogger.error({ err }, "Error connecting to PostgreSQL database");
  });

