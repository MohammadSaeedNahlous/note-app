# Technical Specification: Notes Application

| Field            | Value                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Version**      | 1.1                                                                                                       |
| **Status**       | Initial implementation specification                                                                      |
| **Project type** | Full-stack web application                                                                                |
| **Primary goal** | Build a secure, minimal notes application with rich-text editing, user authentication, and optional public sharing |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [Database Design](#5-database-design)
6. [Database Access Layer](#6-database-access-layer)
7. [Authentication with Better Auth](#7-authentication-with-better-auth)
8. [Notes and Rich-Text Editing](#8-notes-and-rich-text-editing)
9. [Autosave Requirements](#9-autosave-requirements)
10. [Public Sharing and Privacy](#10-public-sharing-and-privacy)
11. [API and Mutation Contracts](#11-api-and-mutation-contracts)
12. [User Interface Requirements](#12-user-interface-requirements)
13. [Error Handling and Operational Requirements](#13-error-handling-and-operational-requirements)
14. [Testing Strategy](#14-testing-strategy)
15. [Acceptance Criteria](#15-acceptance-criteria)
16. [Implementation Plan](#16-implementation-plan)
17. [Risks and Technical Considerations](#17-risks-and-technical-considerations)
18. [Final Design Decisions and Assumptions](#18-final-design-decisions-and-assumptions)

---

## 1. Project Overview

### 1.1 Purpose

The application allows registered users to create, read, update, and permanently delete personal notes. Each note can be private or publicly accessible through a unique URL.

Users write and format their notes using a rich-text editor. Changes are saved automatically after a short pause in editing. Public notes can be viewed without authentication, while private notes remain accessible only to their owners.

### 1.2 Project Objectives

- Provide secure email/password authentication.
- Allow users to manage their own notes.
- Support rich-text formatting through Tiptap.
- Persist application data in SQLite.
- Implement database access using Bun's native SQLite client and raw SQL.
- Enable and disable public sharing without changing the note's content.
- Keep the architecture small, maintainable, and easy to extend.

### 1.3 Scope

#### Included in the MVP

- Registration, login, and logout.
- Authenticated notes dashboard.
- Create, read, edit, and delete notes.
- Note titles and rich-text content.
- Debounced autosaving with visible save status.
- Private/public visibility controls.
- Unique public sharing URLs.
- Responsive user interface.
- Input validation, authorization, error handling, and automated tests.

#### Excluded from the MVP

- Folders, tags, and categories.
- Search and advanced sorting.
- Note version history and trash recovery.
- Collaborative editing and comments.
- File attachments and image uploads.
- Social login, passkeys, and multi-factor authentication.
- Public note discovery or search engine indexing as a product feature.
- Mobile applications.
- Multi-tenant organizations and administrative dashboards.

---

## 2. Technology Stack

| Component                   | Technology                                         | Responsibility                                        |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| Framework                   | Next.js App Router                                 | Routing, rendering, server-side application logic     |
| Language                    | TypeScript                                         | Type safety                                           |
| Runtime and package manager | Bun                                                | Running the application, dependencies, scripts        |
| Styling                     | Tailwind CSS                                       | Layout, responsive design, visual styling             |
| Rich-text editor            | Tiptap                                             | Editing and displaying structured note content        |
| Authentication              | Better Auth                                        | Users, password authentication, sessions              |
| Database                    | SQLite                                             | Persistent application and authentication data        |
| Database client             | `bun:sqlite`                                       | SQLite connections, prepared statements, transactions |
| Validation                  | Zod                                                | Validating request payloads and editor documents      |
| Testing                     | Bun test runner and an appropriate UI testing tool | Unit, integration, and end-to-end tests               |

### 2.1 Dependency Policy

- Use the current stable, mutually compatible versions of the chosen libraries at project initialization.
- Commit `package.json` and `bun.lock` to version control.
- Do not introduce an ORM or query builder. Application queries must use parameterized SQL statements through Bun's SQLite API.
- Zod is a lightweight validation dependency. It does **not** replace database constraints or authorization checks.

---

## 3. Architecture

### 3.1 High-Level Architecture

The application follows a server-centric architecture.

```text
Browser
  |
  | Next.js pages and client components
  |
  +-- Authentication UI
  +-- Notes dashboard
  +-- Tiptap editor
  +-- Autosave controller
          |
          | Server Actions / Route Handlers
          |
          v
      Application services
          |
          +-- Session verification
          +-- Ownership authorization
          +-- Input validation
          +-- Note business rules
          |
          v
      Data access layer
          |
          +-- Authentication database access
          |      Better Auth (Kysely SQLite adapter over bun:sqlite)
          |
          +-- Notes repository
                 Raw parameterized SQL
          |
          v
       SQLite database
```

The browser never connects directly to SQLite. Database operations, session verification, authorization, and validation take place on the server.

### 3.2 Architectural Principles

1. **Server-side data access:** All SQLite imports and queries remain in server-only modules.
2. **Explicit authorization:** Every private-note operation verifies ownership.
3. **Minimal abstractions:** Use a small number of services and repositories rather than a complex domain architecture.
4. **Validated inputs:** Treat browser-submitted data as untrusted.
5. **Single source of truth:** SQLite is the authoritative store for notes and authentication data.
6. **Immediate privacy changes:** A public/private change takes effect on the server as soon as the update succeeds.
7. **Clear boundaries:** Authentication responsibilities remain separate from note-management responsibilities.

### 3.3 Rendering Strategy

Use React Server Components for pages and data that do not require browser interaction.

Use Client Components only where necessary, particularly for:

- Tiptap editing.
- Toolbar interactions.
- Autosave state.
- Visibility toggles.
- Interactive forms.

The public note page can be server-rendered using a server-side lookup by public slug. The lookup must return only notes that are currently public.

---

## 4. Project Structure

Use a `src/` directory and the Next.js App Router.

```text
notes-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (app)/
│   │   │   └── notes/
│   │   │       ├── page.tsx
│   │   │       ├── new/
│   │   │       └── [id]/
│   │   ├── share/
│   │   │   └── [slug]/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...all]/
│   │   │   │       └── route.ts
│   │   │   └── notes/
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── notes/
│   │   ├── editor/
│   │   │   ├── rich-text-editor.tsx
│   │   │   ├── editor-toolbar.tsx
│   │   │   └── save-status.tsx
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── auth.ts
│   │   │   └── auth-client.ts
│   │   ├── db/
│   │   │   ├── connection.ts
│   │   │   └── migrate.ts
│   │   ├── notes/
│   │   │   ├── repository.ts
│   │   │   ├── service.ts
│   │   │   ├── validation.ts
│   │   │   └── types.ts
│   │   └── security/
│   │       └── require-user.ts
│   │
│   └── actions/
│       └── notes.ts
│
├── migrations/
│   └── 0001_create_note.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── package.json
├── bun.lock
├── tsconfig.json
└── README.md
```

> **Note:** This is a suggested initial structure, not a requirement to create every file immediately. Keep authentication and database code separate from UI components.

---

## 5. Database Design

### 5.1 Database File

Use a local SQLite file, for example:

```text
data/notes.sqlite
```

The `data/` directory must be excluded from version control.

The connection module initializes the database **once per server process** and configures:

- Foreign key enforcement (`PRAGMA foreign_keys = ON`).
- A suitable busy timeout (`PRAGMA busy_timeout`).
- WAL journal mode (`PRAGMA journal_mode = WAL`) where appropriate.
- Prepared statements for application queries.

Do not create a new connection for every query. Better Auth and the notes repository share the same `bun:sqlite` `Database` instance.

### 5.2 Schema Conventions

All tables follow Better Auth's default schema conventions so that authentication and application tables are consistent:

| Convention      | Rule                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Table names     | Singular, lowercase (`user`, `session`, `account`, `verification`, `note`)                             |
| Column names    | camelCase (`userId`, `createdAt`, `updatedAt`)                                                         |
| Identifiers     | Quote every identifier in SQL (`"user"` is a reserved word in many SQL dialects)                       |
| Primary keys    | `"id" TEXT NOT NULL PRIMARY KEY`, string IDs generated by the application                              |
| Foreign keys    | `<model>Id` referencing `"<model>" ("id")`                                                             |
| Booleans        | `INTEGER` restricted to `0` / `1` (SQLite has no native boolean type)                                  |
| Timestamps      | `createdAt` and `updatedAt` on every table, stored as ISO 8601 UTC values                              |

Keep Better Auth's default ID generation (string IDs). Do **not** set `advanced.database.generateId` to `"serial"` or `false`; the `note."userId"` foreign key depends on `user."id"` being `TEXT`.

Do not rename Better Auth tables or columns via `modelName` / `fields` unless this specification is updated accordingly.

### 5.3 Authentication Tables (Better Auth Core Schema)

Better Auth owns the four core tables below. They are documented here as a **reference** for foreign keys, queries, and tests — they must be created by the Better Auth CLI, never by hand-written application migrations (see [5.6](#56-database-migrations)).

Types are listed as Better Auth field types; `?` marks optional (nullable) columns.

#### `user`

| Field           | Type      | Constraints      | Description                                   |
| --------------- | --------- | ---------------- | --------------------------------------------- |
| `id`            | `string`  | Primary key      | Unique identifier for each user               |
| `name`          | `string`  | Required         | User's chosen display name                    |
| `email`         | `string`  | Required, unique | User's email address for communication/login  |
| `emailVerified` | `boolean` | Required         | Whether the user's email is verified          |
| `image`         | `string?` | Optional         | User's image URL                              |
| `createdAt`     | `Date`    | Required         | Timestamp of when the user account was created |
| `updatedAt`     | `Date`    | Required         | Timestamp of the last update to the user      |

#### `session`

| Field       | Type      | Constraints                     | Description                                  |
| ----------- | --------- | ------------------------------- | -------------------------------------------- |
| `id`        | `string`  | Primary key                     | Unique identifier for each session           |
| `userId`    | `string`  | Foreign key → `user.id`         | ID of the user who owns the session          |
| `token`     | `string`  | Required, unique                | The session token                            |
| `expiresAt` | `Date`    | Required                        | Time when the session expires                |
| `ipAddress` | `string?` | Optional                        | IP address of the device                     |
| `userAgent` | `string?` | Optional                        | User agent information of the device         |
| `createdAt` | `Date`    | Required                        | Timestamp of when the session was created    |
| `updatedAt` | `Date`    | Required                        | Timestamp of when the session was updated    |

#### `account`

An account represents one authentication method linked to a user. Better Auth identifies the provider-side identity by the pair (`providerId`, `accountId`); `id` identifies the local row.

| Field                   | Type      | Constraints             | Description                                                   |
| ----------------------- | --------- | ----------------------- | ------------------------------------------------------------- |
| `id`                    | `string`  | Primary key             | Unique identifier for each account                            |
| `userId`                | `string`  | Foreign key → `user.id` | ID of the user who owns the account                           |
| `accountId`             | `string`  | Required                | Account ID from the provider (user ID for credential accounts) |
| `providerId`            | `string`  | Required                | Provider ID (`credential` for email/password)                 |
| `accessToken`           | `string?` | Optional                | OAuth access token                                            |
| `refreshToken`          | `string?` | Optional                | OAuth refresh token                                           |
| `accessTokenExpiresAt`  | `Date?`   | Optional                | Expiration time of the access token                           |
| `refreshTokenExpiresAt` | `Date?`   | Optional                | Expiration time of the refresh token                          |
| `scope`                 | `string?` | Optional                | OAuth scope granted                                           |
| `idToken`               | `string?` | Optional                | ID token returned by the provider                             |
| `password`              | `string?` | Optional                | Password hash (credential accounts only)                      |
| `createdAt`             | `Date`    | Required                | Timestamp of when the account was created                     |
| `updatedAt`             | `Date`    | Required                | Timestamp of when the account was updated                     |

For this MVP, every user has exactly one `account` row with `providerId = 'credential'`, `accountId = user.id`, and the password hash in `password`. **Passwords are never stored on the `user` table.** OAuth columns remain `NULL` until social login is added.

#### `verification`

| Field        | Type     | Constraints | Description                                  |
| ------------ | -------- | ----------- | -------------------------------------------- |
| `id`         | `string` | Primary key | Unique identifier for each verification      |
| `identifier` | `string` | Required    | Identifier for the verification request      |
| `value`      | `string` | Required    | Value to be verified                         |
| `expiresAt`  | `Date`   | Required    | Time when the verification request expires   |
| `createdAt`  | `Date`   | Required    | Timestamp of when the request was created    |
| `updatedAt`  | `Date`   | Required    | Timestamp of when the request was updated    |

The `verification` table is created even though email verification and password reset are not in the MVP; it is part of the required core schema.

#### Entity relationships

```text
user 1 ──< session        (session.userId → user.id, ON DELETE CASCADE)
user 1 ──< account        (account.userId → user.id, ON DELETE CASCADE)
user 1 ──< note           (note.userId    → user.id, ON DELETE CASCADE)
verification               (standalone, keyed by identifier)
```

#### Rules for the authentication tables

- Application code must **not** `INSERT`, `UPDATE`, or `DELETE` rows in `user`, `session`, `account`, or `verification`. Use Better Auth's API (`auth.api.*`) instead.
- Read-only joins against `user` (for example, in tests) are allowed but should be rare; prefer the session returned by Better Auth.
- No `additionalFields` are added to `user` or `session` in the MVP. If added later, declare them in the Better Auth config and regenerate the schema with the CLI.
- Before applying the notes migration, run `bunx --bun auth@latest generate` or inspect the migrated database to confirm the generated schema matches this section for the installed Better Auth version.

### 5.4 Notes Table

Create a separate `note` table for application data, following the same conventions as the Better Auth tables.

`migrations/0001_create_note.sql`:

```sql
CREATE TABLE IF NOT EXISTS "note" (
    "id"         TEXT    NOT NULL PRIMARY KEY,
    "userId"     TEXT    NOT NULL
        REFERENCES "user" ("id") ON DELETE CASCADE,
    "title"      TEXT    NOT NULL DEFAULT '',
    "content"    TEXT    NOT NULL,
    "isPublic"   INTEGER NOT NULL DEFAULT 0
        CHECK ("isPublic" IN (0, 1)),
    "publicSlug" TEXT    UNIQUE,
    "createdAt"  TEXT    NOT NULL,
    "updatedAt"  TEXT    NOT NULL,

    CHECK (
        ("isPublic" = 0 AND "publicSlug" IS NULL)
        OR
        ("isPublic" = 1 AND "publicSlug" IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS "note_userId_updatedAt_idx"
    ON "note" ("userId", "updatedAt" DESC);
```

The `UNIQUE` constraint on `"publicSlug"` already creates an index, so no separate slug index is needed.

### 5.5 Note Column Definitions

| Column       | Type      | Constraints                  | Purpose                                   |
| ------------ | --------- | ---------------------------- | ----------------------------------------- |
| `id`         | `TEXT`    | Primary key                  | Internal note identifier (UUID)           |
| `userId`     | `TEXT`    | Foreign key → `user.id`      | Owner's Better Auth user ID               |
| `title`      | `TEXT`    | Required, default `''`       | Plain-text note title                     |
| `content`    | `TEXT`    | Required                     | Serialized Tiptap JSON document           |
| `isPublic`   | `INTEGER` | Required, `0` or `1`         | Whether anonymous access is enabled       |
| `publicSlug` | `TEXT`    | Unique, nullable             | Unguessable public identifier             |
| `createdAt`  | `TEXT`    | Required                     | Creation timestamp (ISO 8601 UTC)         |
| `updatedAt`  | `TEXT`    | Required                     | Last successful modification (ISO 8601 UTC) |

- Use ISO 8601 UTC timestamps (`new Date().toISOString()`) for consistent storage, ordering, and display.
- Generate note IDs with `crypto.randomUUID()`.
- Public slugs must use a cryptographically secure random generator with sufficient entropy (at least 128 bits, e.g. base64url-encoded random bytes). They must not be derived from a sequential ID or the note title.

### 5.6 Database Migrations

Two independent migration mechanisms exist:

| Schema                  | Managed by                                    | Command                         |
| ----------------------- | --------------------------------------------- | ------------------------------- |
| Better Auth core tables | Better Auth CLI                               | `bunx --bun auth@latest migrate` |
| Application tables      | Numbered SQL files in `migrations/` via `src/lib/db/migrate.ts` | `bun run db:migrate`            |

The `--bun` flag is required so the CLI runs under the Bun runtime and can load `bun:sqlite`.

Migration rules:

1. Never rely on production startup to silently modify the schema.
2. Run the Better Auth migration **before** the application migrations, because `note` references `"user"`.
3. Apply application migrations in filename order.
4. Track successfully applied application migration filenames in a `_app_migration` table (`"name" TEXT PRIMARY KEY`, `"appliedAt" TEXT NOT NULL`).
5. Make migrations repeatable where appropriate and fail clearly when an unexpected schema is detected.
6. Never place Better Auth table definitions in application migration files.
7. Document the commands needed to initialize a fresh database in `README.md`.

### 5.7 Data Deletion

- Deleting a user cascades to their sessions, accounts, and notes through `ON DELETE CASCADE`. Verify this behavior in integration tests (foreign keys must be enabled on the connection).
- Deleting a note permanently removes its row. A deleted public note must no longer be accessible through its former public URL.

---

## 6. Database Access Layer

### 6.1 Connection Management

Create a server-only connection module (`src/lib/db/connection.ts`) that exposes the shared Bun SQLite database instance.

The module must:

- Resolve the database path consistently.
- Create the database directory if necessary.
- Enable foreign keys.
- Expose no database connection to client bundles (use `import "server-only"`).
- Provide a clean location for future transaction helpers.

### 6.2 Repository Responsibilities

`src/lib/notes/repository.ts` contains SQL queries and row mapping (converting `isPublic` from `0`/`1` to a boolean).

Suggested repository operations:

- `createNote`
- `findNoteByIdAndOwner`
- `listNotesByOwner`
- `updateNoteContent`
- `updateNoteVisibility`
- `deleteNoteByIdAndOwner`
- `findPublicNoteBySlug`

Repository functions must accept explicit parameters and return typed results.

### 6.3 Query Requirements

All SQL must use parameterized statements. Never concatenate user-provided values into SQL strings.

```sql
SELECT "id", "title", "content", "isPublic",
       "publicSlug", "createdAt", "updatedAt"
FROM "note"
WHERE "id" = ? AND "userId" = ?;
```

Every owner-specific update or delete must include both the note ID and the authenticated user ID in its `WHERE` clause:

```sql
DELETE FROM "note"
WHERE "id" = ? AND "userId" = ?;
```

A mutation that affects zero rows returns a not-found result without revealing whether another user's private note exists.

### 6.4 Transactions

- Use transactions when a logical operation requires multiple database changes to succeed together — for example, changing visibility and assigning or removing the public slug.
- Use `db.transaction(...)` from `bun:sqlite`.
- Never keep a transaction open while waiting for browser input or external services.

---

## 7. Authentication with Better Auth

### 7.1 Required Functionality

- User registration using email and password.
- Login using email and password.
- Logout.
- Persistent session handling.
- Protected access to the notes dashboard and editor.
- Server-side retrieval of the authenticated user.

Password reset is added only when an email delivery mechanism is configured and tested. Email verification requirements must be explicitly configured (`emailAndPassword.requireEmailVerification`) rather than assumed; it is disabled for the MVP.

### 7.2 Integration

- Configure Better Auth in `src/lib/auth/auth.ts`, passing the shared `bun:sqlite` `Database` instance as `database` and enabling `emailAndPassword`.
- Expose the authentication endpoints through the Next.js catch-all Route Handler at `src/app/api/auth/[...all]/route.ts` using `toNextJsHandler`.
- Create the client in `src/lib/auth/auth-client.ts` using `createAuthClient` from `better-auth/react`.
- Generate or migrate the core schema ([5.3](#53-authentication-tables-better-auth-core-schema)) with the Better Auth CLI under the Bun runtime.

References:

- [Better Auth database concepts](https://better-auth.com/docs/concepts/database)
- [Better Auth SQLite adapter](https://better-auth.com/docs/adapters/sqlite)

### 7.3 Session Verification

- Implement a server-side helper (`src/lib/security/require-user.ts`) that obtains and verifies the current session with `auth.api.getSession({ headers })`.
- Protected operations must use the verified `session.user.id`. Never accept a `userId` from a client payload as proof of ownership.
- Redirect unauthenticated users from protected pages to the login page. For mutation requests, return a structured `UNAUTHENTICATED` error.

### 7.4 Security Configuration

- Store the Better Auth secret in the `BETTER_AUTH_SECRET` environment variable.
- Use a high-entropy secret of at least the length required by the selected version.
- Configure the canonical application URL (`BETTER_AUTH_URL`) and trusted origins.
- Use secure cookie settings appropriate to the environment.
- Do not log passwords, session tokens, or authentication secrets.
- Keep development-only secrets out of version control.

---

## 8. Notes and Rich-Text Editing

### 8.1 Supported Formatting

The editor must support only the following content types in the initial release:

| Content type       | Tiptap extension                                |
| ------------------ | ----------------------------------------------- |
| Normal paragraphs  | Paragraph, included in StarterKit               |
| Bold               | Bold, included in StarterKit                    |
| Italic             | Italic, included in StarterKit                  |
| Heading levels 1–3 | Heading, restricted to levels 1, 2, and 3       |
| Inline code        | Code, included in StarterKit                    |
| Code blocks        | CodeBlock, included in StarterKit               |
| Bullet lists       | BulletList and ListItem, included in StarterKit |
| Horizontal rules   | HorizontalRule, included in StarterKit          |

Use `@tiptap/starter-kit` and disable StarterKit extensions that are not listed above. Avoid enabling unnecessary formatting options.

Reference: [Tiptap StarterKit documentation](https://tiptap.dev/docs/editor/extensions/functionality/starterkit)

### 8.2 Editor Behavior

- Provide a toolbar with clear formatting controls.
- Support keyboard shortcuts supplied by Tiptap.
- Show the current active formatting state.
- Preserve formatting when saving and reopening a note.
- Display an appropriate empty editor state.
- Do not block editing with unnecessary full-page refreshes.
- Keep the toolbar keyboard-accessible and provide descriptive labels.

### 8.3 Content Storage

Store the editor document as serialized JSON in the `note."content"` column.

Example document:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "My note" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Hello " },
        {
          "type": "text",
          "marks": [{ "type": "bold" }],
          "text": "world"
        }
      ]
    }
  ]
}
```

This example is illustrative. The editor's actual serialized document is the canonical format.

### 8.4 Validation

Before persisting editor content:

1. Parse the incoming JSON.
2. Reject malformed JSON and invalid document structures.
3. Validate the root document and permitted node types.
4. Allow only the configured marks and node attributes.
5. Restrict headings to levels 1–3.
6. Enforce a configurable maximum content size.
7. Reject unsupported nodes, marks, and attributes rather than blindly persisting arbitrary content.
8. Validate the title separately as plain text.

Use the same content schema for creation, editing, and public rendering. Do not trust the browser merely because the content originated from Tiptap.

### 8.5 Public Rendering

- Render public documents using Tiptap's rendering functionality or a server-side renderer that understands the same schema.
- Do not inject arbitrary stored HTML through `dangerouslySetInnerHTML`.
- Public rendering must not execute user-provided scripts or allow unsupported embedded content. Code blocks display text; they never execute code.

---

## 9. Autosave Requirements

### 9.1 Behavior

Autosave is the default saving mechanism.

- Save after a configurable pause, initially **700 ms** after the last edit.
- Display the states `Unsaved changes`, `Saving…`, `Saved`, and `Save failed`.
- Save both title and document changes.
- Avoid sending duplicate requests for unchanged content.
- Do not mark content as saved until the server confirms success.
- Retry only when appropriate and preserve unsaved content after a failure.
- Warn the user before leaving the page when unsaved changes remain.

### 9.2 Race Conditions

The implementation must handle overlapping requests. For example, an earlier save may finish after a later save; the earlier response must not mark newer editor content as saved or overwrite a more recent update.

Use **both** a client-side request sequence and a server-side concurrency strategy:

- The client sends the `updatedAt` value it last received as `expectedUpdatedAt`.
- The server performs a conditional update:

  ```sql
  UPDATE "note"
  SET "title" = ?, "content" = ?, "updatedAt" = ?
  WHERE "id" = ? AND "userId" = ? AND "updatedAt" = ?;
  ```

- If no row is updated but the note exists for this owner, return a `CONFLICT` response rather than silently overwriting the newer version.
- The client then reloads or reconciles the latest server state.

### 9.3 Failure Behavior

If a save fails:

- Keep the current editor content in memory.
- Display a clear error.
- Keep the save state as unsaved.
- Allow the user to retry.
- Never report a successful save before the database operation succeeds.

---

## 10. Public Sharing and Privacy

### 10.1 Visibility Model

Each note has exactly two visibility states:

- **Private:** Accessible only to its owner.
- **Public:** Accessible to anyone who has the public URL.

Public does not mean listed. The MVP must not provide a public feed of notes.

### 10.2 Sharing URL

Use the route:

```text
/share/{publicSlug}
```

- Generate the slug with a cryptographically secure random source. It must not reveal the note ID or user ID.
- Generate the slug when public sharing is enabled and store it in `"publicSlug"`, protected by the uniqueness constraint.
- On a collision, generate another slug and retry a limited number of times before returning an internal error.

### 10.3 Enabling Sharing

When the owner enables sharing:

1. Verify the user's session.
2. Verify note ownership.
3. Validate the request.
4. Generate a secure public slug.
5. Atomically update `"isPublic"` and `"publicSlug"`.
6. Return the public URL after the update succeeds.

### 10.4 Disabling Sharing

When the owner disables sharing:

1. Verify the user's session.
2. Verify note ownership.
3. Set `"isPublic" = 0`.
4. Set `"publicSlug" = NULL`.
5. Complete the update atomically.

The former URL must immediately stop resolving to the note. Re-enabling sharing generates a new slug.

### 10.5 Public Lookup

Public pages must query notes using both the supplied slug and the current visibility state:

```sql
SELECT "title", "content", "createdAt", "updatedAt"
FROM "note"
WHERE "publicSlug" = ?
  AND "isPublic" = 1;
```

- Never look up a note by slug and return it without checking visibility.
- Return a generic not-found page for missing or disabled public URLs.
- Never expose private note metadata, `userId`, internal note IDs, or authentication information.

### 10.6 Caching

- Private note data must not be stored in a shared cache.
- For public notes, use conservative cache behavior in the MVP (dynamic rendering, no static generation) so visibility changes take effect immediately.
- If public caching is introduced later, cache invalidation must be designed as part of the visibility mutation.

### 10.7 Additional Protections

- Apply rate limits to authentication and mutation endpoints (Better Auth's built-in rate limiter covers the auth endpoints).
- Avoid logging public slugs unnecessarily.
- Do not place private note content in analytics events or error logs.
- Use HTTPS in any non-local deployment.
- Configure metadata and indexing behavior intentionally (e.g. `noindex` on share pages).
- Recognize that a public note that has already been viewed or copied cannot be recalled.

---

## 11. API and Mutation Contracts

Use Server Actions for the primary authenticated note mutations. Use Route Handlers where an HTTP interface is useful, particularly for autosave requests.

All operations must enforce the same validation and authorization rules regardless of entry point.

### 11.1 Required Operations

| Operation            | Method or mechanism            | Access                    |
| -------------------- | ------------------------------ | ------------------------- |
| Register             | Better Auth endpoint           | Public                    |
| Login                | Better Auth endpoint           | Public                    |
| Logout               | Better Auth endpoint           | Authenticated session     |
| List own notes       | Server-side query              | Authenticated             |
| Create note          | Server Action                  | Authenticated             |
| Read own note        | Server-side query              | Owner only                |
| Update title/content | Server Action or Route Handler | Owner only                |
| Change visibility    | Server Action                  | Owner only                |
| Delete note          | Server Action                  | Owner only                |
| Read shared note     | `GET /share/[slug]`            | Public, only while shared |

### 11.2 Mutation Payloads

**Create note**

```ts
type CreateNoteInput = {
  title?: string;
  content: unknown;
};
```

**Update note**

```ts
type UpdateNoteInput = {
  title?: string;
  content?: unknown;
  expectedUpdatedAt: string;
};
```

**Change visibility**

```ts
type SetVisibilityInput = {
  isPublic: boolean;
};
```

These payloads are conceptual contracts. Validate them at runtime with Zod and use the authenticated session to determine the owner — none of them carry a `userId`.

### 11.3 Response Behavior

A mutation returns either the updated note metadata or a structured error.

Error categories:

- `UNAUTHENTICATED`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

Do not return stack traces, SQL errors, secrets, or sensitive note details to the browser.

For Route Handlers, use these HTTP status codes:

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| `400`  | Malformed or invalid input               |
| `401`  | Unauthenticated mutation                 |
| `404`  | Missing or inaccessible note             |
| `409`  | Concurrent modification conflict         |
| `413`  | Payload exceeds configured limits        |
| `429`  | Rate limited                             |
| `500`  | Unexpected server failure                |

---

## 12. User Interface Requirements

### 12.1 Authentication Screens

Provide:

- Registration form (name, email, password — `name` is required by the Better Auth `user` table).
- Login form (email, password).
- Validation feedback.
- Loading and submission states.
- Clear authentication error messages.

### 12.2 Notes Dashboard

Display the authenticated user's notes. Each entry shows:

- Title.
- Last updated timestamp.
- Visibility status.
- Link to the editor.

Include a button to create a note and an empty state for new accounts. The dashboard must only retrieve notes belonging to the authenticated user.

### 12.3 Note Editor

The editor page contains:

- Editable title.
- Rich-text editing area.
- Formatting toolbar.
- Autosave status.
- Visibility control.
- Public URL and copy-link action when sharing is enabled.
- Delete action with a confirmation step.

The public URL must not be shown as active until the visibility update succeeds.

### 12.4 Public Note Page

The public page must:

- Render the note title and supported formatting.
- Display a clear not-found state for invalid or disabled links.
- Hide editing controls and private management information.
- Work without a login session.
- Avoid leaking ownership or internal database information.

### 12.5 Visual and Accessibility Requirements

- Use Tailwind CSS for consistent spacing, responsive layouts, and visual states.
- Support desktop and mobile browsers.
- Provide keyboard-accessible controls, visible focus states, proper labels, and adequate text contrast.
- Dark mode is not required unless added during implementation.

---

## 13. Error Handling and Operational Requirements

### 13.1 Database Errors

Handle database failures at the service or repository boundary. Log diagnostic details server-side without including credentials, session tokens, or full private note content.

Return a generic user-facing error and preserve unsaved editor content.

### 13.2 Input Errors

Validation errors identify the affected field when possible. Invalid content must not partially overwrite an existing note.

### 13.3 Not-Found and Authorization Behavior

- An owner-only operation must not disclose whether an inaccessible note exists.
- A private note's identifier is never sufficient to grant access.

### 13.4 Local Development

Document commands in `README.md` for:

- Installing dependencies (`bun install`).
- Migrating the Better Auth schema (`bunx --bun auth@latest migrate`).
- Applying application migrations (`bun run db:migrate`).
- Running the development server (`bun run dev`).
- Running tests (`bun test`).
- Performing a production build (`bun run build`).

Provide `.env.example` without real secrets:

```dotenv
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
DATABASE_PATH=data/notes.sqlite
```

Add the database directory, environment secrets, and generated runtime files to `.gitignore`.

---

## 14. Testing Strategy

Use a layered testing approach.

### 14.1 Unit Tests

Test:

- Zod schemas for titles and Tiptap documents.
- Allowed editor node and mark types.
- Heading-level restrictions.
- Public slug generation.
- Save-state transitions.
- Error mapping.
- Note service business rules.

### 14.2 Database Integration Tests

Use a temporary SQLite database with the Better Auth schema and application migrations applied.

Verify:

- Note creation and retrieval.
- Correct owner filtering.
- Parameterized SQL behavior.
- Visibility changes.
- Unique public slugs.
- Permanent deletion.
- Foreign key behavior (deleting a `user` cascades to `session`, `account`, and `note`).
- Timestamp updates.
- Transaction rollback on failure.

### 14.3 Authentication and Authorization Tests

Verify that:

- Unauthenticated users cannot create, edit, or delete notes.
- User A cannot read or mutate User B's private notes.
- Supplying another user's ID does not change authorization.
- A public note can be read anonymously.
- A private note cannot be read anonymously.
- Disabling sharing invalidates the public URL.
- Deleting a public note invalidates its URL.
- Re-enabling sharing generates a new URL.
- Registration creates one `user` row and one `credential` `account` row holding the password hash.

### 14.4 Editor Tests

Verify that:

- Every required formatting control works.
- JSON serialization and deserialization preserve formatting.
- Unsupported nodes and marks are rejected.
- Autosave occurs after the debounce period.
- Unchanged content does not trigger unnecessary saves.
- Save failures preserve editor content.
- Out-of-order responses do not overwrite newer state.
- Concurrent modifications produce a conflict rather than a silent overwrite.

### 14.5 End-to-End Tests

Using a browser automation tool such as Playwright, test the complete user journey:

1. Register a user.
2. Log in.
3. Create and format a note.
4. Wait for autosave.
5. Refresh and confirm the content persists.
6. Enable public sharing.
7. Open the URL in a logged-out browser context.
8. Disable sharing and verify that the URL no longer displays the note.
9. Delete the note.
10. Verify that the note is absent from the dashboard and inaccessible by its former URL.

---

## 15. Acceptance Criteria

The MVP is complete when all of the following are true.

### 15.1 Authentication

- [ ] A user can register, log in, and log out.
- [ ] Authentication state is verified server-side for protected operations.
- [ ] Users cannot access other users' private notes.
- [ ] The Better Auth core tables (`user`, `session`, `account`, `verification`) are created by the Better Auth CLI and match [5.3](#53-authentication-tables-better-auth-core-schema).

### 15.2 Notes Management

- [ ] A user can create a note with a title and content.
- [ ] A user can view and edit their own notes.
- [ ] Changes persist in SQLite.
- [ ] Autosave reports saving, success, and failure states correctly.
- [ ] A user can permanently delete a note.
- [ ] Deleted notes cannot be recovered through the application.

### 15.3 Rich-Text Editing

- [ ] Paragraphs, bold, italic, H1–H3, inline code, code blocks, bullet lists, and horizontal rules are supported.
- [ ] Formatting survives a refresh.
- [ ] Invalid editor documents are rejected server-side.

### 15.4 Public Sharing

- [ ] Each shared note has a unique, unguessable URL.
- [ ] Anyone with the URL can view a currently public note without logging in.
- [ ] Private notes are not accessible through public URLs or direct ID lookup.
- [ ] Disabling sharing immediately invalidates the former URL.
- [ ] Re-enabling sharing creates a new public URL.
- [ ] Deleting a note removes public access.

### 15.5 Security and Maintainability

- [ ] All SQL uses parameterized statements.
- [ ] All note mutations verify session and ownership.
- [ ] The database and authentication secrets are not exposed to the client.
- [ ] Application migrations are documented and repeatable.
- [ ] Automated tests cover the critical authorization and sharing rules.
- [ ] The application starts locally using Bun and passes its production build.

---

## 16. Implementation Plan

### Phase 1 — Project Initialization

- Create the Next.js application with TypeScript, Bun, and Tailwind CSS.
- Install Better Auth, Tiptap, and Zod.
- Configure scripts, environment variables, and project structure.
- Verify the development server and production build.

**Deliverable:** A working application skeleton.

### Phase 2 — Database and Authentication

- Initialize the shared Bun SQLite connection.
- Configure Better Auth with email/password and the shared connection.
- Run `bunx --bun auth@latest migrate` and verify the core schema against [5.3](#53-authentication-tables-better-auth-core-schema).
- Implement the application migration runner and apply `0001_create_note.sql`.
- Implement session retrieval and protected-route behavior.

**Deliverable:** A working authentication flow and database.

### Phase 3 — Notes CRUD

- Implement the notes repository.
- Implement the note service and validation schemas.
- Build the dashboard and editor routes.
- Add create, read, update, and permanent-delete operations.
- Verify owner-only access.

**Deliverable:** Authenticated users can manage their notes.

### Phase 4 — Rich-Text Editor and Autosave

- Configure Tiptap's StarterKit.
- Restrict formatting to the specified document schema.
- Build the toolbar and editor UI.
- Implement debounced autosave and save states.
- Add concurrency protection and failure recovery.

**Deliverable:** A reliable rich-text editing experience.

### Phase 5 — Public Sharing

- Implement secure public slug generation.
- Add visibility mutations.
- Build the anonymous public note page.
- Prevent private-note exposure and stale cached responses.
- Test enabling, disabling, and re-enabling sharing.

**Deliverable:** Public sharing works securely.

### Phase 6 — Testing and Completion

- Add unit and database integration tests.
- Add authentication and authorization tests.
- Add end-to-end coverage for the primary user journey.
- Verify responsive design and accessibility.
- Document setup, migrations, tests, and backup considerations.

**Deliverable:** A tested MVP ready for local use.

---

## 17. Risks and Technical Considerations

### 17.1 Better Auth and Database Ownership

Better Auth and the application share one `bun:sqlite` database while keeping separate responsibilities: Better Auth owns the `user`, `session`, `account`, and `verification` tables and all writes to them; the notes repository owns the `note` table.

Avoid manually writing authentication queries or duplicating session logic. Upgrading Better Auth may add columns to the core tables — re-run the CLI after upgrades and update [5.3](#53-authentication-tables-better-auth-core-schema) if the schema changes.

### 17.2 SQLite Deployment Constraints

SQLite is appropriate for the initial local application. Its database file must remain on persistent storage. Before deploying to a serverless or multi-instance environment, reassess file persistence, write concurrency, backups, and database sharing.

### 17.3 Public Sharing and Privacy

Public URLs are bearer-style access links: anyone who obtains the URL can view the note while sharing remains enabled. Unpublishing prevents future application access but cannot erase previously copied content.

### 17.4 Autosave Reliability

Autosave risks lost updates and confusing save indicators when requests overlap. Client-side request sequencing alone is insufficient; server-side concurrency checks must also be implemented.

### 17.5 Editor Security

Structured JSON reduces reliance on stored HTML but does not automatically make arbitrary content safe. Strict schema validation and safe rendering remain mandatory.

---

## 18. Final Design Decisions and Assumptions

This specification establishes the following defaults:

1. The MVP is a single Next.js application with server-side SQLite access.
2. The initial environment is local development using Bun.
3. Better Auth manages the `user`, `session`, `account`, and `verification` tables and all session logic.
4. All tables follow Better Auth's conventions: singular names, camelCase columns, `TEXT` string IDs, `createdAt`/`updatedAt` timestamps.
5. Application note data is stored in the `note` table using raw parameterized SQL.
6. Note content is stored as Tiptap JSON in SQLite.
7. Each note belongs to exactly one user (`note.userId → user.id`).
8. Notes are private by default.
9. Public sharing uses an unguessable slug, not the internal note ID.
10. Disabling sharing clears the public slug.
11. Deletion is permanent.
12. Autosave uses debouncing and server-side conflict protection.
13. Only the specified rich-text formatting is enabled.
14. No ORM, collaboration framework, search service, or external database is required.
15. Email delivery, production hosting, and account recovery must be configured separately if required.

Any future extension must preserve the ownership model, strict server-side validation, and the distinction between authenticated note management and anonymous public reading.

---

> **Definition of done:** The application provides a working, secure notes workflow from registration through rich-text editing, autosave, public sharing, unpublishing, and permanent deletion, with the critical behavior verified by automated tests.
