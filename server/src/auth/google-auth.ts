import { IncomingMessage, ServerResponse } from "http";
import { send } from "../utils/helpers.ts";
import { pool } from "../config/db.config.ts";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.ts";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import "dotenv/config";

const SECRET = process.env.SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

// configuration
interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  jwtSecret: string;
  jwtExpiration: string;
}

const config: GoogleAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
  jwtSecret: process.env.SECRET || "",
  jwtExpiration: process.env.JWT_EXPIRATION || "1h",
};

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
    console.log("Redirecting to Google auth URL:", authUrl);
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
    console.log("Handling Google callback james bond");

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

    console.log({ email, name });

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

    // generate JWT token
    token = jwt.sign(
      { email: user.email, is_super_user: user.is_super_user },
      config.jwtSecret,
      {
        expiresIn: "1h",
      }
    );

    //  redirect to frontend with token
    const redirectUrl = `${FRONTEND_URL}/auth/google/callback?token=${token}`;
    res.writeHead(302, { Location: redirectUrl });
    res.end();
  } catch (error) {
    console.error("Google callback error:", error);
    send(res, 500, { error: "Internal server error during Google callback" }); // respond with error
  }
}

// Handler to refresh OAuth tokens when they expire
// export async function refreshOAuthTokens(userId: "string"): Promise<boolean> {
//   try {
//     const userResult = await pool.query<User>(
//       "SELECT oauth_refresh_token FROM users WHERE id = $1 AND oauth_provider = $2",
//       [userId, "google"]
//     );

//     if (
//       userResult.rows.length === 0 ||
//       !userResult.rows[0].oauth_refresh_token
//     ) {
//       console.error("User not found or not using Google OAuth");
//       return false;
//     }
//     const refreshToken = userResult.rows[0].oauth_refresh_token;
//     // setup credentials
//     OAuthClient.setCredentials({
//       refresh_token: refreshToken,
//     });

//     // refresh tokens
//     const { credentials } = await OAuthClient.refreshAccessToken();
//     await pool.query(
//       `UPDATE users SET
//         oauth_access_token = $1,
//         oauth_token_expires_at = $2,
//         oauth_refresh_token = $3
//       WHERE id = $4`,
//       [
//         credentials.access_token,
//         credentials.expiry_date ? new Date(credentials.expiry_date) : null,
//         credentials.refresh_token || refreshToken,
//         userId,
//       ]
//     );
//     return true;
//   } catch (error) {
//     console.error("Error refreshing OAuth tokens:", error);
//     return false;
//   }
// }

// middleware to check if user is authenticated
// export async function validateOAuthToken(req: IncomingMessage, userId: string) {
//   try {
//     const userResult = await pool.query<User>(
//       "SELECT oauth_token_expires_at FROM users WHERE id = $1 AND oauth_provider = $2",
//       [userId, "google"]
//     );
//     if (userResult.rows.length === 0) {
//       console.error("User not found or not using Google OAuth");
//       return false;
//     }

//     const tokenExpiresAt = userResult.rows[0].oauth_token_expires_at;

//     // If token is expired, try to refresh it
//     if (!tokenExpiresAt || new Date() > tokenExpiresAt) {
//       return await refreshGoogleToken(userId);
//     }

//     return true;
//   } catch (error) {
//     console.error("Error validating OAuth token:", error);
//     return false;
//   }
// }

// async function refreshGoogleToken(userId: string): Promise<boolean> {
//   try {
//     const userResult = await pool.query<User>(
//       "SELECT oauth_refresh_token FROM users WHERE id = $1 AND oauth_provider = $2",
//       [userId, "google"]
//     );

//     if (
//       userResult.rows.length === 0 ||
//       !userResult.rows[0].oauth_refresh_token
//     ) {
//       console.error("User not found or not using Google OAuth");
//       return false;
//     }

//     const refreshToken = userResult.rows[0].oauth_refresh_token;

//     // Set up credentials with the refresh token
//     OAuthClient.setCredentials({
//       refresh_token: refreshToken,
//     });

//     // Refresh the access token
//     const { credentials } = await OAuthClient.refreshAccessToken();

//     // Update the user's tokens in the database
//     await pool.query(
//       `UPDATE users SET
//         oauth_access_token = $1,
//         oauth_token_expires_at = $2,
//         oauth_refresh_token = $3
//       WHERE id = $4`,
//       [
//         credentials.access_token,
//         credentials.expiry_date ? new Date(credentials.expiry_date) : null,
//         credentials.refresh_token || refreshToken,
//         userId,
//       ]
//     );

//     return true;
//   } catch (error) {
//     console.error("Error refreshing Google OAuth tokens:", error);
//     return false;
//   }
// }

async function handleLinkOAuthAccount(
  req: IncomingMessage,
  res: ServerResponse,
  userId: number,
  oauthProvider: string,
  oauthId: string,
  oauthToken: string
): Promise<void> {
  try {
    await pool.query(
      `UPDATE users SET 
        oauth_provider = $1, 
        oauth_id = $2, 
        oauth_access_token = $3
      WHERE id = $4`,
      [oauthProvider, oauthId, oauthToken, userId]
    );

    send(res, 200, { message: "Account linked successfully" });
  } catch (error) {
    console.error("Account linking error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}
