import http from "node:http";
import handleRoutes from "./routes/index.routes.ts";

const server = http.createServer(async (req, res) => {
  // log incoming request
  console.log(`\x1b[32m\x1b[44m${req.method} ${req.url}.\x1b[0m`);

  // Set default CORS headers that will be applied to all responses
  // Adjust to your frontend's origin in production
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", 2592000); // 30 days (in seconds) for preflight cache

  if (!handleRoutes(req, res)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Not Found\n");
  }
});

server.listen(3000, () => {
  console.log("server is running on http://localhost:3000");
});
