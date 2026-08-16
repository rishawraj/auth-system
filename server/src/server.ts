import http, { IncomingMessage, ServerResponse } from "node:http";
import handleRoutes from "./routes/index.routes.js";
import { env } from "./config/env.js";
import { startCronJobs } from "./cron/cleanupUnverifiedUsers.js";
import { processEmailOutbox } from "./workers/emailOutbox.worker.js";
import { standardApiLimiter } from "./utils/rateLimiter.js";
import { logger, logHttpRequest } from "./utils/logger.js";

const handler: http.RequestListener = (req, res) => {
  void handleRequest(req, res);
};

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const startTime = performance.now();

  try {
    const rawIp =
      (Array.isArray(req.headers["x-forwarded-for"])
        ? req.headers["x-forwarded-for"][0]
        : req.headers["x-forwarded-for"]?.split(",")[0]) ||
      req.socket.remoteAddress ||
      "unknown_ip";

    // Attach request completion logger
    res.on("finish", () => {
      logHttpRequest(req, res, startTime, rawIp);
    });

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
    logger.error({ err: error }, "Unhandled internal server error");

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
    logger.info(
      { port: 3000, env: env.NODE_ENV },
      `Auth server running on http://localhost:3000 [${env.NODE_ENV}]`
    );
  });
}

export { handler };
