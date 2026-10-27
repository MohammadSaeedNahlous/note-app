# Notes App

Rich-text notes with email/password auth and optional public sharing. See `SPEC.md`.

## Setup

```bash
bun install
cp .env.example .env.local   # set BETTER_AUTH_SECRET (openssl rand -base64 32)
bun run dev                  # http://localhost:3000
```

On startup the server creates any missing tables in `DATABASE_PATH` (default `data/notes.sqlite`, WAL mode).

To initialize a fresh database manually (Better Auth first, because `note` references `"user"`):

```bash
bunx --bun auth@latest migrate   # Better Auth core tables
bun run db:migrate               # app migrations (migrations/*.sql)
```

## Other commands

```bash
bun test        # tests
bun run lint    # ESLint
bun run build   # production build
```
