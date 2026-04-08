import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "db", "mission-control.db");
const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Schema is safe to re-run (CREATE IF NOT EXISTS)
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  _db.exec(schema);
  migrate(_db);

  return _db;
}

function migrate(db: Database.Database) {
  // Add resources column to meetings if it doesn't exist
  const cols = db.prepare("PRAGMA table_info(meetings)").all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "resources")) {
    db.prepare("ALTER TABLE meetings ADD COLUMN resources TEXT").run();
  }
}
