import http, { IncomingMessage, ServerResponse } from "node:http";
import handleRoutes from "./routes/index.routes.js";
import { env } from "./config/env.js";

const handler: http.RequestListener = (req, res) => {
  void handleRequest(req, res);
};

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // Wrap the async logic in an async IIFE
  try {
    // log incoming request
    console.log(`\x1b[32m\x1b[44m${req.method} ${req.url}.\x1b[0m`);

    const FRONTEND_URL = env.FRONTEND_URL;

    // Set default CORS headers that will be applied to all responses
    // Adjust to your frontend's origin in production

    if (FRONTEND_URL) {
      res.setHeader("Access-Control-Allow-Origin", `${FRONTEND_URL}`);
    }
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS"
    );
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

    if (!handled && !res.writableEnded) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found\n");
    }
  } catch (error) {
    console.error("Server error:", error);

    if (!res.writableEnded) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("Internal Server Error\n");
    }
  }
}

// 👉 No auto listen() on import. Ever.
if (import.meta.url === "file://" + process.argv[1]) {
  const server = http.createServer(handler);
  server.listen(3000, () => {
    console.log("server is running on http://localhost:3000");
  });
}

export { handler };
