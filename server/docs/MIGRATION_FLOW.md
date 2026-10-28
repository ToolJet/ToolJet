# Migration flow

How ToolJet runs database migrations: at boot, across many pods, and in async mode.

**Read this when** you change `server/src/migration-helpers/`, `server/src/modules/app/migration-runs/`, `server/src/modules/app/middlewares/migration-gate.middleware.ts` or the `db:setup` step of a container entrypoint. Update this document in the same PR. To *write* a migration, read the Migrations section of [`../AGENTS.md`](../AGENTS.md#migrations).

**Sections:** [Boot path](#boot-path) · [Phases and transactions](#phases-and-transactions) · [Many pods, one migration](#many-pods-one-migration) · [Upgrade gate](#upgrade-gate) · [Async mode](#async-mode) · [Environment variables](#environment-variables) · [Failure modes](#failure-modes) · [Operator runbook](#operator-runbook) · [Invariants](#invariants) · [Tests](#tests)

## In short

There are two modes.

- **Blocking mode** (the default). Each pod runs every pending migration before it starts serving, in one transaction. A failure leaves the database as it was. A long migration can outlast the liveness probe.
- **Async mode** (`MIGRATION_MODE=async`). A pod applies schema migrations before it starts, then serves. Data migrations run in the background. While they run, or after they fail, the upgrade gate refuses writes. Cleanup migrations run after writes reopen. Rollback: deploy the previous image.

In both modes only one pod migrates at a time. The others wait.

| Term | Meaning |
|---|---|
| runner | The process that runs migrations (`run-all-migrations.ts`) |
| single-transaction run | A runner with `MIGRATION_PHASE` unset: schema, data and cleanup in one transaction |
| schema / data / cleanup phase | A runner with `MIGRATION_PHASE=schema` / `data` / `cleanup` |
| migration lock | Advisory lock: one runner at a time migrates (`MIGRATION_ADVISORY_LOCK_KEY`) |
| active lock | Advisory lock held while a runner changes the database (`MIGRATION_ACTIVE_LOCK_KEY`) |
| run | One async-mode data phase, recorded as a row in `migration_runs` |
| upgrade gate | Middleware that answers unsafe requests with `503` in async mode (`MigrationGateMiddleware`) |

---

## Boot path

```
entrypoint → wait-for-it (PostgreSQL) → npm run db:setup:prod → exec "$@" (npm run start:prod → exec node dist/src/main)
                                          └── db:create + db:migrate
                                                └── src/migration-helpers/run-all-migrations.ts
```

- **Every pod runs migrations.** There is no separate migration job. [Many pods, one migration](#many-pods-one-migration) explains how only one of them migrates.
- **The runner is not the server.** It is a plain Node process without NestJS (no `ConfigService`, no DI). It reads config with `getEnvVars()` and opens its own connections.
- **Config.** `getEnvVars()` puts the env file over `process.env`: a key in `.env` wins over an exported shell variable. A key missing from the file comes from `process.env`. The e2e specs rely on this.
- **`NODE_ENV`** only picks the file (`test` → `../.env.test`, else `../.env`). Coordination does not depend on it. With `NODE_ENV=test`, `ormconfig.ts` lists no migrations, so the e2e pods bring their own DataSources.
- **Async mode.** The entrypoint runs only the schema phase (`MIGRATION_PHASE=schema`) and exports the database-only setup command as `MIGRATION_SETUP_COMMAND`. The server runs the data and cleanup phases with it, so they run no plugin steps. Cloud does the same as EE.

## Phases and transactions

Folders: `server/migrations/schema/`, `server/migrations/data/`, `server/migrations/cleanup/`. A runner runs pending schema, then data, then cleanup migrations. `MIGRATION_PHASE` picks which. An unknown value fails the runner. Types: `MigrationPhase` and `RunStrategy` in `migration-mode.ts`. A single-transaction run uses the `single-transaction` strategy. The split phases use `multi-transaction`.

| `MIGRATION_PHASE` | Used by | Runs | Transactions |
|---|---|---|---|
| unset | Blocking mode, `npm run db:migrate`, an async boot of a database older than 3.21.58 | Schema, data, then cleanup | One. A failing data migration also undoes the schema changes |
| `schema` | Async boot (entrypoint) | Pending schema migrations | One short transaction, with a lock timeout and retries |
| `data` | Async runs | Leftover schema migrations (normally none), then all data migrations | One for the leftover schema, one for all data |
| `cleanup` | Async, after a successful data run | Pending cleanup migrations | One short transaction per step (`withShortLock`) |

**Short-lock steps** (`with-short-lock.ts`). A step that changes an existing table outside the schema phase goes through `withShortLock`: one transaction per step, `lock_timeout` 2000 ms (`SHORT_LOCK_TIMEOUT_MS`, below the server pool's 5000 ms, so readers queued behind it give up after it does), `statement_timeout` 0, up to 10 tries on a lock timeout. Inside a transaction the caller opened (a single-transaction run) it runs inline. `setNotNull` sets NOT NULL without a long scan under an exclusive lock: a `NOT VALID` check, `VALIDATE`, `SET NOT NULL`, then it drops the check. It needs PostgreSQL 12 or later.

**Enum values.** PostgreSQL does not allow using an enum value in the transaction that added it (`55P04`). `planEnumAdditions` (`run-all-migrations.ts`, scanner in `enum-value-additions.ts`) scans pending schema migrations for `ALTER TYPE ... ADD VALUE`:

- All target types exist (upgrade): it commits the values first on a separate connection, then runs the rest in one transaction.
- A target type does not exist yet (fresh install, `db:reset`, a new type in this run): it runs schema and data in two transactions. A fresh database has no data to protect.

The schema phase also commits enum values first.

## Many pods, one migration

Advisory locks (`migration-locks.ts`) make sure one pod migrates and the others know about it. PostgreSQL drops a lock when its connection closes, so a killed pod cannot leave one behind. No TTL, no cleanup job, no Redis.

| Lock | Means | Held | Checked by |
|---|---|---|---|
| Migration lock (`6273975241000`) | "I am the pod that migrates" | From reading the pending list to commit | Waiting pods; dead-run detection; cleanup steps |
| Active lock (`6273975241001`) | "I am changing the database now" | Only while real migrations execute | The upgrade gate |
| Cleanup lock (`6273975241002`) | "I am running cleanup migrations" | For a cleanup run | Other cleanup runs only. A data run never waits on it |

```
run()
 └── withMigrationAdvisoryLock           ← take the migration lock
      └── migrateAsSolePod
           ├── pendingNames               (lock sentinels left out)
           ├── pg_advisory_lock(active)  ← only when there is real work
           └── executeMigrations         ← per MIGRATION_PHASE
```

### Migration lock

The runner takes the migration lock (`pg_try_advisory_lock`) **before** it reads which migrations are pending, and keeps it until commit. The lock lives on its own connection, idle while the migrations run on another.

Why before the read: if two pods read the pending list first, the second later runs migrations the first already applied and fails, for example with `duplicate key value violates unique constraint "pg_type_typname_nsp_index"`. A table lock on `migrations` inside the transaction comes too late.

| Event | Result |
|---|---|
| Pod killed (SIGTERM/SIGKILL) | The lock goes at once. The transaction rolls back after its current statement. The next runner waits for the table locks to clear. |
| Node lost without closing connections | TCP keepalive notices after about 60s (OS default: about 2 hours). The lock connection sets it with `DEAD_CLIENT_KEEPALIVE_SQL`. Every other runner connection sets it at connect time (`withMigrationConnectionOptions`), so the transaction also rolls back. That helper also sets `statement_timeout=0`; `PGOPTIONS` still wins. |
| PgBouncer in transaction mode | The lock does not work: the unlock can reach a different backend. Connect directly or use session pooling. |

### Waiting

A pod that finds the migration lock taken sleeps for `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` and tries again, for at most `MIGRATION_LOCK_MAX_WAIT_MINUTES` (`0` = no limit). While waiting it does not query `migrations`, so a `lock_timeout` or `statement_timeout` cannot end the wait. Log:

```
[migrations] Another pod is running migrations. Waited 4s so far; retrying in 2s. This pod will NOT exit.
[migrations] Lock released; got the migration lock after 8s.
```

With `MIGRATION_SKIP_IF_LOCKED=true` (the data phase an async server starts at boot) the runner does not wait. The child exits with code `75` (`SKIPPED_EXIT_CODE`) and the server keeps serving.

### Lock sentinels

Two old migrations, `LockMigrationsTable1234567890000` and `…891000` (`LOCK_SENTINEL_MIGRATION_NAMES`), delete each other's row, so one of them is always pending. That is how a single-transaction run locks the `migrations` table on every boot. They are not real work:

- `pendingNames` leaves them out. Otherwise every restart and scale-up would take the active lock and refuse traffic.
- A runner with nothing else pending does not take the active lock. It logs `[migrations] No schema or data migrations pending — not cutting API traffic for this boot.`
- The split phases do not run them (`withoutLockSentinels`). The migration lock already keeps those runners apart, and a sentinel would hold `migrations` locked for the whole data transaction, which blocks booting pods.

## Upgrade gate

In async mode the server serves while migrations run. The upgrade gate answers unsafe requests with `503`, and the banner tells users why. Blocking mode has no gate.

| Situation | Status | Refused |
|---|---|---|
| A migration is running | `running` | Writes (`MIGRATION_IN_PROGRESS`). Sign-in and query runs still pass |
| The last migration failed | `failed` | Writes (`MIGRATION_FAILED`), until a server boot reruns it with success |

The client gets `503`, `Retry-After: 30`, body `{ statusCode, code, message, timestamp, path }`.

`MigrationGateMiddleware` asks `MigrationRunsService.status()`, which checks:

- Does a server hold the active lock now? It reads `pg_locks`, which never waits on a table lock, so it answers even while a migration locks `migrations`.
- What does the latest `migration_runs` row say?

**Rules to keep when you change the gate:**

1. **Never refuse health or metrics.** Otherwise the orchestrator kills pods during the upgrade. Reads always pass, so a new probe must be a GET. A request that always passes never reads the status.
2. **Refuse only `/api/*`.** The web app still loads and shows the banner. `buildApiPrefix(SUB_PATH)` handles installs under a subpath.
3. **When in doubt, let it through.** If the status cannot be read, treat it as "no migration running".
4. **Keep it cheap.** The status is cached for 1s, one read at a time, on the service's own pool of two connections. A refusal is logged at most once per 30s.
5. **Match the path Express routes on:** the raw request path (`parseurl.original`), lowercased, including absolute-form targets.

## Async mode

Use async mode when a migration takes longer than the liveness probe allows. Turn it on with `MIGRATION_MODE=async`. Nothing else is needed.

A boot in async mode:

1. **Before the server starts** (`migrateSchemaBeforeBoot`, `migrate-before-boot.ts`):
   - Fresh install (no database, or no `migrations` table): full setup, as in blocking mode.
   - Otherwise: the schema phase in a child process. If it fails, this pod exits and the old pods keep serving.
2. **The server starts** on the new schema.
3. **In the background** (`MigrationRunsService.start()`): the data phase in a child process. Output goes to the container logs and to `migration_runs`. After a successful run, the cleanup phase.

### Schema phase (before boot)

New code can map a column that only a new schema migration adds. Without this phase the server fails at start (for example licensing reads `instance_settings`, PostgreSQL answers `42703`) and every new pod crash-loops.

- **Nothing pending:** it exits at once without taking a lock. A restart or scale-up starts at once, even during a long data phase.
- **`migrations` table locked** (by a single-transaction run): it probes the table with a short `lock_timeout` (`migrationsTableLocked`). On a timeout it waits on the migration lock instead of reading, so a database `statement_timeout` cannot kill the pod.
- **Waiting:** it retries the migration lock every 5s, unless `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` is set.
- **While it applies migrations** it holds the active lock, so serving pods refuse writes.
- **Busy tables:** each try sets `lock_timeout` to `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS`, so a waiting `ALTER TABLE` does not queue up readers. On `55P03` it rolls back, waits 2s and tries again, up to `MIGRATION_SCHEMA_LOCK_RETRIES` tries in total.
- **Logs only.** It writes no `migration_runs` row.

**Older databases.** Migrations up to `MIGRATION_AUTHORING_RULES_CUTOFF` (`migration-mode.ts`) predate the rules that make the split safe. When one is pending, `blocksAsyncUpgrade` decides:

| Upgrade from | What happens |
|---|---|
| 3.21.74 or later | Nothing old is pending. Normal split |
| 3.21.58–3.21.73 | Every old migration still pending is in `ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS`. Normal split. If the data phase fails, 3.21.58 still runs on the database |
| older than 3.21.58 | The whole upgrade runs as one single-transaction run before the server starts, with the active lock held. The data phase then has nothing left to do |

So that 3.21.58 can split, old schema steps it cannot run on were changed:

- `DropGitSyncMetaHashColumns` and `CopyWorkflowAppMetaToAppVersions` live in `migrations/data/` under their old names, so databases that already ran them skip them.
- `GeneralizeUserPersonalAccessTokens` adds its workspace check as `NOT VALID`. `ValidatePatWorkspaceShape1793100000000` deletes the old workspace PATs and validates it.
- `ExemptUnsyncedDraftsFromDefaultBranchUniqueIndex` skips while the data migration that rebuilds those indexes is pending.

**Legacy upgrade (`legacy-3-21-58-upgrade.ts`).** While `MakeAppVersionBranchIdNotNullAndGitSyncFlags1781741000000` is pending, the data phase:

1. **Loosens** the old rules its data migrations break (`LEGACY_LOOSEN_RULES`). Each is saved to `legacy_upgrade_dropped_rules` and dropped in its own `withShortLock` transaction.
2. Runs **lock-free variants** (`LEGACY_VARIANTS`) in place of the originals. Each reuses its original's statements verbatim: row changes and function bodies in `up()`, index builds and new triggers in `beforeCommit()`. An old trigger function the original drops gets an empty body instead (`CREATE OR REPLACE FUNCTION`: no table lock, invisible to other sessions until commit). The last `beforeCommit()` statement swaps `fk_app_versions_branch` from `SET NULL` to `CASCADE` and adds the `branch_id IS NOT NULL` CHECK, both `NOT VALID`, under a 2s `lock_timeout`. That is the only ACCESS EXCLUSIVE lock, held until the commit right after it. A timeout retries the data phase. Migrations without a variant run as written. Single-transaction runs always use the originals.
3. **Restores** the saved rules if the data phase fails, still holding the migration lock: CHECKs `NOT VALID`, then `VALIDATE`; indexes rebuilt. A rule that no longer validates stays `NOT VALID` and is logged. `npm run db:legacy-upgrade:restore` does the same after a killed run. It refuses once the data phase committed.

Removals wait for the cleanup migration `CleanupLegacyBranchModel`, one upgrade later. It first reruns the branch fixes (`branchlessRowFixes`) for rows 3.21.58 pods wrote without a branch during the rollout. Then it validates the key, sets the branch columns NOT NULL, drops the dead columns, table, triggers and functions, and recreates three `app_versions` triggers. Until then, reads treat a row with no branch as on the default branch (`branch_scope.helper.ts`). The final schema and rows match a single-transaction run. Once the data phase commits, only the pre-upgrade backup brings 3.21.58 back.

### Data phase

- Runs as a child of the server (`MIGRATION_PHASE=data`), started at boot or by the dead-run check.
- All data migrations run in one transaction. A failure undoes the data changes only. The schema additions stay, and the next run does the data migrations again.
- **`beforeCommit()`** (`DataMigration`, `migration-mode.ts`) runs after every data migration's `up()`, just before commit. Lock-taking steps placed there hold their SHARE locks for seconds, not the whole run, so sign-in writes that pass the gate wait only that long. A single-transaction run calls the same steps at the same point.
- **Retries.** A deadlock (`40P01`), serialization failure (`40001`) or lock timeout (`55P03`) rolls the data phase back and runs it again, up to 3 attempts, 2s apart. Any other error fails the run at once.

### Cleanup phase

- Runs as a child of the server (`MIGRATION_PHASE=cleanup`) after the run row is recorded `succeeded`, so writes have reopened. A single-transaction run runs cleanup inside its one transaction instead (executor `transaction = 'none'`: TypeORM's `'all'` refuses classes with `transaction = false`).
- Holds only the cleanup lock, never the migration or active lock. The gate stays open and a data run never skips for it.
- Before each step it checks whether a server holds the migration lock. If one does, it stops, and the remaining steps run on the next boot.
- Each step is its own `withShortLock` transaction. A failed step stays pending. The run stays `succeeded` and writes stay open. Output goes to the pod log only.
- **Held back on a skipped release.** A cleanup runs only if its `requires` migration was recorded before this code first ran. `migration_baselines` keeps, per newest migration the code ships (`code_head`), the last migration id recorded when its first runner started (0 on a fresh install, where everything runs). An instance that skipped that release records it in the same upgrade, so the cleanup waits for the next upgrade and the previous image can still roll back. Single-transaction runs apply the same rule (`planCleanup`, `migration-mode.ts`).

### Serving during a run

- **What passes.** Reads, sign-in, session, OAuth/SSO and query runs (`ASYNC_MODE_WRITE_ALLOWLIST`). Other writes get 503.
- **New pods wait for their own data phase.** From boot until its data phase takes the active lock, exits or fails to start, a pod reports `running`. So new code never writes before its data migrations ran. On a plain restart this lasts as long as the child takes to start, on that pod only.
- **Requests that pass can still wait, but not long.** A row a data migration changed stays locked until commit. In async mode the server's pool sets `lock_timeout` to 5s (`ASYNC_MODE_LOCK_TIMEOUT_MS`, `app/loader.ts`), so such a request fails after 5s instead of holding a pool connection. `/api/health` stays free, so the pod is not killed. The limit applies to every main-pool query while async mode is on, not only during a run.
- **Other runners count too.** A held active lock reads as `running` even without a run row, for example a manual `db:migrate` or a blocking-mode server on the same database.
- **Workers.** A `WORKER=true` server pauses its BullMQ workers while the status is `running` or `failed`. It checks every 5s and resumes after. Jobs wait in Redis.

### Runs

**Starting a run.**

- **One at a time.** A unique index (`migration_runs_one_active`) allows one `running` row in the cluster.
- **Every boot tries.** Each async boot starts a data phase with `MIGRATION_SKIP_IF_LOCKED=true`, also after a failed run of the same version. It records a row only when it finds pending work. If another server holds the migration lock, the child exits `75` and records nothing.
- **No manual retry.** There is no Retry button and no `POST /migration-runs/run`. To rerun a failed migration, ship a fixed image, or fix the cause and restart.
- **Boot could not reach the database.** The dead-run check calls `start()` again until it succeeds.
- **Nothing pending after a failure.** The runner records a `succeeded` run, which reopens writes.
- **A newer release ran last.** A server does not start a run when the latest run's `to_version` is newer than its own: it cannot see that release's migrations and would record a false success. Its gate also ignores a failed run of the newer release. During a rollout, old pods take writes and new pods refuse them. Rolling back to the previous image serves writes and leaves the failed run on record.

**When the migrating server dies.**

- **Dead run.** A `running` row is dead when nobody holds the migration lock and its heartbeat is older than 30s. While a connection holds the lock, the row is alive however old its heartbeat.
- **Dead-run check.** Every server checks every 10s. It marks dead rows failed, then inserts a new `running` row; the unique index lets one server win. The winner's child waits for the migration lock instead of skipping.
- **Stale row in the way.** A runner that holds the migration lock may find a `running` row from a pod killed less than 30s ago. It marks that row failed, then inserts its own.
- **A stopped run is not a failed migration.** The gate and banner treat a dead run, or one recorded as "The migrating server stopped without reporting a result.", as `running`, because another server reruns it. The migrations page lists it as failed, with that error.
- **Finished rows are final.** Updates skip rows that have `finished_at` set.

**When a migration fails.** Nothing from the data phase commits. Reads continue. Writes get 503 `MIGRATION_FAILED`.

### Shutdown

1. SIGTERM reaches Node: the production images run `tini -g` as PID 1, and the root and server `start:prod` scripts use `exec`.
2. Shutdown runs once and takes at most 20s (`onceWithDeadline`, `SHUTDOWN_TIMEOUT_MS`, `src/helpers/bootstrap.helper.ts`).
3. `MigrationRunsService` sends SIGTERM to the child's process group and waits up to 10s.
4. The open transaction rolls back. The run is recorded as stopped, so the next boot runs it again.

A hard kill (OOM, node loss) leaves a dead run. The next runner marks it failed when it takes the lock. Otherwise the dead-run check marks it after 30s.

### Logs and banner

- **Tables.** The service creates `migration_runs` and `migration_run_logs` itself; they are not migrations. It writes them on its own `pg` pool, so they update while the migration transaction is open. It keeps the last 50 runs.
- **Steps.** The run row is rebuilt from the runner's output (`migration-run-log.ts`): `[migrations] START <name>` / `DONE <name> <ms>` lines, data-migration `[PROGRESS] i/total` lines and `MigrationProgress` `<name> Progress N %` lines (one kept per percent).
- **Logs.** Each kept line goes to `migration_run_logs`, tagged with its migration. The run row keeps the last 200 lines (`LOG_TAIL_LINES`). Query parameters, emails and connection URLs are redacted. TypeORM `query is slow:` and `execution time:` lines are dropped unless `ORM_LOGGING` is set. After a success, logs of earlier runs are deleted; their rows stay.
- **Super-admin routes.** `GET {prefix}api/migration-runs` lists runs. `GET {prefix}api/migration-runs/:id/log[?migration=<name>]` returns a run's log, or one migration's lines. The page is `{prefix}settings/migrations`.
- **Banner.** The public `GET {prefix}api/migration-status` returns state, start time, version and end-user text. The frontend `MigrationBanner` shows it for `running` and `failed`, polling every 3s while `running`, else every 30s. In blocking mode the endpoint always says `idle`.
- **Banner text.** End users of released and embedded apps see a generic maintenance message, unless `MIGRATION_END_USER_MESSAGE_RUNNING` / `_FAILED` replace it (sent as `endUserMessage`, trimmed, max 200 characters). Builders and super admins see the built-in text. A super admin's `failed` banner links to the migrations page.

### Trade-offs

- Schema and data do not roll back together. After a data migration failure, the schema additions stay. This is safe because schema migrations only add, and old code ignores additions.
- The schema phase shows only in pod logs.
- A pod of a newer release that boots during a long data phase of the previous release waits on the migration lock, up to `MIGRATION_LOCK_MAX_WAIT_MINUTES`.

## Environment variables

All optional. The ROLLING UPGRADE block of `.env.example` lists them too.

| Variable | Default | Effect |
|---|---|---|
| `MIGRATION_MODE` | `blocking` | `async`: see [Async mode](#async-mode). Any other value means `blocking`. |
| `DISABLE_MIGRATION_TRAFFIC_GATE` | `false` | Async mode: `true` turns off the 503. Locks and waits still apply. Each serving pod logs this at boot. |
| `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` | `60` (schema phase: `5`) | How often a waiting pod tries the migration lock again. |
| `MIGRATION_LOCK_MAX_WAIT_MINUTES` | `30` | How long a pod waits before it fails its boot. `0` waits with no limit; a blank value uses the default. |
| `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS` | `5000` | Schema phase only: `lock_timeout` for its transaction and its table probe. |
| `MIGRATION_SCHEMA_LOCK_RETRIES` | `10` | Schema phase only: total tries before a lock timeout fails the boot. `1` means no retry. |
| `MIGRATION_END_USER_MESSAGE_RUNNING` | unset | Banner text for end users of released apps during a run. Max 200 characters. |
| `MIGRATION_END_USER_MESSAGE_FAILED` | unset | Same, after a failed run. |

Set by ToolJet itself, never by operators: `MIGRATION_PHASE`, `MIGRATION_SKIP_IF_LOCKED`, `MIGRATION_SETUP_COMMAND`.

## Failure modes

The Gate column is for async mode.

| What happens | Migration | Gate | Cost |
|---|---|---|---|
| Another pod is migrating | Waits, then has nothing to do | Not raised by the waiting pod | As long as the other migration |
| Migrating pod gets SIGTERM/SIGKILL | Rolled back | Lifted when its connection closes | None |
| Migrating pod's node is lost | Rolled back | Lifted after ~60s keepalive | About a minute |
| A migration is broken | Rolled back, runner exits non-zero | Lifted | Fails fast, no retry |
| A pod waits longer than the maximum | Exits non-zero | — | `MIGRATION_LOCK_MAX_WAIT_MINUTES` |
| Schema phase cannot lock a busy table | Rolled back, retried, then exits non-zero | Lifted | Old pods keep serving |
| Async data phase fails | Data rolled back, schema stays | `failed`: writes refused | Until a boot reruns it with success |
| A cleanup step fails or keeps timing out | That step rolled back; finished steps stay | Open | The step reruns on the next boot |
| Async runner killed | Rolled back | Dead run after 30s, then rerun | Up to ~40s |
| Serving pod cannot reach the database | — | Lets requests through | The API is down anyway |

## Operator runbook

**Is a migration running?**

```sql
-- holders of the migration lock (6273975241000) and the active lock (6273975241001)
SELECT (l.classid::bigint << 32) | l.objid::bigint AS key, a.pid, a.client_addr, a.backend_start
FROM pg_locks l JOIN pg_stat_activity a USING (pid)
WHERE l.locktype = 'advisory' AND l.objsubid = 1 AND l.granted;
```

A row means a live connection is migrating. Once that connection ends, the lock is gone.

**Stop a runaway migration:**

1. Run `SELECT pg_terminate_backend(<pid>)`. The transaction rolls back and both locks are released.
2. In async mode the run then shows as failed, and writes stay refused until a server restarts. That restart runs the migration again.
3. To stop it for good, ship a fixed image.

**Upgrade without refused traffic:** set `DISABLE_MIGRATION_TRAFFIC_GATE=true`.

**Back to 3.21.58 after a killed upgrade:** from the new image, run `npm run db:legacy-upgrade:restore` (`:prod` in the image), then deploy the 3.21.58 image.

**Known limitation:** the gate works from the *next* async upgrade on. During the deploy that first ships it, the old pods have no gate.

## Invariants

- Take the migration lock **before** reading the pending list.
- Lock sentinels are not work: keep them out of the pending count. The split phases do not run them.
- Gate state comes only from connection-held locks and run rows. Never from a flag someone must clear by hand.
- Never refuse a health or metrics endpoint. If the gate cannot read the status, it lets the request through.
- An error inside the migration transaction is final; do not wrap the runner in a retry. Exceptions: a lock timeout in the schema phase, transient errors (`40P01`, `40001`, `55P03`) in the data phase, and `withShortLock` steps.
- In async mode only a server boot or the dead-run check starts a run. There is no manual retry.
- Schema, data and cleanup run as separate `MigrationExecutor` passes. Do not merge the folders into one DataSource: TypeORM sorts by class-name timestamp, and the timestamps interleave.
- Plan enum additions before `announceEachMigration` wraps `up()`; the wrapper hides the source from the scanner.

## Tests

| File (under `server/test/modules/`) | Covers |
|---|---|
| `migrations/unit/migration-mode.spec.ts` | Mode selection, opt-out, end-user banner text, `MIGRATION_PHASE` parsing, cleanup hold-back plan, `blocksAsyncUpgrade` and the allowlist |
| `migrations/unit/migrate-before-boot.spec.ts` | Cloud entrypoint steps; schema before boot |
| `migrations/unit/enum-value-additions.spec.ts` | Enum `ADD VALUE` scanning |
| `migrations/unit/migration-locks.spec.ts` | Wait interval and maximum (blank values use the defaults), skip-if-locked, migrations run on the lock's connection before unlock, sentinels left out; data-phase retry codes, `retryWhen` attempts, code head pick |
| `migrations/unit/migration-run-log.spec.ts` | Run rebuilt from runner output, redaction, failed step |
| `migrations/unit/migration-lint.spec.ts` | The rules in `migration-lint.ts`, then every real migration against them; the frozen pre-cutoff list |
| `migrations/unit/lock-probe.spec.ts` | Which table locks each phase may take (`classifyLocks`). CI also runs `npm run db:probe-locks` on a copy of the migration snapshot and fails on a forbidden lock |
| `migrations/unit/legacy-3-21-58-upgrade.spec.ts` | Legacy variants, loosen and restore steps. Delete with `legacy-3-21-58-upgrade.ts` |
| `migrations/e2e/pods-upgrading-together.spec.ts` | Three real pods on one database: no crash loop, every pod boots only after the migration, migration body runs once, a `NODE_ENV=production` race, active lock only during work (a pod with nothing to do never waits on it) and released on SIGKILL |
| `migrations/e2e/schema-then-data-then-cleanup.spec.ts` | Split phases, single-transaction run for an old database, lock-timeout retry, enum `ADD VALUE` (including one a schema migration uses), boot during a long data phase, skip-if-locked, connection options, cleanup hold-back and stop rules, `beforeCommit()`, deadlock retry, a failing data migration (single-transaction run undoes the schema too; data phase keeps the schema and records nothing) |
| `migrations/e2e/short-lock-steps.spec.ts` | `withShortLock` against a held reader lock, and readers queued behind it getting through; inline inside an open transaction; `setNotNull` |
| `migrations/e2e/upgrade-from-3-21-58.spec.ts` | A 3.21.58 database upgraded async ends like a single-transaction upgrade; cleanup held back once; failed data restores loosened rules; branchless rows read on the default branch. Delete with `legacy-3-21-58-upgrade.ts` |
| `app/unit/migration-gate.middleware.spec.ts` | Blocking passes everything, gated vs ungated paths, 503 per state, async allowlist, opt-out log |
| `app/e2e/migration-runs.spec.ts` | Auth (401/403), no manual retry route (404), claim races, dead vs live runs, boot reruns a same-version failure, no rerun of a newer release's run, boot start retried, skipped runner records nothing, real runner output parsed into the run, cleanup run, status cache, fail-open; an async-mode app: 503 per state with `Retry-After` on writes, reads and `/api/health` pass, 5s `lock_timeout` |
| `apps/e2e/viewer-cache-stamps.spec.ts` | The released-app cache key moves when a migration is recorded, and differs while one runs |
| `app/unit/graceful-shutdown.spec.ts` | Shutdown runs once per signal burst, exits 1 past the 20s deadline or when it throws |

Fixtures are in `test/modules/migrations/fixtures/`. The e2e specs run the real `run()` against a scratch database.

- `harness.ts`, `pod.ts`: scratch databases and the pod process the specs spawn. `pod.ts` loads the sentinels and the migrations of `FIXTURE_SET`, and exits 75 when `run()` returns false.
- `migration-files.ts`: reads this repo's migrations and entities for the lint checks.
- `fake-runner.js`: a stand-in runner for `app/e2e/migration-runs.spec.ts`.
- `migration-sets/<set>/{schema,data,cleanup}/`: `concurrent-pods` (sentinels, loaded by every set, and a slow schema migration), `split-phases`, `cleanup-phase`, `data-before-commit`, `pre-cutoff`.
- `3-21-58-database.sql`: a seeded 3.21.58 database (synthetic data, secrets redacted).

Start pods with `process.execPath`, **not** `npx`: `npx` does not forward SIGKILL and leaves the pod orphaned.
