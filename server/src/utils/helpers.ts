import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as path from "node:path";
import * as fs from "node:fs";
import { IncomingMessage, ServerResponse } from "http";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { pool } from "./db.ts";
import { sendEmailWorker } from "../workers/sendEmailWorker.ts";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userFile = path.join(__dirname, "../data/users.json");
const SECRET = process.env.SECRET;

interface User {
  name?: string;
  email: string;
  password: string;
}

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const verifySchema = z.object({
  code: z.string().length(6, "Code is a 6 digit number"),
});

type CodeWithExpiry = {
  code: string;
  expiresAt: Date;
};

function generateSixDigitCodeWithExpiry(minutesValid = 60): CodeWithExpiry {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + minutesValid * 60 * 1000); // e.g. 5 minutes from now
  return { code, expiresAt };
}

function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

function readBody<T>(req: IncomingMessage): Promise<T> {
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

function send(res: ServerResponse, statusCode: number, data: object): void {
  res.writeHead(statusCode, { "Content-type": "application/json" });
  res.end(JSON.stringify(data));
}

async function getAllUsers() {
  console.log("getting all the user");

  try {
    const result = await pool.query("SELECT * FROM users");
    console.log("Users:", result.rows);
    return result.rows;
  } catch (err) {
    console.error("Error executing query:", err);
    throw err;
  }
}

function getUsers(): User[] {
  try {
    if (!fs.existsSync(userFile)) return [];
    const data = fs.readFileSync(userFile, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    // Handle potential JSON parse errors
    console.error("Error reading users file:", error);
    return [];
  }
}

function saveUsers(users: User[]): void {
  // Ensure directory exists before writing
  const dir = path.dirname(userFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
  console.log(getUsers());
}

async function handleRegister(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const body = await readBody<{ token: string; code: string }>(req);
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { name, email, password } = result.data;
    console.log({ name, email, password });

    if (!email || !password) {
      return send(res, 400, { error: "Email and password are required" });
    }

    const existingUserResult = await pool.query(
      "SELECT id FROM users where email = $1",
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return send(res, 400, { error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const CodeWithExpiry = generateSixDigitCodeWithExpiry();
    const verificationCode = CodeWithExpiry.code;
    const verification_code_expiry_time = CodeWithExpiry.expiresAt;

    const newUserResult = await pool.query(
      "INSERT INTO users (name, email, password, verification_code, verification_code_expiry_time) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, is_active, registration_date",
      [
        name,
        email,
        hashedPassword,
        verificationCode,
        verification_code_expiry_time,
      ]
    );
    const newUser = newUserResult.rows[0];

    const token = jwt.sign({ email: newUser.email }, SECRET, {
      expiresIn: "1h",
    });

    // fire and forget
    setImmediate(() => sendEmailWorker(email, verificationCode));

    send(res, 201, {
      message: "User registered successfully",
      user: newUser,
      token: token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

async function handleLogin(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const body = await readBody(req);
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return send(res, 400, { errors });
    }

    const { email, password } = result.data;

    if (!email || !password) {
      return send(res, 400, { error: "Email and password are required" });
    }

    const user = await pool.query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    console.log(user.rows[0]);

    if (!user) return send(res, 401, { error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.rows[0].password);

    if (!match) return send(res, 401, { error: "Invalid credentials" });

    const token = jwt.sign({ email: user.rows[0].email }, SECRET, {
      expiresIn: "1h",
    });

    send(res, 200, { message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

async function handleProfile(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
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
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [
          decoded.email,
        ]);

        send(res, 200, { message: user.rows[0] });
      } else {
        send(res, 400, { error: "Invalid token payload" });
      }
    } catch (error) {
      send(res, 401, { error: "Invalid token" });
    }
  } catch (error) {
    console.error("Profile error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}

async function handleLogut(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Set-Cookie", "token=; httpOnly; Path=/;Max-Age=0");
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "Logged out successfully" }));
}

async function handleVerify(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await readBody<{ token: string; code: string }>(req);

    const { token, code } = body;
    console.log({ token, code });

    if (!token || !code) {
      return send(res, 400, { error: "Missing token or verification code" });
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, SECRET);
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return send(res, 401, { error: "Invalid or expired token" });
    }

    const { email } = decodedToken;

    // Query the database to check verification code
    const userQuery =
      "SELECT id, verification_code, verification_code_expiry_time FROM users WHERE email = $1";
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return send(res, 404, { error: "User not found" });
    }
    const user = userResult.rows[0];
    const currentTime = new Date();

    // Check if verification code is valid and not expired
    if (user.verification_code !== code) {
      return send(res, 400, { error: "Invalid verification code" });
    }

    if (
      user.verification_code_expiry_time &&
      new Date(user.verification_code_expiry_time) < currentTime
    ) {
      return send(res, 400, { error: "Verification code has expired" });
    }

    // Update user account to active status
    const updateQuery = `
      UPDATE users 
      SET is_active = TRUE, 
          verification_code = NULL, 
          verification_code_expiry_time = NULL 
      WHERE id = $1
    `;

    await pool.query(updateQuery, [user.id]);
    // Send success response
    send(res, 200, {
      message: "Account verified successfully",
      email: email,
    });
  } catch (error) {
    console.error("Verification error: ", error);
    send(res, 500, { error: "Internal server error duing verification" });
  }
}

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    // Handle OPTIONS requests
    if (req.method === "OPTIONS") {
      console.log("/options");
      res.writeHead(204); // Respond with 204 No Content for successful preflight
      res.end();
      return; // Stop further processing for OPTIONS requests
    }

    if (req.method === "GET" && req.url === "/health") {
      return send(res, 200, { status: "OK", message: "Server is healthy" });
    }

    if (req.method === "POST" && req.url === "/register") {
      console.log("register function called");

      return await handleRegister(req, res);
    }

    if (req.method === "POST" && req.url === "/login") {
      return await handleLogin(req, res);
    }

    if (req.method === "GET" && req.url === "/profile") {
      return await handleProfile(req, res);
    }
    if (req.method === "POST" && req.url === "/logout") {
      return handleLogut(req, res);
    }
    if (req.method === "POST" && req.url === "/verify") {
      return handleVerify(req, res);
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (error) {
    console.error("Request handling error:", error);
    send(res, 500, { error: "Internal server error" });
  }
}
