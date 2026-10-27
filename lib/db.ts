import "server-only";
import type { Database } from "bun:sqlite";
import { applyAppMigrations as applyMigrations, openDatabase } from "./db-core";

// One connection per server process; cached on globalThis so dev HMR doesn't reopen it.
const globalForDb = globalThis as unknown as { __notesDb?: Database };

export const db: Database = (globalForDb.__notesDb ??= openDatabase());

export function applyAppMigrations(): string[] {
  return applyMigrations(db);
}
