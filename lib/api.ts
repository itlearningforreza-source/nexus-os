import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logger, logAuditEvent, logError } from "@/lib/logger";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function authedUser() {
  const user = await requireUser();
  return user;
}

export function withOrg<T>(user: any, rows: T[]): T[] {
  const db = getDb();
  return rows.filter((r: any) => r.organization_id === user.organization_id);
}

export function logAudit(user: any, action: string, object: string, objectId = "", ip = "", result = "Success") {
  if (process.env.AUDIT_LOG_ENABLED === "false") return;
  
  try {
    const db = getDb();
    const id = require("crypto").randomUUID();
    db.prepare(
      "INSERT INTO audit_logs (id, organization_id, user_id, action, object, object_id, ip, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    ).run(id, user.organization_id, user.id, action, object, objectId, ip, result);
    
    // Also log to structured logger
    logAuditEvent(user.id, user.organization_id, action, object, objectId, result as "Success" | "Failed");
  } catch (error) {
    logError(error as Error, { action, object, objectId, userId: user?.id });
  }
}

export function isAdminRole(role: string): boolean {
  const adminRoles = (process.env.ADMIN_ROLES || "owner,admin").split(",").map(r => r.trim());
  return adminRoles.includes(role);
}

export function handleApiError(error: unknown, context: string): NextResponse {
  logError(error as Error, { context });
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function withErrorHandling<T>(
  handler: () => Promise<NextResponse>,
  context: string
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error, context);
  }
}
