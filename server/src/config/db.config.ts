import pkg from "pg";
const { Pool } = pkg;
import { env } from "./env.js";
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
    console.log("connected to PostgreSQL db!");
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL: ", err);
  });
