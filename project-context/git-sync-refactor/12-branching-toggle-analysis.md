# Branching Toggle Analysis — OLD vs NEW Architecture

**Branch:** `feature/git-sync-phase-2.1` | **Date:** 2026-03-11

---

## Context

The `isBranchingEnabled` toggle already exists as a column on `organization_git_sync`. This document analyzes the effort required to fully implement the toggle across all 3 providers in the OLD (duplicated) vs NEW (deduplicated) architecture.

---

## 1. Current State of Branching

### Toggle Usage (Today)

The `isBranchingEnabled` flag is only consumed in **2 places**, both in HTTPS `util.service.ts`:

| Location | Method | What It Does |
|----------|--------|--------------|
| `util.service.ts:417-424` | `pullGitAppChanges` | Dispatches to `pullLatestChangesWithBranching` vs `pullGitAppChangesWithoutBranching` |
| `util.service.ts:767-782` | `gitPushApp` | Conditionally adjusts target branch |

### Branching-Related Methods (HTTPS Only)

| Method | File | Lines | Purpose |
|--------|------|-------|---------|
| `getAllBranches` | `util.service.ts` | 1080-1166 (~86 lines) | List remote branches via Octokit API |
| `createBranch` | `util.service.ts` | 1168-1212 (~44 lines) | Create branch via GitHub refs API |
| `deleteGitBranch` | `util.service.ts` | 1214-1242 (~28 lines) | Delete branch via GitHub refs API |
| `getPullRequests` | `util.service.ts` | 996-1078 (~82 lines) | List PRs via Octokit API |
| `createGitTag` | `util.service.ts` | 842-920 (~78 lines) | Create annotated git tag |
| `checkTagExists` | `util.service.ts` | 922-994 (~72 lines) | Check if tag exists remotely |
| `pullLatestChangesWithBranching` | `util.service.ts` | 539-755 (~216 lines) | Full branching pull with conflict resolution |
| `pullGitAppChangesWithoutBranching` | `util.service.ts` | 427-537 (~110 lines) | Legacy pull without branching |

**40% of the HTTPS util file (530 out of 1,320 lines) is branching-specific code.**

### SSH/GitLab Stubs

All 7 branching methods throw `NotFoundException('Method not implemented.')`:
- `getAllBranches`, `getPullRequests`, `createBranch`, `deleteGitBranch`
- `createGitTag`, `getLatestChangesInfo`, `checkTagExists`

### Unguarded Methods

These branching-related methods have **no `isBranchingEnabled` guard**:
- `getAllBranches` — always returns branches even if toggle is off
- `createBranch` — always creates even if toggle is off
- `deleteGitBranch` — always deletes even if toggle is off
- `getPullRequests` — always returns PRs even if toggle is off
- `createGitTag` / `checkTagExists` — always operates even if toggle is off

---

## 2. Interleaved Branching Logic

These methods mix branching and non-branching logic, making toggle implementation harder:

### `gitPullAppInfo` (service.ts:76)
- Clone depth: **100** for branching (needs commit history), **1** without
- Fetches tags via Octokit API (branching feature)
- `readGitHistoryMetadata` receives `branchName` param
- `hasLatestChanges` comparison (branching feature)

### `getLatestChangesInfo` (service.ts:346)
- Same interleaving as `gitPullAppInfo`
- Clone depth dependent on branching

### `gitPushApp` (util.service.ts:757)
- Target branch selection depends on `isBranchingEnabled`, `versionType`, and `allowMasterPush`
- Lines 767-782: conditional branch logic interleaved with push flow

### `pullGitAppChanges` (util.service.ts:417)
- **Cleanly separated** — already has toggle dispatch (good pattern to follow)

---

## 3. OLD Architecture — Adding Branching Toggle

### Phase 1: Complete HTTPS Toggle

Toggle exists but is only checked in 2/~10 methods. Remaining work:

| File | Method | Change |
|------|--------|--------|
| `https/util.service.ts` | `getAllBranches` | Guard: if `!isBranchingEnabled`, return `[]` |
| `https/util.service.ts` | `createBranch` | Guard: if `!isBranchingEnabled`, throw |
| `https/util.service.ts` | `deleteGitBranch` | Guard: if `!isBranchingEnabled`, throw |
| `https/util.service.ts` | `getPullRequests` | Guard: if `!isBranchingEnabled`, return `[]` |
| `https/util.service.ts` | `createGitTag` | Conditional behavior |
| `https/util.service.ts` | `checkTagExists` | Conditional: skip if off |
| `https/service.ts` | `gitPullAppInfo` | Toggle depth (100 vs 1), tag fetching |
| `https/service.ts` | `getLatestChangesInfo` | Toggle depth (100 vs 1), tag fetching |
| `service.ts` (orchestrator) | `getAllBranches` | Guard: skip workspace merge if off |
| `service.ts` (orchestrator) | `createBranch` | Guard: if off, throw |

**Subtotal: ~9-11 touch points across 4 files**

### Phase 2: Extend to SSH

Every branching method must be **reimplemented from scratch**:

| File | Work | Est. Lines |
|------|------|------------|
| `ssh/service.ts` | Implement 7 stub methods with real logic | ~400-500 |
| `ssh/util.service.ts` | New SSH-based branching utilities | ~300-400 |
| `ssh/service.ts` | Add toggle guards to `pullGitAppChanges`, `gitPushApp` | ~35 |

Plus duplicate all toggle guard logic from Phase 1.

### Phase 3: Extend to GitLab

Same as Phase 2 — all stubs replaced, all guards duplicated:

| File | Work | Est. Lines |
|------|------|------------|
| `gitlab/service.ts` | Implement 7 stub methods | ~400-500 |
| `gitlab/util.service.ts` | New GitLab API branching utilities | ~300-400 |

### OLD Architecture Totals

| Metric | Count |
|--------|-------|
| Files touched | **8** |
| Toggle guard implementations | **27-33** (9-11 × 3 providers) |
| Lines of new/modified code | **~1,400-1,800** |
| Duplicated toggle logic | **3×** |
| Risk of drift | **HIGH** |

---

## 4. NEW Architecture — Adding Branching Toggle

### Phase 1: Add Toggle to Shared Base

| File | Change | Touch Points |
|------|--------|-------------|
| `shared/base-app-git.service.ts` | `pullGitAppChanges`: single toggle dispatch | 1 |
| `shared/base-app-git.service.ts` | `gitPushApp`: single branching-aware target branch | 1 |
| `shared/branching.service.ts` | `getAllBranches`, `createBranch`, `deleteGitBranch`: single guard each | 3 |
| `shared/branching.service.ts` | `getPullRequests`, `createGitTag`, `checkTagExists`: single guard each | 3 |
| `service.ts` (orchestrator) | `getAllBranches`, `createBranch`: guard logic | 2 |

**Subtotal: 2-3 files, ~10 touch points, all in one place**

### Phase 2: Extend to SSH

| File | Change | Touch Points |
|------|--------|-------------|
| `ssh/transport.ts` | Implement SSH-specific git operations | Transport only |
| Toggle logic | **Already done** — inherited from shared base | **0** |

### Phase 3: Extend to GitLab

| File | Change | Touch Points |
|------|--------|-------------|
| `gitlab/transport.ts` | Implement GitLab-specific API calls | Transport only |
| Toggle logic | **Already done** — inherited from shared base | **0** |

### NEW Architecture Totals

| Metric | Count |
|--------|-------|
| Files touched | **3-4** |
| Toggle guard implementations | **~10** (once) |
| Lines of new/modified code | **~400-600** |
| Duplicated toggle logic | **1×** |
| Risk of drift | **NONE** |

---

## 5. Comparison Matrix

| Dimension | OLD (Duplicated) | NEW (Deduplicated) | Savings |
|-----------|------------------|--------------------|---------|
| Files touched for full rollout | 8 | 3-4 | **50%** |
| Toggle guard implementations | 27-33 | ~10 | **70%** |
| Lines of code | 1,400-1,800 | 400-600 | **65-70%** |
| Time to extend to new provider | Reimplement all branching + toggle | Transport only | **75% less** |
| Risk of toggle inconsistency | HIGH (3 copies) | NONE (1 source) | **Eliminated** |
| Regression testing surface | 3× (per provider) | 1× + transport | **65% smaller** |
| Bug fix propagation | Patch 3 providers | Patch once | **3× faster** |

---

## 6. Edge Cases

1. **Toggle mid-operation** — if `isBranchingEnabled` flips while `pullLatestChangesWithBranching` (216 lines) is running, partial completion can occur. Toggle should be read once at operation start.

2. **Orphaned branches** — disabling branching after branches exist leaves orphaned branches in Git. Need cleanup strategy or "branching was previously enabled" state.

3. **`gitPushApp` race condition** — interleaved logic checks `isBranchingEnabled` then adjusts `targetBranch`. If toggle changes between read and push, wrong branch targeted.

4. **SSH/GitLab stubs return 404** — if controller endpoints hit for SSH/GitLab before implementation, users get `NotFoundException` instead of "branching not supported for this provider". Toggle should gate at orchestrator level.

---

## 7. Verdict

Deduplicating **before** adding the branching toggle saves ~65-70% code, eliminates cross-provider drift risk, and makes extending branching to SSH/GitLab a transport-only task instead of a full reimplementation.

The longer deduplication is deferred, the more branching logic gets copy-pasted across providers.
