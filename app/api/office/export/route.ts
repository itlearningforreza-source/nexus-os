import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { toCsv } from "@/lib/utils";

// Export office documents to portable formats.
// Supported targets: "txt", "markdown", "html", "json", "csv" (spreadsheet only).

const SAFE_CONTENT_LENGTH = 5 * 1024 * 1024;

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function writerToMarkdown(content: any): string {
  const blocks = Array.isArray(content?.blocks) ? content.blocks : [];
  const lines: string[] = [];
  for (const b of blocks) {
    const text = b?.text || "";
    switch (b?.type) {
      case "heading1":
        lines.push(`# ${text}`);
        break;
      case "heading2":
        lines.push(`## ${text}`);
        break;
      case "heading3":
        lines.push(`### ${text}`);
        break;
      case "quote":
        lines.push(`> ${text}`);
        break;
      case "list":
        lines.push(`- ${text}`);
        break;
      case "number":
        lines.push(`1. ${text}`);
        break;
      case "code":
        lines.push("```\n" + text + "\n```");
        break;
      case "check":
        lines.push(`- [${b.checked ? "x" : " "}] ${text}`);
        break;
      default:
        lines.push(text);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function spreadsheetToMarkdown(content: any): string {
  const rows = content?.rows || [];
  if (!rows.length) return "";
  const fmt = (v: any) =>
    v == null || v === "" ? "" : String(typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(2)) : v);
  const cols = Math.max(...rows.map((r: any[]) => r.length));
  const header = rows[0] || [];
  const out = [header.map((c: any) => fmt(c)).join(" | ")];
  out.push(Array(cols || header.length).fill("---").join(" | "));
  for (let i = 1; i < rows.length; i++) {
    out.push(rows[i].map((c: any) => fmt(c)).join(" | "));
  }
  return out.join("\n");
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const id = String(body.id || "");
  const format = String(body.format || "markdown");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getDb();
  const doc = db
    .prepare("SELECT * FROM office_documents WHERE id = ? AND organization_id = ?")
    .get(id, user.organization_id) as any;
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let content: any;
  try {
    content = JSON.parse(doc.content || "{}");
  } catch {
    content = {};
  }

  let output = "";
  if (format === "json") {
    output = JSON.stringify({ name: doc.name, kind: doc.kind, content }, null, 2);
  } else if (doc.kind === "spreadsheet" && format === "csv") {
    const rows = Array.isArray(content?.rows) ? content.rows : [];
    output = toCsv(rows.map((r: any[]) => Object.fromEntries(r.map((cell, i) => [`col${i}`, cell]))));
  } else if (doc.kind === "spreadsheet") {
    output = spreadsheetToMarkdown(content);
  } else if (doc.kind === "writer") {
    if (format === "html") {
      const blocks = Array.isArray(content?.blocks) ? content.blocks : [];
      output =
        "<h1>" +
        escapeHtml(doc.name) +
        "</h1>\n" +
        blocks
          .map((b: any) => {
            const text = escapeHtml(b?.text || "");
            switch (b?.type) {
              case "heading1":
                return "<h1>" + text + "</h1>";
              case "heading2":
                return "<h2>" + text + "</h2>";
              case "heading3":
                return "<h3>" + text + "</h3>";
              case "quote":
                return "<blockquote>" + text + "</blockquote>";
              case "list":
                return "<ul><li>" + text + "</li></ul>";
              case "number":
                return "<ol><li>" + text + "</li></ol>";
              case "code":
                return "<pre><code>" + text + "</code></pre>";
              default:
                return "<p>" + text + "</p>";
            }
          })
          .join("\n");
    } else {
      output = writerToMarkdown(content);
    }
  } else {
    // presentation: export speaker notes / slide titles as markdown
    const slides = Array.isArray(content?.slides) ? content.slides : [];
    output = slides
      .map((s: any, i: number) => `## Slide ${i + 1}\n\n${escapeHtml(s?.title || "")}\n`)
      .join("\n");
  }

  if (output.length > SAFE_CONTENT_LENGTH) {
    return NextResponse.json({ error: "Exported content too large" }, { status: 413 });
  }
  return NextResponse.json({ ok: true, format, filename: `${doc.name}.${format === "markdown" ? "md" : format}`, content: output });
}