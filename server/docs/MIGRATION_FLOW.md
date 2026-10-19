# Migration flow

How ToolJet applies database migrations on boot, and how several pods doing it at once stay out
of each other's way.

**Read this before changing anything under `server/src/migration-helpers/`, the boot path in a
container entrypoint, or the upgrade gate.** The mechanisms here exist because of
specific, reproduced failures; the "Why" notes record what breaks without them.

Conventions for *writing* a migration (schema vs data, enum rules, logging) live in
[`../AGENTS.md`](../AGENTS.md) § Migrations. This file is about *running* them.

---

## 1. Where migrations run from

Every container entrypoint (`docker/ce-entrypoint.sh`, `docker/**/ee-entrypoint.sh`, …) waits for
PostgreSQL and then runs `db:setup` before `exec`ing the server:

```
entrypoint → wait-for-it (PostgreSQL) → npm run db:setup:prod → exec node dist/src/main
                                          │
                                          └── db:create + db:migrate
                                                └── src/migration-helpers/run-all-migrations.ts
```

Two consequences that drive everything below:

- **Every pod runs migrations**, not a dedicated job. A 20-pod deployment starts 20 migrators.
- **The migrator is a standalone process.** It never boots NestJS, so it has no `ConfigService`,
  and no DI. It reads config with `getEnvVars()` and opens its own connections.

> `getEnvVars()` merges the env file **over** `process.env`, so a key defined in `.env` wins over
> an exported shell variable — exporting `PG_HOST=…` does **not** override an `.env` that sets
> it. Keys *absent* from the file fall through from `process.env`, which is how the e2e specs tune
> the gate without editing `.env`.
>
> `NODE_ENV` only selects which file is read (`test` → `../.env.test`, anything else → `../.env`).
> It is **not** load-bearing for any of the coordination below: verified identical behaviour under
> `test`, `development`, `production`, empty and unset, and pinned by a case in
> `concurrent-migrations.spec.ts`. (It *does* change `ormconfig.ts`, which lists **no** migrations
> under `NODE_ENV=test` — which is why the e2e pods inject their own DataSources rather than
> relying on the defaults.)

## 2. Execution model

`run-all-migrations.ts` runs all schema migrations (`server/migrations/`) then all data
migrations (`server/data-migrations/`) through two `MigrationExecutor` passes **sharing one query
runner and one transaction**, so a failing data migration rolls back the schema changes too.

The exception is `ALTER TYPE … ADD VALUE`: PostgreSQL forbids *using* an enum value in the
transaction that added it, so `planEnumAdditions` either pre-commits the value (upgrade) or falls
back to two transactions (fresh install). Full reasoning in `../AGENTS.md` § Migrations.

## 3. Multi-pod coordination

Two advisory locks, both session-scoped: PostgreSQL releases them when the holding connection
ends, so a killed pod cannot leak either one. No TTL, no cleanup path, no Redis.

```
run()
 └── withMigrationAdvisoryLock           ← 3.1  serialises pods cluster-wide (migration lock)
      └── migrateAsSolePod
           ├── realPendingMigrationNames  (sentinels excluded)
           ├── pg_advisory_lock(active)  ← 3.3  only when real work is pending
           └── executeMigrations         ← schema pass + data pass, one transaction
```

| Lock | Key | Held | Read by |
|---|---|---|---|
| Migration lock | `MIGRATION_ADVISORY_LOCK_KEY` | from "what is pending?" to commit, by every migrator in turn | waiting pods; `migration_runs` liveness (§10) |
| Active lock | `MIGRATION_ACTIVE_LOCK_KEY` | while real migrations execute | the upgrade gate (§4) |

### 3.1 Migration lock — the actual serialiser

`withMigrationAdvisoryLock` takes `pg_try_advisory_lock` **before** the pending migration list is
read, and holds it until migrations commit.

**Why, and why the table lock is not enough.** `LockMigrationsTable1/2` take an ACCESS EXCLUSIVE
lock on `migrations`, but they do it *inside* the migration transaction — by which point every
pod has already computed its own pending list. A pod that loses the race wakes up holding a
**stale list** and re-runs a migration the winner just applied. That fails with a catalog error
such as:

```
duplicate key value violates unique constraint "pg_type_typname_nsp_index"
```

which kills the pod. Reproduced by `concurrent-migrations.spec.ts`, which failed exactly this way
before the advisory lock was added.

### 3.2 Waiting — never crash-loop

A pod that finds the lock taken sleeps `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` and tries again
instead of exiting, bounded by `MIGRATION_LOCK_MAX_WAIT_MINUTES` (`0` = wait forever). It never
queries `migrations` while another pod holds it, so no `lock_timeout`/`statement_timeout` can turn
the wait into an error. What an operator sees on a waiting pod:

```
[migrations] Another pod is running migrations. Waited 4s so far; retrying in 2s. This pod will NOT exit.
[migrations] Lock released; got the migration lock after 8s.
```

With `MIGRATION_SKIP_IF_LOCKED=true` (server-managed modes, §10) the pod does not wait: it leaves
the run to the holder and exits with code `75`.

### 3.3 Active lock — only when work is pending

`excludeLockSentinels` drops `LockMigrationsTable1234567890000` / `…891000` from the pending list
first. Exactly one of them is always pending (each deletes the other's row — that is how the
table lock gets taken every boot), so counting them would refuse writes on every ordinary pod
restart and scale-up. A boot with nothing pending never takes the active lock:

```
[migrations] No schema or data migrations pending — not cutting API traffic for this boot.
```

## 4. The upgrade gate

`MigrationGateMiddleware` answers `/api/*` with `503` while `MigrationRunsService.status()` says so.
`status()` reads `HELD_MIGRATION_LOCKS_SQL` (the two locks in `pg_locks`, scoped to the current
database) and, in async and manual mode, the latest `migration_runs` row.

| State | When | Blocking mode | Async / manual mode |
|---|---|---|---|
| `running` | active lock held, or the latest run is running | every API request | writes (`MIGRATION_IN_PROGRESS`) |
| `pending` | manual mode found work and waits | — | writes (`MIGRATION_PENDING`) |
| `failed` | the latest run failed | — | writes (`MIGRATION_FAILED`), until a super admin retries |

**Why a database lock now works where a database row would not:** reading `pg_locks` takes no
lock on `migrations` or any other table, so it answers instantly while a migration holds ACCESS
EXCLUSIVE on `migrations`.

### Response the gate serves

```
HTTP/1.1 503 Service Unavailable
Retry-After: 30

{ "statusCode": 503, "code": "MIGRATION_IN_PROGRESS",
  "message": "ToolJet is being upgraded — database migrations are in progress. Please retry in a few moments.",
  "timestamp": "…", "path": "/api/apps" }
```

### Four properties the middleware must keep

1. **Health and metrics are never gated** (`UNGATED_API_PATHS`). Gating `/api/health` would make
   the orchestrator kill the very pods that are waiting out the upgrade. *Anything added to the
   probe surface must be added to that set.*
2. **Only API routes are gated**, so the SPA shell still loads and can show the upgrade state.
   Subpath installs are handled by `buildApiPrefix(SUB_PATH)`.
3. **It fails open.** A status read error is treated as "no migration running".
4. **It is cheap.** One query per second per pod (`status()` caches 1s, single-flight), on the
   service's own two-connection pool, with rejection logs throttled to one per 30s.

## 5. Environment variables

All optional; defaults are the shipped behaviour. Also listed in `.env.example` § ROLLING UPGRADE.

| Variable | Default | Effect |
|---|---|---|
| `DISABLE_MIGRATION_TRAFFIC_GATE` | `false` | `true` skips the gate entirely — migrations run without refusing traffic. Logged at boot on every serving pod. |
| `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` | `60` | How often a waiting pod retries. |
| `MIGRATION_LOCK_MAX_WAIT_MINUTES` | `30` | How long a pod waits before failing its own boot. `0` waits forever. |
| `MIGRATION_MODE` | `blocking` | `async`: the server boots first and migrates in the background. `manual`: the server boots first and a super admin starts the migration; writes are refused until then. See §10. |

## 6. Failure modes

| Scenario | Migration | Gate | Cost |
|---|---|---|---|
| Another pod migrating | ✅ waits, then no-ops | not raised by the waiter (nothing pending) | length of the other migration |
| Migrating pod gets SIGTERM or SIGKILL | ✗ rolled back | **released** with its connection | none |
| Migration itself is broken | ✗ rolled back, exits non-zero | released | fails fast, no retry |
| Waiting longer than the ceiling | ✗ exits non-zero | — | `MIGRATION_LOCK_MAX_WAIT_MINUTES` |
| Database unreachable from a serving pod | — | fails open | the API is down anyway |

## 7. Operator runbook

**Is a migration running, and where?**

```sql
-- holders of the migration lock (6273975241000) and the active lock (6273975241001)
SELECT (l.classid::bigint << 32) | l.objid::bigint AS key, a.pid, a.client_addr, a.backend_start
FROM pg_locks l JOIN pg_stat_activity a USING (pid)
WHERE l.locktype = 'advisory' AND l.objsubid = 1 AND l.granted;
```

A held lock means a live session is migrating; the gate cannot be "stuck" past that session.
To stop a runaway migration, terminate its backend (`SELECT pg_terminate_backend(<pid>)`): the
transaction rolls back and both locks go.

**Ship an upgrade without refusing traffic:** set `DISABLE_MIGRATION_TRAFFIC_GATE=true`. The
locks and the waiting still apply — only the 503 is skipped.

**Known limitation.** The 503 only takes full effect from the *next* upgrade onward: during the
deploy that first ships the gate, the pods still serving run the old image and have no middleware.

## 8. Tests

| File | Covers |
|---|---|
| `test/modules/migrations/unit/migrations-table-gate.spec.ts` | Waiting interval and ceiling, skip-if-busy, lock session handed to the critical section, sentinel exclusion pinned against the files on disk |
| `test/modules/migrations/unit/migration-status.spec.ts` | Mode selection (Cloud stays blocking), opt-out |
| `test/modules/app/unit/migration-gate.middleware.spec.ts` | Gated vs ungated paths, 503 shape per state, async/manual write allowlist, opt-out logging |
| `test/modules/migrations/e2e/concurrent-migrations.spec.ts` | Three real pods, one database: nobody crash-loops, the migration body runs exactly once, the active lock is held only while work runs and released on SIGKILL. Plus a `NODE_ENV=production` race |
| `test/modules/migrations/unit/migration-run-log.spec.ts` | Server-managed modes: rebuilding a run from runner output (both progress formats), redaction, failed step |
| `test/modules/app/e2e/migration-runs.spec.ts` | Server-managed modes: auth (401/403/409), claims racing across servers, one pending row, dead vs live runs from the lock, no rerun after a failure of the same version, skipped runner records nothing, status cache and fail-open |

The e2e specs drive the real `run()` against a scratch database and a fixture migration set
(`test/modules/migrations/fixtures/concurrent-pods/`), spawning pods as real OS processes via
`process.execPath` — **not** `npx`, which cannot forward SIGKILL and would orphan the pod.

## 9. Invariants to preserve

- Serialise **before** reading the pending list, never after. See 3.1.
- The lock sentinels are not "work". Keep them out of the pending count. See 3.3.
- Gate state comes from session locks and rows, never from something that must be cleared by hand.
- Never gate a health or metrics endpoint.
- The gate fails open, always.
- An error inside the migration transaction is final. Never wrap the run in a retry, and never
  rerun a failed run without a super admin (or a new release). See §10.

## 10. Server-managed modes (`MIGRATION_MODE=async` and `manual`)

Opt-in, env only. For installs where a long migration would outlast a liveness probe, or where an operator wants to choose when it runs.

```
entrypoint: exports MIGRATION_SETUP_COMMAND (the edition's setup), skips running it
main.ts:    fresh install (no DB / no `migrations` table) → run setup, blocking, as before
            otherwise → Nest boots and serves on the OLD schema
MigrationRunsService.start():
  async   → child process = setup command (MIGRATION_SKIP_IF_LOCKED: skip if another server migrates)
  manual  → same child with MIGRATION_CHECK_ONLY=true: lists pending work, runs nothing → run `pending`
            stdout/stderr teed to container logs, parsed into `migration_runs`
```

- **Serving during the run.** New code runs against the old schema until commit; breakage is accepted. The gate (§4) answers mutating requests with 503; reads, login, session, SSO and query runs pass (`ASYNC_MODE_WRITE_ALLOWLIST`). Passing the gate is not the same as being served: the run is one transaction, so a table that a migration has altered stays locked until commit, and requests that read it wait (same as blocking mode during a rolling deploy).
- **Exactly one run.** A unique index allows one `pending` or `running` row across the cluster. A super admin's `POST {prefix}api/migration-runs/run` claims with one conditional write (`pending` → `running`, or a new `running` row after a failure), so a second click on any server gets 409. A claimed child waits for the migration lock rather than skipping it. A boot child that finds the lock taken exits `75` and records nothing.
- **No automatic rerun of a failed migration.** A boot in async mode does not start a run when the latest run of the same version failed; a super admin retries it. A new release (different `to_version`) runs again on boot, and so does a run whose server stopped (killed, scaled down, shut down mid-run): its error reads "The migrating server stopped without reporting a result.", because the migration itself never failed.
- **Dead runs.** A `running` row whose migration lock is free and whose heartbeat is older than 30s lost its server: it reads as `failed` and is marked so before the next claim. While the lock is held the row is alive however old its heartbeat.
- **Cloud.** Always blocking: `TOOLJET_EDITION=cloud` ignores `MIGRATION_MODE`.
- **Workers.** A `WORKER=true` server pauses its BullMQ queue workers from boot while the state is `pending`, `running` or `failed`, and resumes once it is not (checked every 5s): jobs would otherwise run new code against the old schema. Jobs wait in Redis.
- **Untracked migrators.** The active lock wins over the latest row: a server left in blocking mode (a worker with a different env, say) or a manual `db:migrate` reads as `running` and writes are refused while it runs.
- **Stale waiting run.** A manual-mode boot whose check finds nothing pending deletes the `pending` row, in case the migrations were applied another way.
- **Banner.** `GET {prefix}api/migration-status` (public, state only) → frontend `MigrationBanner` for `pending`, `running` and `failed`. In blocking mode it reports `running` while another server holds the active lock.
- **Tracking.** `migration_runs` and `migration_run_logs`, created by the service (not a migration), written on its own `pg` pool so progress shows while the transaction is open and heartbeats stay out of the TypeORM query log. Last 50 runs kept.
- **Progress source.** The runner prints `[migrations] START <name>` / `DONE <name> <ms>`; data migrations' `[PROGRESS] i/total` and `MigrationProgress`'s `<name> Progress N %` give in-migration progress.
- **Logs.** Every kept line goes to `migration_run_logs`, tagged with the migration that was running, and the row keeps the last 200 for the page. Query parameters, emails and connection URLs are removed; TypeORM query lines are dropped unless `ORM_LOGGING` is set. Once a run succeeds, earlier runs' logs are deleted (their rows stay). `GET {prefix}api/migration-runs/:id/log[?migration=<name>]` returns the full log, or one migration's lines.
- **Failure.** Nothing committed; the server keeps serving reads; writes get 503 `MIGRATION_FAILED`. A super admin opens `{prefix}settings/migrations` (typed URL, no menu link) and retries with the same `run` endpoint.
- **Shutdown.** SIGTERM kills the child's process group; the open transaction rolls back.
