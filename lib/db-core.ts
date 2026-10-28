// Runtime-agnostic DB helpers (no "server-only") so scripts and tests can import them.
import { Database } from "bun:sqlite";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const DEFAULT_DATABASE_PATH = "data/notes.sqlite";
export const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

export function resolveDatabasePath(): string {
  return path.resolve(process.cwd(), process.env.DATABASE_PATH || DEFAULT_DATABASE_PATH);
}

export function openDatabase(filename: string = resolveDatabasePath()): Database {
  if (filename !== ":memory:") mkdirSync(path.dirname(filename), { recursive: true });

  const db = new Database(filename, { create: true, strict: true });
  db.run("PRAGMA busy_timeout = 5000"); // first, so the WAL switch below waits instead of failing
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");
  return db;
}

/** Applies unapplied `migrations/*.sql` files in filename order; returns the names applied. */
export function applyAppMigrations(db: Database, dir: string = MIGRATIONS_DIR): string[] {
  db.run(`CREATE TABLE IF NOT EXISTS "_app_migration" (
    "name"      TEXT NOT NULL PRIMARY KEY,
    "appliedAt" TEXT NOT NULL
  )`);

  const applied = new Set(
    db.query<{ name: string }, []>(`SELECT "name" FROM "_app_migration"`).all().map((r) => r.name),
  );
  const pending = readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && !applied.has(f))
    .sort();

  const record = db.prepare(`INSERT INTO "_app_migration" ("name", "appliedAt") VALUES (?, ?)`);
  for (const name of pending) {
    const sql = readFileSync(path.join(dir, name), "utf8");
    try {
      db.transaction(() => {
        db.run(sql);
        record.run(name, new Date().toISOString());
      })();
    } catch (err) {
      throw new Error(`App migration ${name} failed`, { cause: err });
    }
  }
  return pending;
}
