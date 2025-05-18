import { IncomingMessage, ServerResponse } from "http";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";

type CodeWithExpiry = {
  code: string;
  expiresAt: Date;
};

export function generateSixDigitCodeWithExpiry(
  minutesValid = 60
): CodeWithExpiry {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + minutesValid * 60 * 1000); // e.g. 5 minutes from now
  return { code, expiresAt };
}

export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function readBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", (error) => reject(error));
  });
}

export function send(
  res: ServerResponse,
  statusCode: number,
  data: object
): void {
  res.writeHead(statusCode, { "Content-type": "application/json" });
  res.end(JSON.stringify(data));
}

export function generateAccessToken(payload: object) {
  const secret = env.ACCESS_TOKEN_SECRET;

  return jwt.sign(payload, secret, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(payload: object) {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET!, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY,
  });
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      cookies[name] = decodeURIComponent(value);
    });
  }

  return cookies;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
