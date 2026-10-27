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
