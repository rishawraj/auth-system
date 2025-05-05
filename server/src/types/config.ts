// config.ts
import { z } from "zod";
import { User } from "../models/user.model.ts";

// Step 1: Define the schema
const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REDIRECT_URI: z
    .string()
    .url("GOOGLE_REDIRECT_URI must be a valid URL"),
  SECRET: z.string().min(1, "SECRET is required"),
  JWT_EXPIRATION: z.string().min(1, "JWT_EXPIRATION is required"), // e.g. "1d"
});

// Step 2: Parse and validate
const env = envSchema.parse(process.env);

// Step 3: Export your config
export const config = {
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_REDIRECT_URI,
  jwtSecret: env.SECRET,
  jwtExpiration: env.JWT_EXPIRATION,
};

export type { User };
