import pino from "pino";
import type { IncomingMessage, ServerResponse } from "node:http";

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isTest = nodeEnv === "test";

// Default log level based on environment
const defaultLogLevel = isTest ? "silent" : isProduction ? "info" : "debug";
const logLevel = process.env.LOG_LEVEL || defaultLogLevel;

export const logger = pino({
  level: logLevel,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: isProduction
    ? {
        service: "auth-system-api",
        env: nodeEnv,
        pid: process.pid,
      }
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    !isProduction && !isTest
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname,service,env",
          },
        }
      : undefined,
});

// Domain-scoped child loggers for structured contextual tracing
export const httpLogger = logger.child({ module: "http" });
export const authLogger = logger.child({ module: "auth" });
export const dbLogger = logger.child({ module: "database" });
export const workerLogger = logger.child({ module: "worker" });
export const cronLogger = logger.child({ module: "cron" });

/**
 * Structured HTTP Request Logger.
 * Records method, path, HTTP status, execution latency, and client metadata.
 */
export function logHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  startTime: number,
  clientIp: string
) {
  const duration = Math.round(performance.now() - startTime);
  const statusCode = res.statusCode;
  const method = req.method || "UNKNOWN";
  const url = req.url || "/";
  const userAgent = (req.headers["user-agent"] as string) || "unknown";

  const logPayload = {
    method,
    url,
    statusCode,
    durationMs: duration,
    clientIp,
    userAgent,
  };

  const message = `${method} ${url} ${statusCode} - ${duration}ms`;

  if (statusCode >= 500) {
    httpLogger.error(logPayload, message);
  } else if (statusCode >= 400) {
    httpLogger.warn(logPayload, message);
  } else {
    httpLogger.info(logPayload, message);
  }
}
