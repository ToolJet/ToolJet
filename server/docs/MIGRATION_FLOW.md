# Migration flow

How ToolJet runs database migrations on boot, and how many pods do it at once without conflict.

**Read this before you change `server/src/migration-helpers/`, `server/src/modules/app/migration-runs/`, the upgrade gate, or a container entrypoint's `db:setup` step.** Update it in the same PR.

How to *write* a migration (schema vs data, enum rules, logging): [`../AGENTS.md`](../AGENTS.md) § Migrations.

---

## 1. Where migrations run from

```
entrypoint → wait-for-it (PostgreSQL) → npm run db:setup:prod → exec node dist/src/main
                                          └── db:create + db:migrate
                                                └── src/migration-helpers/run-all-migrations.ts
```

- **Every pod runs migrations.** There is no dedicated job. 20 pods start 20 migrators.
- **The migrator is a standalone process.** It does not boot NestJS (no `ConfigService`, no DI). It reads config with `getEnvVars()` and opens its own connections.

> `getEnvVars()` merges the env file **over** `process.env`. A key in `.env` wins over an exported shell variable. Keys absent from the file come from `process.env`; the e2e specs use this to tune the gate.
>
> `NODE_ENV` only selects the file (`test` → `../.env.test`, else `../.env`). Coordination does not depend on it (pinned in `concurrent-migrations.spec.ts`). It does change `ormconfig.ts`, which lists no migrations under `NODE_ENV=test`, so the e2e pods inject their own DataSources.

## 2. Execution model

`run-all-migrations.ts` runs all schema migrations (`server/migrations/`), then all data migrations (`server/data-migrations/`). `MIGRATION_PHASE` selects what one run does:

| `MIGRATION_PHASE` | Set by | Runs | Transaction |
|---|---|---|---|
| unset | blocking mode, Cloud, `npm run db:migrate` | schema, then data | **one** for both. A failing data migration rolls back the schema changes too. |
| `schema` | boot in async mode (§10) | pending schema migrations only | its own short one, with `lock_timeout` and retries |
| `data` | runs that the server starts (§10) | schema catch-up (normally empty), then all data migrations | catch-up in its own; all data in **one** |

Exception: PostgreSQL forbids use of an enum value in the transaction that added it. `planEnumAdditions` pre-commits the value (upgrade) or falls back to two transactions (fresh install). Details: `../AGENTS.md` § Migrations.

## 3. Multi-pod coordination

Two session-scoped advisory locks, in `migrations-table-gate.ts`. PostgreSQL releases a lock when its connection ends, so a killed pod cannot leak one. No TTL, no cleanup, no Redis.

```
run()
 └── withMigrationAdvisoryLock           ← 3.1  serialises pods (migration lock)
      └── migrateAsSolePod
           ├── realPendingMigrationNames  (sentinels excluded)
           ├── pg_advisory_lock(active)  ← 3.3  only when real work is pending
           └── executeMigrations         ← per MIGRATION_PHASE (§2)
```

| Lock | Key | Held | Read by |
|---|---|---|---|
| Migration lock | `MIGRATION_ADVISORY_LOCK_KEY` (`6273975241000`) | from "what is pending?" to commit | waiting pods; `migration_runs` liveness (§10) |
| Active lock | `MIGRATION_ACTIVE_LOCK_KEY` (`6273975241001`) | while real migrations execute | the upgrade gate (§4) |

### 3.1 Migration lock

`withMigrationAdvisoryLock` takes `pg_try_advisory_lock` **before** it reads the pending list, and holds it until commit.

The lock has its own session, idle while migrations run on other connections:

- **Pod killed (SIGTERM/SIGKILL):** the socket closes and the lock goes at once. The in-flight statement finishes, then rolls back. A new run waits behind its table locks.
- **Pod lost without a FIN** (node failure, partition): TCP keepalive (`DEAD_CLIENT_KEEPALIVE_SQL`) drops the session after about 60s, not the OS default of about 2 hours.
- **PgBouncer in transaction mode breaks this.** The unlock can land on another backend. Use a direct connection or session pooling.

**Why the table lock is not enough.** `LockMigrationsTable1/2` take ACCESS EXCLUSIVE on `migrations` *inside* the migration transaction. By then every pod has its own pending list. The loser wakes with a stale list, re-runs an applied migration, and crashes on a catalog error such as `duplicate key value violates unique constraint "pg_type_typname_nsp_index"`.

### 3.2 Waiting, never crash-looping

A pod that finds the lock taken sleeps `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` and tries again. `MIGRATION_LOCK_MAX_WAIT_MINUTES` bounds the wait (`0` = forever). The waiter never queries `migrations`, so no `lock_timeout`/`statement_timeout` can turn the wait into an error. Log on a waiting pod:

```
[migrations] Another pod is running migrations. Waited 4s so far; retrying in 2s. This pod will NOT exit.
[migrations] Lock released; got the migration lock after 8s.
```

With `MIGRATION_SKIP_IF_LOCKED=true` (server-managed modes, §10) the pod does not wait. It exits with code `75`.

### 3.3 Active lock, only when work is pending

`excludeLockSentinels` drops `LockMigrationsTable1234567890000` / `…891000` from the pending list. One of them is always pending (each deletes the other's row; that is how the table lock is taken every boot). If they counted, every restart and scale-up would refuse traffic. A boot with nothing pending never takes the active lock:

```
[migrations] No schema or data migrations pending — not cutting API traffic for this boot.
```

## 4. The upgrade gate

`MigrationGateMiddleware` answers `/api/*` with `503` while `MigrationRunsService.status()` says so. `status()` reads both locks from `pg_locks` (`HELD_MIGRATION_LOCKS_SQL`, current database only). In async mode it also reads the latest `migration_runs` row. Reading `pg_locks` locks no table, so it answers instantly while a migration holds ACCESS EXCLUSIVE on `migrations`.

| State | When | Blocking mode | Async mode |
|---|---|---|---|
| `running` | active lock held, or latest run is running | every API request | writes (`MIGRATION_IN_PROGRESS`) |
| `failed` | latest run failed | — | writes (`MIGRATION_FAILED`) until a super admin retries |

Response: `503`, `Retry-After: 30`, body `{ statusCode, code, message, timestamp, path }`.

Rules the middleware must keep:

1. **Never gate health or metrics** (`UNGATED_API_PATHS`). A gated `/api/health` makes the orchestrator kill the pods that wait out the upgrade. Add every new probe endpoint to that set.
2. **Gate only API routes**, so the SPA shell loads and shows the upgrade state. `buildApiPrefix(SUB_PATH)` handles subpath installs.
3. **Fail open.** A status read error means "no migration running".
4. **Stay cheap.** `status()` caches for 1s with a single flight, on the service's own two-connection pool. Rejection logs are throttled to one per 30s.

## 5. Environment variables

All optional. Also in `.env.example` § ROLLING UPGRADE.

| Variable | Default | Effect |
|---|---|---|
| `DISABLE_MIGRATION_TRAFFIC_GATE` | `false` | `true` turns off the 503. Locks and waiting still apply. Each serving pod logs this at boot. |
| `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` | `60` | How often a waiting pod retries. |
| `MIGRATION_LOCK_MAX_WAIT_MINUTES` | `30` | How long a pod waits before it fails its own boot. `0` waits forever. |
| `MIGRATION_MODE` | `blocking` | `async`: see §10. Any other value means `blocking`. Ignored on Cloud. |
| `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS` | `5000` | Schema phase only (§10). `lock_timeout` for its transaction. |
| `MIGRATION_SCHEMA_LOCK_RETRIES` | `10` | Schema phase only. Attempts after a lock timeout before the pod fails its boot. |

## 6. Failure modes

| Scenario | Migration | Gate | Cost |
|---|---|---|---|
| Another pod migrating | waits, then no-ops | not raised by the waiter | length of the other migration |
| Migrating pod gets SIGTERM/SIGKILL | rolled back | released with its connection | none |
| Migrating pod's node vanishes (no FIN) | rolled back | released after ~60s keepalive | about a minute |
| Migration itself is broken | rolled back, exits non-zero | released | fails fast, no retry |
| Wait exceeds the ceiling | exits non-zero | — | `MIGRATION_LOCK_MAX_WAIT_MINUTES` |
| Schema phase cannot lock a busy table (§10) | rolled back, retried, then exits non-zero | released | old pods keep serving |
| Database unreachable from a serving pod | — | fails open | the API is down anyway |

## 7. Operator runbook

**Is a migration running, and where?**

```sql
-- holders of the migration lock (6273975241000) and the active lock (6273975241001)
SELECT (l.classid::bigint << 32) | l.objid::bigint AS key, a.pid, a.client_addr, a.backend_start
FROM pg_locks l JOIN pg_stat_activity a USING (pid)
WHERE l.locktype = 'advisory' AND l.objsubid = 1 AND l.granted;
```

A held lock means a live session is migrating. The gate cannot stay raised after that session ends. To stop a runaway migration, run `SELECT pg_terminate_backend(<pid>)`: the transaction rolls back and both locks go.

**Upgrade without refusing traffic:** set `DISABLE_MIGRATION_TRAFFIC_GATE=true`.

**Known limitation:** the gate takes effect from the *next* upgrade. During the deploy that first ships it, the old pods have no middleware.

## 8. Tests

| File | Covers |
|---|---|
| `test/modules/migrations/unit/migrations-table-gate.spec.ts` | Wait interval and ceiling, skip-if-locked, lock session handoff, sentinel exclusion against files on disk |
| `test/modules/migrations/unit/migration-status.spec.ts` | Mode selection (Cloud stays blocking), opt-out |
| `test/modules/app/unit/migration-gate.middleware.spec.ts` | Gated vs ungated paths, 503 per state, async write allowlist, opt-out log |
| `test/modules/migrations/e2e/concurrent-migrations.spec.ts` | Three real pods, one database: no crash loop, body runs once, active lock only during work and released on SIGKILL; a `NODE_ENV=production` race |
| `test/modules/migrations/unit/migration-authoring-rules.spec.ts` | New migrations: schema only adds (rule 1), non-empty `down()` |
| `test/modules/migrations/unit/migration-run-log.spec.ts` | Run rebuilt from runner output (both progress formats), redaction, failed step |
| `test/modules/app/e2e/migration-runs.spec.ts` | Auth (401/403/409), claim races across servers, dead vs live runs, no rerun after a same-version failure, no retry of a newer release's run, boot start retried, skipped runner records nothing, status cache, fail-open |

The e2e specs run the real `run()` against a scratch database and fixtures in `test/modules/migrations/fixtures/concurrent-pods/`. They spawn pods with `process.execPath`, **not** `npx`: `npx` does not forward SIGKILL and orphans the pod.

## 9. Invariants to preserve

- Serialise **before** you read the pending list (§3.1).
- Lock sentinels are not work. Keep them out of the pending count (§3.3).
- Gate state comes from session locks and rows, never from state that someone must clear by hand.
- Never gate a health or metrics endpoint.
- The gate always fails open.
- An error inside the migration transaction is final. Do not wrap the run in a retry. The one exception is a lock timeout (`55P03`) in the schema phase (§10). Do not rerun a failed run without a super admin or a new release (§10).

## 10. Async mode (`MIGRATION_MODE=async`)

Opt-in, env only. Use when a long migration would outlast a liveness probe.

Schema first, data after. Schema changes apply at boot, before new code serves. Data migrations run after, in the background.

```
entrypoint: exports MIGRATION_SETUP_COMMAND (the edition's setup), does not run it
main.ts → migrateSchemaBeforeBoot (async-mode.ts), before NestFactory.create:
  fresh install (no DB / no `migrations` table) → full setup, blocking (schema + data)
  otherwise → setup child with MIGRATION_PHASE=schema:
              no pending schema migration → exit 0 at once, no lock
              else → migration lock, pending schema only, own transaction → commit
              non-zero exit → this pod exits non-zero; old pods keep serving
Nest boots on the NEW schema
MigrationRunsService.start(), child gets MIGRATION_PHASE=data:
  child process = setup command (MIGRATION_SKIP_IF_LOCKED: skip if another server migrates)
  child stdout/stderr → container logs + `migration_runs`
```

**Schema phase (boot)**

- Without this phase, an entity that maps a new column crashes boot. Example: licensing init reads `instance_settings`, PostgreSQL answers `42703`, `bootstrap()` exits 1, and every new pod crash-loops.
- A restart or scale-up has no pending schema migration. It takes no lock and starts at once.
- Other pods wait on the migration lock (§3.2), retrying every 5s by default in this phase.
- The pod holds the active lock while it runs, so serving pods refuse writes (§4).
- The transaction sets `SET LOCAL lock_timeout` to `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS`. A queued `ALTER TABLE` must not stall readers of released apps. On `55P03` it rolls back, waits and tries again, up to `MIGRATION_SCHEMA_LOCK_RETRIES` attempts.
- It is not a `migration_runs` row. Its output is in the pod logs only.

**Data phase (server-started runs)**

- Boot runs, Retry and dead-run restarts all set `MIGRATION_PHASE=data`.
- All data migrations run in one transaction. A failure rolls back the data only. The schema additions stay. Retry runs data only.

**Serving and gating**

- **Boot hold.** A new pod reports `running` from boot until its own data run takes the active lock, exits (nothing pending, or another server runs it) or cannot start, so its new code never writes before its data migrations. On a plain restart that is the child's start-up time, on that pod only.
- The gate (§4) refuses writes. Reads, login, session, OAuth/SSO and query runs pass (`ASYNC_MODE_WRITE_ALLOWLIST`).
- Passing the gate does not mean the request is served. A row or table that a data migration locked stays locked until commit, and requests on it wait.
- **Untracked migrators.** The active lock wins over the latest row. A blocking-mode server or a `db:migrate` run by hand reads as `running`.
- **Workers.** A `WORKER=true` server pauses its BullMQ workers while the state is `running` or `failed`, and resumes after (checked every 5s). Jobs wait in Redis.
- **Cloud.** `TOOLJET_EDITION=cloud` ignores `MIGRATION_MODE` and stays blocking.

**Runs**

- **One active run.** A unique index allows one `running` row across the cluster.
- **Claim.** A super admin's `POST {prefix}api/migration-runs/run` retries a failed run by inserting a new `running` row; the unique index lets one insert win. A second click on any server gets 409. A claimed child waits for the migration lock. A boot child that finds the lock taken exits `75` and records nothing.
- **No automatic rerun of a failure.** An async boot does not start a run if the latest run of the same version failed. A super admin retries. A new release (different `to_version`) runs on boot.
- **Dead runs.** A `running` row is dead when the migration lock is free and its heartbeat is older than 30s. It reads as `failed` ("The migrating server stopped without reporting a result.") and is marked so before the next claim. While the lock is held, the row is alive at any heartbeat age. Every server checks every 10s. One server then claims a new run. Without this, writes stay refused until the next boot.
- **Nothing pending after a failure.** A run that finds nothing pending records a `succeeded` run, and writes are allowed again.
- **Older release.** A server never starts, retries or restarts a run when the latest run's `to_version` is newer than its own (retry answers 409): its runner cannot see that release's migrations, so it would find nothing and record a success. It also ignores a newer release's failed run in its gate: its code runs on the schema it knows. So mid-rollout, old pods keep taking writes while new pods refuse them, and deploying the previous image (rollback) serves writes without clearing the failed run.
- **Boot start fails.** If `start()` cannot reach the database at boot, the 10s dead-run check calls it again until it gets through.
- **Failure.** No data change commits. Reads continue; writes get 503 `MIGRATION_FAILED`. A super admin retries at `{prefix}settings/migrations` (typed URL, no menu link).
- **Shutdown.** SIGTERM kills the child's process group. The open transaction rolls back.

**Tracking and logs**

- `migration_runs` and `migration_run_logs` are created by the service, not by a migration. They are written on the service's own `pg` pool, so progress shows while the transaction is open. The last 50 runs are kept.
- Progress comes from runner lines `[migrations] START <name>` / `DONE <name> <ms>`, plus data-migration `[PROGRESS] i/total` and `MigrationProgress` `<name> Progress N %`.
- Each kept line goes to `migration_run_logs`, tagged with its migration. The row keeps the last 200 lines. Query parameters, emails and connection URLs are redacted. TypeORM query lines are dropped unless `ORM_LOGGING` is set. After a success, earlier runs' logs are deleted (rows stay).
- `GET {prefix}api/migration-runs/:id/log[?migration=<name>]` returns the full log or one migration's lines.
- **Banner.** `GET {prefix}api/migration-status` (public, state only) feeds the frontend `MigrationBanner` for `running` and `failed`. In blocking mode it reports `running` while another server holds the active lock.

**Costs**

- There is no joint schema and data rollback. Schema additions stay after a data failure.
- The schema phase shows only in pod logs (see above).
- A pod of a newer release that boots during a long data phase of the previous release waits on the migration lock, up to `MIGRATION_LOCK_MAX_WAIT_MINUTES`.

These costs are acceptable because schema migrations only add (`../AGENTS.md` § Migrations, rule 1). Old code ignores additions, so rollback is: deploy the previous image.

GitLab self-managed uses the same split: [regular schema migrations before new code](https://docs.gitlab.com/development/migration_style_guide/), background migrations for data, destructive changes in a later release, and [restore the pre-upgrade backup instead of `db:rollback`](https://docs.gitlab.com/development/migration_style_guide/#reversibility). The difference: here the operator has no separate post-deploy step.
