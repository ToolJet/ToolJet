# Migration flow

How ToolJet runs database migrations: at boot, across many pods, and in async mode.

**Read this when** you change `server/src/migration-helpers/`, `server/src/modules/app/migration-runs/`, `server/src/modules/app/middlewares/migration-gate.middleware.ts` or the `db:setup` step of a container entrypoint. Update this document in the same PR.

To *write* a migration (expand vs backfill, enum rules, logging), read the migration-writing rules in [`../AGENTS.md`](../AGENTS.md#migrations).

**Sections:** [Boot path](#boot-path) · [Phases and transactions](#phases-and-transactions) · [Many pods, one migration](#many-pods-one-migration) · [Upgrade gate](#upgrade-gate) · [Async mode](#async-mode) · [Environment variables](#environment-variables) · [Failure modes](#failure-modes) · [Operator runbook](#operator-runbook) · [Invariants](#invariants) · [Tests](#tests)

## In short

There are two modes.

- **Blocking mode** (the default, and always on Cloud). Each pod runs every pending migration before it starts serving. All expand and backfill migrations run in one transaction, so a failure leaves the database as it was. A long migration can outlast the liveness probe.
- **Async mode** (`MIGRATION_MODE=async`). A pod applies expand migrations before it starts, then serves. Backfill migrations run in the background. While they run, or after they fail, the upgrade gate refuses writes. Rollback is: deploy the previous image.

In both modes only one pod migrates at a time. The others wait.

**Terms** used below:

| Term | Meaning |
|---|---|
| runner | The process that runs migrations (`run-all-migrations.ts`) |
| single-transaction run | A runner that runs expand and backfill migrations in one transaction (`MIGRATION_PHASE` unset) |
| expand phase | A runner that runs only expand migrations (`MIGRATION_PHASE=expand`) |
| backfill phase | A runner that runs only backfill migrations (`MIGRATION_PHASE=backfill`) |
| migration lock | A PostgreSQL lock that lets one runner at a time migrate (`MIGRATION_ADVISORY_LOCK_KEY`) |
| active lock | A PostgreSQL lock held while a runner actually changes the database (`MIGRATION_ACTIVE_LOCK_KEY`) |
| run | One async-mode backfill phase, recorded as a row in `migration_runs` |
| upgrade gate | The middleware that answers unsafe requests with `503` in async mode (`MigrationGateMiddleware`) |

---

## Boot path

```
entrypoint → wait-for-it (PostgreSQL) → npm run db:setup:prod → exec "$@" (npm run start:prod → exec node dist/src/main)
                                          └── db:create + db:migrate
                                                └── src/migration-helpers/run-all-migrations.ts
```

- **Every pod runs migrations.** There is no separate migration job, so 20 pods start 20 runners. [Many pods, one migration](#many-pods-one-migration) explains how only one of them migrates.
- **The runner is not the server.** It is a plain Node process without NestJS (no `ConfigService`, no DI). It reads config with `getEnvVars()` and opens its own connections.
- **Config.** `getEnvVars()` puts the env file over `process.env`: a key in `.env` wins over an exported shell variable, and a key missing from the file comes from `process.env`. The e2e specs rely on this.
- **`NODE_ENV`** only picks the file (`test` → `../.env.test`, else `../.env`). Coordination does not depend on it (`concurrent-migrations.spec.ts` checks this). With `NODE_ENV=test`, `ormconfig.ts` lists no migrations, so the e2e pods bring their own DataSources.
- **Async mode** skips this step in the entrypoint. The entrypoint exports the command as `MIGRATION_SETUP_COMMAND` and the server runs it.

## Phases and transactions

A runner runs all expand migrations (`server/migrations/expand/`), then all backfill migrations (`server/migrations/backfill/`). `MIGRATION_PHASE` says which part it runs. Any value other than those below fails the runner.

The phase and run-strategy meanings are defined once, at `MigrationPhase` and `RunStrategy` in `migration-mode.ts`. A single-transaction run is the `single-transaction` strategy; the expand and backfill phases of async mode are the `multi-transaction` strategy.

| `MIGRATION_PHASE` | Used by | Runs | Transactions |
|---|---|---|---|
| unset (single-transaction run) | Blocking mode, Cloud, `npm run db:migrate`, and an async boot of a database older than 3.21.58 | Expand, then backfill | One. A failing backfill migration also undoes the schema changes |
| `expand` | Async boot | Pending expand migrations | One short transaction, with a lock timeout and retries |
| `backfill` | Async runs | Any expand migration still pending (normally none), then all backfill migrations | One for the leftover expand, one for all backfill |

**Enum exception.** PostgreSQL does not allow using an enum value in the transaction that added it (`55P04`). On an upgrade, `planEnumAdditions` commits new enum values first. On a fresh install it uses two transactions. Details: the migration-writing rules in [`../AGENTS.md`](../AGENTS.md#migrations).

## Many pods, one migration

Two PostgreSQL advisory locks (`migration-locks.ts`) make sure one pod migrates and the others know about it. PostgreSQL drops a lock when its connection closes, so a killed pod cannot leave one behind. No TTL, no cleanup job, no Redis.

| Lock | What it means | Held | Checked by |
|---|---|---|---|
| Migration lock (`6273975241000`) | "I am the pod that migrates" | From reading the pending list to commit | Waiting pods; dead-run detection |
| Active lock (`6273975241001`) | "I am changing the database right now" | Only while real migrations execute | The upgrade gate |

```
run()
 └── withMigrationAdvisoryLock           ← take the migration lock
      └── migrateAsSolePod
           ├── realPendingMigrationNames  (lock sentinels left out)
           ├── pg_advisory_lock(active)  ← only when there is real work
           └── executeMigrations         ← per MIGRATION_PHASE
```

### Migration lock

The runner takes the migration lock (`pg_try_advisory_lock`) **before** it reads which migrations are pending, and keeps it until commit. The lock lives on its own connection, which sits idle while the migrations run on another.

Why before the read: if two pods both read the pending list first, the second one later runs migrations the first already applied and fails, for example with `duplicate key value violates unique constraint "pg_type_typname_nsp_index"`. A table lock on `migrations` taken inside the transaction (`LockMigrationsTable1/2`) comes too late to prevent this.

What happens when the migrating pod goes away:

| Event | Result |
|---|---|
| Pod killed (SIGTERM/SIGKILL) | The connection closes and the lock goes at once. The transaction rolls back after its current statement. The next runner waits for the table locks to clear. |
| Pod's node lost without closing connections | TCP keepalive notices after about 60s (the OS default is about 2 hours). The lock connection sets it with `DEAD_CLIENT_KEEPALIVE_SQL`; every other runner connection sets it at connect time (`withMigrationConnectionOptions`), so the transaction rolls back and frees its row locks too. That helper also sets `statement_timeout=0`, unless `PGOPTIONS` says otherwise, so a long migration is not cancelled. |
| PgBouncer in transaction mode | The lock does not work, because the unlock can reach a different backend. Connect directly or use session pooling. |

### Waiting

A pod that finds the migration lock taken sleeps for `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` and tries again, for at most `MIGRATION_LOCK_MAX_WAIT_MINUTES` (`0` = no limit). While waiting it does not query `migrations`, so a `lock_timeout` or `statement_timeout` cannot end the wait. Its log:

```
[migrations] Another pod is running migrations. Waited 4s so far; retrying in 2s. This pod will NOT exit.
[migrations] Lock released; got the migration lock after 8s.
```

With `MIGRATION_SKIP_IF_LOCKED=true` (the backfill phase an async server starts at boot) the runner does not wait: the child process exits with code `75` (`SKIPPED_EXIT_CODE`) and the server keeps serving.

### Lock sentinels

Two old migrations, `LockMigrationsTable1234567890000` and `…891000` (`LOCK_SENTINEL_MIGRATION_NAMES`), delete each other's row, so one of them is always pending. That is how a single-transaction run locks the `migrations` table on every boot. They are not real work:

- They do not count as pending (`realPendingMigrations`). Otherwise every restart and scale-up would take the active lock and refuse traffic.
- A runner with nothing else pending does not take the active lock. It logs: `[migrations] No schema or backfill migrations pending — not cutting API traffic for this boot.`
- The expand and backfill phases do not run them at all (`withoutLockSentinels`). The migration lock already keeps those runners apart, and a sentinel would hold `migrations` locked for the whole data transaction, which blocks booting pods.

## Upgrade gate

In async mode the server serves while migrations run. The upgrade gate stops requests that are not safe during that time: it answers them with `503` and the banner tells users why. Blocking mode has no gate; it works as on releases before async mode.

**When it refuses.**

| Situation | Status | Refused |
|---|---|---|
| A migration is running | `running` | Writes (`MIGRATION_IN_PROGRESS`). Sign-in and query runs still pass |
| The last migration failed | `failed` | Writes (`MIGRATION_FAILED`), until a server boot reruns it with success |

Health and metrics endpoints are never refused.

**What the client gets.** `503`, `Retry-After: 30`, body `{ statusCode, code, message, timestamp, path }`.

**How it knows.** `MigrationGateMiddleware` asks `MigrationRunsService.status()`. That checks two things:

- Is a server holding the active lock right now? It reads `pg_locks`, which never waits on a table lock, so it answers even while a migration locks `migrations`.
- What does the latest row in `migration_runs` say?

**Rules to keep when you change the gate:**

1. **Never refuse health or metrics.** Otherwise the orchestrator kills pods for failing health checks during the upgrade. Both are reads, and reads always pass; a new probe must be a GET too. A request that always passes never reads the migration status.
2. **Refuse only `/api/*`.** The web app still loads and can show the banner. `buildApiPrefix(SUB_PATH)` handles installs under a subpath.
3. **When in doubt, let it through.** If the status cannot be read, treat it as "no migration running".
4. **Keep it cheap.** The status is cached for 1s, one read at a time, on its own pool of two connections. A refusal is logged at most once per 30s.
5. **Check the path Express routes on:** the raw request path (`parseurl.original`), lowercased, including absolute-form targets.

## Async mode

Use async mode when a migration takes longer than the liveness probe allows. Turn it on with `MIGRATION_MODE=async`; nothing else is needed. Cloud ignores it and stays blocking.

A boot in async mode:

1. **Before the server starts** (`migrateSchemaBeforeBoot` in `migrate-before-boot.ts`):
   - Fresh install (no database, or no `migrations` table): run the full setup, as in blocking mode.
   - Otherwise: run the expand phase in a child process. If it fails, this pod exits; the old pods keep serving.
2. **The server starts**, on the new schema.
3. **In the background** (`MigrationRunsService.start()`): run the backfill phase in a child process. Its output goes to the container logs and to `migration_runs`.

### Expand phase (before boot)

**Why it exists.** New code can map a column that only a new expand migration adds. Without this phase the server fails at start, for example: licensing reads `instance_settings`, PostgreSQL answers `42703` (no such column), and every new pod crash-loops.

**How it behaves:**

- **Nothing pending:** it exits at once without taking a lock. A restart or scale-up starts right away, even during a long backfill phase.
- **`migrations` table locked** (by a single-transaction run or a blocking-mode server): it first probes the table with a short `lock_timeout` (`migrationsTableLocked`). If the probe times out, it waits on the migration lock instead of reading, so a database `statement_timeout` cannot kill the pod.
- **Waiting:** it retries the migration lock every 5s, unless `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` is set.
- **While it applies migrations** it holds the active lock, so serving pods refuse writes.
- **Busy tables:** each try sets `lock_timeout` to `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS`, so a waiting `ALTER TABLE` does not queue up readers of released apps. On a lock timeout (`55P03`) it rolls back, waits 2s and tries again, up to `MIGRATION_SCHEMA_LOCK_RETRIES` tries in total.
- **Logs only.** It writes no `migration_runs` row; its output is in the pod logs.

**Older databases.** Migrations up to `MIGRATION_AUTHORING_RULES_CUTOFF` (`migration-mode.ts`) were written before the rules that make the split safe. When one of them is pending, `blocksAsyncUpgrade` decides:

| Upgrade from | What happens |
|---|---|
| 3.21.74 or later | Nothing old is pending. Normal split |
| 3.21.58–3.21.73 | The old migrations still pending are all in `ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS` (`pre-cutoff-allowlist.ts`). Normal split. If the backfill phase fails, the previous release still runs on the database |
| older than 3.21.58 | The whole upgrade runs as one single-transaction run before the server starts, with the active lock held. The backfill phase then has nothing left to do |

To make 3.21.58 splittable, the old schema steps 3.21.58 cannot run on moved to the backfill phase:

- `DropGitSyncMetaHashColumns` and `CopyWorkflowAppMetaToAppVersions` moved to `migrations/backfill/` under the same names, so databases that already ran them skip them.
- `GeneralizeUserPersonalAccessTokens` adds its workspace check as `NOT VALID`. `ValidatePatWorkspaceShape1793100000000` deletes the old workspace PATs and validates the check.
- `ExemptUnsyncedDraftsFromDefaultBranchUniqueIndex` skips while the backfill migration that rebuilds those indexes is pending.

The final schema is the same as after a single-transaction run. Once the backfill phase succeeds, it has dropped columns 3.21.58 needs, so from then on only the pre-upgrade backup brings 3.21.58 back.

### Backfill phase

- Runs as a child of the server (`MIGRATION_PHASE=backfill`), started at boot or by the dead-run check.
- All backfill migrations run in one transaction. A failure undoes the data changes only. The schema additions stay, and the next run does the backfill migrations again.

### Serving during a run

- **What passes.** Reads, sign-in, session, OAuth/SSO and query runs (`ASYNC_MODE_WRITE_ALLOWLIST`). Other writes get 503.
- **New pods wait for their own backfill phase.** From boot until its backfill phase takes the active lock, exits or fails to start, a pod reports `running`. So new code never writes before its backfill migrations ran. On a plain restart this lasts as long as the child takes to start, on that pod only.
- **Requests that pass can still wait, but not for long.** A row a backfill migration changed stays locked until commit, and a backfill migration that alters a table (upgrades from 3.21.58–3.21.62) locks the whole table. In async mode the server's database pool sets `lock_timeout` to 5s (`ASYNC_MODE_LOCK_TIMEOUT_MS` in `app/loader.ts`), so such a request fails after 5s instead of holding a pool connection. The pool and `/api/health` stay free, so the pod is not killed. Pages that read other tables keep working. The limit applies to every query on the main pool for as long as async mode is on, not only during a run.
- **Other runners count too.** A held active lock reads as `running` even without a run row, for example a manual `db:migrate` or a blocking-mode server on the same database.
- **Workers.** A `WORKER=true` server pauses its BullMQ workers while the status is `running` or `failed`. It checks every 5s and resumes after. Jobs wait in Redis.

### Runs

**Starting a run.**

- **One at a time.** A unique index (`migration_runs_one_active`) allows one `running` row in the cluster.
- **Every boot tries.** Each async boot starts a backfill phase with `MIGRATION_SKIP_IF_LOCKED=true`, including a boot after a failed run of the same version. It records a row only when it finds pending work. If another server holds the migration lock, the child exits `75` and records nothing.
- **No manual retry.** There is no Retry button and no `POST /migration-runs/run`. To rerun a failed migration, ship a fixed image, or fix the cause (bad data, a missing table) and restart. The migrations page only shows runs.
- **Boot could not reach the database.** The 10s dead-run check (below) calls `start()` again until it succeeds.
- **Nothing pending after a failure.** The runner records a `succeeded` run, which lets writes through again.
- **A newer release ran last.** A server does not start a run when the latest run's `to_version` is newer than its own: it cannot see that release's migrations, so it would find nothing and record a false success. Its gate also ignores a failed run of the newer release, because its own code runs fine on the schema it knows. During a rollout, old pods take writes and new pods refuse them. Rolling back to the previous image serves writes and leaves the failed run on record.

**When the migrating server dies.**

- **Dead run.** A `running` row is dead when nobody holds the migration lock and its heartbeat is older than 30s. While a connection holds the lock, the row is alive however old its heartbeat.
- **Dead-run check.** Every server checks every 10s. It marks dead rows failed, then inserts a new `running` row; the unique index lets one server win. The winner's child waits for the migration lock instead of skipping. Without this check, writes would stay refused until the next boot.
- **Stale row in the way.** A runner that holds the migration lock may find a `running` row from a pod killed less than 30s ago. It marks that row failed, then inserts its own.
- **A stopped run is not a failed migration.** The gate and banner treat a dead run, or one recorded as "The migrating server stopped without reporting a result.", as `running`, because another server reruns it. The migrations page still lists it as failed, with that error.
- **Finished rows are final.** Updates skip rows that have `finished_at` set.

**When a migration fails.** Nothing from the backfill phase commits. Reads continue. Writes get 503 `MIGRATION_FAILED` ("…until it is fixed and ToolJet restarts.").

### Shutdown

1. SIGTERM reaches Node: the production images run `tini -g` as PID 1, and the root and server `start:prod` scripts use `exec`.
2. Shutdown runs once and takes at most 20s (`onceWithDeadline`, `SHUTDOWN_TIMEOUT_MS`, `src/helpers/bootstrap.helper.ts`).
3. `MigrationRunsService` sends SIGTERM to the child's process group and waits up to 10s.
4. The open transaction rolls back. The run is recorded as stopped, so the next boot runs it again.

A hard kill (OOM, node loss) leaves a dead run. The next runner marks it failed when it starts, since it then holds the lock and any `running` row must be dead. Otherwise the dead-run check marks it after 30s.

### Progress, logs and banner

- **Tables.** The service creates `migration_runs` and `migration_run_logs` itself; they are not migrations. It writes them on its own `pg` pool, so progress shows while the migration transaction is still open. It keeps the last 50 runs.
- **Progress** comes from the runner's `[migrations] START <name>` and `DONE <name> <ms>` lines, data-migration `[PROGRESS] i/total` lines and `MigrationProgress` `<name> Progress N %` lines, keeping one line per percent.
- **Logs.** Each kept line goes to `migration_run_logs`, tagged with its migration; the run row keeps the last 200 lines (`LOG_TAIL_LINES`). Query parameters, emails and connection URLs are redacted. TypeORM `query is slow:` and `execution time:` lines are dropped unless `ORM_LOGGING` is set. After a success, logs of earlier runs are deleted; their rows stay.
- **Super-admin routes.** `GET {prefix}api/migration-runs` lists runs. `GET {prefix}api/migration-runs/:id/log[?migration=<name>]` returns a run's log, or one migration's lines.
- **Banner.** The public `GET {prefix}api/migration-status` returns state, start time, version and end-user text, plus `progress: { done, total }` (backfill migrations, counts only) while a run is in progress. The frontend `MigrationBanner` shows it for `running` and `failed`, polling every 3s while `running`, else every 30s. In blocking mode the endpoint always says `idle`.
- **Upgrade page.** A page that fails to load lands on `/error/:errorType`. While an upgrade runs, that route shows a plain page with the progress bar instead of the error (`UpgradeInProgress`), with no product name since released apps reach it too, and returns to `/` once the run ends. The progress also shows in the pod log: `[migrations] START <name>` and `DONE <name> <ms>` per migration.
- **Banner text.** End users of released and embedded apps see a generic maintenance message, unless `MIGRATION_END_USER_MESSAGE_RUNNING` / `_FAILED` replace it (sent as `endUserMessage`, trimmed, max 200 characters). Builders and super admins see the built-in text. A super admin's `failed` banner links to `{prefix}settings/migrations`, with the failed migration and its log.

### Trade-offs

- Expand and backfill do not roll back together. After a backfill failure, the expand additions stay.
- The expand phase shows only in pod logs.
- A pod of a newer release that boots during a long backfill phase of the previous release waits on the migration lock, up to `MIGRATION_LOCK_MAX_WAIT_MINUTES`.

This is acceptable because expand migrations only add (see the migration-writing rules in [`../AGENTS.md`](../AGENTS.md#migrations)). Old code ignores additions, so rollback is: deploy the previous image.

GitLab self-managed works the same way: [regular expand migrations before new code](https://docs.gitlab.com/development/migration_style_guide/), background migrations for data, destructive changes a release later, and [restore the pre-upgrade backup instead of `db:rollback`](https://docs.gitlab.com/development/migration_style_guide/#reversibility). The difference: here the operator has no separate post-deploy step.

## Environment variables

All optional. The ROLLING UPGRADE block of `.env.example` lists them too.

| Variable | Default | Effect |
|---|---|---|
| `MIGRATION_MODE` | `blocking` | `async`: see [Async mode](#async-mode). Any other value means `blocking`. Cloud ignores it. |
| `DISABLE_MIGRATION_TRAFFIC_GATE` | `false` | Async mode: `true` turns off the 503. Locks and waits still apply. Each serving pod logs this at boot. |
| `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` | `60` (expand phase: `5`) | How often a waiting pod tries the migration lock again. |
| `MIGRATION_LOCK_MAX_WAIT_MINUTES` | `30` | How long a pod waits before it fails its boot. `0` waits with no limit. |
| `MIGRATION_SCHEMA_LOCK_TIMEOUT_MS` | `5000` | Expand phase only: `lock_timeout` for its transaction and its table probe. |
| `MIGRATION_SCHEMA_LOCK_RETRIES` | `10` | Expand phase only: total tries, first included, before a lock timeout fails the boot. `1` means no retry. |
| `MIGRATION_END_USER_MESSAGE_RUNNING` | unset | Banner text for end users of released apps while a run is going. Unset: "Scheduled maintenance in progress…". Max 200 characters. |
| `MIGRATION_END_USER_MESSAGE_FAILED` | unset | Same, after a failed run. Unset: "Maintenance is taking longer than expected…". |

Set by ToolJet itself, never by operators: `MIGRATION_PHASE`, `MIGRATION_SKIP_IF_LOCKED`, `MIGRATION_SETUP_COMMAND`.

## Failure modes

The Gate column is for async mode; blocking mode has no gate.

| What happens | Migration | Gate | Cost |
|---|---|---|---|
| Another pod is migrating | Waits, then has nothing to do | Not raised by the waiting pod | As long as the other migration |
| Migrating pod gets SIGTERM/SIGKILL | Rolled back | Lifted when its connection closes | None |
| Migrating pod's node is lost | Rolled back | Lifted after ~60s keepalive | About a minute |
| A migration is broken | Rolled back, runner exits non-zero | Lifted | Fails fast, no retry |
| A pod waits longer than the maximum | Exits non-zero | — | `MIGRATION_LOCK_MAX_WAIT_MINUTES` |
| Expand phase cannot lock a busy table | Rolled back, retried, then exits non-zero | Lifted | Old pods keep serving |
| Async backfill phase fails | Data rolled back, schema stays | `failed`: writes refused | Until a boot reruns it with success |
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

**Known limitation:** the gate works from the *next* async upgrade on. During the deploy that first ships it, the old pods have no gate.

## Invariants

- Take the migration lock **before** reading the pending list.
- Lock sentinels are not work: keep them out of the pending count. The expand and backfill phases do not run them.
- Gate state comes only from connection-held locks and run rows. Never from a flag someone must clear by hand.
- Never refuse a health or metrics endpoint.
- If the gate cannot read the status, it lets the request through.
- An error inside the migration transaction is final; do not wrap the runner in a retry. The one exception: a lock timeout (`55P03`) in the expand phase.
- In async mode only a server boot or the dead-run check starts a run. There is no manual retry.
- All expand migrations run before all backfill migrations, as two `MigrationExecutor` passes. Do not merge the two folders into one DataSource: TypeORM sorts by class-name timestamp, and expand and backfill timestamps interleave.
- Plan enum additions before `announceEachMigration` wraps `up()`; the wrapper hides the source from the scanner.

## Tests

| File | Covers |
|---|---|
| `test/modules/migrations/unit/migration-locks.spec.ts` | Wait interval and maximum, skip-if-locked, lock connection handoff, sentinels left out (checked against files on disk) |
| `test/modules/migrations/unit/migration-mode.spec.ts` | Mode selection (Cloud stays blocking), opt-out, end-user banner text, `blocksAsyncUpgrade`, allowlist names exist |
| `test/modules/app/unit/migration-gate.middleware.spec.ts` | Blocking mode passes everything, gated vs ungated paths, 503 per state, what passes in async mode, opt-out log |
| `test/modules/migrations/e2e/concurrent-migrations.spec.ts` | Three real pods on one database: no crash loop, migration body runs once, active lock only during work and released on SIGKILL, a `NODE_ENV=production` race. Split phases: schema then data, lock-timeout retry and give-up, enum `ADD VALUE` in both phases, boot during a long backfill phase, exit 75 with skip-if-locked, wait behind a locked `migrations` table, single-transaction run for an old database, `statement_timeout=0` on runner connections |
| `test/modules/migrations/unit/migration-authoring-rules.spec.ts` | New migrations: schema only adds, non-empty `down()` |
| `test/modules/migrations/unit/migration-run-log.spec.ts` | Run rebuilt from runner output (both progress formats), redaction, failed step |
| `test/modules/app/e2e/migration-runs.spec.ts` | Auth (401/403), no manual retry route (404), claim races across servers, dead vs live runs, boot reruns a same-version failure, no rerun of a newer release's run, boot start retried, skipped runner records nothing, progress counts in the status, status cache, fail-open |
| `test/modules/migrations/unit/migrate-before-boot.spec.ts` | Blocking mode runs nothing, async runs the expand phase, fresh install runs full setup, a failed expand phase fails boot |
| `test/modules/app/unit/graceful-shutdown.spec.ts` | Shutdown runs once per signal burst, exits 1 past the 20s deadline or when it throws |

The e2e specs run the real `run()` against a scratch database. Fixtures are in `test/modules/migrations/fixtures/`:

- `concurrent-pods/`: the lock sentinels and a slow expand migration (`1790700000001`, after the cutoff).
- `split-phases/`: a schema `ADD VALUE` and a backfill migration that uses it.
- `legacy/`: one pre-cutoff migration.

`pod.ts` loads the sentinels and the migrations of `FIXTURE_SET`, and exits 75 when `run()` returns false. The specs start pods with `process.execPath`, **not** `npx`, because `npx` does not forward SIGKILL and leaves the pod orphaned.
