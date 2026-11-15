import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

const transport = isDevelopment
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    }
  : undefined;

export const logger = pino({
  level: logLevel,
  transport,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "nexus-os",
    env: process.env.NODE_ENV || "development",
  },
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export function logApiRequest(req: Request, userId?: string, orgId?: string) {
  const url = new URL(req.url);
  logger.info(
    {
      method: req.method,
      path: url.pathname,
      query: url.searchParams.toString(),
      userId,
      orgId,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown",
    },
    "API Request"
  );
}

export function logApiResponse(
  req: Request,
  status: number,
  durationMs: number,
  userId?: string,
  orgId?: string
) {
  const url = new URL(req.url);
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  logger[level](
    {
      method: req.method,
      path: url.pathname,
      status,
      durationMs,
      userId,
      orgId,
    },
    "API Response"
  );
}

export function logError(
  error: Error,
  context: Record<string, unknown> = {}
) {
  logger.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    "Application Error"
  );
}

export function logAuditEvent(
  userId: string,
  orgId: string,
  action: string,
  object: string,
  objectId: string,
  result: "Success" | "Failed",
  metadata: Record<string, unknown> = {}
) {
  logger.info(
    {
      audit: true,
      userId,
      orgId,
      action,
      object,
      objectId,
      result,
      ...metadata,
    },
    "Audit Event"
  );
}

export function logSecurityEvent(
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  context: Record<string, unknown> = {}
) {
  logger.warn(
    {
      security: true,
      event,
      severity,
      ...context,
    },
    "Security Event"
  );
}

export function logPerformance(
  operation: string,
  durationMs: number,
  metadata: Record<string, unknown> = {}
) {
  const level = durationMs > 1000 ? "warn" : durationMs > 500 ? "info" : "debug";
  logger[level](
    {
      performance: true,
      operation,
      durationMs,
      ...metadata,
    },
    "Performance Metric"
  );
}

export function logDatabaseQuery(
  query: string,
  durationMs: number,
  rowsAffected?: number
) {
  logger.debug(
    {
      db: true,
      query: query.length > 200 ? query.slice(0, 200) + "..." : query,
      durationMs,
      rowsAffected,
    },
    "Database Query"
  );
}
