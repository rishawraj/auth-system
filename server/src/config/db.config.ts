import pkg from "pg";
const { Pool } = pkg;
import "dotenv/config";

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// test the connection

pool
  .connect()
  .then(() => {
    console.log("connected to PostgreSQL db!");
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL: ", err);
  });
