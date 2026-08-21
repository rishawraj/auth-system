import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

// Resolve from env or default to <cwd>/data inside the container
const DATA_DIR = env.UPLOAD_DIR || path.resolve(process.cwd(), "data");
const AVATARS_DIR = path.join(DATA_DIR, "avatars");

/**
 * Returns true when all four R2 / Cloudflare credentials are present and non-empty.
 */
function isR2Configured(): boolean {
  return !!(
    env.CF_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME
  );
}

/**
 * Write the avatar buffer to the local filesystem.
 * Creates the avatars directory if it doesn't exist.
 * Returns a URL path that Nginx can serve (e.g. `/uploads/avatars/user-5.png`).
 */
async function uploadToLocal(
  buffer: Buffer,
  key: string,
): Promise<string> {
  await fs.mkdir(AVATARS_DIR, { recursive: true });

  const filename = path.basename(key); // "user-5.png"
  const destPath = path.join(AVATARS_DIR, filename);
  await fs.writeFile(destPath, buffer);

  logger.info({ path: destPath }, "Avatar saved to local filesystem");
  return `/uploads/avatars/${filename}`;
}

/**
 * Upload an avatar image. Strategy:
 *   1. If R2 credentials are configured, attempt R2 upload.
 *   2. If R2 upload fails, fall back to local disk.
 *   3. If R2 is not configured, go straight to local disk.
 */
export async function uploadAvatar(
  buffer: Buffer,
  key: string,
  mimeType: string,
): Promise<string> {
  if (isR2Configured()) {
    try {
      // Dynamic import: avoids constructing the S3Client when creds are missing
      const { uploadToR2 } = await import("./uploadToR2.js");
      return await uploadToR2(buffer, key, mimeType);
    } catch (error) {
      logger.warn(
        { err: error },
        "R2 upload failed, falling back to local filesystem",
      );
      return uploadToLocal(buffer, key);
    }
  }

  return uploadToLocal(buffer, key);
}
