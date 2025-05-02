import { IncomingMessage, ServerResponse } from "http";
import { send } from "../utils/helpers.ts";
import { pool } from "../config/db.config.ts";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.ts";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import "dotenv/config";
import { config } from "../types/config.ts";

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
    // console.log("Redirecting to Google auth URL:", authUrl);
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
    // console.log("Handling Google callback james bond");

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

    // console.log({ email, name });

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
      // create a new user
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
          oauth_token_expires_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          payload.name || "Google User",
          payload.email,
          "", // Empty password for OAuth users
          true, // Auto-verify OAuth users
          "google",
          payload.sub,
          tokens.access_token,
          tokens.refresh_token || null,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null,
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

    token = jwt.sign(jwtpayload, config.jwtSecret, {
      expiresIn: "1d",
    });

    //  redirect to frontend with token
    const redirectUrl = `${FRONTEND_URL}/auth/google/callback?token=${token}`;
    res.writeHead(302, { Location: redirectUrl });
    res.end();
  } catch (error) {
    console.error("Google callback error:", error);
    send(res, 500, { error: "Internal server error during Google callback" }); // respond with error
  }
}
