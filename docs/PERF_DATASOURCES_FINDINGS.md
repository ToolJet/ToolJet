# Data-sources page perf — findings & low-hanging fruit

Date: 2026-06-01
Lab: local backend (`:3230`/`:8312`) → staging Azure DB `low-swiggy-db` (VPN), Tempo `:3030`.
Page: `/vamshi-cloned-rep/data-sources`, org `223a711f-7d86-4cd2-b6ae-64d74a169e35`.
Trace: `9c2f458f25206a74adce3229861fe21d` (`GET /api/data-sources/:orgId`, 11.3s).

## Evidence

HAR (page load, 13 endpoints fire concurrently):
- `GET /api/data-sources/:orgId` → **307 KB**, 20s / 11s (two loads)
- `/api/authorize` → 172 KB; `/api/plugins` → 70 KB
- every endpoint 2–12s → 25-conn pool drained by concurrent fan-out

Trace of the 11.3s request:
```
@+0    GET /api/{*path}                 740ms   middleware/auth
@+742  fetchGlobalDataSources (ctrl)  10520ms   guards + service
@+8474   getAll (service work)         2780ms   actual DS logic = last 2.8s
```
40 DB spans:
- **9 transactions** (9 START + 9 COMMIT) = **5.7s** of pure round-trips (VPN). Half the request.
- **2× auth pipeline**: User n=2, Organization n=2, UPDATE user_sessions n=2 (1123ms), UPDATE organizations n=2, session DISTINCT-wrap n=2. **4× UserSessions select.** Guards (`JwtAuthGuard` + `OrganizationValidateGuard` + `FeatureAbilityGuard`) each re-resolve.
- data_source select n=2 (main query + `sampleDataSourceQuery` in `allGlobalDS`).

Staging DB facts (disprove two hypotheses):
- `data_sources` = 2000 rows total, **390 for this org (all `scope=global`)**.
- Filter `org + scope + type` → **Seq Scan, exec 0.314ms**. **Index NOT needed** (table tiny).
- `plugin_id` null for all 390 → `iconFile/manifestFile/operationsFile` joins are no-ops here. Plugin-file over-fetch would only bite marketplace-plugin orgs.

## What actually costs (ranked, evidence-based)

### 1. 307 KB payload = 390 DS × full `options` JSONB — HIGH impact, MED effort
List query returns every column incl. `options` (connection config/creds) for all 390 sources. The left-sidebar list only needs id/name/kind/type/scope/icon. `options` is needed only when a DS is *opened*.
**Fix:** drop `options` (and plugin manifest/operations blobs) from the list query; fetch on DS-detail open. 307 KB → ~20 KB. Network-bound win that survives same-region. Verify FE list doesn't read `options`.

### 2. Concurrent fan-out drains pool — HIGH impact (the real "not snappy")
13 endpoints on page load, each ~40 queries → ~520 queries through 25 conns. Even same-region this serializes. Leverage:
- **Per-request auth memo (Tier A, already planned):** session/user/org/perm resolved 2–4× per request → 1×. Cuts each endpoint ~40→~25 queries. Safe, request-scoped. `docs/PERF_PERMISSION_MEMO_PLAN.md` §A.
- Long-term: bootstrap endpoint (#33) collapses the ×13.

### 3. 9 transactions / request — MED impact (mostly VPN artifact)
5.7s local; ~45ms same-region but still 9 needless txns wrapping single reads. Collapse guard/session/repo `dbTransactionWrap` into 1–2. `PERF_PERMISSION_MEMO_PLAN.md` §C.

### 4. O(n²) raw-row lookup in `allGlobalDS` — LOW effort, LOW-MED impact
`repository.ts`: `rawResults.find(r => r.data_source_id === ds.id)` inside `.map()` over 390 rows ≈ 150k scans (branch/env path only). Build a `Map<data_source_id, rawRow>` once. Trivial.

### 5. Per-request writes ×2 — LOW-MED
`UPDATE user_sessions` (expiry) + `UPDATE organizations.last_accessed_at` write on every request, twice here. `touchLastAccessedAt` already debounces org write; gate the session-expiry write behind a refresh window. `PERF_AUTH_PIPELINE_FINDINGS.md` §Tier1.1.

## Dropped hypotheses (honest)
- ❌ Missing `data_sources(organization_id, scope, type)` index — disproved, 0.3ms seq scan on 2000 rows.
- ❌ Plugin icon/manifest/operations over-fetch — no-op for this org (plugin_id null). Real only for marketplace-plugin orgs; keep in mind, don't ship for this case.

## Recommended order (low-effort high-impact first)
1. **#4** Map lookup — trivial, isolated to `allGlobalDS`.
2. **#1** Defer `options` from list query — biggest payload win, needs FE check.
3. **#2** Per-request auth memo — cuts query count on EVERY endpoint (compounds across the ×13).
4. **#3 / #5** Tx collapse + write throttle — broad but lower per-page impact.
