# PERF — `POST /api/workspace-branches` (Create Branch)

**Trace:** `1d270d0a63aeac766fe4702206b49615` — service `tooljet-staging-debug` — **110,164 ms total**.
Tempo: `http://localhost:3030/api/datasources/proxy/uid/tempo/api/traces/1d270d0a63aeac766fe4702206b49615`

## Verdict

A serial **N+1 round-trip loop** over data sources during the post-create git pull. ~75s of the 110s is data-source work. **Not a query-cost problem — a round-trip-count problem.** Indexes will NOT help.

## Evidence

Span aggregate (400 spans):

| pattern | count | total |
|---|---|---|
| `SELECT "DataSource".*` | 102 | 25.6 s |
| `SELECT "DataSourceVersion".*` | 102 | 25.0 s |
| `UPDATE data_source_versions SET name, is_active, updated_at WHERE id=$1` | 101 | 25.1 s |
| INSERT (clone, bulk) | 4 | 9.1 s |

- `SELECT DataSource` spans: **0 overlapping pairs → fully serial** (confirmed N+1).
- Every DB span median **236 ms ≈ its min** → a fixed **network RTT floor** to a remote DB, not execution time.
- `EXPLAIN ANALYZE` of those exact queries on the worktree DB = **0.3 ms** (seq scan over 1,999 `data_sources`; the unique index `data_source_versions(data_source_id, branch_id)` already covers the DSV lookup). The SQL is fine.
- 211 DS-related queries, **98.6 s wall** — pure serial round-trip latency: ~305 trips × ~236 ms ≈ 72 s.

## Root cause

`server/ee/git-sync/workspace-git-sync-adapter.ts` → `deserializeDataSources()` (~line 586).
The `for (const file of files)` loop issues **3 awaited round-trips per data source**:

1. `findOne(DataSource, { co_relation_id, organizationId, is_dummy:false })`
2. `findOne(DataSourceVersion, { dataSourceId, branchId })`
3. `manager.update(DataSourceVersion, { id }, { name, isActive, updatedAt })` (existing-DSV path)

DSVO writes in the same loop were **already** batched into one `INSERT … ON CONFLICT` (see accumulator comment "collapse ~1038 row writes"). The DS read, the DSV read, and the DSV update were **missed in that same optimization pass**.

## Compounding redundancy

`createBranch` (`server/ee/workspace-branches/service.ts:192`) does the work twice:

1. `cloneDataSourceVersions(sourceBranchId, newBranchId)` — bulk-inserts every source-branch DSV into the new branch (the 4 INSERT spans, fast).
2. then clones the git repo and runs `pullDataSources` → `deserializeDataSources`, which **re-finds and UPDATEs each just-cloned DSV** (the 101× UPDATE path).

The per-DS `contentHash` skip (`if (dsv && metaContentHash && dsv.metaTimestamp === metaContentHash) continue`) **cannot fire** because `cloneDataSourceVersions` never sets `metaTimestamp` on the rows it inserts → every cloned DSV falls through to a redundant UPDATE.

## Fix direction (next session — findings first, no code yet)

1. **Batch the reads.** Before the loop, one `findBy(DataSource, { co_relation_id: In(allCoRelIds), organizationId })` and one `findBy(DataSourceVersion, { branchId })` into maps. Eliminates ~204 serial SELECTs. Same pattern already used for DSVOs in this file.
2. **Batch the writes.** Collapse the 101 per-DS `UPDATE` into a set-based `INSERT … ON CONFLICT (data_source_id, branch_id) DO UPDATE` — mirrors the existing DSVO upsert.
3. **Kill the redundancy.** Set `metaTimestamp` in `cloneDataSourceVersions` so the hash-skip fires and the immediate post-clone pull becomes a near no-op — or skip the DS deserialize entirely when the branch was just clone-seeded (the clone already populated it).

Expected: ~305 serial round-trips → <5 bulk round-trips. 110 s → low single-digit seconds; scales with data-source *count* removed from the latency multiplier.

## Fix applied (N+1 batching)

`server/ee/git-sync/workspace-git-sync-adapter.ts` → `deserializeDataSources()`:

- **Reads batched.** Pre-load all org `DataSource` (maps by co_relation_id / id / kind+type) and all branch `DataSourceVersion` (map by data_source_id) once. Per-DS `findOne(DataSource)` ×3 and `findOne(DataSourceVersion)` replaced by O(1) map gets. Default-branch path pre-loads default DSVs the same way. Maps kept coherent when the cold path creates a DS/default-DSV (guards the `one_default` unique index).
- **Writes batched.** Existing-DSV name refresh → accumulated, flushed as one `UPDATE … FROM (VALUES)` (per-row names differ). New branch DSVs → pre-gen UUID, one chunked bulk `INSERT` (flushed before the DSVO upsert / pulledAt so FKs resolve).
- Result: per-DS read+write trips (`SELECT DS` + `SELECT DSV` + `UPDATE DSV`, ×~100) → 2 reads + 2 writes total. ~305 → ~6 round-trips.

Behavior preserved: lookup priority, contentHash skip, dummy exclusion, name-conflict rename, cold-create path, default-branch DSV sync, DSVO upsert, deactivation sweep all unchanged.

**Verified:** `tsc --noEmit` clean (0 errors); server hot-reloaded healthy.
**Pending:** re-run a create-branch → pull new Tempo trace → confirm DS spans collapse from ~305 to ~6 and total drops from 110 s.

## Verified live (Playwright + Tempo, org `tests-workspace`, 579 data sources)

Source branch `master` has 579 active data sources (5.7× the 102 in the original trace).

| run | result | time | dominant DS cost |
|---|---|---|---|
| original baseline (102 DS) | ok | 110 s | `SELECT DS` ×102 + `SELECT DSV` ×102 + `UPDATE name` ×101 |
| fix #1 only (579 DS) | **FAILED, rolled back** | 172 s | `UPDATE meta_timestamp` ×579 = 171 s |
| **fix #1 + #2 (579 DS)** | **201 Created** | **66 s** | none — DS loop no longer repeats per-row |

After both fixes (trace `860f0aa4…`): `SELECT DataSource` ×13, `SELECT DataSourceVersion` ×9, **zero** per-row `UPDATE name`/`meta_timestamp`. The data-source N+1 is eliminated.

### Second N+1 found during verification (now fixed)

`deserializeDataSources` had a *second* per-row loop after the main one — `dsvHashUpdates`, writing `meta_timestamp` one row at a time, with a comment claiming "a single bulk UPDATE doesn't help here." Wrong: it bulks identically. Invisible in the original 102-DS trace (that meta had no `contentHash`, so the loop was empty), it became the **dominant 171 s cost** at 579 DS and blew the request's timeout → rollback. Fixed with the same `UPDATE … FROM (VALUES)`.

### VPN-free measurement (server repointed to local clone)

The :3230 server was connecting to **remote Azure** (`ee-test-system-new-2.…azure.com/low-swiggy-db`) — every DB span carried ~236 ms VPN RTT. Repointed `.env` to the already-restored local clone (`localhost:5431/tooljet_ee_feat_performance_optimisations`, copied Azure's renewed license into local `instance_settings`) and re-ran:

| run (579 DS, both fixes) | total | DB time | per-query | DB queries |
|---|---|---|---|---|
| Azure (VPN) | 66 s | ~60 s | ~236 ms | 168 |
| **local (no VPN)** | **8.6 s** | **1.45 s** | **1.1 ms** | 168 |

VPN was ~57 s of the 66 s. Two independent multipliers, both removed: the **N+1 fix** cut query *count* (~2,300 → 168), VPN removal cut per-query *latency* (236 ms → 1.1 ms). DB is no longer the bottleneck (1.45 s).

### Remaining bottleneck (out of scope — next target)

VPN-free, **~7 s of the 8.6 s is git, not DB**: `git clone` + sparse-checkout from GitHub, `octokit createRef`, parsing `data-sources/*.json` + app-stub import. Inherent to the feature / GitHub network. DB-side leftovers are minor: 26 `START`/`COMMIT` pairs and `pullApps` inserts.

66 s is now spread, no single DS N+1. Top remaining: **26 `START`/`COMMIT` pairs = ~16 s** of transaction overhead (one tx per pull sub-step / batch) and **`pullApps` stub import** (`INSERT app_versions`/`folders`, ×7 each) for 763 apps. These are git-pull/stub-import concerns, not the data-source path. Round-trip-bound at ~168 queries.

### Test artifacts created (cleanup pending)
- DB branch `perf-verify-n2` (`25b087af-…`) on `tests-workspace` + its remote GitHub ref.
- Possible lingering remote ref `perf-verify-n1` from the failed (rolled-back) run.

## Flow walkthrough + further optimization (eager loading / background jobs)

`createBranch` — `server/ee/workspace-branches/service.ts:192`. VPN-free timeline (trace `641a098e`, 8.6 s):

**Phase A — DB tx1 (~1.3 s, synchronous)**
1. Resolve source branch (explicit `sourceBranchId` or org default).
2. `INSERT organization_git_sync_branches` (the branch row — committed here).
3. `cloneDataSourceVersions` — bulk-copy source-branch DSVs + DSVOs + credentials into the new branch.
4. Copy `folder_apps` from source. COMMIT.

**Phase B — git, ~6.6 s, synchronous, ZERO DB** (the dominant VPN-free cost; one 6.6 s gap at t+1.3 s)
5. `octokit getRef` source HEAD sha → `octokit createRef` (creates the **remote** branch on GitHub).
6. `mkdtemp` + `cloneWithSparseCheckout` — `git clone --depth 1 --filter=blob:none --no-checkout` then sparse-checkout `.meta` + `data-sources` from GitHub.

**Phase C — pull/import (DB + file IO, the rest of the ~1.4 s DB)**
7. `pullDataSources` → `deserializeDataSources` (now batched) — reads `data-sources/*.json`, upserts branch DS/DSV/DSVO.
8. `pullModules` → stub module `App` rows (batched, hash-skip tier-1).
9. `pullApps` → stub app `App` rows (batched, hash-skip tier-1). `rm` tmpdir.

**Phase D** — audit log. On **any** error in B/C: catch → `DELETE` the branch row (rollback) → 400. (This is what bit us: the 172 s run blew a timeout mid-flight → rollback.)

### Eager loading — already mostly done; one real win left
- The ORM N+1 is gone (Phase C preloads DS/DSV/DSVO maps). DB is now 1.46 s — eager loading buys little more there, and **cannot** touch the 6.6 s git phase (that's network, not lazy ORM relations).
- **Real win — kill the clone↔pull redundancy.** Phase A's `cloneDataSourceVersions` already replicates every source DSV into the new branch in-DB. Phase C (7) then re-reads the same data sources from git and re-writes them. On *create-from-source* the DB already has the content, so Phase C/DS is redundant. Two levers:
  1. Set `meta_timestamp` inside `cloneDataSourceVersions` so the per-DS `contentHash` skip in `deserializeDataSources` fires → `pullDataSources` becomes a near no-op.
  2. Better: **don't sparse-checkout `data-sources/` on create at all** — only fetch `.meta` (for the hash columns). Skipping `data-sources` shrinks the blobless clone (579 fewer blobs) → cuts into the 6.6 s, and removes the redundant deserialize entirely. Branch content already came from `cloneDataSourceVersions`.

### Background jobs — yes, recommended
- Phases B+C are slow (6.6 s local; **66 s over the prod-like VPN**), depend on external GitHub (clone + API), and are failure-prone — exactly the profile for async. The synchronous HTTP path already caused a timeout→rollback at scale.
- ToolJet already runs **BullMQ** (the `hydrate-all` endpoint returns a `jobId`; precedent exists).
- Proposed: keep **Phase A synchronous** (create the branch row + return 202 with a `provisioning` status so the UI shows the branch instantly), move **Phases B+C to a worker** with status transitions (`provisioning → ready / failed`) and retries. Removes the HTTP-timeout rollback failure mode and makes perceived create-branch ~1.3 s regardless of repo size / network.
- Caveat: `createRef` (remote branch) in the job means the remote branch appears a beat later; gate the branch as not-yet-usable until the job reports `ready`.

## Git clone optimization (persistent object cache)

**Already optimal — "fetch only the needed branch":** `cloneWithSparseCheckout` already does
`git clone --branch <name> --single-branch --depth 1 --filter=blob:none --no-checkout` + sparse-checkout `.meta`+`data-sources`. One branch, one commit, blobless, two paths. The whole repo / all branches are never pulled. No further gain on the *shape* of the clone.

**Missing — object cache (the real win):** every git flow (`create`, `push`, `pull`, `check-updates`, `hydrate`, app-git listener) does `mkdtemp → full fresh blobless clone → rm`. The object store is re-downloaded from GitHub on every op → that's the 6.6 s. A per-repo persistent cache turns each clone into an incremental fetch.

### Design
- **Per-repo blobless bare mirror** at a stable path: `<cacheRoot>/<orgId>-<repoHash>.git`, created once via `git clone --bare --filter=blob:none <url>`.
- Each op: refresh installation token, then `git -C cache fetch --filter=blob:none origin <branch>` — transfers only missing objects.
- **Materialize working files** with `git -C cache worktree add --no-checkout <tmp> <sha>` + sparse-checkout the needed paths. The worktree shares the cache's object store (no re-copy); `rm` the worktree after — objects stay cached.
- **Prune**: delete cache dirs with mtime > N days (cron or lazy on-access check); periodic `git gc`/repack.

### Why create-branch nearly disappears with a warm cache
The new branch is created via `createRef` from the **source branch HEAD sha** — identical content. If the cache already fetched the source branch, the new branch's objects are **already local**. So after `createRef` there's nothing to download: just `worktree add <sha>` + sparse-checkout locally. **Git phase 6.6 s → <1 s** (only the `getRef`/`createRef` GitHub API calls remain). Combined with skipping `data-sources/` on create (it's already in the DB from `cloneDataSourceVersions`), the git phase is near-zero.

### Caveats (must handle or it breaks)
- **Concurrency**: per-repo lock around `fetch`/`worktree add`; reads run in per-op worktrees so they don't collide.
- **Auth/security**: do NOT persist the token in the cached remote URL (today `buildAuthUrl` bakes it in and the dir is `rm`'d). Set a clean https remote, pass the token per-fetch via ephemeral `-c http.extraHeader="AUTHORIZATION: bearer <token>"` (not written to config). Installation tokens expire ~1 h → refreshed per op anyway.
- **Self-heal**: on any cache error (corruption, partial fetch) → `rm` cache + full clone fallback.
- **Multi-pod (prod k8s)**: cache is node-local `/tmp` → each pod warms its own (still a win). A shared RWX PVC would share across pods but adds locking complexity — start node-local.

### Expected impact (all flows, not just create)
| flow | today (fresh clone) | warm cache |
|---|---|---|
| create-branch git phase | 6.6 s | <1 s (objects already local from source) |
| pull / push / check-updates / hydrate | full clone each | incremental fetch (delta only) |
| first op per repo / post-prune | full clone | full clone (one-time) |

## DONE #1 — clone↔pull redundancy fix (DSV path)

Decision (subagent-vetted, aligns with `feedback_minimize_schema_churn` / `avoid_migrations`): **coerce the dead skip + carry the hash forward**. No migration, no column rename, no skipping deserialize (rejected — deserialize also creates shared DataSource rows, name-conflict rename, default-DSV sync, deactivation sweep, dummy reconcile).

Root cause of the redundancy: `deserializeDataSources`'s per-DS "content unchanged → skip" was **dead code**. `meta_timestamp` is a `numeric` column → node-postgres returns it as a **string**, so `dsv.metaTimestamp === metaContentHash` (string === number) was always false → every DSV re-written on every pull. (Note: the column is misnamed — on the data-source path it stores a truncated-sha256 **content hash**, not a timestamp; the apps/modules path's `metaTimestamp` is a real epoch-ms on a different in-memory shape.)

Changes:
1. `server/ee/app-git/shared/datasource-branch.util.ts:61` — `cloneDataSourceVersions` now carries `metaTimestamp` (the content hash) forward to the new branch's DSVs.
2. `server/ee/git-sync/workspace-git-sync-adapter.ts:824` — coerce: `Number(dsv.metaTimestamp) === metaContentHash`. (Precision-safe: hash is 48 bits, well under `numeric(15)` and `MAX_SAFE_INTEGER`.)

**Verified** (create from an in-sync source branch, hashes match git): redundant Phase-C writes eliminated — `name` 579→**0**, `meta_timestamp` 579→**0**, `pulled_at` 579→**0**, deserialize DSVO upsert 1737→**0**. Branch still fully created (588 DSVs via Phase A clone). ~3,500 redundant row-writes removed per create-branch.

Scope note: the skip fires when the source branch's DSV hashes match the current git content (the normal case — branching from an in-sync branch). If the source DB is stale vs its git sha (e.g. our dump-vs-live-git test on `master`), it safely falls back to the batched write — correct, just not skipped.

### Optional follow-ups (not done)
- Set `metaTimestamp` in `cloneDataSourceVersions` so the per-DS contentHash skip fires and the post-clone pull no-ops the just-cloned DSVs entirely.
- `CREATE INDEX CONCURRENTLY idx_data_source_versions_branch_id ON data_source_versions (branch_id)` — the new batched read filters on `branch_id` alone (currently a 244k-row seq scan, ~10 ms local; grows at prod scale). Also helps branch DELETE cascade.
