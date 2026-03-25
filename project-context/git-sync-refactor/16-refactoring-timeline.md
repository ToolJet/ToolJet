# Git-Sync Refactoring Timeline

**Branch:** `feature/git-sync-phase-2.1` | **Date:** 2026-03-11

---

## Phase 1: Move Misplaced Code (git-sync to app-git)

**What:** Move ~340 lines of app-git-only methods from `base-git-util.service.ts` to new `app-git-file-operations.util.ts`. Includes `readAppFromDistributedStructure()` (called by HTTPS, must move with `readAppJson()`). Add pass-through delegations temporarily to avoid breaking callers. Add `manager?: EntityManager` param to `UpdateGitApp` (L365), `updateAppGit` (L382), `createAppGit` (L148) for transaction safety. Note: `normalizeGitTag()` is in HTTPS util, NOT in base-git-util - no move needed. `validateGitProviderConflict()` (L131) stays in base-git-util (shared git-sync method).

**Files:**
- NEW: `server/ee/app-git/shared/app-git-file-operations.util.ts`
- MODIFY: `server/ee/git-sync/base-git-util.service.ts` (remove ~340 lines)
- MODIFY: `server/ee/app-git/providers/github-ssh/util.service.ts` (update imports)
- MODIFY: `server/ee/app-git/providers/github-https/util.service.ts` (update imports)
- MODIFY: `server/ee/app-git/providers/gitlab/util.service.ts` (update imports)
- MODIFY: `server/ee/app-git/providers/github-ssh/service.ts` (update imports)
- MODIFY: `server/ee/app-git/providers/github-https/service.ts` (update imports)
- MODIFY: `server/ee/app-git/providers/gitlab/service.ts` (update imports)
- MODIFY: `server/src/modules/app-git/module.ts` (register new util)

**Estimated time:** ___

---

## Phase 2: Bug Fixes and Normalizations

**What:** 15 fixes across providers to normalize behavior before deduplication.

| # | Fix | Status |
|---|-----|--------|
| 1 | Add `--single-branch` to SSH clone | Confirmed | `ssh/util.service.ts:66` |
| 2 | SSH push: throw errors instead of swallowing | Confirmed | `ssh/util.service.ts:128-129` |
| 3 | Remove duplicated `credential.helper` disable in HTTPS | Confirmed | `https/util.service.ts:264+266` |
| 4 | Unify user name to `(firstName + lastName).trim()` | Confirmed | `https/util.service.ts:227`, `gitlab/util.service.ts:109` |
| 5 | Add empty commit skip to HTTPS and GitLab | Confirmed | `https/util.service.ts:229`, `gitlab/util.service.ts:94` |
| 6 | Use raw commit message everywhere (remove SSH prefix) | Confirmed | `ssh/util.service.ts:91` |
| 7 | Git config cleanup: skip (temp repo deleted anyway) | Confirmed | no-op |
| 8 | Fix `await await` double-await in SSH and GitLab | Confirmed | `ssh/service.ts:160`, `gitlab/service.ts:118` |
| 9 | Fix missing `await` on `createAppGit` in GitLab service | Confirmed | `gitlab/service.ts:137` |
| 10 | Unify timeout to 60s across providers | Confirmed | `ssh/util.service.ts:120-121` (30s currently) |
| 11 | `UpdateGitApp`, `updateAppGit`, `createAppGit` accept optional `manager` param | Confirmed | `app-git-file-operations.util.ts` (after Phase 1) |
| 12 | `pullGitAppChanges`: move `updateAppGit` INSIDE `dbTransactionWrap` | Confirmed | all 3 provider `service.ts` |
| 13 | `pullGitAppChanges`: pass `manager` to `UpdateGitApp` inside wrap | Confirmed | all 3 provider `service.ts` |
| 14 | `createGitApp`: wrap `import()` + `createAppGit()` in single `dbTransactionWrap` | Confirmed | all 3 provider `service.ts` |
| 15 | Fix missing `await` on `createAppGit` in HTTPS util | Confirmed | `https/util.service.ts:400` |

**Files:**
- MODIFY: `server/ee/app-git/providers/github-ssh/util.service.ts`
- MODIFY: `server/ee/app-git/providers/github-https/util.service.ts`
- MODIFY: `server/ee/app-git/providers/gitlab/util.service.ts`
- MODIFY: `server/ee/app-git/providers/github-ssh/service.ts`
- MODIFY: `server/ee/app-git/providers/github-https/service.ts`
- MODIFY: `server/ee/app-git/providers/gitlab/service.ts`
- MODIFY: `server/ee/app-git/shared/app-git-file-operations.util.ts` (from Phase 1)

**Estimated time:** ___

---

## Phase 3: Create Shared Git Operations Util (Layer 2)

**What:** One provider-agnostic implementation of clone/commit/push with unified options (env, SSL, depth, timeout, credential helper).

**Files:**
- NEW: `server/ee/app-git/shared/git-operations.util.ts` (~120-150 lines)
- MODIFY: `server/src/modules/app-git/module.ts` (register)

**Estimated time:** ___

---

## Phase 4: Add Auth Factories (Layer 1)

**What:** Each provider extracts auth setup into `getAuth()` returning uniform `GitAuthResult`. HTTPS uses factory function for token freshness (tokens expire ~1 hour).

**Files:**
- NEW: `server/ee/app-git/shared/auth-factory.interface.ts` (~20 lines)
- MODIFY: `server/ee/app-git/providers/github-ssh/util.service.ts` (add `getAuth()`)
- MODIFY: `server/ee/app-git/providers/github-https/util.service.ts` (add `getAuth()`)
- MODIFY: `server/ee/app-git/providers/gitlab/util.service.ts` (add `getAuth()`)

**Estimated time:** ___

---

## Phase 5: Refactor Provider Util Services

**What:** Replace inline gitClone/gitCommit/gitPush with thin wrappers calling `GitOperationsUtil` + `getAuth()`. Branching methods in HTTPS untouched.

**Files:**
- MODIFY: `server/ee/app-git/providers/github-ssh/util.service.ts` (137 to ~60 lines)
- MODIFY: `server/ee/app-git/providers/github-https/util.service.ts` (git ops 223 to ~30 lines)
- MODIFY: `server/ee/app-git/providers/gitlab/util.service.ts` (137 to ~50 lines)

**Estimated time:** ___

---

## Phase 6: Create Shared Service-Layer Util

**What:** Deduplicate 6 service methods (~85-95% identical across providers) into shared util. Each method uses single `dbTransactionWrap` for all DB ops with shared `EntityManager`.

**Methods:**
1. `checkSyncApp` - test connection, find/create appGit record (read-only)
2. `createGitApp` - clone, readAppJson outside txn; single txn for import + createAppGit
3. `gitPushApp` - clone, write, commit, push outside txn; txn for save lastPushDate
4. `pullGitAppChanges` - clone, read outside txn; single txn for deleteVersion + UpdateGitApp + setupImported + updateEntityRefs + updateAppGit
5. `renameAppOrVersion` - build commit message, call gitPushApp
6. `findAppGitConfigs` - find appGit, strip sensitive key (read-only)

**NOT moved:** `gitPullAppInfo` (too diverged across providers)

**Files:**
- NEW: `server/ee/app-git/shared/app-git-operations.util.ts` (~300-350 lines)
- MODIFY: `server/src/modules/app-git/module.ts` (register)

**Estimated time:** ___

---

## Phase 7: Refactor Provider Services to Delegate

**What:** Replace inline orchestration with 1-line delegations to `AppGitOperationsUtil`. Each provider sets up `ProviderContext` in constructor.

**Files:**
- MODIFY: `server/ee/app-git/providers/github-ssh/service.ts` (433 to ~180 lines)
- MODIFY: `server/ee/app-git/providers/github-https/service.ts` (412 to ~320 lines)
- MODIFY: `server/ee/app-git/providers/gitlab/service.ts` (420 to ~170 lines)

**Estimated time:** ___

---

## Phase 7.5: Remove Pass-Through Delegations

**What:** Remove the 16 temporary pass-through methods from `base-git-util.service.ts` and the `AppGitFileOperationsUtil` constructor injection. By this point Phases 5-7 will have replaced all `this.` calls to inherited methods in HTTPS util, so the pass-throughs are dead code.

**Files:**
- MODIFY: `server/ee/git-sync/base-git-util.service.ts` (remove 16 pass-through methods + constructor injection)

**Estimated time:** ___

---

## Summary

| Phase | New Files | Modified Files | Key Deliverable |
|-------|-----------|----------------|-----------------|
| 1 | 1 | 8 | Move misplaced code, add manager params |
| 2 | 0 | 7 | 15 bug fixes and normalizations |
| 3 | 1 | 1 | Shared clone/commit/push |
| 4 | 1 | 3 | Auth factories per provider |
| 5 | 0 | 3 | Slim provider util services |
| 6 | 1 | 1 | Shared service orchestration with txn safety |
| 7 | 0 | 3 | Slim provider services |
| 7.5 | 0 | 1 | Remove pass-through delegations from base-git-util |
| **Total** | **4** | **~27** | **~470 fewer lines, 1 copy instead of 3** |

## What We're NOT Touching

- Import/export services (git-aware but no git operations)
- 7 stub methods (HTTPS-only branching features)
- `gitPullAppInfo` (stays provider-specific)
- HTTPS-unique methods (fetchTagsForApp, normalizeTagMessage, pullLatestChangesWithBranching)
- Frontend, database/entities
- Version status logic in `setupImportedAppAssociations()` (future branching concern)
