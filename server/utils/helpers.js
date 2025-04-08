const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userFile = path.join(__dirname, "../data/users.json");
const SECRET = "supsersecretkey";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => resolve(JSON.parse(body)));
  });
}

function send(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function getUsers() {
  if (!fs.existsSync(userFile)) return [];
  const data = fs.readFileSync(userFile, "utf-8");
  return JSON.parse(data || "[]");
}

function saveUsers(users) {
  fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
}

async function handleRegister(req, res) {
  const { name, email, password } = await readBody(req);

  const users = getUsers();
  if (users.find((user) => user.email === email)) {
    return send(res, 400, { error: "user already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ name, email, password: hashedPassword });
  saveUsers(users);

  send(res, 201, { message: "User registered successfully" });
}

async function handleLogin(req, res) {
  const { email, password } = await readBody(req);

  const users = getUsers();
  const user = users.find((u) => u.email === email);

  if (!user) return send(res, 401, { error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return send(res, 401, { error: "Invalid credentials" });

  const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: "1h" });
  send(res, 200, { message: "Login successful", token });
}

async function handleProfile(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return send(res, 401, { error: "not token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    send(res, 200, { message: `Welcome ${decoded.email}` });
  } catch (error) {
    send(res, 404, { error: "Invalid token" });
  }
}

async function handleRequest(req, res) {
  if (req.method === "POST" && req.url === "/register") {
    return handleRegister(req, res);
  }

  if (req.method === "POST" && req.url === "/login") {
    return handleLogin(req, res);
  }
  if ((req.method = "GET" && req.url === "/profile")) {
    return handleProfile(req, res);
  }

  res.writeHead(404);
  res.end("Not found");
}

module.exports = {
  handleRequest,
};
