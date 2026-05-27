# ToolJet Production Perf Investigation — Session Bootstrap Prompt

Paste this verbatim into a fresh Claude Code session at the start of every perf-debugging session, then append the specific topic you want to drill into.

---

## Problem statement

ToolJet customer (Swiggy) is running EE with **600+ apps and 900+ workspace branches** → `app_versions` table has ~540k rows. Reported pain on production:

- Server slowdowns / OOM kills, especially during git operations (workspace pull, branch create, branch delete).
- Preview mode fails to load on **heavier apps** (modules-heavy): API calls time out.
- Branch delete crashes the pod ("no healthy upstream" / `EADDRINUSE`-style ingress drops).
- General API latency cliff: `/api/apps`, `/api/folder-apps`, `/api/apps/:id`, `/api/workspace-branches/pull`, `/api/workspace-branches/:id` DELETE all p95 ≥ 10s on the staging-clone instance.

Confirmed slow trace (`tooljet-server-refactor-optimisations` service, staging clone):

- Single `GET /api/apps` request → **1.46 min** with 25+ DB spans.
- Inside that: **56s on a TypeORM `SELECT DISTINCT distinctAlias.apps_id` pagination wrapper** + **30s on a `COUNT(DISTINCT(apps.id))`** that rebuilds the heavy join.

Hypothesised root causes (working theory, validate before acting):

1. **N+1 + redundant joins** on the dashboard read path — even after PR #16339, `/api/apps` still calls `getManyAndCount()` on a query that joins `apps + users + app_versions` plus a 2-arm `NOT EXISTS / OR EXISTS` correlated subquery. The `INNER JOIN app_versions` overlaps and contradicts the EXISTS arm.
2. **Missing indexes** — no `app_versions(branch_id)`, no `app_versions(app_id, branch_id)`, no `pages(app_version_id)`, no `data_queries(app_version_id)`. All correlated subqueries and cascade deletes do seq scans on 540k rows.
3. **DB pool contention inside a single req/res** — multiple `dbTransactionWrap` calls per request hold connections; one slow query starves everyone (though current Grafana shows `pending=0`, so this is secondary to query slowness).
4. **No rate limit on `/api/data-queries/:id/run`** — bursts from preview mode can run many queries in parallel, each acquiring its own pool connection.
5. **OOM on git ops** — each `hydrateStubApp` / `pullWorkspace` clones the git repo to a `tmpDir`. With many apps × many branches, concurrent pulls can blow memory + disk.

Reference PR already merged into `main`: **#16339** (CE) + ee-server PR #526. That PR fixed the cascading `/api/apps` dashboard cascade, batched `pullResources`, killed AppVersion subscriber N+1, and made branch delete a bulk DELETE. It did **not** fix:

- `allWithCount` still uses `getManyAndCount()` on a joined QB (the 56s + 30s pair above).
- The redundant `INNER JOIN app_versions` in `applyAppVersionsJoin` for FRONT_END.
- Missing indexes on `app_versions(app_id, branch_id)` etc.
- The `hydrateStubApp` per-app `git clone` cost (sequential for bulk hydration).

## Environment

- **Worktree**: `/Users/akshaysasidharan/code/ToolJet/.worktrees/feat_performance_optimisations`
- **Branch**: `feat/performance-optimisations` off `main`
- **Edition**: `ee`
- **Backend port**: `:3230` — start with `cd <worktree>/server && npm run start:dev`
- **Frontend port**: `:8312` — start with `cd <worktree>/frontend && npm start -- --port 8312`
- **DB**: `tooljet_ee_feat_performance_optimisations` on `localhost:5431` (user `postgres`, password `postgres`)
- **Observability stack** (Docker, already up): `/Users/akshaysasidharan/code/ToolJet/.observability/docker-compose.yml`
  - Grafana: http://localhost:3030 (anon admin, no login)
  - Tempo (traces): `http://localhost:4318` OTLP HTTP receiver
  - Prometheus: http://localhost:9090
  - Dashboard UID `tooljet-monitoring` — synced from prod-staging at http://10.0.223.65:3030/d/tooljet-monitoring
- **OTel env wired in `.env`**: `ENABLE_OTEL=true`, `OTEL_SERVICE_NAME=tooljet-feat-perf`. Filter Grafana traces by `service.name="tooljet-feat-perf"` to isolate this worktree.
- **Prod-cloned DB dump**: `/Users/akshaysasidharan/Downloads/low-swiggy-db-20260526-175036.sql` (577 MB plain SQL, PG14 → PG16 format). Already restored into the worktree DB.
- **Decryption keys** (must match the dump or LOCKBOX rows fail to decrypt):
  - `LOCKBOX_MASTER_KEY=20f449d374354d6036b0fc884b00078c53369f503465e07ad1cf0c48ec4d9d77`
  - `SECRET_KEY_BASE=a04368a57884135658a96fc22b194a3a2a7156508b228a07f2a04ca9e1327d44bee358f62869f6e28be72e646e9cf14a45ae9405246d38f4d1db81b120573ef1`
- **Restored DB row counts** (snapshot at restore time): 2,664 apps · 148,298 app_versions · 553 branches · 11,531 components · 4,195 data_queries · 1,999 data_sources · 11 orgs · 8 users.
- **Biggest org for repro**: `Test's workspace` (`org_id=1032c53c-0c59-49d2-bff6-3d6ad5b66075`, `branch=master id=d2f8564d-eece-42b0-b44d-8a9a49292666`) — 763 apps, 141,629 versions.

## Reference URLs

- Staging-clone dashboard (prod-shape data): http://10.0.223.65:3030/d/tooljet-monitoring/tooljet-monitoring?from=now-24h&to=now&var-service=tooljet-server-refactor-optimisations
- Local dashboard (this worktree): http://localhost:3030/d/tooljet-monitoring/tooljet-monitoring?var-service=tooljet-feat-perf
- Reference PR: https://github.com/ToolJet/ToolJet/pull/16339 (merged into `main`)

## Custom endpoint added in this worktree

`POST /api/workspace-branches/hydrate-all` — bulk-runs `hydrateStubApp` for every stub app on a branch. Returns `{ jobId, appsTargeted }`. Use only when populating local with real git content. **Caveat**: per-app `git clone` makes this slow (~1 app/1.5s). Code in `server/ee/workspace-branches/service.ts` `hydrateAllStubs`.

## Hot endpoints to drill into (priority order)

1. `GET /api/apps` — dashboard read; 86s combined (56s pagination + 30s count) at prod scale.
2. `GET /api/folder-apps` — same cartesian shape, p95 ≥ 10s.
3. `POST /api/workspace-branches/pull` — workspace pull; per-app clone + import; OOM risk.
4. `POST /api/workspace-branches` — branch create; similar clone fan-out.
5. `DELETE /api/workspace-branches/:id` — branch delete; cascade across 540k app_versions without indexes.
6. `GET /api/apps/:id` — single app fetch (preview mode timeouts on heavy modules apps).
7. `POST /api/v2/apps/module/by-correlation/:correlationId` — module resolution; heavy apps fail here.
8. `POST /api/data-queries/:id/run` — needs rate limit.

## Ground rules (carry forward every session)

1. **EXPLAIN ANALYZE before changing any query.** Capture the plan, identify the dominant cost (Seq Scan, Memoize loops, Nested Loop blowup, sort spill), then justify the fix.
2. **Index changes are reversible** but never run them on production from a Claude session. Always wrap as a TypeORM migration; `CREATE INDEX CONCURRENTLY` is the only acceptable form.
3. **Code changes must respect PR #16339** as the baseline — confirm the change being proposed isn't already covered by the merged perf work; check `git log b695d8e43c4e..HEAD` on `main`.
4. **No silent rollback or rewrite of merged perf code.** If something there looks wrong, surface it before editing.
5. **Reproduce locally first.** Don't ship a fix without confirming the slow query / OOM / crash on the cloned-prod DB.
6. **Tracing > guessing.** Pull the trace from Grafana / Tempo before forming a hypothesis. Use the Tempo proxy: `GET http://localhost:3030/api/datasources/proxy/uid/tempo/api/traces/<traceId>`.
7. **Don't touch the dump file or restore it again** without explicit consent — it's the ground truth for prod-shape testing.
8. **`tj-postgres` MCP points to a different DB (`tooljet_ee`).** For the worktree DB, use `psql -h localhost -p 5431 -U postgres -d tooljet_ee_feat_performance_optimisations`.
9. **Write findings before code.** Every session ends with: (a) what query / trace was inspected, (b) measured timing before/after, (c) the smallest change that would move it.

## Session template — append below this line per session

> **Today's focus**: [one of the hot endpoints, or a specific reported customer issue]
>
> **Symptom to reproduce locally**: [Grafana panel link / trace ID / curl command]
>
> **What I want by end of session**: [e.g., EXPLAIN of the slow query + proposed index migration, or a failing repro test, or a memory profile of `pullWorkspace`]
>
> **Don't change**: [anything you want to defer]
