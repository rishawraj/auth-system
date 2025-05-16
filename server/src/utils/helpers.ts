import { IncomingMessage, ServerResponse } from "http";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

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
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not defined");

  if (!process.env.ACCESS_TOKEN_EXPIRY)
    throw new Error("ACCESS_TOKEN_EXPIRY is not defined");

  return jwt.sign(payload, secret, {
    expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY),
  });
}

export function generateRefreshToken(payload: object) {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET is not defined");
  if (!process.env.REFRESH_TOKEN_EXPIRY)
    throw new Error("REFRESH_TOKEN_EXPIRY is not defined");
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRY),
  });
}

// Helper function to parse cookies from request
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
