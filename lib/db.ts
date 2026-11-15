import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { migrate } from "./schema";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "nexus.db");

declare global {
  // eslint-disable-next-line no-var
  var __nexusDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__nexusDb) return global.__nexusDb;
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // Apply the schema idempotently on boot so newly added tables/columns are
  // created on existing databases without requiring a destructive re-seed.
  migrate(db);
  global.__nexusDb = db;
  return db;
}
