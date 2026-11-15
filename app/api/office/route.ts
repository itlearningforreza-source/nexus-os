import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/api";
import crypto from "crypto";

// Office documents API — CRUD for the integrated office suite.
// kind ∈ { writer, spreadsheet, presentation }.
// content holds structured JSON (rich text ops / cells / slides).

const KINDS = ["writer", "spreadsheet", "presentation"];
const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB

async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function now() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const row = db
      .prepare("SELECT * FROM office_documents WHERE id = ? AND organization_id = ?")
      .get(id, user.organization_id) as any;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ doc: row });
  }
  const kind = url.searchParams.get("kind");
  const q = url.searchParams.get("q") || "";
  let sql = "SELECT * FROM office_documents WHERE organization_id = ? AND archived = 0";
  const params: any[] = [user.organization_id];
  if (kind && KINDS.includes(kind)) {
    sql += " AND kind = ?";
    params.push(kind);
  }
  if (q) {
    sql += " AND name LIKE ?";
    params.push(`%${q}%`);
  }
  sql += " ORDER BY updated_at DESC LIMIT 200";
  const rows = db.prepare(sql).all(...params) as any[];
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const kind = KINDS.includes(body.kind) ? body.kind : "writer";
  const name = (body.name || "Untitled").toString().trim().slice(0, 200);
  const folder = (body.folder || "My Drive").toString().slice(0, 100);
  const content = typeof body.content === "string" ? body.content : JSON.stringify(body.content ?? {});
  const id = crypto.randomUUID();
  const db = getDb();
  const ts = now();
  db.prepare(
    `INSERT INTO office_documents (id, organization_id, name, kind, folder, owner_id, starred, archived, content, meta, version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 1, ?, ?)`
  ).run(id, user.organization_id, name, kind, folder, user.id, content, JSON.stringify(body.meta || {}), ts, ts);
  logAudit(user, "Create", "office_document", id, "", "Success");
  return NextResponse.json({ ok: true, id, doc: { id, name, kind, folder, owner_id: user.id, starred: 0, archived: 0, content, version: 1, updated_at: ts } });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  // CRIT-02: Enforce content size limit (5MB) to prevent DoS via large payloads
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_SIZE) {
    return NextResponse.json({ error: "Payload too large (max 5MB)" }, { status: 413 });
  }
  
  const db = getDb();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const body = await readJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const existing = db
    .prepare("SELECT * FROM office_documents WHERE id = ? AND organization_id = ?")
    .get(id, user.organization_id) as any;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sets: string[] = [];
  const params: any[] = [];
  const whitelist = ["name", "folder", "starred", "archived", "content", "meta"];
  let bumpVersion = false;
  for (const key of whitelist) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`);
      if (key === "content") {
        const contentStr = typeof body.content === "string" ? body.content : JSON.stringify(body.content);
        // CRIT-02: Also validate content size after stringification
        if (Buffer.byteLength(contentStr, "utf8") > MAX_CONTENT_SIZE) {
          return NextResponse.json({ error: "Document content too large (max 5MB)" }, { status: 413 });
        }
        params.push(contentStr);
        bumpVersion = true;
      } else if (key === "meta") {
        params.push(typeof body.meta === "string" ? body.meta : JSON.stringify(body.meta));
      } else {
        params.push(body[key]);
      }
    }
  }
  if (!sets.length) return NextResponse.json({ error: "No updatable fields" }, { status: 400 });
  sets.push("updated_at = ?");
  params.push(now());
  if (bumpVersion) {
    sets.push("version = version + 1");
  }
  params.push(id, user.organization_id);
  db.prepare(`UPDATE office_documents SET ${sets.join(", ")} WHERE id = ? AND organization_id = ?`).run(...params);
  logAudit(user, "Update", "office_document", id, "", "Success");
  const updated = db.prepare("SELECT * FROM office_documents WHERE id = ?").get(id) as any;
  return NextResponse.json({ ok: true, doc: updated });
}

export async function DELETE(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const body = await readJson(req);
  const ids = id ? [id] : Array.isArray(body?.ids) ? body.ids.map(String) : [];
  if (!ids.length) return NextResponse.json({ error: "Missing id or ids" }, { status: 400 });
  
  // CRIT-03: Limit bulk delete to 100 IDs per request
  if (ids.length > 100) {
    return NextResponse.json({ error: "Too many IDs (max 100)" }, { status: 400 });
  }
  
  const placeholders = ids.map(() => "?").join(",");
  const result = db
    .prepare(`DELETE FROM office_documents WHERE id IN (${placeholders}) AND organization_id = ?`)
    .run(...ids, user.organization_id);
  if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  logAudit(user, "Delete", "office_document", ids.join(","), "", "Success");
  return NextResponse.json({ ok: true, deleted: result.changes });
}
