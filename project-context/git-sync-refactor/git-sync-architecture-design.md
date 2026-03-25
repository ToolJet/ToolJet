# Git Sync Architecture Design

> **Branch:** `refactor/git-sync`
> **Base:** `feat/platform-git-sync`
> **Date:** 2026-03-24
> **Status:** Approved — implementation in progress

---

## Problem Statement

The git sync module has three structural problems that make it hard to extend and maintain:

1. **Split-brain orchestration.** `ExternalApisService` calls `httpsAppGitUtilityService.createGitApp/pullGitAppChanges/gitPushApp` directly, bypassing `AppGitService` and `AppGitOperationsUtil`. This hardcodes HTTPS into the CI/CD integration path.

2. **Branch logic stuck in provider.** `ensureBranchVersion`, `createBranchVersionFromGit`, and `gitSparseClone` are private on `HTTPSAppGitUtilityService`. They contain no HTTPS-specific logic but are inaccessible to the shared orchestration layer.

3. **CE build crash.** `AppGitModule` registers 3 shared utils (`AppGitOperationsUtil`, `AppGitFileOperationsUtil`, `GitOperationsUtil`) via `getProviders()`. The CE stub files at `src/modules/app-git/shared/` do not exist, crashing CE builds at startup.

---

## Architecture Overview

```
AppGitController
      │
      ▼
AppGitService          ExternalApisService
      │                       │
      └──────────┬────────────┘
                 ▼
        AppGitOperationsUtil          ← shared orchestration
        ┌──────────────────┐
        │  ProviderContext  │          ← provider-specific deps injected here
        │  - utilService   │          ← SSH / HTTPS / GitLab util service
        │  - fileOpsUtil   │          ← AppGitFileOperationsUtil
        │  - supportsBranching        ← from existing Phase 2
        │  - defaultBranch  │
        └──────────────────┘
                 │
        GitOperationsUtil             ← pure git mechanics (clone/commit/push/sparseClone)
```

### Provider util services

Each provider util service is responsible for exactly two things:
1. **Auth** — `getAuth(orgGit): Promise<GitAuthResult>` returns a ready-to-use URL + env/ssl opts + cleanup callback
2. **Git transport** — `gitClone`, `gitCommit`, `gitPush` wrappers that unpack auth and call `GitOperationsUtil`

Business logic (branching, version creation, import/export) lives in `AppGitOperationsUtil` and `BranchingBusinessUtil`, not in provider util services.

---

## Key Design Decisions

### 1. `sparseClone` is not on provider util services

`gitSparseClone` (clone only a single app folder) has no provider-specific logic. The sparse flags (`--filter=blob:none --sparse`) are git protocol flags, not transport flags. They work identically over SSH, HTTPS, and GitLab token-URLs.

**Decision:** Add `GitOperationsUtil.sparseClone(targetPath, url, branch, appFolder, opts)` as a 5th method. The caller (`AppGitOperationsUtil.createBranchVersionFromGit`) calls `ctx.utilService.getAuth(orgGit)` to get the URL/env, then calls `this.gitOpsUtil.sparseClone(...)` directly. No `gitSparseClone` method on any provider util service.

```typescript
// In AppGitOperationsUtil.createBranchVersionFromGit():
const auth = await ctx.utilService.getAuth(orgGit);
const url = auth.getAuthUrl ? await auth.getAuthUrl() : auth.url;
try {
  await this.gitOpsUtil.sparseClone(repoPath, url, branch, `apps/${appFolderHint}`, {
    env: auth.env,
    sslDisabled: auth.sslDisabled,
  });
} finally {
  await auth.cleanup();
}
```

### 2. `BranchingStrategy` uses `supportsBranching: boolean` on `ProviderContext` directly

Rather than a separate `BranchingStrategy` interface, the `supportsBranching` field is added directly to `ProviderContext` (covered by existing Phase 2 of REFACTOR_PLAN.md). This is sufficient — SSH and GitLab set `false`, HTTPS sets `true`.

### 3. `ExternalApisService` routes through `AppGitService`

The CI/CD integration path (Jenkins/GitHub Actions triggering git pull/push) must go through `AppGitService` to ensure provider-agnostic dispatch. `HTTPSAppGitUtilityService` is removed from `ExternalApisService` injection.

### 4. CE stubs are empty `@Injectable()` classes

`SubModule.getProviders()` resolves shared utils from `src/modules/app-git/shared/` for CE builds. The 3 stub files export the correct class names as empty `@Injectable()` classes. No logic, no imports beyond NestJS — just enough for DI to not crash.

---

## `GitOperationsUtil.sparseClone()` — Method Spec

```typescript
async sparseClone(
  targetPath: string,
  url: string,              // fully authenticated URL — caller resolves auth
  branch: string,
  appFolder: string,        // path inside repo, e.g. 'apps/my-app'
  opts: Pick<CloneOptions, 'env' | 'sslDisabled'> = {}
): Promise<void>
```

**Behaviour:**
1. If `targetPath` exists, delete it (`rmSync` recursive)
2. Build clone args: `['--filter=blob:none', '--sparse', '--depth', '1', '--no-checkout', '-b', branch]`
3. Prepend `-c http.sslVerify=false` if `opts.sslDisabled`
4. Always append `-c credential.helper=`
5. Apply `opts.env` to the git instance if provided
6. Run `git.clone(url, targetPath, args)`
7. `sparse-checkout init --cone`
8. `sparse-checkout set <appFolder>`
9. `checkout <branch>`

**Caller responsibility:** Resolve auth (call `getAuth()`, extract URL, call `cleanup()` in finally).

---

## `ensureBranchVersion` and `createBranchVersionFromGit` — Where They Move

Both methods move from `HTTPSAppGitUtilityService` (private) to `AppGitOperationsUtil` (private).

They are DB-only operations — no HTTPS-specific code. After the move:

| Call site | Before | After |
|---|---|---|
| `createBranchVersionFromGit` calls git | `this.gitSparseClone(...)` | `this.gitOpsUtil.sparseClone(...)` via `ctx.utilService.getAuth()` |
| `createBranchVersionFromGit` reads app file | `this.appGitFileOpsUtil.resolvedAppName(...)` | `ctx.fileOpsUtil.resolvedAppName(...)` |
| `ensureBranchVersion` creates version | `this.versionUtilService.createVersion(...)` | `this.versionUtilService.createVersion(...)` (unchanged, already injected) |
| `createGitApp` calls `ensureBranchVersion` | `await this.ensureBranchVersion(...)` (HTTPS only) | `if (appMetaBody.workspaceBranchId && ctx.supportsBranching)` → `await this.ensureBranchVersion(..., ctx)` |

---

## ExternalApisService Bypass Fix

**Current (broken):**
```typescript
// ExternalApisService — hardcoded HTTPS
return this.httpsAppGitUtilityService.createGitApp(adminUser, payload);
return this.httpsAppGitUtilityService.pullGitAppChanges(adminUser, payload, appId);
return this.httpsAppGitUtilityService.gitPushApp(adminUser, appGit.id, payload, version);
```

**After fix:**
```typescript
// ExternalApisService — provider-agnostic
return this.appGitService.createGitApp(adminUser, payload);
return this.appGitService.pullGitAppChanges(adminUser, payload, appId);
return this.appGitService.gitPushApp(adminUser, appGit.id, payload, version);
```

`AppGitService` dispatches to the correct provider based on `OrganizationGitSync` configuration (SSH/HTTPS/GitLab), so external API callers automatically get the right provider.

---

## SSH and GitLab Branch Methods

`getAllBranches`, `createBranch`, `deleteGitBranch` on SSH and GitLab services currently throw `Error`. This causes 500s.

**Fix:** Return clean responses:
- `getAllBranches` → `[]`
- `createBranch` / `deleteGitBranch` → throw `BadRequestException('Branch management is not supported for this provider')`

---

## What Does NOT Change

- Provider util service `gitClone`, `gitCommit`, `gitPush` methods
- `getAuth()` signatures on all 3 providers
- `AppGitFileOperationsUtil` (no changes)
- Entity/migration files
- CE/EE split pattern in `SubModule.getProviders()`
- `AppGitOperationsUtil` existing 6 methods (checkSyncApp, createGitApp, gitPushApp, pullGitAppChanges, renameAppOrVersion, findAppGitConfigs)
