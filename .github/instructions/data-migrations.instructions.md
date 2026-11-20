---
applyTo: "server/migrations/data/**/*"
---

# Data Migration — Review Rules

Full writing rules: the Migrations section of `server/AGENTS.md`.

## Phase rules

The data phase runs while old and new code serve. Flag:

- Index builds, triggers, foreign keys `NOT VALID` or `VALIDATE` in `up()`. They go in `beforeCommit()`.
- `DROP`, `RENAME`, `SET NOT NULL`, `ADD CHECK` or `LOCK TABLE`. They go in a cleanup migration.
- Schema changes (new tables or columns). They go in a schema migration.

## Progress logging

New data migrations log progress, so operators and the super-admin Migrations page can follow a deploy:

1. `{MIGRATION_NAME}: [START] {action}: {total}` — after a count query sets the total.
2. `{MIGRATION_NAME}: [PROGRESS] {current}/{total} ({percent}%)` — inside the batch loop. The run tracker parses the `current/total` ratio.
3. `{MIGRATION_NAME}: [SUCCESS] {action} finished.`

Flag silent bulk updates. Example: `server/migrations/data/1783372800000-MoveNavigationLayoutStylesToStyles.ts`.
