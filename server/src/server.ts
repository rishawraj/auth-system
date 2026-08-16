import http, { IncomingMessage, ServerResponse } from "node:http";
import handleRoutes from "./routes/index.routes.js";
import { env } from "./config/env.js";
import { startCronJobs } from "./cron/cleanupUnverifiedUsers.js";
import { processEmailOutbox } from "./workers/emailOutbox.worker.js";
import { standardApiLimiter } from "./utils/rateLimiter.js";

function formatHttpMethod(method: string | undefined): string {
  const reset = "\x1b[0m";
  const bold = "\x1b[1m";

  switch (method?.toUpperCase()) {
    case "GET":
      return `\x1b[32m${bold}GET${reset}`; // Green
    case "POST":
      return `\x1b[36m${bold}POST${reset}`; // Cyan
    case "PATCH":
      return `\x1b[35m${bold}PATCH${reset}`; // Magenta
    case "PUT":
      return `\x1b[33m${bold}PUT${reset}`; // Yellow
    case "DELETE":
      return `\x1b[31m${bold}DELETE${reset}`; // Red
    case "OPTIONS":
      return `\x1b[90m${bold}OPTIONS${reset}`; // Gray
    case "HEAD":
      return `\x1b[90m${bold}HEAD${reset}`; // Gray
    default:
      return `${bold}${method || "UNKNOWN"}${reset}`;
  }
}

const handler: http.RequestListener = (req, res) => {
  void handleRequest(req, res);
};

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // Wrap the async logic in an async IIFE
  try {
    // log incoming request with color-coded HTTP method
    console.log(`${formatHttpMethod(req.method)} \x1b[90m${req.url || "/"}\x1b[0m`);

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

    res.setHeader(
      "Access-Control-Expose-Headers",
      "Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset"
    );

    // handle preflight request
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const rawIp =
      (Array.isArray(req.headers["x-forwarded-for"])
        ? req.headers["x-forwarded-for"][0]
        : req.headers["x-forwarded-for"]?.split(",")[0]) ||
      req.socket.remoteAddress ||
      "unknown_ip";

    try {
      await standardApiLimiter.consume(rawIp);
    } catch (rateLimiterRes) {
      // 1. Tell the client how many seconds to wait
      res.setHeader(
        "Retry-After",
        Math.round(rateLimiterRes.msBeforeNext / 1000)
      );

      // 2. (Optional) Provide standard rate limit info
      res.setHeader("X-RateLimit-Limit", 200);
      res.setHeader("X-RateLimit-Remaining", rateLimiterRes.remainingPoints);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString()
      );

      // Return 429 immediately if they exceed 200 requests / 15 mins
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "Too many requests. Please try again later." })
      );
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
  startCronJobs();
  setInterval(processEmailOutbox, 5_000);

  const server = http.createServer(handler);
  server.listen(3000, () => {
    console.log(`server is running in [${env.NODE_ENV}]`);
    console.log("server is running on http://localhost:3000");
  });
}

export { handler };
