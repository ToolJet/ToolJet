# Migration flow

How ToolJet applies database migrations on boot, and how several pods doing it at once stay out
of each other's way.

**Read this before changing anything under `server/src/migration-helpers/`, the boot path in a
container entrypoint, or the `MIGRATION_IN_PROGRESS` gate.** The mechanisms here exist because of
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
  no DI, and no `RedisService`. It reads config with `getEnvVars()` and opens its own connections.

> `getEnvVars()` merges the env file **over** `process.env`, so a key defined in `.env` wins over
> an exported shell variable — exporting `REDIS_HOST=…` does **not** override an `.env` that sets
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

Three layers, in the order a booting pod hits them.

```
run()
 └── withMigrationAdvisoryLock          ← 3.1  serialises pods cluster-wide
      └── migrateAsSolePod
           ├── waitForTurn              ← 3.2  probes the migrations table, retries
           │    └── probeMigrationsTable + realPendingMigrationNames
           ├── MigrationStatusFlag      ← 3.3  raises MIGRATION_IN_PROGRESS (only if work pending)
           └── executeMigrations        ← schema pass + data pass, one transaction
```

### 3.1 Advisory lock — the actual serialiser

`withMigrationAdvisoryLock` takes a session-scoped `pg_try_advisory_lock` **before** the pending
migration list is read, and holds it until migrations commit.

**Why, and why the table lock is not enough.** `LockMigrationsTable1/2` take an ACCESS EXCLUSIVE
lock on `migrations`, but they do it *inside* the migration transaction — by which point every
pod has already computed its own pending list. A pod that loses the race wakes up holding a
**stale list** and re-runs a migration the winner just applied. That fails with a catalog error
such as:

```
duplicate key value violates unique constraint "pg_type_typname_nsp_index"
```

which is *not* a lock error, so it is not retryable, and the pod exits non-zero. Before the
waiting room existed this was invisible: the crash-restart was what fixed it, because a restarted
pod re-reads a fresh list. Reproduced by `concurrent-migrations.spec.ts`, which failed exactly
this way before the advisory lock was added.

PostgreSQL releases an advisory lock when the session ends, so a killed pod cannot leak it — no
TTL, no recovery path.

### 3.2 Waiting room — never crash-loop

`probeMigrationsTable` reads one row from `migrations` under a short lock timeout.
`withLockContentionRetry` retries it every `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` instead of
letting the pod exit.

- **The lock timeout is transaction-local** — `SELECT set_config('lock_timeout', $1, true)`, not
  `SET`. A session-level `SET` rides the pooled connection back out and silently caps the real
  migration's own `LOCK TABLE` at the probe's timeout. Verified: `SHOW lock_timeout` is back to
  `0` after a probe.
- **Only lock/timeout/connection errors retry** (`55P03`, `57014`, `40P01`, `53300`, `08xxx`,
  `ECONNREFUSED`, …, plus `MigrationLockBusyError`). A broken migration still fails the deploy on
  the first attempt. `42P01 undefined_table` means a fresh install, not contention.
- **This layer still matters after 3.1** because a pod running the *previous* release holds the
  table without taking the advisory lock.
- Bounded by `MIGRATION_LOCK_MAX_WAIT_MINUTES` (`0` = wait forever).

What an operator sees on a waiting pod:

```
[migrations] Another pod is running migrations (attempt 3 of acquiring the migration lock was
             refused: Another pod holds the ToolJet migration advisory lock.). Waited 4s so far;
             retrying in 2s. This pod will NOT exit.
[migrations] Lock released — acquiring the migration lock succeeded on attempt 5 after waiting 8s.
```

### 3.3 Upgrade gate — cut API traffic during the upgrade

When **real** migrations are pending, the migrating pod sets `MIGRATION_IN_PROGRESS` in Redis.
Every serving pod's `MigrationGateMiddleware` reads it and answers `/api/*` with `503`.

**Only when work is actually pending.** `excludeLockSentinels` drops
`LockMigrationsTable1234567890000` / `…891000` from the pending list first. Exactly one of them is
always pending (each deletes the other's row — that is how the lock gets taken every boot), so
counting them would answer every ordinary pod restart and scale-up with 503. A boot with nothing
pending never even opens a Redis connection:

```
[migrations] No schema or data migrations pending — not cutting API traffic for this boot.
```

## 4. The `MIGRATION_IN_PROGRESS` contract

| | |
|---|---|
| Key | `MIGRATION_IN_PROGRESS` (Redis) |
| Value | Owner token, `<hostname>:<pid>:<8 hex>` — identifies the migrating pod in logs |
| Set by | `MigrationStatusFlag` (`src/migration-helpers/migration-status-flag.ts`) |
| Read by | `MigrationGateMiddleware` (`src/modules/app/middlewares/migration-gate.middleware.ts`) |
| Means in progress | Key present and not the literal `false` (`isMigrationInProgressValue`) |
| Released by | Lua compare-and-delete on the owner token |
| Backstop | TTL, `MIGRATION_FLAG_TTL_MINUTES` (default 30) |

**Why Redis and not a database row:** the flag must be readable *while* a pod holds an ACCESS
EXCLUSIVE lock on `migrations`. A database-backed flag would be exactly as unreachable as the
thing it describes.

**Why compare-and-delete:** two pods can both decide migrations are pending and both write the
key; the second owns it. A plain `DEL` by the first pod to finish would clear a gate the second
still needs.

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
3. **It fails open.** Any read error — including an uninitialised client — is treated as "no
   migration running". A Redis outage must not take the API down by itself.
4. **It is cheap.** One Redis read per second per pod (1s cache, single-flight), bounded by a
   500ms timeout, with rejection logs throttled to one per 30s.

## 5. Environment variables

All optional; defaults are the shipped behaviour. Also listed in `.env.example` § ROLLING UPGRADE.

| Variable | Default | Effect |
|---|---|---|
| `DISABLE_MIGRATION_TRAFFIC_GATE` | `false` | `true` skips the gate entirely — migrations run without cutting traffic. Logged loudly on both the migrator and every serving pod. |
| `MIGRATION_FLAG_TTL_MINUTES` | `30` | Expiry of the flag — the backstop when a pod is SIGKILLed. Invalid/zero values fall back to the default, so the key is never written without an expiry. |
| `MIGRATION_LOCK_RETRY_INTERVAL_SECONDS` | `60` | How often a waiting pod retries. |
| `MIGRATION_LOCK_MAX_WAIT_MINUTES` | `30` | How long a pod waits before failing its own boot. `0` waits forever. |
| `MIGRATION_LOCK_PROBE_TIMEOUT` | `5s` | PostgreSQL interval for the probe's `lock_timeout`. |
| `MIGRATION_MODE` | `blocking` | `async`: the server boots first and migrates in the background. `manual`: the server boots first and a super admin starts the migration; writes are refused until then. See §10. |

## 6. Failure modes

Measured against a real database and a 1-second migration. **No Redis failure mode fails a
migration** — every Redis call is guarded and timeout-bounded.

| Scenario | Migration | Gate | Cost |
|---|---|---|---|
| Another pod migrating | ✅ waits, then no-ops | not raised (nothing pending) | length of the other migration |
| Pod running the previous release holds the table | ✅ waits on the probe | — | until that pod commits |
| Redis refuses connections | ✅ commits | not raised | ~0.5s |
| Redis black-holed (packets dropped) | ✅ commits | not raised | ~8s |
| Redis DNS does not resolve | ✅ commits | not raised | ~8s |
| `REDIS_PORT` malformed | ✅ commits | not raised | ~0.2s |
| Redis client cannot be constructed | ✅ commits | not raised | none |
| Migrating pod gets SIGTERM | ✗ rolled back | **cleared** by the signal handler | — |
| Migrating pod gets SIGKILL | ✗ rolled back | left set, expires via TTL | ≤ TTL |
| Migration itself is broken | ✗ rolled back, exits non-zero | cleared | fails fast, no retry |
| Waiting longer than the ceiling | ✗ exits non-zero | cleared | `MIGRATION_LOCK_MAX_WAIT_MINUTES` |

> **Why every Redis call is timeout-bounded.** A *refused* connection fails in milliseconds, but a
> black-holed Redis (NetworkPolicy drop, sick node) leaves ioredis retrying against its connect
> timeout. Unbounded, that measured **~41s added to every pod's boot** (~20s each for acquire and
> release) — for a best-effort traffic gate. `withTimeout` (`src/helpers/with-timeout.ts`) caps
> commands at 3s, close at 1s, and the middleware's read at 500ms.

## 7. Operator runbook

**Is an upgrade gate stuck on?**

```bash
redis-cli GET MIGRATION_IN_PROGRESS   # owner token, or (nil)
redis-cli TTL MIGRATION_IN_PROGRESS   # seconds remaining; -1 would mean no expiry (a bug), -2 absent
```

The value names the pod that raised it. Check that pod's logs first — it may legitimately still
be migrating.

**Clear a gate left by a SIGKILLed pod** (or just wait for the TTL):

```bash
redis-cli SET MIGRATION_IN_PROGRESS false    # readers treat the literal "false" as not-in-progress
redis-cli DEL MIGRATION_IN_PROGRESS          # equivalent
```

**A pod is waiting and you need to know on what:**

```sql
-- who holds the migration advisory lock
SELECT a.pid, a.application_name, a.state, a.query_start
FROM pg_locks l JOIN pg_stat_activity a USING (pid)
WHERE l.locktype = 'advisory' AND l.granted;

-- who holds the migrations table
SELECT a.pid, a.query, a.state FROM pg_locks l JOIN pg_stat_activity a USING (pid)
WHERE l.relation = 'migrations'::regclass;
```

**Ship an upgrade without cutting traffic:** set `DISABLE_MIGRATION_TRAFFIC_GATE=true`. The
waiting room and advisory lock still apply — only the 503 is skipped.

**Known limitation.** The 503 only takes full effect from the *next* upgrade onward: during the
deploy that first ships the gate, the pods still serving run the old image and have no middleware.
The crash-loop fix applies immediately, since that runs in the new pods' migrator.

## 8. Tests

| File | Covers |
|---|---|
| `test/modules/migrations/unit/migrations-table-gate.spec.ts` | Error classification, retry/ceiling behaviour, probe SQL, advisory lock, sentinel exclusion pinned against the files on disk |
| `test/modules/migrations/unit/migration-status.spec.ts` | Flag value semantics, TTL parsing, compare-and-delete, Redis-outage tolerance, signal handlers |
| `test/modules/app/unit/migration-gate.middleware.spec.ts` | Gated vs ungated paths, 503 shape, caching/single-flight, fail-open, opt-out logging |
| `test/modules/migrations/e2e/concurrent-migrations.spec.ts` | Three real pods, one database: nobody crash-loops, the migration body runs exactly once, the gate rises and clears. Plus a `NODE_ENV=production` race, so the coordination is never an artifact of test mode |
| `test/modules/migrations/e2e/migration-redis-gate.spec.ts` | Real Redis: writer↔reader agreement, outage tolerance, SIGTERM/SIGKILL leak behaviour, opt-out |
| `test/modules/migrations/unit/migration-run-log.spec.ts` | Async mode: rebuilding a run from runner output (both progress formats), redaction, failed step |
| `test/modules/app/e2e/migration-runs.spec.ts` | Async mode: status/runs/retry auth (401/403/409), stale-heartbeat → failed, one runner per concurrent retry, ordering |

The e2e specs drive the real `run()` against a scratch database and a fixture migration set
(`test/modules/migrations/fixtures/concurrent-pods/`), spawning pods as real OS processes via
`process.execPath` — **not** `npx`, which cannot forward SIGKILL and would orphan the pod. They
use Redis db `15` so a local ToolJet instance is never gated by a test run.

## 9. Invariants to preserve

- Serialise **before** reading the pending list, never after. See 3.1.
- Never set a session-level `lock_timeout`/`statement_timeout` on a pooled connection. See 3.2.
- The lock sentinels are not "work". Keep them out of the pending count. See 3.3.
- Never gate a health or metrics endpoint.
- The gate fails open, always. A Redis problem may cost the gate, never the deploy or the API.
- Every Redis call stays timeout-bounded, construction included.
- The flag is never written without a TTL.
- An error inside the migration transaction is final. Never wrap the run in a retry. See §10.

## 10. Server-managed modes (`MIGRATION_MODE=async` and `manual`)

Opt-in, env only. For installs where a long migration would outlast a liveness probe, or where an operator wants to choose when it runs.

```
entrypoint: exports MIGRATION_SETUP_COMMAND (the edition's setup), skips running it
main.ts:    fresh install (no DB / no `migrations` table) → run setup, blocking, as before
            otherwise → Nest boots and serves on the OLD schema
MigrationRunsService.start():
  async   → child process = setup command (advisory lock, one transaction)
  manual  → same child with MIGRATION_CHECK_ONLY=true: lists pending work, runs nothing → run `pending`
            stdout/stderr teed to container logs, parsed into `migration_runs`
```

- **Serving during the run.** New code runs against the old schema until commit; breakage is accepted. The gate (§3.3) answers mutating requests with 503 `MIGRATION_IN_PROGRESS`; reads, login, session, SSO and query runs pass (`ASYNC_MODE_WRITE_ALLOWLIST`). Passing the gate is not the same as being served: the run is one transaction, so a table that a migration has altered stays locked until commit, and requests that read it wait (same as blocking mode during a rolling deploy).
- **One runner per cluster.** The child skips the run when another server holds the advisory lock (`MIGRATION_SKIP_IF_LOCKED`), so a waiting server never re-runs a run that just failed elsewhere.
- **Cloud.** Always blocking: `TOOLJET_EDITION=cloud` ignores `MIGRATION_MODE`.
- **Manual mode, waiting.** While the latest run is `pending`, the same writes get 503 `MIGRATION_PENDING` (gate reads `MigrationRunsService.status()`, 5s cache, fails open). A super admin starts it from the page: `POST {prefix}api/migration-runs/run` turns the pending row into the running one.
- **Banner.** `GET {prefix}api/migration-status` (public, state only, 5s cache) → frontend `MigrationBanner` for `pending`, `running` and `failed`.
- **Tracking.** `migration_runs` and `migration_run_logs`, created by the service (not a migration), written on its own `pg` pool so progress shows while the transaction is open and heartbeats stay out of the TypeORM query log. Last 50 runs kept. A `running` row without a heartbeat for 30s reads as `failed`; `pending` rows never go stale.
- **Progress source.** The runner prints `[migrations] START <name>` / `DONE <name> <ms>`; data migrations' `[PROGRESS] i/total` and `MigrationProgress`'s `<name> Progress N %` give in-migration progress.
- **Logs.** Every kept line goes to `migration_run_logs`, tagged with the migration that was running, and the row keeps the last 200 for the page. Query parameters, emails and connection URLs are removed; TypeORM query lines are dropped unless `ORM_LOGGING` is set. Once a run succeeds, earlier runs' logs are deleted (their rows stay). `GET {prefix}api/migration-runs/:id/log[?migration=<name>]` returns the full log, or one migration's lines.
- **Failure.** Nothing committed; the server keeps serving; status `failed`. Super admin opens `{prefix}settings/migrations` (typed URL, no menu link) and retries with the same `run` endpoint, which re-spawns the child on that pod and records the new run at once (409 unless the latest run is pending or failed and none is running or claimed).
- **Shutdown.** SIGTERM kills the child's process group; the open transaction rolls back.

