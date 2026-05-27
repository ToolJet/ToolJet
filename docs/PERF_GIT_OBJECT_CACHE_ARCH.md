# Git-Sync Object Cache — Architecture Analysis (read-only)

Repo: `.worktrees/feat_git_object_cache`, ee submodule @ `626c7c8`.
Goal: minimize wall-clock of workspace git-sync ops under horizontally-scaled pods against ONE GitHub repo.

---

## VERDICT (lead)

**Keep A (node-local blobless mirror + isolated reference-clone) as the base, but (1) FIX the broken blob optimization so it becomes effectively D, and (2) add F (repo-affinity routing) for the horizontal-scaling win. Do NOT adopt B (shared persistent working clone) — its commit/push-in-shared-dir model is unsafe enough under the current in-process lock that the marginal local-read win isn't worth it. E (async 202) is orthogonal and worth doing for the user-facing latency on create-branch regardless.**

Why: the real cost is **network/latency-bound** (~57s VPN clone vs ~6s local). A already kills the *history* re-transfer (blobless mirror reused, deltas-only fetch). The remaining network cost is **blobs of `.meta`+`data-sources` re-fetched every op** — exactly what the (currently broken) D-style "keep default-branch blobs in mirror" change was meant to eliminate. Fix that and warm ops do zero blob bytes over the wire for default/feature-from-default branches. F keeps each repo's mirror warm on one pod so N-pod warm-up dilution (mirror rebuilt once *per pod*) collapses to once globally. B's only theoretical advantage over fixed-A is avoiding the per-op reference-clone copy, which is a *local* filesystem cost (cheap) — it does nothing for the network bottleneck while adding serialization + crash-state hazards.

---

## Step 1 — what each flow actually does (cited)

All workspace ops sparse-clone only `['.meta','data-sources']` (push/pull/create) or `[]` (check-updates). Hydrate clones `['.meta']` then expands to one `appPath`. Working dir is a per-op `mkdtemp` that lives only for the request and is `rm -rf`'d in `finally`.

| Flow | File:line | Git work | Mutates? | tmpDir life |
|---|---|---|---|---|
| create-branch | `workspace-branches/service.ts:308` | octokit `createRef` (remote branch, no clone) THEN `cloneWithSparseCheckout(.meta,data-sources)` to hydrate DSV/apps | remote ref via API; clone is READ | per-request |
| push | `service.ts:500` clone; `:517-538` commit + `remote set-url`(token)→`push`→`set-url`(clean) | clone READ, then **commit+push** | yes (push) | per-request |
| pull | `service.ts:604` | sparse clone `.meta,data-sources`, conflict-check, DB import | READ only | per-request |
| check-updates | `service.ts:713` | clone `paths=[]` (no checkout), `git log -1` | READ only | per-request |
| hydrate app | `pull.service.ts:915` | cached sparse clone `.meta`, optional `fetch <tagSha>`, `sparse-checkout add appPath` | READ only | `tj-hydrate-` per-request |

**plainClone fallback** (`service.ts:798`, `pull.service.ts:923`): `clone --branch --single-branch --depth 1 --filter=blob:none --no-checkout` then `sparse-checkout init --cone / set / checkout`. Token via `buildAuthUrl` (in URL), `credential.helper=` disabled.

### Cache path (`cachedSparseClone`, `git-object-cache.service.ts:226`)
1. `ensureMirror` (`:125`) under per-repo lock:
   - first time: `clone --bare --filter=blob:none` (tiny, history-only).
   - default branch (`!hasMirror || branch===def`): `fetch` **without** filter → blobs of default land in mirror (`:143`).
   - non-default branch: `fetch --filter=blob:none` → blobless (`:149`).
2. reference clone (`:245`): `clone --reference <mirror> --dissociate --filter=blob:none --single-branch --branch <b> --no-checkout`, then sparse-checkout.

### THE BUG (confirmed, `:246`)
The reference clone **re-applies `--filter=blob:none`**. Even when the mirror holds default-branch blobs locally, the child clone declares itself a partial clone with a blob filter, so `git checkout` of the sparse paths triggers a **lazy blob fetch from origin over the network** — the "keep blobs local" work in `ensureMirror` (`:140-146`) is wasted. There is also NO `--depth 1` on the reference clone (unlike plainClone), so it pays the full ref-advertisement of ~900 branches + 355 tags every op.

### Concurrency
Lock = in-process `Map<string,Promise>` chain keyed by **mirror path** (`:99-111`). It serializes only `ensureMirror` (mirror fetch). Reference clones run **unserialized** and concurrent (each writes its own tmpDir — safe, no shared state). Two ops on the same repo on the same pod: mirror fetch serialized, clones parallel. **Across pods: NO shared lock at all** — each pod has its own mirror + its own lock. Correctness across pods comes from **fetch-before-use** in `ensureMirror`, not from eviction. Eviction (`git-sync/service.ts:63`) fires only on git-sync **config change**, broadcast via Redis pub/sub (`:61-73`) — NOT on push. That's fine because every op fetches deltas before cloning.

---

## Step 2/3 — scored comparison

Scale: ++ strong / + ok / 0 neutral / - weak / -- bad.

| | git-op time (cold/warm) | multi-pod | concurrency/safety | complexity/LOC/disk | zero-regression + token-safety |
|---|---|---|---|---|---|
| **A current (broken)** | cold: full history+blobs; warm: history local BUT blobs re-fetched (bug) + full ref-ad, +1 round-trip. **net warm ≈ B without the win** | + warms per-pod; correct via fetch-before-use; Redis evict for config | + clones parallel, mirror fetch serialized; push isolated in own tmpDir | + small (~260 LOC), mirror tiny (blobless) | ++ unchanged fallback; token never on disk (extraHeader) |
| **A-fixed = D-effective** (drop child filter on default-reachable; add depth) | cold: 1 full fetch of default blobs into mirror; **warm: ZERO blob bytes, deltas only** | + same warm-per-pod (mitigate w/ F) | + same as A | + ~5-line change; mirror grows by `.meta`+`data-sources` blob size (small, MBs) | ++ same |
| **B reusable working clone** | warm: fully local reads, no child clone copy. BUT still must `fetch` deltas (same network as A-fixed). **No extra network win over A-fixed** | + warm per-pod | **-- commit/push in the SHARED clone**: in-proc lock only serializes same-pod; a crash mid-`reset --hard`/mid-commit leaves dirty state for next op; needs reset+clean+sparse discipline every op; sparse-set churn | - more state, clean-up logic, failure modes; disk = full working tree per repo per pod | + token-safe if same extraHeader; regression risk higher (stateful) |
| **C shared PVC/EFS/NFS** | one global warm-up | ++ no per-pod dilution, one evict | **-- cross-pod FS locking; git+NFS = corruption/`.lock` hazards; pack races** | -- ops, NFS tuning | 0 |
| **D non-blobless mirror + per-op clone** | warm: blobs local (== A-fixed intent) | + per-pod | + like A | + mirror bigger (full blobs incl app content we never read → wasteful vs A-fixed which only keeps default's blobs) | ++ |
| **E async 202 + worker** | doesn't speed git; **removes ~57s from user-facing latency** | inherits underlying arch | needs job store/status; idempotency | + moderate | ++ |
| **F repo-affinity (hash org→pod)** | n/a alone | **++ collapses per-pod warm-up to once-global**; mirror stays hot on owner pod | needs sticky routing / consistent hash at LB or app | + infra-level | ++ |

Notes on the dominant criterion (network, criterion 1): warm-op transfer = **ref-advertisement (~900 branches + 355 tags, the fixed cost git pays before any negotiation) + delta commits since last fetch + blobs not already local**. A-fixed/D drive the blob term to ~0; the ref-ad term is unavoidable on a plain fetch but is *small bytes, latency-bound* — and is paid once per pod per op regardless of arch. `--depth 1` / `--filter` on the *fetch* and a `--no-tags`/refspec-narrowed fetch would shrink the ref-ad — **this, not the clone strategy, is the next network lever.**

---

## The single most important thing to measure over the prod VPN

`GIT_TRACE_PACKET=1 GIT_TRACE2_PERF=1` on one warm op and split the bytes:
**ref-advertisement bytes (≈900 branches+355 tags) vs negotiation round-trips vs tree bytes vs blob bytes**, plus wall-time per phase.
This single trace decides everything: if **blob bytes dominate** → the A-fix (drop child `--filter`) is the whole win. If **ref-ad/round-trips dominate** (likely on a 900-branch repo over VPN) → the clone strategy (A/B/D) is nearly irrelevant and the real fix is narrowing the fetch refspec + `--no-tags` + reducing round-trips (and F to amortize warm-up). Measure before choosing B.

---

## Honest calls

- **Keep A, fix the bug.** The fix is ~5 lines: on the reference clone for a default-reachable branch, drop `--filter=blob:none` (so it's a full clone borrowing the mirror's now-local blobs) and add `--depth 1` to cut ref/history. That turns A into effective-D for the paths we read, with a tiny mirror.
- **Do NOT switch to B.** Its only edge over A-fixed is avoiding a *local* object copy; it gives **no network win** (still must fetch deltas) yet introduces shared-clone commit/push state that the current **in-process** lock cannot protect across pods, and a mid-op crash leaves a dirty tree. Not worth it.
- **Add F** for horizontal scaling — it's the only option that fixes per-pod warm-up dilution without shared-FS corruption risk (C).
- **Add E for create-branch specifically** — see below.
- **C is a trap** (NFS + git locking).

## Flows where git time is IRRELEVANT (DB dominates — caching is pointless there)

- **create-branch**: measured OFF 9.76s → A-warm 7.0–7.4s, of which **~7s is DB** (591 DSV inserts + deserialize in `cloneDataSourceVersions` + `folder_apps` INSERT…SELECT, `service.ts:226-235`). The git clone is a minor slice locally. Optimizing the cache barely moves create-branch; the lever there is **DB batching / E (async 202)**, not git caching. Over the VPN the 57s clone re-enters the picture, so E (move clone off the request path) helps user-facing latency even though it doesn't speed git.
- **check-updates**: `paths=[]`, no checkout, just `git log -1` — pure history; A-fixed already optimal (no blobs).
- **pull / push / hydrate**: genuinely git-network-bound (clone of `.meta`+`data-sources` blobs) → these are where A-fixed's blob-local win actually lands.
