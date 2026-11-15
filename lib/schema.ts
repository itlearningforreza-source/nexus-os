import fs from "fs";
import path from "path";

function readSchemaSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "lib", "schema.sql"), "utf8");
}

export function migrate(db: any) {
  // Single source of truth: lib/schema.sql (shared with scripts/seed.mjs).
  db.exec(readSchemaSql());

  // Additive column migrations for existing databases created before a column
  // was introduced. `CREATE TABLE IF NOT EXISTS` never adds columns, so these
  // guarded ALTERs keep older DBs in sync without dropping data.
  const hasColumn = (table: string, column: string) => {
    try {
      return db.prepare(`PRAGMA table_info(${table})`).all().some((c: any) => c.name === column);
    } catch {
      return true;
    }
  };
  if (!hasColumn("users", "phone")) {
    try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT"); } catch {}
  }
  if (!hasColumn("users", "preferences")) {
    try { db.exec("ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{}'"); } catch {}
  }
  if (!hasColumn("employees", "updated_at")) {
    try { db.exec("ALTER TABLE employees ADD COLUMN updated_at TEXT"); } catch {}
  }
  if (!hasColumn("campaigns", "updated_at")) {
    try { db.exec("ALTER TABLE campaigns ADD COLUMN updated_at TEXT"); } catch {}
  }
  if (!hasColumn("expenses", "updated_at")) {
    try { db.exec("ALTER TABLE expenses ADD COLUMN updated_at TEXT"); } catch {}
  }
  if (!hasColumn("assets", "updated_at")) {
    try { db.exec("ALTER TABLE assets ADD COLUMN updated_at TEXT"); } catch {}
  }
  if (!hasColumn("automations", "updated_at")) {
    try { db.exec("ALTER TABLE automations ADD COLUMN updated_at TEXT"); } catch {}
  }
}
