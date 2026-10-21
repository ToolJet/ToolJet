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

`run-all-migrations.ts` runs all schema migrations (`server/migrations/`), then all data migrations (`server/data-migrations/`). Two `MigrationExecutor` passes share one query runner and **one transaction**. A failing data migration rolls back the schema changes too.

Exception: PostgreSQL forbids use of an enum value in the transaction that added it. `planEnumAdditions` pre-commits the value (upgrade) or falls back to two transactions (fresh install). Details: `../AGENTS.md` § Migrations.

## 3. Multi-pod coordination

Two session-scoped advisory locks, in `migrations-table-gate.ts`. PostgreSQL releases a lock when its connection ends, so a killed pod cannot leak one. No TTL, no cleanup, no Redis.

```
run()
 └── withMigrationAdvisoryLock           ← 3.1  serialises pods (migration lock)
      └── migrateAsSolePod
           ├── realPendingMigrationNames  (sentinels excluded)
           ├── pg_advisory_lock(active)  ← 3.3  only when real work is pending
           └── executeMigrations         ← schema + data, one transaction
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

`MigrationGateMiddleware` answers `/api/*` with `503` while `MigrationRunsService.status()` says so. `status()` reads both locks from `pg_locks` (`HELD_MIGRATION_LOCKS_SQL`, current database only). In async and manual mode it also reads the latest `migration_runs` row. Reading `pg_locks` locks no table, so it answers instantly while a migration holds ACCESS EXCLUSIVE on `migrations`.

| State | When | Blocking mode | Async / manual mode |
|---|---|---|---|
| `running` | active lock held, or latest run is running | every API request | writes (`MIGRATION_IN_PROGRESS`) |
| `pending` | manual mode found work and waits | — | writes (`MIGRATION_PENDING`) |
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
| `MIGRATION_MODE` | `blocking` | `async` or `manual`: see §10. Ignored on Cloud. |

## 6. Failure modes

| Scenario | Migration | Gate | Cost |
|---|---|---|---|
| Another pod migrating | waits, then no-ops | not raised by the waiter | length of the other migration |
| Migrating pod gets SIGTERM/SIGKILL | rolled back | released with its connection | none |
| Migrating pod's node vanishes (no FIN) | rolled back | released after ~60s keepalive | about a minute |
| Migration itself is broken | rolled back, exits non-zero | released | fails fast, no retry |
| Wait exceeds the ceiling | exits non-zero | — | `MIGRATION_LOCK_MAX_WAIT_MINUTES` |
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
| `test/modules/app/unit/migration-gate.middleware.spec.ts` | Gated vs ungated paths, 503 per state, async/manual write allowlist, opt-out log |
| `test/modules/migrations/e2e/concurrent-migrations.spec.ts` | Three real pods, one database: no crash loop, body runs once, active lock only during work and released on SIGKILL; a `NODE_ENV=production` race |
| `test/modules/migrations/unit/migration-run-log.spec.ts` | Run rebuilt from runner output (both progress formats), redaction, failed step |
| `test/modules/app/e2e/migration-runs.spec.ts` | Auth (401/403/409), claim races across servers, one pending row, dead vs live runs, no rerun after a same-version failure, skipped runner records nothing, status cache, fail-open |

The e2e specs run the real `run()` against a scratch database and fixtures in `test/modules/migrations/fixtures/concurrent-pods/`. They spawn pods with `process.execPath`, **not** `npx`: `npx` does not forward SIGKILL and orphans the pod.

## 9. Invariants to preserve

- Serialise **before** you read the pending list (§3.1).
- Lock sentinels are not work. Keep them out of the pending count (§3.3).
- Gate state comes from session locks and rows, never from state that someone must clear by hand.
- Never gate a health or metrics endpoint.
- The gate always fails open.
- An error inside the migration transaction is final. Do not wrap the run in a retry. Do not rerun a failed run without a super admin or a new release (§10).

## 10. Server-managed modes (`MIGRATION_MODE=async` and `manual`)

Opt-in, env only. Use when a long migration would outlast a liveness probe, or when an operator wants to choose when it runs.

```
entrypoint: exports MIGRATION_SETUP_COMMAND (the edition's setup), does not run it
main.ts:    fresh install (no DB / no `migrations` table) → run setup first, blocking
            otherwise → Nest boots and serves on the OLD schema
MigrationRunsService.start():
  async   → child process = setup command (MIGRATION_SKIP_IF_LOCKED: skip if another server migrates)
  manual  → same child with MIGRATION_CHECK_ONLY=true: lists pending work, runs nothing → run `pending`
            child stdout/stderr → container logs + `migration_runs`
```

**Serving and gating**

- New code runs on the old schema until commit. Breakage is accepted.
- The gate (§4) refuses writes. Reads, login, session, OAuth/SSO and query runs pass (`ASYNC_MODE_WRITE_ALLOWLIST`).
- Passing the gate does not mean the request is served. A table that a migration altered stays locked until commit, and requests on it wait.
- **Untracked migrators.** The active lock wins over the latest row. A blocking-mode server or a manual `db:migrate` reads as `running`.
- **Workers.** A `WORKER=true` server pauses its BullMQ workers while the state is `pending`, `running` or `failed`, and resumes after (checked every 5s). Jobs wait in Redis.
- **Cloud.** `TOOLJET_EDITION=cloud` ignores `MIGRATION_MODE` and stays blocking.

**Runs**

- **One active run.** A unique index allows one `pending` or `running` row across the cluster.
- **Claim.** A super admin's `POST {prefix}api/migration-runs/run` claims with one conditional write (`pending` → `running`, or a new `running` row after a failure). A second click on any server gets 409. A claimed child waits for the migration lock. A boot child that finds the lock taken exits `75` and records nothing.
- **No automatic rerun of a failure.** An async boot does not start a run if the latest run of the same version failed. A super admin retries. A new release (different `to_version`) runs on boot.
- **Dead runs.** A `running` row is dead when the migration lock is free and its heartbeat is older than 30s. It reads as `failed` ("The migrating server stopped without reporting a result.") and is marked so before the next claim. While the lock is held, the row is alive at any heartbeat age. Every server checks every 10s. Async mode then claims a new run; manual mode re-checks and waits for a super admin. Without this, writes stay refused until the next boot.
- **Nothing pending after a failure.** A run or check that finds nothing pending records a `succeeded` run, and writes are allowed again.
- **Stale waiting run.** A manual-mode check that finds nothing pending deletes the `pending` row.
- **Failure.** Nothing commits. Reads continue; writes get 503 `MIGRATION_FAILED`. A super admin retries at `{prefix}settings/migrations` (typed URL, no menu link).
- **Shutdown.** SIGTERM kills the child's process group. The open transaction rolls back.

**Tracking and logs**

- `migration_runs` and `migration_run_logs` are created by the service, not by a migration. They are written on the service's own `pg` pool, so progress shows while the transaction is open. The last 50 runs are kept.
- Progress comes from runner lines `[migrations] START <name>` / `DONE <name> <ms>`, plus data-migration `[PROGRESS] i/total` and `MigrationProgress` `<name> Progress N %`.
- Each kept line goes to `migration_run_logs`, tagged with its migration. The row keeps the last 200 lines. Query parameters, emails and connection URLs are redacted. TypeORM query lines are dropped unless `ORM_LOGGING` is set. After a success, earlier runs' logs are deleted (rows stay).
- `GET {prefix}api/migration-runs/:id/log[?migration=<name>]` returns the full log or one migration's lines.
- **Banner.** `GET {prefix}api/migration-status` (public, state only) feeds the frontend `MigrationBanner` for `pending`, `running` and `failed`. In blocking mode it reports `running` while another server holds the active lock.
