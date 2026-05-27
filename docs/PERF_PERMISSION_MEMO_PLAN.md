# Permission Resolution Memo — Plan

Date: 2026-05-29
Context: every authenticated endpoint re-resolves user permissions. Dashboard = ~15 parallel requests, each pays full resolution. Within a single request there is ALSO redundant repetition (measured below).

## Measured redundancy (single request, tests-workspace, dev@tooljet.io)

`GET /api/apps` — 39 queries:
- 14× tx (START/COMMIT) = 7 separate transactions
- 4× folder_apps (the 4 arms of createUserAppsPermissions — distinct WHERE, NOT dups)
- 3× GroupPermissions role lookup (getUserRole + isBuilder + getAllGroupsOfUser overlap)
- 2× users (findByEmail repeated)
- 2× user_sessions

`GET /api/authorize` — 37 queries: 3× GroupPermissions, 2× users, 2× organizations, 2× user_sessions.

## Two DISTINCT optimizations — do not conflate

### A. Per-request memo (RequestContext) — SAFE, matches existing convention

`RequestContext` is per-HTTP-request. A memo here dedupes repeated identical calls **within one request only**. It does NOT touch the ×15 across dashboard endpoints (those are 15 separate requests → 15 separate RequestContexts).

What it collapses, per request:
- `users` findByEmail 2× → 1
- `getUserRole` 3× → 1 (called in getPermissionDataToAuthorize AND isBuilder)
- `user_sessions` validate 2× → 1
- whole `resourceActionsPermission` result if a request resolves it more than once

Pattern (already used in branch — commit 66856fe, theme/findVersion/getAppEnvironment):

```ts
const PERM_MEMO_KEY = 'tj_user_perms_memo';

#getPermMemo(key: string): UserPermissions | undefined {
  const ctx = RequestContext.currentContext;
  const memo = ctx?.res?.locals?.[PERM_MEMO_KEY] as Record<string, UserPermissions> | undefined;
  return memo?.[key];
}
#setPermMemo(key: string, val: UserPermissions): void {
  const ctx = RequestContext.currentContext;
  if (!ctx?.res) return; // no request scope (worker/job) → skip memo
  const memo = (ctx.res.locals?.[PERM_MEMO_KEY] as Record<string, UserPermissions>) ?? {};
  memo[key] = val;
  RequestContext.setLocals(PERM_MEMO_KEY, memo);
}
```

Apply in `AbilityService.resourceActionsPermission` (ability/service.ts:42):
- key = `${user.id}:${organizationId}:${resources.map(r=>r.resource).sort().join(',')}`
- check memo → return cached; else resolve → setMemo.
- guard against tx-bound manager param (caller owns isolation) — skip memo when manager passed, same as findVersion memo.

Also dedupe `getUserRole`: memo by `${userId}:${orgId}` in RolesRepository, same helper.

Expected: per-endpoint query count drops (role 3→1, users 2→1, perm-resolution dedup). ~5-8 fewer queries/endpoint. ZERO staleness risk — request-scoped, dies with the request.

Effort: ~1 file (ability/service.ts) + optional roles/repository.ts. Low risk.

### B. Cross-request cache — the real ×15 killer, HIGHER RISK

To stop 15 dashboard endpoints each re-resolving the SAME (user, org) permissions, cache the resolved `UserPermissions` OUTSIDE request scope:

- Store: Redis (multi-pod safe) keyed `perms:${userId}:${orgId}`, TTL 30–60s. Or in-process LRU (per-pod, simpler, but each pod cold).
- Read: ability guard checks cache first.
- **Invalidation (the hard part — security-sensitive):** bust the key on ANY change to user's groups / granular permissions / group membership / role / folder permissions / app-in-folder. Miss an invalidation path → user keeps stale (over- or under-) permissions = security bug.

Invalidation trigger points to wire (must be exhaustive):
- group_users add/remove
- granular_permissions + apps/ds/folders_group_permissions CRUD
- group_apps / group_data_sources / group_folders CRUD
- role change
- folder_apps add/remove (affects folder-derived app access)

Expected: 15× resolution → ~1 (first endpoint warms, rest hit cache). Biggest single win for dashboard load.

Risk: stale permissions if invalidation incomplete. TTL bounds blast radius (≤60s). Needs careful audit of every mutation path. NOT a same-day change.

### C. Collapse transactions (orthogonal, easy)

14 tx-stmts/endpoint = 7 transactions, each a round-trip. Many wrap single reads (already partly done in this branch). Audit authorize/session path: pass one manager through getPermissionDataToAuthorize so sub-calls join one tx instead of opening their own. ~7 tx → 1-2.

## Recommendation / order

1. **A (per-request memo)** — safe, fast, matches convention, real intra-request win. Do first.
2. **C (tx collapse)** — easy, orthogonal, cuts round-trips.
3. **B (cross-request cache)** — biggest win but security-sensitive; design invalidation carefully, separate PR, review heavily. The honest ×15 killer.

## Verify

Local VPN wall-time won't move (RTT-bound). Verify by QUERY COUNT per endpoint in Tempo trace before/after:
- A: expect /api/apps 39 → ~31 (role 3→1, users 2→1, session dedup).
- B: expect dashboard total resolution count to collapse across endpoints.
- Real wall-time: staging same-region trace only.
