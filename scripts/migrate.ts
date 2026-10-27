// `bun run db:migrate` — applies app migrations. Run `bunx --bun auth@latest migrate` first.
import { applyAppMigrations, openDatabase, resolveDatabasePath } from "../lib/db-core";

const db = openDatabase();
const applied = applyAppMigrations(db);
db.close();

console.log(
  applied.length ? `Applied: ${applied.join(", ")}` : "No pending migrations",
  `(${resolveDatabasePath()})`,
);
