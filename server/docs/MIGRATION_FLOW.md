# Migration flow

This document is the single source of truth for how ToolJet runs database migrations. It covers the boot path, multi-pod coordination, the upgrade gate and async mode.

**Read this when** you change `server/src/migration-helpers/`, `server/src/modules/app/migration-runs/`, `server/src/modules/app/middlewares/migration-gate.middleware.ts` or the `db:setup` step of a container entrypoint. Update this document in the same PR.

To *write* a migration (schema vs data, enum rules, logging), read [`../AGENTS.md`](../AGENTS.md) § Migrations.

**Sections:** [1 Boot path](#1-boot-path) · [2 Phases and transactions](#2-phases-and-transactions) · [3 Multi-pod coordination](#3-multi-pod-coordination) (locks, waiting, lock sentinels) · [4 Upgrade gate](#4-upgrade-gate) (503, states) · [5 Async mode](#5-async-mode-migration_modeasync) (schema phase, data phase, runs, shutdown, logs, banner) · [6 Environment variables](#6-environment-variables) · [7 Failure modes](#7-failure-modes) · [8 Operator runbook](#8-operator-runbook) · [9 Invariants](#9-invariants) · [10 Tests](#10-tests)

**Terms.** These terms have one meaning in this document:

| Term | Meaning |
|---|---|
| runner | The process that runs `run-all-migrations.ts` |
| joint run | A runner with `MIGRATION_PHASE` unset: schema and data migrations in one transaction |
| schema phase | A runner with `MIGRATION_PHASE=schema` |
| data phase | A runner with `MIGRATION_PHASE=data` |
| migration lock | Advisory lock `MIGRATION_ADVISORY_LOCK_KEY` |
| active lock | Advisory lock `MIGRATION_ACTIVE_LOCK_KEY` |
| run | A row in `migration_runs` (async mode only) |
| upgrade gate | `MigrationGateMiddleware`, which answers `503` |

---

## 1. Boot path

```
entrypoint → wait-for-it (PostgreSQL) → npm run db:setup:prod → exec "$@" (npm run start:prod → exec node dist/src/main)
                                          └── db:create + db:migrate
                                                └── src/migration-helpers/run-all-migrations.ts
```

- Every pod runs migrations. There is no dedicated job, so 20 pods start 20 runners.
- The runner is a standalone process. It does not start NestJS (no `ConfigService`, no DI). It reads config with `getEnvVars()` and opens its own connections.
- `getEnvVars()` merges the env file over `process.env`. A key in `.env` wins over an exported shell variable. A key that is not in the file comes from `process.env`. The e2e specs use this to tune the gate.
- `NODE_ENV` only selects the file (`test` → `../.env.test`, else `../.env`). Coordination does not depend on it (`concurrent-migrations.spec.ts` pins this).
- `NODE_ENV=test` changes `ormconfig.ts`: it lists no migrations. The e2e pods inject their own DataSources for this reason.
- In async mode the entrypoint does not run setup. It exports `MIGRATION_SETUP_COMMAND` and the server runs it (§5).

## 2. Phases and transactions

`run-all-migrations.ts` runs all schema migrations (`server/migrations/`), then all data migrations (`server/data-migrations/`). `MIGRATION_PHASE` selects what one runner does. Any other value fails the runner.

| `MIGRATION_PHASE` | Set by | Runs | Transaction |
|---|---|---|---|
| unset (joint run) | blocking mode, Cloud, `npm run db:migrate`, async schema phase with pre-cutoff migrations (§5.1) | schema, then data | One for both. A failing data migration also rolls back the schema changes. |
| `schema` | async boot (§5.1) | pending schema migrations only | Its own short transaction, with `lock_timeout` and retries |
| `data` | server-started runs (§5.2) | schema catch-up (normally empty), then all data migrations | Catch-up in its own transaction. All data in one transaction. |

Enum exception: PostgreSQL forbids use of an enum value in the transaction that added it (`55P04`). `planEnumAdditions` pre-commits the value on an upgrade. On a fresh install it falls back to two transactions. Details: `../AGENTS.md` § Migrations.

## 3. Multi-pod coordination

`migrations-table-gate.ts` defines two session-scoped advisory locks. PostgreSQL releases a lock when its connection ends, so a killed pod cannot leak one. There is no TTL, no cleanup and no Redis.

```
run()
 └── withMigrationAdvisoryLock           ← 3.1  serialises pods (migration lock)
      └── migrateAsSolePod
           ├── realPendingMigrationNames  (lock sentinels excluded)
           ├── pg_advisory_lock(active)  ← 3.3  only when real work is pending
           └── executeMigrations         ← per MIGRATION_PHASE (§2)
```

| Lock | Key | Held | Read by |
|---|---|---|---|
| Migration lock | `MIGRATION_ADVISORY_LOCK_KEY` (`6273975241000`) | From the pending-list read to commit | Waiting pods; dead-run detection (§5.4) |
| Active lock | `MIGRATION_ACTIVE_LOCK_KEY` (`6273975241001`) | While real migrations execute | The upgrade gate (§4) |

### 3.1 Migration lock

`withMigrationAdvisoryLock` takes `pg_try_advisory_lock` **before** it reads the pending list. It holds the lock until commit. The lock has its own session, which stays idle while migrations run on other connections.

| Event | Result |
|---|---|
| Pod killed (SIGTERM/SIGKILL) | The socket closes and the lock goes at once. The current statement finishes, then rolls back. A new runner waits behind its table locks. |
| Pod lost without a FIN (node failure, partition) | TCP keepalive (`DEAD_CLIENT_KEEPALIVE_SQL`) drops the session after about 60s. The OS default is about 2 hours. |
| PgBouncer in transaction mode | The lock does not work: the unlock can go to a different backend. Use a direct connection or session pooling. |

The table lock alone is not sufficient. `LockMigrationsTable1/2` take ACCESS EXCLUSIVE on `migrations` *inside* the migration transaction. At that time, each pod already has its own pending list. The losing pod then runs an applied migration again and fails with a catalog error, for example `duplicate key value violates unique constraint "pg_type_typname_nsp_index"`.

### 3.2 Waiting

A pod that finds the migration lock taken sleeps for `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS`, then tries again. `MIGRATION_LOCK_MAX_WAIT_MINUTES` sets the maximum wait (`0` = no limit). The waiting pod does not query `migrations`, so a `lock_timeout` or `statement_timeout` cannot stop the wait. Log on a waiting pod:

```
[migrations] Another pod is running migrations. Waited 4s so far; retrying in 2s. This pod will NOT exit.
[migrations] Lock released; got the migration lock after 8s.
```

With `MIGRATION_SKIP_IF_LOCKED=true` (server-started boot runs, §5.4) the pod does not wait. It exits with code `75` (`SKIPPED_EXIT_CODE`).

### 3.3 Active lock and lock sentinels

`LockMigrationsTable1234567890000` and `…891000` are the lock sentinels (`LOCK_SENTINEL_MIGRATION_NAMES`). Each one deletes the row of the other, so one sentinel is always pending. This is how a joint run takes the table lock on every boot.

- `realPendingMigrations` (`run-all-migrations.ts`) removes the sentinels from the pending list. If they counted, every restart and scale-up would refuse traffic.
- A runner with nothing pending does not take the active lock. It logs: `[migrations] No schema or data migrations pending — not cutting API traffic for this boot.`
- Split phases (`MIGRATION_PHASE=schema|data`) remove the sentinels before they run (`withoutLockSentinels`). The migration lock already serialises split runners. A sentinel's `LOCK TABLE migrations` would hold the table for the full data transaction and block the pending read of a booting pod.

## 4. Upgrade gate

`MigrationGateMiddleware` answers `/api/*` with `503` while `MigrationRunsService.status()` reports a refusing state. `status()` reads both locks from `pg_locks` (`HELD_MIGRATION_LOCKS_SQL`, current database only). In async mode it also reads the latest run. A `pg_locks` read takes no table lock, so it answers at once while a migration holds ACCESS EXCLUSIVE on `migrations`.

| State | When | Blocking mode | Async mode |
|---|---|---|---|
| `running` | Active lock held, or the latest run is running, or boot hold (§5.3) | Refuses every API request | Refuses writes (`MIGRATION_IN_PROGRESS`) |
| `failed` | Latest run failed | — | Refuses writes (`MIGRATION_FAILED`) until a server boot runs it again with success |

Response: `503`, `Retry-After: 30`, body `{ statusCode, code, message, timestamp, path }`.

The middleware must keep these rules:

1. **Never gate health or metrics** (`UNGATED_API_PATHS`). A gated `/api/health` makes the orchestrator kill the pods that wait for the upgrade. Add every new probe endpoint to that set.
2. **Gate only API routes.** The SPA shell then loads and shows the upgrade state. `buildApiPrefix(SUB_PATH)` handles subpath installs.
3. **Fail open.** A status read error means "no migration is running".
4. **Keep it cheap.** `status()` caches for 1s, with one read in flight, on the service's own pool of two connections. Rejection logs are limited to one per 30s.
5. **Match the raw request path** (`parseurl.original`), lowercased, the path that Express routes on. Absolute-form targets are included.

## 5. Async mode (`MIGRATION_MODE=async`)

Async mode is opt-in, by env only. Use it when a long migration takes longer than a liveness probe allows. Schema migrations apply at boot, before new code serves. Data migrations run after boot, in the background.

```
entrypoint: exports MIGRATION_SETUP_COMMAND (the edition's setup), does not run it
main.ts → migrateSchemaBeforeBoot (async-mode.ts), before NestFactory.create:
  fresh install (no database / no `migrations` table) → full setup, blocking (schema + data)
  else → setup child with MIGRATION_PHASE=schema:
           no pending schema migration → exit 0 at once, no lock
           else → migration lock, pending schema only, own transaction → commit
           non-zero exit → this pod exits non-zero; old pods keep serving
Nest boots on the NEW schema
MigrationRunsService.start() → child with MIGRATION_PHASE=data:
  child = setup command (MIGRATION_SKIP_IF_LOCKED=true: skip if another server migrates)
  child stdout/stderr → container logs + `migration_runs`
```

`TOOLJET_EDITION=cloud` ignores `MIGRATION_MODE` and stays in blocking mode.

### 5.1 Schema phase (boot)

- **Reason.** Without this phase, an entity that maps a new column stops boot. Example: licensing init reads `instance_settings`, PostgreSQL answers `42703`, `bootstrap()` exits 1, and every new pod crash-loops.
- **No pending schema migration.** A restart or scale-up takes no lock and starts at once, also during a long data phase. Split phases skip the lock sentinels, so no runner holds `migrations` locked.
- **Probe before the read** (`migrationsTableLocked`). A joint run or a blocking-mode run holds `migrations` locked until it ends. The schema phase first probes the table with `lock_timeout` = `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS` and `statement_timeout = 0`. On a timeout it waits on the migration lock and does not read, so a role `statement_timeout` cannot stop the pod.
- **Wait interval.** Schema-phase waits retry the migration lock every 5s (`SCHEMA_PHASE_RETRY_INTERVAL_SECONDS`), unless `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` is set.
- **Pre-cutoff migrations.** A pending schema or data migration can be at or before `MIGRATION_AUTHORING_RULES_CUTOFF` (`src/migration-helpers/migration-status.ts`). Then this phase runs the full upgrade as a joint run before boot, with the active lock held. Older migrations can drop, rename or `SET NOT NULL`, which is not safe while old pods serve. The later data phase finds nothing pending.
- **Active lock.** The pod holds the active lock while it applies schema migrations, so serving pods refuse writes (§4).
- **Lock timeout.** The transaction sets `SET LOCAL lock_timeout` to `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS`, so a queued `ALTER TABLE` does not block readers of released apps. On `55P03` it rolls back, waits 2s and tries again, up to `MIGRATION_SCHEMA_LOCK_RETRIES` tries in total.
- **No run.** The schema phase does not write a `migration_runs` row. Its output is in the pod logs only.
- A fresh install runs the full setup, as in blocking mode.

### 5.2 Data phase (server-started runs)

- Boot runs and dead-run restarts both set `MIGRATION_PHASE=data`.
- All data migrations run in one transaction. A failure rolls back the data changes only. The schema additions stay, and the next run executes data migrations only.

### 5.3 Serving during a run

- **Boot hold.** A new pod reports `running` from boot until its own data phase takes the active lock, exits, or cannot start. Its new code thus never writes before its data migrations. On a plain restart this is the start-up time of the child, on that pod only.
- **Allowed requests.** The gate refuses writes. Reads, login, session, OAuth/SSO and query runs pass (`ASYNC_MODE_WRITE_ALLOWLIST`).
- **Row locks.** A request that passes the gate can still wait. A row or table that a data migration locked stays locked until commit.
- **Untracked runners.** The active lock has priority over the latest run. A blocking-mode server or a manual `db:migrate` reads as `running`.
- **Workers.** A `WORKER=true` server pauses its BullMQ workers while the state is `running` or `failed`. It checks every 5s and resumes after. Jobs wait in Redis.

### 5.4 Runs

- **One active run.** A unique index (`migration_runs_one_active`) allows one `running` row in the cluster.
- **Boot run.** Every async boot starts a data phase with `MIGRATION_SKIP_IF_LOCKED=true`. This includes a boot after a failed run of the same version. The boot run inserts its row only when it finds pending work. If another server holds the migration lock, the child exits `75` and records nothing.
- **No manual retry.** There is no Retry button and no `POST /migration-runs/run`. To run a failed migration again, ship a fixed image, or fix the cause (bad data, a missing table) and restart. The migrations page is view-only.
- **Dead runs.** A `running` row is dead when the migration lock is free and its heartbeat is older than 30s. It reads as `failed` with "The migrating server stopped without reporting a result." While a session holds the migration lock, the row is alive at any heartbeat age.
- **Dead-run restart.** Every server checks every 10s. It marks dead rows failed, then inserts a new `running` row. The unique index lets one server win. The claimed child waits for the migration lock (no skip). Without this check, writes stay refused until the next boot.
- **Reap on insert.** A runner that holds the migration lock can find a `running` row in its way (a pod killed less than 30s before). It marks that row failed with the dead-run error, then inserts its own row.
- **Finished rows are final.** Tracking updates skip rows that have `finished_at` set.
- **Nothing pending after a failure.** A runner that finds nothing pending after a failed run records a `succeeded` run. Writes are then allowed again.
- **Newer release.** A server does not start or restart a run when the `to_version` of the latest run is newer than its own. Its runner cannot see that release's migrations, so it would find nothing and record a success. Its gate also ignores a failed run of a newer release, because its code runs on the schema it knows. During a rollout, old pods take writes and new pods refuse them. A rollback to the previous image serves writes and does not clear the failed run.
- **Boot start failure.** If `start()` cannot reach the database at boot, the 10s dead-run check calls it again until it succeeds.
- **Failure.** No data change commits. Reads continue. Writes get 503 `MIGRATION_FAILED` ("…until it is fixed and ToolJet restarts.").

### 5.5 Shutdown

1. SIGTERM reaches Node. The production images run `tini -g` as PID 1, and the root and server `start:prod` scripts use `exec`. So `npm run start:prod` (every shipped deploy config) delivers the signal.
2. `onceWithDeadline` (`src/helpers/bootstrap.helper.ts`) runs shutdown once and caps it at 20s (`SHUTDOWN_TIMEOUT_MS`).
3. `MigrationRunsService` sends SIGTERM to the process group of the child and waits up to 10s for it to exit.
4. The open transaction rolls back. The server records the run as failed with the dead-run error, so the next boot runs it again.

A hard kill (OOM, node loss) leaves a dead run. The next runner marks it failed when it starts, because it holds the lock and any `running` row is then dead. Otherwise the dead-run check marks it after 30s.

### 5.6 Tracking, logs and banner

- The service creates `migration_runs` and `migration_run_logs`, not a migration. It writes them on its own `pg` pool, so progress shows while the transaction is open. The service keeps the last 50 runs.
- Progress comes from runner lines `[migrations] START <name>` and `DONE <name> <ms>`, from data-migration `[PROGRESS] i/total` lines, and from `MigrationProgress` `<name> Progress N %` lines. The service keeps one line per percent.
- Each kept line goes to `migration_run_logs`, tagged with its migration. The row keeps the last 200 lines (`LOG_TAIL_LINES`). Query parameters, emails and connection URLs are redacted.
- TypeORM `query is slow:` and `execution time:` lines are dropped unless `ORM_LOGGING` is set.
- After a success, the service deletes the logs of earlier runs. The rows stay.
- `GET {prefix}api/migration-runs` and `GET {prefix}api/migration-runs/:id/log[?migration=<name>]` are for super admins. The log route returns the full log or the lines of one migration.
- **Banner.** `GET {prefix}api/migration-status` (public, state only) feeds the frontend `MigrationBanner` for `running` and `failed`. The banner polls every 3s while the state is `running`, else every 30s. In blocking mode the endpoint reports `running` while another server holds the active lock.
- Released and embedded apps show a generic maintenance message to end users. For a super admin, the `failed` banner links to `{prefix}settings/migrations`, which shows the failed migration and its log.

### 5.7 Costs

- There is no joint rollback of schema and data. Schema additions stay after a data failure.
- The schema phase shows only in pod logs (§5.1).
- A pod of a newer release that boots during a long data phase of the previous release waits on the migration lock, up to `MIGRATION_LOCK_MAX_WAIT_MINUTES`.

These costs are acceptable because schema migrations only add (`../AGENTS.md` § Migrations, rule 1). Old code ignores additions, so rollback is: deploy the previous image.

GitLab self-managed uses the same split: [regular schema migrations before new code](https://docs.gitlab.com/development/migration_style_guide/), background migrations for data, destructive changes in a later release, and [restore the pre-upgrade backup instead of `db:rollback`](https://docs.gitlab.com/development/migration_style_guide/#reversibility). The difference: here the operator has no separate post-deploy step.

## 6. Environment variables

All are optional. `.env.example` § ROLLING UPGRADE lists them too.

| Variable | Default | Effect |
|---|---|---|
| `DISABLE_MIGRATION_TRAFFIC_GATE` | `false` | `true` turns off the 503. Locks and waits still apply. Each serving pod logs this at boot. |
| `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` | `60` (schema phase: `5`) | Interval between lock tries of a waiting pod. |
| `MIGRATION_LOCK_MAX_WAIT_MINUTES` | `30` | Maximum wait before a pod fails its own boot. `0` waits with no limit. |
| `MIGRATION_MODE` | `blocking` | `async`: see §5. Any other value means `blocking`. Cloud ignores it. |
| `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS` | `5000` | Schema phase only (§5.1). `lock_timeout` for its transaction and for the table probe. |
| `MIGRATION_SCHEMA_LOCK_RETRIES` | `10` | Schema phase only. Total tries, first try included, before a lock timeout fails the boot. `1` means no retry. |

Set by the system, not by operators: `MIGRATION_PHASE` (§2), `MIGRATION_SKIP_IF_LOCKED` (§3.2), `MIGRATION_SETUP_COMMAND` (§5).

## 7. Failure modes

| Scenario | Migration | Gate | Cost |
|---|---|---|---|
| Another pod migrates | Waits, then does nothing | Not raised by the waiting pod | Duration of the other migration |
| Migrating pod gets SIGTERM/SIGKILL | Rolled back | Released with its connection | None |
| Node of the migrating pod is lost (no FIN) | Rolled back | Released after ~60s keepalive | About one minute |
| Migration is broken | Rolled back, exits non-zero | Released | Fails fast, no retry |
| Wait exceeds the maximum | Exits non-zero | — | `MIGRATION_LOCK_MAX_WAIT_MINUTES` |
| Schema phase cannot lock a busy table (§5.1) | Rolled back, tried again, then exits non-zero | Released | Old pods keep serving |
| Async data phase fails (§5.4) | Data rolled back, schema stays | `failed`: writes refused | Until a boot runs it with success |
| Async runner killed (§5.5) | Rolled back | Dead run after 30s, then restarted | Up to ~40s |
| Database unreachable from a serving pod | — | Fails open | The API is down anyway |

## 8. Operator runbook

**Find a running migration:**

```sql
-- holders of the migration lock (6273975241000) and the active lock (6273975241001)
SELECT (l.classid::bigint << 32) | l.objid::bigint AS key, a.pid, a.client_addr, a.backend_start
FROM pg_locks l JOIN pg_stat_activity a USING (pid)
WHERE l.locktype = 'advisory' AND l.objsubid = 1 AND l.granted;
```

A held lock means a live session migrates. The gate cannot stay raised after that session ends.

**Stop a runaway migration:**

1. Run `SELECT pg_terminate_backend(<pid>)`. The transaction rolls back and both locks are released.
2. In async mode, expect the run to show as failed. Writes stay refused until a server restarts, and that restart runs the migration again.
3. Ship a fixed image to stop it permanently.

**Upgrade without refused traffic:** set `DISABLE_MIGRATION_TRAFFIC_GATE=true`.

**Known limitation:** the gate takes effect from the *next* upgrade. During the deploy that first ships it, the old pods have no middleware.

## 9. Invariants

- Serialise **before** you read the pending list (§3.1).
- Lock sentinels are not work. Keep them out of the pending count (§3.3). Split phases do not run them.
- Gate state comes from session locks and rows. Never use state that a person must clear manually.
- Never gate a health or metrics endpoint.
- The gate always fails open.
- An error inside the migration transaction is final. Do not wrap the runner in a retry. The one exception is a lock timeout (`55P03`) in the schema phase (§5.1).
- In async mode, only a server boot or a dead-run restart starts a run (§5.4). There is no manual retry.
- Run all schema migrations before all data migrations, with two `MigrationExecutor` passes. Do not merge the two globs into one DataSource: TypeORM sorts by class-name timestamp, and schema and data timestamps interleave.
- Plan enum additions before `announceEachMigration` wraps `up()`. The wrapper hides the source from the scanner.

## 10. Tests

| File | Covers |
|---|---|
| `test/modules/migrations/unit/migrations-table-gate.spec.ts` | Wait interval and maximum, skip-if-locked, lock session handoff, sentinel exclusion against files on disk |
| `test/modules/migrations/unit/migration-status.spec.ts` | Mode selection (Cloud stays blocking), opt-out |
| `test/modules/app/unit/migration-gate.middleware.spec.ts` | Gated vs ungated paths, 503 per state, async write allowlist, opt-out log |
| `test/modules/migrations/e2e/concurrent-migrations.spec.ts` | Three real pods on one database: no crash loop, body runs once, active lock only during work and released on SIGKILL; a `NODE_ENV=production` race. `MIGRATION_PHASE`: schema then data, lock-timeout retry and give-up, enum `ADD VALUE` in both phases, boot during a long data phase, exit 75 with skip-if-locked, wait behind a locked `migrations` table, joint run for pre-cutoff migrations |
| `test/modules/migrations/unit/migration-authoring-rules.spec.ts` | New migrations: schema only adds (rule 1), non-empty `down()` |
| `test/modules/migrations/unit/migration-run-log.spec.ts` | Run rebuilt from runner output (both progress formats), redaction, failed step |
| `test/modules/app/e2e/migration-runs.spec.ts` | Auth (401/403), no manual retry route (404), claim races across servers, dead vs live runs, boot reruns a same-version failure, no rerun of a newer release's run, boot start retried, skipped runner records nothing, status cache, fail-open |

The e2e specs run the real `run()` against a scratch database. Fixtures are in `test/modules/migrations/fixtures/`:

- `concurrent-pods/`: the lock sentinels and a slow schema migration (`1790700000001`, after the cutoff).
- `split-phases/`: a schema `ADD VALUE` and a data migration that uses it.
- `legacy/`: one pre-cutoff migration.

`pod.ts` loads the sentinels and the migrations of `FIXTURE_SET`, and exits 75 when `run()` returns false. The specs start pods with `process.execPath`, **not** `npx`, because `npx` does not forward SIGKILL and leaves the pod orphaned.
