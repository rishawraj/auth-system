import { IncomingMessage, ServerResponse } from "node:http";
import {
  deleteBackupCodes,
  generateBackupCodes,
  generateSixDigitCodeWithExpiry,
  readBody,
  send,
} from "../utils/helpers.js";
import { pool } from "../config/db.config.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Secret, TOTP } from "otpauth";
import qrcode from "qrcode";
import { z } from "zod";
import bcrypt from "bcrypt";
import {
  sendDisable2FAOtpEmailWorker,
  sendRegenerate2FABackupCodesOTPEmailWorker,
} from "../workers/sendEmail.Worker.js";
import { User } from "../models/user.model.js";
import crypto from "crypto";

const SECRET = env.ACCESS_TOKEN_SECRET;

export async function EnableTwofactorAuth(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    console.log("enable 2fa");
    const authHeader = req.headers.authorization;

    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];

    if (!token) {
      return send(res, 401, { error: "Invalid authorization format" });
    }

    try {
      const decoded = jwt.verify(token, SECRET);

      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        // try catch

        // check if user exists in the database
        const userResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [decoded.email]
        );

        const user = userResult.rows[0];

        if (!user) {
          return send(res, 404, { error: "User not found" });
        }

        // 2fa
        const secret = new Secret({ size: 20 });
        const secretBase32 = secret.base32;
        console.log(secretBase32);

        // save secret
        await pool.query(
          "UPDATE users SET tmp_two_factor_secret = $1 WHERE id = $2",
          [secretBase32, user.id]
        );

        // generate backup codes

        // generate QRCode 2fa
        const totp = new TOTP({
          issuer: "auth-system",
          label: user.email,
          secret: secretBase32,
          digits: 6,
          period: 30,
        });

        const OtpAuthUri = totp.toString();
        const qrcodeImageUrl = await qrcode.toDataURL(OtpAuthUri);

        send(res, 200, {
          id: user.id,
          is_two_factor_enabled: user.is_two_factor_enabled,
          qrcodeImageUrl: qrcodeImageUrl,
          secret: secretBase32,
        });
      } else {
        send(res, 400, { error: "Invalid token payload" });
      }
    } catch (error) {
      console.log(error);
      send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.error("Profile error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

const VerifyTwoFactorAuthSchema = z.object({
  code: z.string(),
  id: z.string(),
});

const TwoFactorAuthSchema = z.object({
  code: z.string(),
});

const DisableTwoFactorAuthSchema = z.object({
  password: z.string(),
});

const DisableTwoFactorAuthOTPVerifySchema = z.object({
  code: z.string(),
});

const ValidateBackupCodeSchema = z.object({
  code: z.string(),
});

const RegenerateBackupCodesEmailSchema = z.object({
  password: z.string(),
  totp: z.string(),
});

export async function VerifyTwoFactorAuth(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    console.log("verify 2 auth");

    const body = await readBody<{ code: string; id: string }>(req);
    const result = VerifyTwoFactorAuthSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { code, id } = result.data;
    console.log({ code, id });

    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    const user = userResult.rows[0];

    if (!user) {
      return send(res, 404, { error: "User not found" });
    }

    const secret = user.tmp_two_factor_secret;

    const totp = new TOTP({
      issuer: "auth-system",
      label: user.email,
      secret: secret,
      digits: 6,
      period: 30,
    });

    const delta = totp.validate({ token: code, window: 1 });
    console.log({ delta });
    if (delta === null) {
      return send(res, 400, { error: "Invalid 2fa code" });
    }

    try {
      await pool.query(
        "UPDATE users SET is_two_factor_enabled = $1, two_factor_secret = $2 WHERE id = $3",
        [true, secret, id]
      );
    } catch (error) {
      console.log(error);
      send(res, 500, { error: "unable to enable 2fa in the database" });
    }

    //
    const codes = await generateBackupCodes();
    console.log(codes);

    // save the backup codes
    await Promise.all(
      codes.map(async (code) => {
        await pool.query(
          "INSERT INTO two_fa_backup_codes (user_id, code_hash) VALUES ($1, $2)",
          [user.id, code.hash]
        );
      })
    );

    const rawCodes = codes.map((c) => c.raw);

    send(res, 200, {
      message: "2fa enabled",
      rawCodes,
    });
  } catch (error) {
    console.error("Profile error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function DisableTwoFactorAuth(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];

    if (!token) {
      return send(res, 401, { error: "Invalid authorization format" });
    }

    const body = await readBody(req);
    const result = DisableTwoFactorAuthSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { password } = result.data;

    if (!password) {
      return send(res, 400, { error: "Invalid password" });
    }

    try {
      const decoded = jwt.verify(token, SECRET);

      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        const userResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [decoded.email]
        );

        const user = userResult.rows[0];

        if (!user) {
          return send(res, 404, { error: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return send(res, 401, { error: "Invalid password" });
        }

        try {
          await pool.query(
            "UPDATE users SET is_two_factor_enabled = $1, two_factor_secret = $2 WHERE id = $3",
            [false, null, user.id]
          );

          // Delete backup codes
          await deleteBackupCodes(user.id);
        } catch (error) {
          console.log(error);
          send(res, 500, { error: "unable to disable 2fa in the database" });
        }

        send(res, 200, {
          message: "2fa disabled",
        });
      } else {
        return send(res, 401, { error: "Invalid token" });
      }
    } catch (error) {
      console.error("error disabling 2fa:", error);
      send(res, 500, { error: "Internal server error" });
    }
  } catch (error) {
    console.error("error disabling 2fa:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function ValidateTwoFactorAuth(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];

    if (!token) {
      return send(res, 401, { error: "Invalid authorization format" });
    }

    const body = await readBody(req);
    const result = TwoFactorAuthSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { code } = result.data;

    if (!code) {
      return send(res, 400, { error: "Invalid 2fa code" });
    }
    //
    try {
      const decoded = jwt.verify(token, SECRET);

      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        const userResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [decoded.email]
        );

        const user = userResult.rows[0];

        if (!user) {
          return send(res, 404, { error: "User not found" });
        }

        const secret = user.two_factor_secret;

        const totp = new TOTP({
          issuer: "auth-system",
          label: user.email,
          secret: secret,
          digits: 6,
          period: 30,
        });

        const delta = totp.validate({ token: code, window: 1 });
        console.log({ delta });
        if (delta === null) {
          return send(res, 400, { error: "Invalid 2fa code" });
        }

        send(res, 200, {
          message: "2fa validated",
        });
      } else {
        send(res, 401, { error: "Invalid token" });
      }
    } catch (error) {
      console.log(error);
      send(res, 401, { error: "Invalid token" });
    }

    //
  } catch (error) {
    console.log(error);
    send(res, 500, { error: "Internal server error" });
  }
}

// disable 2fa for google auth
export async function DisableTwoFactorAuthSendOTP(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];

    if (!token) {
      return send(res, 401, { error: "Invalid authorization format" });
    }

    try {
      const decoded = jwt.verify(token, SECRET);

      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        const userResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [decoded.email]
        );

        const user = userResult.rows[0];

        if (!user) {
          return send(res, 404, { error: "User not found" });
        }

        const { code, expiresAt } = generateSixDigitCodeWithExpiry();

        await pool.query(
          `
          UPDATE users
          SET disable_2fa_otp = $1,
              disable_2fa_otp_expiry_time = $2
          WHERE id = $3
          `,
          [code, expiresAt, user.id]
        );

        // send email
        setImmediate(() => sendDisable2FAOtpEmailWorker(user.email, code));
      } else {
        return send(res, 401, { error: "Invalid token" });
      }
    } catch (error) {
      console.log(error);
      return send(res, 401, { error: "Invalid token" });
    }

    // generate 6 digit code
  } catch (error) {
    console.log(error);
    send(res, 500, { error: "Internal server error" });
  }

  // setImmediate(() => sendVerificationEmailWorker(email, verificationCode));

  send(res, 200, {
    message: "email sent",
  });
}

export async function DisableTwoFactorAuthVerifyOTP(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];
    console.log(token);

    if (!token) {
      return send(res, 401, { error: "Invalid authorization format" });
    }

    const body = await readBody(req);
    console.log(body);

    const result = DisableTwoFactorAuthOTPVerifySchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { code } = result.data;
    console.log({ code });

    if (!code) {
      return send(res, 400, { error: "Invalid code" });
    }

    try {
      const decoded = jwt.verify(token, SECRET);

      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        const userResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [decoded.email]
        );

        const user: User = userResult.rows[0];

        if (!user) {
          return send(res, 404, { error: "User not found" });
        }

        if (user.disable_2fa_otp !== code) {
          return send(res, 400, { error: "Invalid code" });
        }

        if (user.disable_2fa_otp_expiry_time < new Date()) {
          return send(res, 400, { error: "Code expired" });
        }

        // Delete backup codes first
        await deleteBackupCodes(user.id);

        await pool.query(
          `
          UPDATE users
          SET is_two_factor_enabled = false,
              disable_2fa_otp = NULL,
              disable_2fa_otp_expiry_time = NULL,
              two_factor_secret = NULL
          WHERE id = $1
          `,
          [user.id]
        );
      }
    } catch (error) {
      console.log(error);
      return send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.log(error);
    send(res, 500, { error: "Internal server error" });
  }

  send(res, 200, {
    message: "2fa disabled",
  });
}

export async function ValidateBackupCode(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return send(res, 401, { error: "Invalid authorization format" });

    const body = await readBody(req);
    const result = ValidateBackupCodeSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { code } = result.data;
    if (!code) return send(res, 400, { error: "Invalid backup code" });

    try {
      const decoded = jwt.verify(token, SECRET);
      if (
        typeof decoded === "object" &&
        decoded !== null &&
        "email" in decoded
      ) {
        const userResult = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [decoded.email]
        );

        const user = userResult.rows[0];
        if (!user) return send(res, 404, { error: "User not found" });

        // Hash the provided backup code
        const hash = crypto.createHash("sha256").update(code).digest("hex");

        // Check if the backup code exists and hasn't been used
        const backupCodeResult = await pool.query(
          "SELECT * FROM two_fa_backup_codes WHERE user_id = $1 AND code_hash = $2 AND used = false",
          [user.id, hash]
        );

        if (backupCodeResult.rows.length === 0) {
          return send(res, 400, {
            error: "Invalid or already used backup code",
          });
        }

        // Mark the backup code as used
        await pool.query(
          "UPDATE two_fa_backup_codes SET used = true, used_at = NOW() WHERE id = $1",
          [backupCodeResult.rows[0].id]
        );

        send(res, 200, { message: "Backup code validated successfully" });
      } else {
        send(res, 401, { error: "Invalid token" });
      }
    } catch (error) {
      console.error("Error validating backup code:", error);
      send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.error("Error in backup code validation:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

export async function RegenerateBackupCodesEmailUser(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return send(res, 401, { error: "Invalid authorization format" });

    const body = await readBody(req);
    const result = RegenerateBackupCodesEmailSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    try {
      const decoded = jwt.verify(token, SECRET);
      if (
        typeof decoded !== "object" ||
        decoded === null ||
        !("email" in decoded)
      ) {
        return send(res, 401, { error: "Invalid token payload" });
      }

      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [decoded.email]
      );

      const user = userResult.rows[0];
      if (!user) return send(res, 404, { error: "User not found" });

      // Verify password
      const passwordMatch = await bcrypt.compare(
        result.data.password,
        user.password
      );
      if (!passwordMatch) {
        return send(res, 401, { error: "Invalid password" });
      }

      // Verify TOTP
      const secret = user.two_factor_secret;
      if (!secret) {
        return send(res, 400, {
          error: "Two-factor authentication is not enabled",
        });
      }

      const totp = new TOTP({
        issuer: "auth-system",
        label: user.email,
        secret: secret,
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token: result.data.totp, window: 1 });
      if (delta === null) {
        return send(res, 401, { error: "Invalid TOTP code" });
      }

      // Begin transaction for atomic operations
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Delete existing backup codes
        await client.query(
          "DELETE FROM two_fa_backup_codes WHERE user_id = $1",
          [user.id]
        );

        // Generate new backup codes
        const backupCodes = await generateBackupCodes();

        // Insert new backup codes
        await Promise.all(
          backupCodes.map(async (code) => {
            await client.query(
              "INSERT INTO two_fa_backup_codes (user_id, code_hash) VALUES ($1, $2)",
              [user.id, code.hash]
            );
          })
        );

        await client.query("COMMIT");

        const rawCodes = backupCodes.map((code) => code.raw);
        return send(res, 200, { rawCodes });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Transaction error:", error);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Token verification error:", error);
      return send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return send(res, 500, { error: "Internal server error" });
  }
}

export async function RegenerateBackupCodesSendOTPGoogleUser(
  req: IncomingMessage,
  res: ServerResponse
) {
  console.log("[CONTROLLER] regenerate backup codes sms");

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return send(res, 401, { error: "Invalid authorization format" });

    const decoded = jwt.verify(token, SECRET);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("email" in decoded)
    ) {
      return send(res, 401, { error: "Invalid token payload" });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [decoded.email]
    );

    const user = userResult.rows[0];
    if (!user) return send(res, 404, { error: "User not found" });

    const secret = user.two_factor_secret;
    if (!secret) {
      return send(res, 400, {
        error: "Two-factor authentication is not enabled",
      });
    }

    // send otp

    const { code, expiresAt } = generateSixDigitCodeWithExpiry(10); // 10 minutes

    await pool.query(
      `
          UPDATE users
          SET regenerate_2fa_otp = $1,
             regenerate_2fa_otp_expiry = $2
          WHERE id = $3
          `,
      [code, expiresAt, user.id]
    );

    // send email
    setImmediate(() =>
      sendRegenerate2FABackupCodesOTPEmailWorker(user.email, code)
    );
    send(res, 200, { message: "OTP sent successfully" });
  } catch (error) {
    console.error("Server error:", error);
    return send(res, 500, { error: "Internal server error" });
  }
}
export async function RegenerateBackupCodesGoogleUser(
  req: IncomingMessage,
  res: ServerResponse
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return send(res, 401, { error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return send(res, 401, { error: "Invalid authorization format" });

    const body = await readBody(req);
    const result = z
      .object({
        otp: z.string(),
        totp: z.string(),
      })
      .safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    try {
      const decoded = jwt.verify(token, SECRET);
      if (
        typeof decoded !== "object" ||
        decoded === null ||
        !("email" in decoded)
      ) {
        return send(res, 401, { error: "Invalid token payload" });
      }

      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [decoded.email]
      );

      const user = userResult.rows[0];
      if (!user) return send(res, 404, { error: "User not found" });

      // Verify OTP
      if (!user.regenerate_2fa_otp || !user.regenerate_2fa_otp_expiry) {
        return send(res, 400, { error: "Please request a new OTP" });
      }

      if (user.regenerate_2fa_otp !== result.data.otp) {
        return send(res, 400, { error: "Invalid OTP" });
      }

      if (new Date(user.regenerate_2fa_otp_expiry) < new Date()) {
        return send(res, 400, { error: "OTP has expired" });
      }

      // Verify TOTP
      const secret = user.two_factor_secret;
      if (!secret) {
        return send(res, 400, {
          error: "Two-factor authentication is not enabled",
        });
      }

      const totp = new TOTP({
        issuer: "auth-system",
        label: user.email,
        secret: secret,
        digits: 6,
        period: 30,
      });

      const delta = totp.validate({ token: result.data.totp, window: 1 });
      if (delta === null) {
        return send(res, 401, { error: "Invalid TOTP code" });
      }

      // Begin transaction for atomic operations
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Clear the OTP
        await client.query(
          `UPDATE users 
           SET regenerate_2fa_otp = NULL,
               regenerate_2fa_otp_expiry = NULL
           WHERE id = $1`,
          [user.id]
        );

        // Delete existing backup codes
        await client.query(
          "DELETE FROM two_fa_backup_codes WHERE user_id = $1",
          [user.id]
        );

        // Generate new backup codes
        const backupCodes = await generateBackupCodes();

        // Insert new backup codes
        await Promise.all(
          backupCodes.map(async (code) => {
            await client.query(
              "INSERT INTO two_fa_backup_codes (user_id, code_hash) VALUES ($1, $2)",
              [user.id, code.hash]
            );
          })
        );

        await client.query("COMMIT");

        const rawCodes = backupCodes.map((code) => code.raw);
        return send(res, 200, { codes: rawCodes });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Transaction error:", error);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Token verification error:", error);
      return send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return send(res, 500, { error: "Internal server error" });
  }
}
