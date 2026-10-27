import "server-only";
import { getMigrations } from "better-auth/db/migration";
import { authOptions } from "./auth-options";
import { applyAppMigrations } from "./db";

let ready: Promise<void> | undefined;

/**
 * Creates any missing tables: Better Auth core tables via its own migration
 * engine (same as `auth migrate`), then app migrations — `note` references `"user"`.
 * Doesn't import `auth`, so its startup schema check runs only after this.
 */
export function ensureDatabase(): Promise<void> {
  return (ready ??= (async () => {
    const { runMigrations } = await getMigrations(authOptions);
    await runMigrations();
    applyAppMigrations();
  })());
}
