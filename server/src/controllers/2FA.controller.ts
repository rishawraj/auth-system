import { IncomingMessage, ServerResponse } from "node:http";
import { readBody, send } from "../utils/helpers.js";
import { pool } from "../config/db.config.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Secret, TOTP } from "otpauth";
import qrcode from "qrcode";
import { z } from "zod";
import bcrypt from "bcrypt";

const SECRET = env.ACCESS_TOKEN_SECRET;

export async function EnableTwofactorAuth(
  req: IncomingMessage,
  res: ServerResponse
) {
  console.log("enable 2fa");
  // todo db persistence
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

    send(res, 200, {
      message: "2fa enabled",
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
  }
}
