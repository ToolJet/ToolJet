# Git Sync Refactor — Architectural Changes Summary

> **Branch:** `refactor/git-sync`
> **Base:** `feat/platform-git-sync`
> **Completed:** 2026-03-25
> **Phases executed:** 16

---

## The Problem (Before)

Three structural issues made the git sync module hard to extend:

### 1. Everything was stuck inside `HTTPSAppGitUtilityService`

All business logic — branching, version creation, tag management, datasource snapshotting — lived as private methods in one HTTPS-specific service. SSH and GitLab providers couldn't reuse any of it.

### 2. The CI/CD integration path was hardcoded to HTTPS

`ExternalApisService` (the Jenkins/GitHub Actions trigger path) called `HTTPSAppGitUtilityService` directly for `createGitApp`, `pullGitAppChanges`, `gitPushApp`. An SSH or GitLab workspace using external API triggers would silently route through HTTPS logic.

### 3. CE builds crashed at startup

`AppGitModule` loaded 3 shared utils via `getProviders()` but the CE stub files didn't exist. Every CE build failed with a DI resolution error before even starting.

---

## Architecture: Before vs After

### Before

```
ExternalApisService
        │
        ▼ (hardcoded)
HTTPSAppGitUtilityService
        │
        ├── pullGitAppChanges()
        │     ├── pullGitAppChangesWithoutBranching()  ← non-branching path
        │     └── pullLatestChangesWithBranching()     ← branching path
        │           ├── gitSparseClone()               ← private
        │           ├── ensureBranchVersion()          ← private
        │           └── createBranchVersionFromGit()   ← private
        │
        ├── gitPushApp()
        │     ├── computeTargetBranch()   ← inlined
        │     └── shouldUpdateMetadata()  ← inlined
        │
        ├── createGitTag()
        │     ├── normalizeGitTag()               ← private
        │     └── snapshotDataSourcesForVersion() ← private
        │
        └── getAllBranches()
              └── matchBranchesToVersions()  ← inlined (60 lines)


AppGitController
        │
        ▼
AppGitService
        │
        ▼
AppGitOperationsUtil  (shared but incomplete)
        │
        ├── pull → gitClone (non-branching only, no branching dispatch)
        └── push → gitClone (non-branching only, no branching dispatch)

SSHAppGitService    }  each delegated to AppGitOperationsUtil
GitLabAppGitService }  but branching was HTTPS-only, unreachable for SSH/GitLab
```

### After

```
ExternalApisService
        │
        ▼ (provider-agnostic)
SourceControlProviderService
        │
        ├── SSHAppGitService
        ├── HTTPSAppGitService
        └── GitLabAppGitService
              │
              ▼
        AppGitOperationsUtil  (all providers go through here)
              │
              ├── pullGitAppChanges()
              │     ├── [isBranchingEnabled && gitBranchName] ──► BranchingBusinessUtil
              │     │                                              └── orchestrateBranchingPull()
              │     └── [else] non-branching clone path
              │
              ├── gitPushApp()
              │     ├── [isBranchingEnabled] ──► BranchingBusinessUtil
              │     │     ├── computeTargetBranch()
              │     │     └── shouldUpdateMetadataOnPush()
              │     └── [else] non-branching clone path
              │
              └── createGitApp()
                    ├── [workspaceBranchId] ──► ensureBranchVersion()  (private, shared)
                    └── createBranchVersionFromGit()                   (private, shared)
                          └── GitOperationsUtil.sparseClone()


HTTPSAppGitUtilityService  (now: pure GitHub transport only)
        │
        ├── gitClone / gitCommit / gitPush   ← transport
        ├── getAuth()                         ← auth
        ├── checkoutCommitHash()              ← transport
        ├── createGitTag()     ──► BranchingBusinessUtil.buildTagName()
        │                      ──► DataSourceBranchUtil.snapshotDataSourcesForVersion()
        ├── renameGitTag()     ──► BranchingBusinessUtil.normalizeGitTag()
        ├── checkTagExists()   ──► BranchingBusinessUtil.normalizeGitTag()
        └── getAllBranches()   ──► BranchingBusinessUtil.matchBranchesToVersions()


New shared utilities:
        BranchingBusinessUtil       — git branching business logic (provider-agnostic)
        DataSourceBranchUtil        — DataSourceVersion branch lifecycle
        GitOperationsUtil           — pure git mechanics (clone/commit/push/sparseClone)
        AppGitFileOperationsUtil    — file read/write for app JSON
        AppGitOperationsUtil        — orchestration (was already shared, now complete)
```

---

## Key Decisions Explained

### Decision 1: Remove `supportsBranching` flag — use data-driven dispatch

**Before:** `ProviderContext` had `supportsBranching: boolean`. SSH and GitLab were set to `false`, which blocked them from branch-aware pull/push even though git itself supports branching over SSH.

**After:** Dispatch is based on runtime data:
- Pull: `isBranchingEnabled && appMetaBody.gitBranchName`
- Push: `isBranchingEnabled`

`supportsBranching` conflated two concerns:
- **Branch operations** (git clone/push to a named branch) — all providers support this
- **Branch management** (REST API: create/list/delete GitHub branches) — provider-specific

Branch management is handled separately: SSH and GitLab `createBranch`/`deleteGitBranch` throw `BadRequestException('Branch management is not supported for this provider')`. They do not need a flag — they simply don't implement the REST API methods.

### Decision 2: `BranchingBusinessUtil` has zero transport dependencies

`BranchingBusinessUtil` contains only DB operations and business logic. It never touches Octokit, SSH keys, or HTTP clients. This makes it usable by all three providers without any provider-specific wiring.

### Decision 3: `DataSourceBranchUtil` lives in `app-git/shared/`, not `workspace-branches/`

Two methods, two consumers:
- `snapshotDataSourcesForVersion` — called during git push (tag creation) from `HTTPSAppGitUtilityService`
- `cloneDataSourceVersions` — called when creating a workspace branch from `WorkspaceBranchesService`

It is registered in `AppGitModule` and has a CE stub under `src/modules/app-git/shared/`. Placing it in `workspace-branches/` would require `AppGitModule` to import `WorkspaceBranchesModule`, adding cross-module coupling for no benefit. `WorkspaceBranchesService` importing from `AppGitModule` exports is the clean direction of dependency.

### Decision 4: `ExternalApisService` routes through `SourceControlProviderService`

`SourceControlProviderService.getSourceControlService(organizationId)` reads `OrganizationGitSync` and returns the correct provider strategy (SSH/HTTPS/GitLab) based on which is enabled. `ExternalApisService` now uses this for all three git operations. The `findOrgGit(organizationId)` helper was also added to `SourceControlProviderService` to expose the `OrganizationGitSync` entity without going back to `HTTPSAppGitUtilityService`.

### Decision 5: `OrganizationGitSync.isEnabled` getter on the entity

The check `gitSsh?.isEnabled || gitHttps?.isEnabled || gitLab?.isEnabled` was repeated across 5 files. A computed getter on the entity is the right place — the entity knows its own sub-relations and can answer "is any provider active?" without callers knowing the internal structure.

---

## What Each Layer Now Owns

| Layer | Responsibility | Files |
|---|---|---|
| **Provider services** (SSH/HTTPS/GitLab) | Auth, git transport (clone/commit/push), Octokit/SSH calls, provider REST API | `providers/*/service.ts` |
| **Provider util services** | Git transport helpers, `getAuth()`, `checkoutCommitHash`, tag/branch REST API calls | `providers/*/util.service.ts` |
| **AppGitOperationsUtil** | Orchestration: pull/push/create dispatch, sparse clone, version creation | `shared/app-git-operations.util.ts` |
| **BranchingBusinessUtil** | Git branching business logic: tag names, target branch, metadata rules, pull orchestration, branch-version matching | `shared/branching-business.util.ts` |
| **GitOperationsUtil** | Pure git mechanics: clone, commit, push, sparseClone | `shared/git-operations.util.ts` |
| **AppGitFileOperationsUtil** | App JSON file read/write, folder resolution | `shared/app-git-file-operations.util.ts` |
| **DataSourceBranchUtil** | DataSourceVersion branch lifecycle: clone DSVs between branches, snapshot DSVs for a tagged version | `shared/datasource-branch.util.ts` |
| **SourceControlProviderService** | Provider selection by organization config | `source-control-provider.ts` |

---

## Branching Flow: Pull

```
AppGitOperationsUtil.pullGitAppChanges(user, appMetaBody, appId, ctx)
        │
        ├── fetch appGit from DB
        ├── read isBranchingEnabled = appGit.orgGit.isBranchingEnabled
        │
        ├── [isBranchingEnabled && appMetaBody.gitBranchName]
        │         │
        │         ├── targetBranch = appMetaBody.gitBranchName
        │         ├── ctx.utilService.gitClone(path, orgGit, targetBranch)
        │         ├── ctx.utilService.checkoutCommitHash(path, commitHash)
        │         └── BranchingBusinessUtil.orchestrateBranchingPull(...)
        │               ├── read app JSON from sparse clone
        │               ├── import app definition
        │               ├── update AppGit metadata
        │               └── return updated App
        │
        └── [else — non-branching]
                  ├── ctx.utilService.gitClone(path, orgGit)
                  ├── read app JSON
                  ├── import app definition
                  └── return updated App
```

## Branching Flow: Push

```
AppGitOperationsUtil.gitPushApp(appGitPushBody, user, appGitId, version, ctx)
        │
        ├── fetch appGit + organizationGit from DB
        ├── read isBranchingEnabled
        │
        ├── [isBranchingEnabled]
        │         │
        │         ├── BranchingBusinessUtil.computeTargetBranch(...)
        │         │     └── returns: feature branch or default branch
        │         ├── ctx.utilService.gitClone(path, orgGit, targetBranch)
        │         ├── write app JSON to cloned repo
        │         ├── ctx.utilService.gitCommit(...)
        │         ├── ctx.utilService.gitPush(...)
        │         └── BranchingBusinessUtil.shouldUpdateMetadataOnPush(targetBranch, defaultBranch)
        │               ├── [true]  → save lastPushDate, gitVersionName, gitVersionId
        │               └── [false] → skip metadata update (feature branch push)
        │
        └── [else — non-branching]
                  ├── ctx.utilService.gitClone(path, orgGit)
                  ├── write app JSON
                  ├── commit + push
                  └── always save lastPushDate
```

---

## Lines Removed from `HTTPSAppGitUtilityService`

| Removed method | Lines | Moved to |
|---|---|---|
| `pullGitAppChanges` | ~10 | deleted (dead after Phase 4) |
| `pullGitAppChangesWithoutBranching` | ~110 | deleted (replicated in shared ops) |
| `pullLatestChangesWithBranching` | ~224 | `BranchingBusinessUtil.orchestrateBranchingPull` |
| `gitPushApp` | ~87 | deleted (shared ops handles both paths) |
| `snapshotDataSourcesForVersion` | ~35 | `DataSourceBranchUtil` |
| `gitSparseClone` | ~25 | `GitOperationsUtil.sparseClone` |
| `ensureBranchVersion` | ~45 | `AppGitOperationsUtil` |
| `createBranchVersionFromGit` | ~75 | `AppGitOperationsUtil` |
| **Total** | **~611 lines** | |

`HTTPSAppGitUtilityService` reduced from ~1276 lines to ~665 lines (~48% smaller).

---

## CE/EE Split After Refactor

```
src/modules/app-git/shared/          ← CE stubs (empty @Injectable classes)
    app-git-operations.util.ts
    app-git-file-operations.util.ts
    git-operations.util.ts
    branching-business.util.ts
    datasource-branch.util.ts

ee/app-git/shared/                   ← EE implementations
    app-git-operations.util.ts       ← full orchestration
    app-git-file-operations.util.ts  ← full file ops
    git-operations.util.ts           ← full git mechanics
    branching-business.util.ts       ← full branching logic
    datasource-branch.util.ts        ← full DSV lifecycle

AppGitModule (src/modules/app-git/module.ts)
    getProviders() resolves EE impl in EE builds, CE stub in CE builds
    same DI token → same injection point → zero code difference at call sites
```
