import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/api";
import { logger, logPerformance, logError } from "@/lib/logger";
import crypto from "crypto";

type Field = { name: string; type?: "text" | "int" | "real" | "json" | "date"; default?: any };

async function readJsonBody(req: Request): Promise<Record<string, any> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
}

export function crudHandlers(table: string, {
  searchFields = [],
  defaultOrder = "created_at DESC",
  allowedFields = [],
}: {
  searchFields?: string[];
  defaultOrder?: string;
  allowedFields: (string | Field)[];
}) {
  const fieldMap: Record<string, Field> = {};
  for (const f of allowedFields) {
    if (typeof f === "string") fieldMap[f] = { name: f };
    else fieldMap[f.name] = f;
  }

  async function GET(req: Request) {
    const start = Date.now();
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const db = getDb();
    const url = new URL(req.url);
    const singleId = url.searchParams.get("id");
    const ip = getClientIp(req);
    
    try {
      if (singleId) {
        const row = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND organization_id = ?`).get(singleId, user.organization_id);
        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
        logPerformance(`GET ${table} (single)`, Date.now() - start, { table, id: singleId, userId: user.id });
        logAudit(user, "Read", table, "", ip);
        return NextResponse.json({ row });
      }
      
      const q = url.searchParams.get("q") || "";
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
      const offset = parseInt(url.searchParams.get("offset") || "0");
      let sql = `SELECT * FROM ${table} WHERE organization_id = ?`;
      const params: any[] = [user.organization_id];
      const filterable = ["company_id", "contact_id", "project_id", "owner_id", "status", "stage"];
      
      if (q && searchFields.length) {
        sql += ` AND (${searchFields.map((f) => `${f} LIKE ?`).join(" OR ")})`;
        for (let i = 0; i < searchFields.length; i++) params.push(`%${q}%`);
      }
      
      for (const f of filterable) {
        const v = url.searchParams.get(f);
        if (v != null && v !== "") {
          sql += ` AND ${f} = ?`;
          params.push(v);
        }
      }
      
      sql += ` ORDER BY ${defaultOrder} LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const rows = db.prepare(sql).all(...params);
      const countParams = [...params.slice(0, params.length - 2)];
      const count = db
        .prepare(`SELECT COUNT(*) as total FROM ${table} WHERE organization_id = ?` + (q && searchFields.length ? ` AND (${searchFields.map((f) => `${f} LIKE ?`).join(" OR ")})` : "") + filterable.filter((f) => url.searchParams.get(f) != null && url.searchParams.get(f) !== "").map((f) => ` AND ${f} = ?`).join(""))
        .all(...(countParams)) as { total: number }[];
      
      logPerformance(`GET ${table} (list)`, Date.now() - start, { table, count: rows.length, userId: user.id, query: q });
      logAudit(user, "Read", table, "", ip);
      return NextResponse.json({ rows, total: count[0]?.total || 0 });
    } catch (error) {
      logError(error as Error, { table, operation: "GET", userId: user?.id });
      throw error;
    }
  }

  async function POST(req: Request) {
    const start = Date.now();
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const ip = getClientIp(req);
    
    try {
      const body = await readJsonBody(req);
      if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      
      const db = getDb();
      const id = crypto.randomUUID();
      const data: any = { id, organization_id: user.organization_id };
      
      for (const f of allowedFields) {
        const name = typeof f === "string" ? f : f.name;
        const type = typeof f === "string" ? undefined : f.type;
        const def = typeof f === "string" ? undefined : f.default;
        
        if (body[name] !== undefined) {
          data[name] = type === "json" ? JSON.stringify(body[name]) : body[name];
        } else if (def !== undefined) {
          data[name] = def;
        }
      }
      
      data.created_at = new Date().toISOString().replace("T", " ").slice(0, 19);
      if (allowedFields.some((f) => (typeof f === "string" ? f : f.name) === "updated_at")) {
        data.updated_at = data.created_at;
      }
      
      const keys = Object.keys(data);
      db.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).run(...keys.map((k) => data[k]));
      
      logPerformance(`POST ${table}`, Date.now() - start, { table, id, userId: user.id });
      logAudit(user, "Create", table, id, ip);
      return NextResponse.json({ ok: true, id, row: data });
    } catch (error) {
      logError(error as Error, { table, operation: "POST", userId: user?.id });
      throw error;
    }
  }

  async function PATCH(req: Request) {
    const start = Date.now();
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const ip = getClientIp(req);
    
    try {
      const db = getDb();
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      
      const body = await readJsonBody(req);
      if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      
      const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND organization_id = ?`).get(id, user.organization_id);
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
      
      const sets: string[] = [];
      const params: any[] = [];
      
      for (const key of Object.keys(body)) {
        const field = fieldMap[key];
        if (!field) continue;
        if (key === "updated_at" || key === "created_at" || key === "id" || key === "organization_id") continue;
        sets.push(`${key} = ?`);
        const value = field.type === "json" || Array.isArray(body[key])
          ? JSON.stringify(body[key])
          : body[key];
        params.push(value);
      }
      
      if (allowedFields.some((f) => (typeof f === "string" ? f : f.name) === "updated_at")) {
        sets.push("updated_at = ?");
        params.push(new Date().toISOString().replace("T", " ").slice(0, 19));
      }
      
      if (sets.length === 0) {
        return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
      }
      
      params.push(id, user.organization_id);
      db.prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ? AND organization_id = ?`).run(...params);
      
      logPerformance(`PATCH ${table}`, Date.now() - start, { table, id, userId: user.id });
      logAudit(user, "Update", table, id, ip);
      return NextResponse.json({ ok: true });
    } catch (error) {
      logError(error as Error, { table, operation: "PATCH", userId: user?.id });
      throw error;
    }
  }

  async function DELETE(req: Request) {
    const start = Date.now();
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const ip = getClientIp(req);
    
    try {
      const db = getDb();
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      
      if (id) {
        const result = db.prepare(`DELETE FROM ${table} WHERE id = ? AND organization_id = ?`).run(id, user.organization_id);
        if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
        logPerformance(`DELETE ${table} (single)`, Date.now() - start, { table, id, userId: user.id });
        logAudit(user, "Delete", table, id, ip);
        return NextResponse.json({ ok: true });
      }
      
      const body = await req.json().catch(() => ({}));
      const ids = Array.isArray(body?.ids) ? body.ids : [];
      if (!ids.length) return NextResponse.json({ error: "Missing id or ids" }, { status: 400 });
      
      // CRIT-03: Limit bulk delete to 100 IDs per request to prevent mass deletion DoS
      if (ids.length > 100) {
        return NextResponse.json({ error: "Too many IDs (max 100)" }, { status: 400 });
      }
      
      const placeholders = ids.map(() => "?").join(",");
      const result = db.prepare(`DELETE FROM ${table} WHERE id IN (${placeholders}) AND organization_id = ?`).run(...ids, user.organization_id);
      
      logPerformance(`DELETE ${table} (bulk)`, Date.now() - start, { table, count: ids.length, userId: user.id });
      logAudit(user, "BulkDelete", table, ids.join(","), ip);
      return NextResponse.json({ ok: true, deleted: result.changes });
    } catch (error) {
      logError(error as Error, { table, operation: "DELETE", userId: user?.id });
      throw error;
    }
  }

  return { GET, POST, PATCH, DELETE };
}
