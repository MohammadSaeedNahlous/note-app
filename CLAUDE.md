# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

A notes app (rich-text notes, email/password auth, optional public sharing) built to the spec in `SPEC.md`. **`SPEC.md` is the source of truth for requirements** — read the relevant section before implementing a feature. The repo is currently a bare `create-next-app` scaffold (Phase 1 of SPEC §16): `app/page.tsx` is a placeholder, and there is no database, auth, editor, or tests yet. Dependencies (Better Auth, Tiptap, Zod) are installed but not wired up.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Known divergences between scaffold and spec — resolve deliberately, don't assume:

- The spec puts code under `src/` (`src/app`, `src/lib`, …); the scaffold uses a root-level `app/` and the `@/*` alias maps to `./*`.
- `.env.example` uses `DB_PATH=data/app.db`; the spec uses `DATABASE_PATH=data/notes.sqlite` and also requires `BETTER_AUTH_URL`.

## Commands

Bun is the runtime and package manager (`bun.lock` is committed).

```bash
bun install
bun run dev        # Next.js dev server on http://localhost:3000
bun run build      # production build
bun run lint       # ESLint (next core-web-vitals + typescript configs)
bun test           # Bun test runner (no tests exist yet)
bun test path/to/file.test.ts   # single test file
bun test -t "name pattern"      # tests matching a name
```

Database setup (once implemented, per SPEC §5.6) — order matters, because `note.userId` references `"user"`:

```bash
bunx --bun auth@latest migrate   # Better Auth core tables; --bun is required to load bun:sqlite
bun run db:migrate               # app migrations in migrations/*.sql (script not yet added)
```

## Architecture (target, per SPEC)

Next.js App Router (Next 16, React 19), Tailwind v4, TypeScript strict. Server-centric: the browser never touches SQLite.

**Layers:** pages / client components → Server Actions or Route Handlers → note service (session check, ownership, Zod validation) → repository (raw SQL) → SQLite.

**Database:** one shared `bun:sqlite` `Database` instance per server process (`lib/db/connection.ts`, `import "server-only"`, foreign keys ON, WAL, busy timeout). Better Auth and the notes repository share that same instance.

- **No ORM or query builder.** All application SQL is parameterized and goes through `bun:sqlite` prepared statements.
- Better Auth owns `user`, `session`, `account`, `verification` — created only by its CLI, and app code never writes to them (use `auth.api.*`). App tables live in numbered `migrations/*.sql`, tracked in a `_app_migration` table.
- Schema conventions follow Better Auth: singular lowercase table names, camelCase columns, every identifier quoted (`"user"` is reserved), `TEXT` string IDs, booleans as `INTEGER` 0/1, ISO 8601 UTC `createdAt`/`updatedAt`. Don't change Better Auth's ID generation.

**Authorization invariants:**

- Owner comes only from `auth.api.getSession({ headers })` (via a `require-user` helper) — never from a client-supplied `userId`.
- Every owner-scoped update/delete has `WHERE "id" = ? AND "userId" = ?`; zero rows affected → `NOT_FOUND` without revealing whether someone else's note exists.
- Public lookups must filter on both `"publicSlug" = ?` and `"isPublic" = 1`. The `note` table has a CHECK tying `isPublic` to a non-null `publicSlug`; toggling visibility updates both in one transaction. Disabling sharing nulls the slug; re-enabling makes a new one (≥128-bit CSPRNG, base64url).
- `/share/[slug]` renders dynamically (no static generation or shared caching), `noindex`, and never exposes note IDs or `userId`.

**Editor content:** Tiptap StarterKit, limited to paragraph, bold, italic, headings 1–3, inline code, code block, bullet list, horizontal rule (disable everything else). Content is stored as Tiptap JSON in `note.content` and validated server-side with a strict Zod schema (allowed nodes, marks, attrs, size limit) before every write. Public rendering uses the same schema — never `dangerouslySetInnerHTML` with stored HTML.

**Autosave:** debounced (700 ms), states `Unsaved changes` / `Saving…` / `Saved` / `Save failed`. Concurrency is handled on both sides: the client sequences requests, and the server does a conditional `UPDATE … WHERE "id" = ? AND "userId" = ? AND "updatedAt" = ?` using the client's `expectedUpdatedAt`, returning `CONFLICT` (HTTP 409) on a mismatch.

**Mutation errors** are structured as `UNAUTHENTICATED | VALIDATION_ERROR | NOT_FOUND | CONFLICT | RATE_LIMITED | INTERNAL_ERROR` (Route Handlers map these to 401/400/404/409/429/500, plus 413 for oversize payloads). Never return SQL errors or stack traces, and never log note content, session tokens, or public slugs.

Use Server Components by default. Use Client Components only for the editor, toolbar, autosave, visibility toggle, and interactive forms.
