import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * Tests for the storage abstraction layer (server/src/utils/storage.ts).
 *
 * Seam: the public `uploadAvatar(buffer, key, mimeType)` function.
 *
 * We test three behaviors:
 *   1. When R2 env vars are present → delegates to uploadToR2 and returns its URL.
 *   2. When R2 env vars are absent  → writes file to local disk and returns a /uploads/ path.
 *   3. When R2 env vars are present but R2 upload throws → falls back to local disk.
 */

// We'll dynamically import the module under test after setting env vars,
// so each test group gets a fresh module evaluation.

const TEST_BUFFER = Buffer.from("fake-png-image-data");
const TEST_KEY = "avatar/user-42.png";
const TEST_MIME = "image/png";

describe("uploadAvatar — storage abstraction", () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Each test gets an isolated temp directory for local uploads
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "avatar-test-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.resetModules();

    // Clean up temp directory
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  });

  describe("when R2 credentials are configured", () => {
    test("delegates to uploadToR2 and returns the CDN URL", async () => {
      // Arrange: set R2 env vars
      vi.stubEnv("CF_ACCOUNT_ID", "fake-cf-account");
      vi.stubEnv("R2_ACCESS_KEY_ID", "fake-access-key");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "fake-secret-key");
      vi.stubEnv("R2_BUCKET_NAME", "fake-bucket");
      vi.stubEnv("UPLOAD_DIR", tmpDir);

      // Mock the R2 upload module so we don't need real S3 credentials
      vi.doMock("../utils/uploadToR2.js", () => ({
        uploadToR2: vi.fn().mockResolvedValue("https://cdn.example.com/avatar/user-42.png"),
      }));

      // Act: dynamically import to pick up the mocked module
      const { uploadAvatar } = await import("../utils/storage.js");
      const url = await uploadAvatar(TEST_BUFFER, TEST_KEY, TEST_MIME);

      // Assert: returns the CDN URL from R2
      expect(url).toBe("https://cdn.example.com/avatar/user-42.png");

      // Assert: no file was written locally
      const localFiles = await fs.readdir(path.join(tmpDir, "avatars")).catch(() => []);
      expect(localFiles).toHaveLength(0);
    });
  });

  describe("when R2 credentials are NOT configured", () => {
    test("writes the file to local disk and returns an /uploads/ path", async () => {
      // Arrange: ensure R2 env vars are absent
      vi.stubEnv("CF_ACCOUNT_ID", "");
      vi.stubEnv("R2_ACCESS_KEY_ID", "");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
      vi.stubEnv("R2_BUCKET_NAME", "");
      vi.stubEnv("UPLOAD_DIR", tmpDir);

      // Act
      const { uploadAvatar } = await import("../utils/storage.js");
      const url = await uploadAvatar(TEST_BUFFER, TEST_KEY, TEST_MIME);

      // Assert: returns a relative /uploads/ path
      expect(url).toBe("/uploads/avatars/user-42.png");

      // Assert: file actually exists on disk with correct contents
      const writtenFile = path.join(tmpDir, "avatars", "user-42.png");
      const contents = await fs.readFile(writtenFile);
      expect(contents).toEqual(TEST_BUFFER);
    });

    test("creates the avatars directory if it does not exist", async () => {
      vi.stubEnv("CF_ACCOUNT_ID", "");
      vi.stubEnv("R2_ACCESS_KEY_ID", "");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
      vi.stubEnv("R2_BUCKET_NAME", "");
      vi.stubEnv("UPLOAD_DIR", tmpDir);

      // Confirm the avatars subdirectory does not exist yet
      const existsBefore = await fs.access(path.join(tmpDir, "avatars")).then(() => true).catch(() => false);
      expect(existsBefore).toBe(false);

      // Act
      const { uploadAvatar } = await import("../utils/storage.js");
      await uploadAvatar(TEST_BUFFER, TEST_KEY, TEST_MIME);

      // Assert: directory was created
      const existsAfter = await fs.access(path.join(tmpDir, "avatars")).then(() => true).catch(() => false);
      expect(existsAfter).toBe(true);
    });

    test("overwrites existing avatar for the same user", async () => {
      vi.stubEnv("CF_ACCOUNT_ID", "");
      vi.stubEnv("R2_ACCESS_KEY_ID", "");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
      vi.stubEnv("R2_BUCKET_NAME", "");
      vi.stubEnv("UPLOAD_DIR", tmpDir);

      const { uploadAvatar } = await import("../utils/storage.js");

      // First upload
      const oldData = Buffer.from("old-avatar-data");
      await uploadAvatar(oldData, TEST_KEY, TEST_MIME);

      // Second upload with new data
      const newData = Buffer.from("new-avatar-data");
      await uploadAvatar(newData, TEST_KEY, TEST_MIME);

      // Assert: file contains the new data, not the old
      const writtenFile = path.join(tmpDir, "avatars", "user-42.png");
      const contents = await fs.readFile(writtenFile);
      expect(contents).toEqual(newData);
    });
  });

  describe("when R2 is configured but upload fails", () => {
    test("falls back to local disk and returns an /uploads/ path", async () => {
      // Arrange: R2 env vars are set, but the upload will throw
      vi.stubEnv("CF_ACCOUNT_ID", "fake-cf-account");
      vi.stubEnv("R2_ACCESS_KEY_ID", "fake-access-key");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "fake-secret-key");
      vi.stubEnv("R2_BUCKET_NAME", "fake-bucket");
      vi.stubEnv("UPLOAD_DIR", tmpDir);

      vi.doMock("../utils/uploadToR2.js", () => ({
        uploadToR2: vi.fn().mockRejectedValue(new Error("S3 network timeout")),
      }));

      // Act
      const { uploadAvatar } = await import("../utils/storage.js");
      const url = await uploadAvatar(TEST_BUFFER, TEST_KEY, TEST_MIME);

      // Assert: fell back to local
      expect(url).toBe("/uploads/avatars/user-42.png");

      // Assert: file exists on disk
      const writtenFile = path.join(tmpDir, "avatars", "user-42.png");
      const contents = await fs.readFile(writtenFile);
      expect(contents).toEqual(TEST_BUFFER);
    });
  });
});
