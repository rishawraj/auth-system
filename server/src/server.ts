import http from "node:http";
import handleRoutes from "./routes/index.routes.js";

const handler: http.RequestListener = async (req, res) => {
  // log incoming request
  console.log(`\x1b[32m\x1b[44m${req.method} ${req.url}.\x1b[0m`);

  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

  // Set default CORS headers that will be applied to all responses
  // Adjust to your frontend's origin in production
  res.setHeader("Access-Control-Allow-Origin", `${FRONTEND_URL}`);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, Cache-Control"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", 2592000); // 30 days (in seconds) for preflight cache

  // handle preflight request
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const handled = await handleRoutes(req, res);

  if (!handled) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Not Found\n");
  }
};

const server = http.createServer(handler);

server.listen(3000, () => {
  console.log("server is running on http://localhost:3000");
});

export { handler };
