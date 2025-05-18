import { z } from "zod";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  FRONTEND_URL: z
    .string()
    .url({ message: "FRONTEND_URL must be a valid URL" })
    .nonempty({ message: "FRONTEND_URL is required" }),

  EMAIL_USER: z.string().nonempty({ message: "EMAIL_USER is required" }),

  EMAIL_APP_PASSWORD: z
    .string()
    .nonempty({ message: "EMAIL_APP_PASSWORD is required" }),

  DB_HOST: z.string().nonempty({ message: "DB_HOST is required" }),

  DB_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), { message: "DB_PORT must be a valid number" })
    .default("5432"),

  DB_NAME: z.string().nonempty({ message: "DB_NAME is required" }),

  DB_USER: z.string().nonempty({ message: "DB_USER is required" }),

  DB_PASSWORD: z.string().nonempty({ message: "DB_PASSWORD is required" }),

  GOOGLE_CLIENT_ID: z
    .string()
    .nonempty({ message: "GOOGLE_CLIENT_ID is required" }),

  GOOGLE_CLIENT_SECRET: z
    .string()
    .nonempty({ message: "GOOGLE_CLIENT_SECRET is required" }),

  GOOGLE_REDIRECT_URI: z
    .string()
    .url({ message: "GOOGLE_REDIRECT_URI must be a valid URL" })
    .nonempty({ message: "GOOGLE_REDIRECT_URI is required" }),

  JWT_EXPIRATION: z
    .string()
    .nonempty({ message: "JWT_EXPIRATION is required" }),

  UPLOADTHING_TOKEN: z
    .string()
    .nonempty({ message: "UPLOADTHING_TOKEN is required" }),

  ACCESS_TOKEN_SECRET: z
    .string()
    .nonempty({ message: "ACCESS_TOKEN_SECRET is required" }),

  REFRESH_TOKEN_SECRET: z
    .string()
    .nonempty({ message: "REFRESH_TOKEN_SECRET is required" }),

  ACCESS_TOKEN_EXPIRY: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "ACCESS_TOKEN_EXPIRY must be a valid number",
    })
    .default("900"),

  REFRESH_TOKEN_EXPIRY: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val), {
      message: "REFRESH_TOKEN_EXPIRY must be a valid number",
    })
    .default("604800"),

  DOMAIN: z
    .string()
    .url({ message: "DOMAIN must be a valid URL" })
    .nonempty({ message: "DOMAIN is required" }),
});

// Parse and validate the environment variables
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error(
    "Environment variable validation failed:",
    envResult.error.format()
  );
  process.exit(1); // Exit the process if validation fails
}

// Export the validated environment variables
export const env = envResult.data;
