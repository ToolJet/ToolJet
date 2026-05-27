# Per-Request Auth Pipeline — Perf Findings

Date: 2026-05-29
Lab: local backend (`:3230`) pointed at staging Azure DB (`low-swiggy-db`), traced via local Tempo (`:3030`).
Org under test: `Test's workspace` (`1032c53c-…`), user `dev@tooljet.io`, 724 front-end apps.

## TL;DR

The staging login-504 **incident** was infra (exec probe `sh -c curl` forks from big Node heap → OOM exit 137 under node memory-pressure → liveness kill → SIGTERM mid-request). Handed to ops. Durable fix: probe `exec` → `httpGet`.

Separately, a real **perf** problem: every authenticated endpoint pays a heavy shared auth tax. Dashboard load fires ~15 endpoints, each ~40 DB queries. Latency-independent metric (query count) is the target — staging same-region RTT (~5ms) hides it until concurrency drains the 25-conn pool.

## Measured (local, VPN-inflated ms; focus on counts)

| Endpoint | db_q | tx_stmts | DISTINCT wraps | writes |
|---|---|---|---|---|
| GET /api/session | 42 | 18 | 4 | 1 |
| GET /api/workspace-branches | 41 | 20 | 4 | 4 |
| GET /api/folder-apps | 41 | 18 | 4 | 4 |
| GET /api/apps | 39 | 14 | 4 | 2 |
| GET /api/license/apps/limits | 39 | 20 | 4 | 4 |
| GET /api/authorize | 37 | 14 | 4 | 2 |
| GET /api/organizations | 8 | 4 | 1 | 0 |

`tx_stmts` = START+COMMIT count → roughly half = number of separate transactions, each a network round-trip.

## Base per-request tax (runs on EVERY authenticated call)

In `JwtStrategy.validate()` → `SessionUtilService.validateUserSession()` (`session/util.service.ts:513`):

1. `SELECT` user_sessions `findOne` w/ relations `[user, pat]` → emits `SELECT DISTINCT "distinctAlias"` pagination wrapper (LIMIT 1 + joins).
2. `UPDATE user_sessions SET expiry, last_logged_in` — **write on every request** (fire-and-forget `manager.save`).
3. `UPDATE organizations SET last_accessed_at` via `touchLastAccessedAt` — **write on every request**.

Plus in `validate()`:
4. `userRepository.findByEmail(sub, orgId, ACTIVE)` (`jwt.strategy.ts:90`) → user + organizationUsers + organization (relations → another DISTINCT wrap).
5. `findOrganization(orgId)` (`jwt.strategy.ts:96`) → org `findOneOrFail`.

≈ 5–6 queries + 2 writes + 2 tx round-trips **before the controller runs**. ×15 dashboard endpoints ≈ 80 base-tax queries + 30 writes per page load.

## Endpoint-specific tax (ability guards)

Each endpoint's ability guard calls `resourceActionsPermission` → full permission resolution:
- `getAllGroupsOfUser` (group_permissions + groupUsers.group)
- `getUserPermissionsQuery` cartesian: group_permissions INNER JOIN groupUsers, LEFT JOIN granularPermissions → appsGroupPermissions/groupApps, dataSourcesGroupPermission/groupDataSources, foldersGroupPermissions/groupFolders
- `getUserRole` (called twice — once in getPermissionDataToAuthorize, once in `isBuilder`)
- `getUserDetails` (user_details)

This whole block re-runs per endpoint with no per-request memo.

## Fix candidates (ranked by leverage)

### Tier 1 — base tax, hits every request, every endpoint

1. **Throttle the per-request writes.**
   - `UPDATE user_sessions` expiry: only write if expiry within a refresh window (e.g. < 50% of session TTL remaining). Eliminates the write on the vast majority of requests.
   - `UPDATE organizations.last_accessed_at`: already meant to be "at most once per interval" — verify `touchLastAccessedAt` actually debounces (cache last-write per org in memory/Redis). If it writes every call, gate it.
   - Impact: removes ~2 writes × 15 endpoints = ~30 writes/page → lock + WAL pressure gone.

2. **Kill the DISTINCT distinctAlias wrappers.**
   - `validateUserSession` findOne w/ relations → replace relation-join+LIMIT with explicit `where id=sessionId` then separate lookups, or `leftJoinAndSelect` without the pagination wrapper. Same pattern as merged PR #16339 fix.
   - `findByEmail` relations load → same treatment.

3. **Per-request memo for permission resolution.**
   - `resourceActionsPermission` / `getAllGroupsOfUser` / `getUserRole` results are stable within a single HTTP request. Memoize on RequestContext so multiple guards in one request reuse one resolution. (Pattern already used in this branch for theme/findVersion/getAppEnvironment.)
   - Dedupe the double `getUserRole` (getPermissionDataToAuthorize + isBuilder).

### Tier 2 — collapse transactions

4. **Collapse nested `dbTransactionWrap`** in authorize/session paths into a single tx — each START/COMMIT is a round-trip. 14–20 tx_stmts → target 2–4.

### Tier 3 — structural

5. **Bootstrap endpoint** (existing task #33): dashboard fires 15 calls each re-paying base tax. One `/api/bootstrap` returning session+orgs+apps+folders+perms in a single resolved context kills the ×15 multiplier. Big lift, FE coordination.

## Next

- Start Tier 1.1 (write throttle) + 1.3 (per-request perm memo) — lowest risk, highest hit-rate.
- Re-measure same endpoints via Tempo, compare query counts.
