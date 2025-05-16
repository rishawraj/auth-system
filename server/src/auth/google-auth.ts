import { IncomingMessage, ServerResponse } from "http";
import { generateAccessToken, parseCookies, send } from "../utils/helpers.js";
import { pool } from "../config/db.config.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import "dotenv/config";
import { config } from "../types/config.js";
import { UAParser } from "ua-parser-js";

const FRONTEND_URL = process.env.FRONTEND_URL;

const OAuthClient = new OAuth2Client(
  config.clientId,
  config.clientSecret,
  config.redirectUri
);

export function getGoogleAuthUrl() {
  const authUrl = OAuthClient.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "consent",
  });
  return authUrl;
}

export async function handleGoogleAuth(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const authUrl = getGoogleAuthUrl();
    res.writeHead(302, { Location: authUrl });
    res.end();
  } catch (error) {
    console.error("Google auth error:", error);
    send(res, 500, { error: "Internal server error during Google auth" });
  }
}

// route handler for Google callback
export async function handleGoogleCallback(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    // parse url to get the code
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const code = url.searchParams.get("code");

    if (!code) {
      return send(res, 400, { error: "No code provided" });
    }

    // exchange code for tokens
    const { tokens } = await OAuthClient.getToken(code);
    OAuthClient.setCredentials(tokens);

    // verify ID token
    const ticket = await OAuthClient.verifyIdToken({
      idToken: tokens.id_token || "",
      audience: config.clientId,
    });

    const payload = ticket.getPayload() as TokenPayload;
    if (!payload) {
      return send(res, 400, { error: "Invalid ID token" });
    }

    console.log("Payload:", payload);

    const { email, name } = payload;

    //  ---- extract user agent from request headers ----
    const ua = new UAParser(req.headers["user-agent"] || "");
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress ||
      null;
    const browser = ua.getBrowser().name || null;
    const os = ua.getOS().name || null;
    const device = ua.getDevice().model || "unknown";

    // todo Replace with actual geo data from ip
    const last_location = null;
    const last_country = null;
    const last_city = null;

    let user: User;
    let token: string;

    // check if email user exists in the database with no oauth provider
    const existingUserResult = await pool.query<User>(
      "SELECT * FROM users WHERE email = $1 AND oauth_provider IS NULL",
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      // user exists, update oauth provider and id
      user = existingUserResult.rows[0];
      const updateUserResult = await pool.query<User>(
        `UPDATE users SET 
          oauth_provider = $1, 
          oauth_id = $2, 
          oauth_access_token = $3, 
          oauth_refresh_token = $4, 
          oauth_token_expires_at = $5,
          is_active = $6,
          last_login = $7
        WHERE id = $8`,
        [
          "google",
          payload.sub,
          tokens.access_token,
          tokens.refresh_token || null,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          true,
          new Date(),
          user.id,
        ]
      );
      user = updateUserResult.rows[0];
    }

    // check if google user exists in the database
    const existingGoogleUserResult = await pool.query<User>(
      "SELECT * FROM users WHERE email = $1 OR (oauth_provider = $2 AND oauth_id = $3)",
      [payload.email, "google", payload.sub]
    );

    if (existingGoogleUserResult.rows.length === 0) {
      const newUserResult = await pool.query<User>(
        `INSERT INTO users (
          name,
          email,
          password,
          is_active,
          oauth_provider,
          oauth_id,
          oauth_access_token,
          oauth_refresh_token,
          oauth_token_expires_at,
          last_login,
          last_login_method,
          last_ip,
          last_browser,
          last_os,
          last_device,
          last_location,
          last_country,
          last_city,
          profile_pic
        ) VALUES (
          $1, $2, '', $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *`,
        [
          name || "Google User",
          email,
          true,
          "google",
          payload.sub,
          tokens.access_token,
          tokens.refresh_token || null,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          new Date(),
          "google",
          ip,
          browser,
          os,
          device,
          last_location,
          last_country,
          last_city,
          payload.picture || null,
        ]
      );

      user = newUserResult.rows[0];
    } else {
      // user exists, update access token and refresh token
      user = existingGoogleUserResult.rows[0];
      const updateUserResult = await pool.query<User>(
        `UPDATE users SET 
          oauth_provider = $1, 
          oauth_id = $2, 
          oauth_access_token = $3, 
          oauth_refresh_token = $4, 
          oauth_token_expires_at = $5,
          is_active = $6,
          last_login = $7
        WHERE id = $8`,
        [
          "google",
          payload.sub,
          tokens.access_token,
          tokens.refresh_token || user.oauth_refresh_token,
          tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : user.oauth_token_expires_at,
          true,
          new Date(),
          user.id,
        ]
      );
    }

    const jwtpayload = {
      email: user.email,
      is_super_user: user.is_super_user,
    };

    token = generateAccessToken(jwtpayload);

    res.setHeader("Set-Cookie", [
      `refreshToken=${tokens.refresh_token}; HttpOnly; Path=/; Max-Age=${tokens.expiry_date}; SameSite=None; Secure=false; Domain=${
        process.env.DOMAIN || "localhost"
      }`,
    ]);

    //  redirect to frontend with token
    const redirectUrl = `${FRONTEND_URL}/auth/google/callback?token=${token}`;
    res.writeHead(302, { Location: redirectUrl });
    res.end();
  } catch (error) {
    console.error("Google callback error:", error);
    send(res, 500, { error: "Internal server error during Google callback" }); // respond with error
  }
}

// Function to handle refreshing OAuth tokens
export async function handleGoogleRefreshToken(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log({ token });

    const cookies = parseCookies(req);
    // console.log(cookies);
    const refreshToken = cookies["refreshToken"];
    console.log(refreshToken);

    if (!refreshToken) {
      return send(res, 400, { error: "Refresh token is required" });
    }

    // Find the user with this refresh token
    const userResult = await pool.query<User>(
      "SELECT * FROM users WHERE oauth_refresh_token = $1",
      [refreshToken]
    );

    console.log(userResult.rows[0]);

    if (userResult.rows.length === 0) {
      return send(res, 401, { error: "Invalid refresh token" });
    }

    const user = userResult.rows[0];
    console.log(user);

    // Set the refresh token in the OAuth client
    OAuthClient.setCredentials({
      refresh_token: refreshToken,
    });

    // Get new tokens using the refresh token
    const { credentials } = await OAuthClient.refreshAccessToken();

    // Update user's tokens in the database
    await pool.query(
      `UPDATE users SET 
        oauth_access_token = $1, 
        oauth_token_expires_at = $2
      WHERE id = $3`,
      [
        credentials.access_token,
        credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        user.id,
      ]
    );

    // Generate a new JWT token
    const jwtPayload = {
      email: user.email,
      is_super_user: user.is_super_user,
    };

    const newAccessToken = generateAccessToken(jwtPayload);

    // Send back the new access token
    send(res, 200, {
      accessToken: newAccessToken,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // 1 hour in seconds
    });
  } catch (error) {
    console.error("OAuth refresh token error:", error);
    send(res, 500, { error: "Internal server error during token refresh" });
  }
}
