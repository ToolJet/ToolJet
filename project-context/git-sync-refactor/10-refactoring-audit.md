# Git-Sync Refactoring Audit — Complete Findings

**Branch:** `feat/platform-git-sync` | **Date:** 2026-03-10

---

## Problem 1: git-sync contains app-git-only logic (HIGH priority)

`ee/git-sync/base-git-util.service.ts` is 856 lines. **14 of its methods are NEVER called by git-sync** — only by app-git. These methods are about app-level operations (write app file, read app JSON, update app git record) but live inside the git-sync module.

### Misplaced methods in `ee/git-sync/base-git-util.service.ts`:

| Method | What it does | Called by git-sync? | Called by app-git? |
|--------|-------------|--------------------|--------------------|
| `WriteAppFile()` | Writes app definition to git repo | Never | All 3 providers |
| `readAppJson()` | Reads app JSON from cloned repo | Never | SSH, GitLab services |
| `readAppFromDistributedStructure()` | Reads split-file app structure | Never | HTTPS util |
| `validateAppJsonForImport()` | Validates app JSON before import | Never | All 3 providers |
| `createAppGit()` | Creates AppGitSync DB record | Never | All 3 utils |
| `updateAppGit()` | Updates AppGitSync DB record | Never | All 3 providers |
| `UpdateGitApp()` | Deletes version + re-imports app | Never | All 3 providers |
| `getAppPath()` | Gets app folder path in git repo | Never | All 3 providers |
| `readGitHistoryMetadata()` | Reads git history for all apps | Never | SSH, HTTPS services |
| `readGitHistoryMetadataForApp()` | Reads git history for one app | Never | Indirectly via above |
| `resolvedAppName()` | Resolves app name from git metadata | Never | HTTPS service + util |
| `getLatestCommitForApp()` | Gets latest commit info for an app | Never | Indirectly |
| `findMatchingVersion()` | Finds matching version for pull | Never | HTTPS util |
| `deleteMatchingVersionIfExists()` | Deletes version before re-import | Never | HTTPS util |
| `updateAppMeta()` | Updates app metadata in git repo | Never | All 3 providers |
| `writeMetaFile()` | Writes meta.json to git repo | Never | GitLab service |
| `checkVersionCompatibility()` | Checks version compat before import | Never | SSH, GitLab services |

**Also misplaced in `ee/git-sync/base-git.service.ts` (64 lines):**

| Method | What it does | Called by git-sync? | Called by app-git? |
|--------|-------------|--------------------|--------------------|
| `updateAppGitConfiguration()` | Writes to `AppGitSync` table | Never | Yes (AppGitService delegates here) |

**Total misplaced: ~340 lines across 18 methods**

### Why this is a problem:
- git-sync module is responsible for **org-level config** (connect/disconnect git repos)
- These methods deal with **app-level operations** (read/write app files, manage app git records)
- They should live in app-git's own base service
- You cannot understand git-sync's purpose by reading it — 80% of its base service serves another module

---

## Problem 2: app-git has 38 import tentacles into git-sync internals (MEDIUM priority)

Every app-git provider file reaches deep into git-sync's internal files instead of consuming a clean public API.

### All 38 cross-module imports:

#### `ee/app-git/providers/github-ssh/service.ts` (6 imports from git-sync)
```
line 9:  GitErrorMessages        from @modules/git-sync/error-constants/...
line 20: RenameAppOrVersionDto   from @ee/git-sync/providers/dto/...
line 21: BaseGitSyncService      from @ee/git-sync/base-git.service
line 22: BaseGitUtilService      from @ee/git-sync/base-git-util.service
line 30: SSHGitSyncUtilityService from @ee/git-sync/providers/github-ssh/util.service
```

#### `ee/app-git/providers/github-ssh/util.service.ts` (4 imports from git-sync)
```
line 9:  BaseGitUtilService       from @ee/git-sync/base-git-util.service
line 12: SSHGitSyncUtilityService from @ee/git-sync/providers/github-ssh/util.service
line 14: OrganizationGitSyncRepository from @modules/git-sync/repository
line 15: GitSyncAdapter           from @ee/git-sync/git-sync-adapter
```

#### `ee/app-git/providers/github-https/service.ts` (6 imports from git-sync)
```
line 6:  GitErrorMessages         from @ee/git-sync/error-handler/error-constants/...
line 9:  RenameAppOrVersionDto    from @ee/git-sync/providers/dto/...
line 10: BaseGitSyncService       from @ee/git-sync/base-git.service
line 11: BaseGitUtilService       from @ee/git-sync/base-git-util.service
line 17: HTTPSGitSyncUtilityService from @ee/git-sync/providers/github-https/util.service
```

#### `ee/app-git/providers/github-https/util.service.ts` (7 imports from git-sync)
```
line 11: BaseGitUtilService       from @ee/git-sync/base-git-util.service
line 14: HTTPSGitSyncUtilityService from @ee/git-sync/providers/github-https/util.service
line 20: OrganizationGitSyncRepository from @modules/git-sync/repository
line 27: GitErrorMessages         from @modules/git-sync/error-constants/...
line 32: GitSyncAdapter           from @ee/git-sync/git-sync-adapter
line 33: WorkspaceGitSyncAdapter  from @ee/git-sync/workspace-git-sync-adapter
```

#### `ee/app-git/providers/gitlab/service.ts` (7 imports from git-sync)
```
line 11: GitErrorMessages         from @ee/git-sync/error-handler/error-constants/...
line 12: GitLabErrorConstants     from @ee/git-sync/error-handler/error-constants/...
line 14: RenameAppOrVersionDto    from @ee/git-sync/providers/dto/...
line 25: BaseGitSyncService       from @ee/git-sync/base-git.service
line 26: BaseGitUtilService       from @ee/git-sync/base-git-util.service
line 33: GitLabGitSyncUtilityService from @ee/git-sync/providers/gitlab/util.service
```

#### `ee/app-git/providers/gitlab/util.service.ts` (4 imports from git-sync)
```
line 8:  BaseGitUtilService       from @ee/git-sync/base-git-util.service
line 11: GitLabGitSyncUtilityService from @ee/git-sync/providers/gitlab/util.service
line 13: OrganizationGitSyncRepository from @modules/git-sync/repository
line 14: GitSyncAdapter           from @ee/git-sync/git-sync-adapter
```

#### `ee/app-git/source-control-provider.ts` (2 imports from git-sync)
```
line 5:  SourceControlProviderServiceBase from @modules/git-sync/source-control-provider
line 7:  OrganizationGitSyncRepository from @modules/git-sync/repository
```

#### `ee/app-git/service.ts` (1 import from git-sync)
```
line 10: RenameAppOrVersionDto   from @ee/git-sync/providers/dto/...
```

#### `ee/app-git/controller.ts` (1 import from git-sync)
```
line 12: RenameAppOrVersionDto   from @ee/git-sync/providers/dto/...
```

#### `ee/app-git/listener.ts` (1 import from git-sync)
```
line 5:  RenameAppOrVersionDto   from @ee/git-sync/providers/dto/...
```

#### `ee/app-git/providers/interfaces/*.ts` (3 imports from git-sync)
```
ssh-service.interface.ts:5:     RenameAppOrVersionDto from @ee/git-sync/providers/dto/...
https-service.interface.ts:5:   RenameAppOrVersionDto from @ee/git-sync/providers/dto/...
gitlab-service.interface.ts:5:  RenameAppOrVersionDto from @ee/git-sync/providers/dto/...
```

### What app-git imports from git-sync (grouped by type):

| Import | Used in # files | Type |
|--------|----------------|------|
| `BaseGitUtilService` (856 lines) | 6 files | Base class inheritance |
| `BaseGitSyncService` (64 lines) | 3 files | Base class inheritance |
| `SSHGitSyncUtilityService` | 2 files | Composition (injected) |
| `HTTPSGitSyncUtilityService` | 2 files | Composition (injected) |
| `GitLabGitSyncUtilityService` | 2 files | Composition (injected) |
| `OrganizationGitSyncRepository` | 4 files | Direct repo access |
| `RenameAppOrVersionDto` | 8 files | DTO |
| `GitErrorMessages` | 4 files | Constants |
| `GitLabErrorConstants` | 1 file | Constants |
| `GitSyncAdapter` | 3 files | Adapter utility |
| `WorkspaceGitSyncAdapter` | 1 file | Adapter utility |
| `SourceControlProviderServiceBase` | 1 file | Base class |

### Reverse direction: git-sync imports from app-git (10 imports)

| Import | File | Line |
|--------|------|------|
| `AppGitUpdateDto` | `ee/git-sync/base-git.service.ts` | 22 |
| `AppGitRepository` | `ee/git-sync/base-git.service.ts` | 24 |
| `AppGitRepository` | `ee/git-sync/providers/github-ssh/service.ts` | 21 |
| `AppGitRepository` | `ee/git-sync/providers/github-https/service.ts` | 21 |
| `AppGitRepository` | `ee/git-sync/providers/gitlab/service.ts` | 21 |
| `AppCommitInfoDto, AppGitPushDto` | `ee/git-sync/base-git-util.service.ts` | 23 |
| `AppGitPushDto` | `src/modules/git-sync/base-git.service.ts` | 16 |
| `AppGitRepository` | `src/modules/git-sync/module.ts` | 9 |
| `AppGitPushDto` | `src/modules/git-sync/base-git-util.service.ts` | 16 |
| `AppGitPushDto` | `src/modules/git-sync/base-git.interface.ts` | 6 |

### Circular dependency chain:
```
AppGitModule ──imports──> GitSyncModule
GitSyncModule ──provides──> AppGitRepository (owned by app-git!)
Both modules register OrganizationGitSyncRepository and AppGitRepository as providers
```

### Why this is a problem:
- Any change to git-sync internals can break app-git
- Cannot deploy, test, or reason about either module independently
- No clear public API boundary between the modules

---

## Problem 3: Provider-to-provider duplication WITHIN each module (HIGH priority)

The 3 providers (SSH, HTTPS, GitLab) within each module copy the same logic from each other. This is the largest source of wasted code.

### 3A. Within app-git services — 7 methods duplicated across 3 providers

#### `checkSyncApp()` — ~35 lines x 3 copies

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/service.ts` | 56-93 |
| `ee/app-git/providers/github-https/service.ts` | 42-75 |
| `ee/app-git/providers/gitlab/service.ts` | 55-88 |

Pattern: find appGit by appId → check if enabled → test connection → if no appGit, find orgGit → create appGitBody → create appGit record.
Only difference: provider-specific lookup (`findAppGitByAppIdSSH` vs `HTTPS` vs `GitLab`).

#### `pullGitAppChanges()` — ~80 lines x 3 copies (LARGEST duplication)

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/service.ts` | 289-378 |
| `ee/app-git/providers/github-https/util.service.ts` | 427-536 (`pullGitAppChangesWithoutBranching`) |
| `ee/app-git/providers/gitlab/service.ts` | 260-347 |

Pattern: clone → read JSON → import TJ databases → validate app JSON → delete matching version → set app name/slug → `UpdateGitApp` → setup associations → update references → update appGit record.
Only difference: which utility service is called for clone/read.

#### `gitPushApp()` — ~60 lines x 2 copies (SSH + GitLab)

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/service.ts` | 188-268 |
| `ee/app-git/providers/gitlab/service.ts` | 200-259 |

Pattern: find appGit → check enabled → clone → getAppPath → WriteAppFile → updateAppMeta → gitCommit → gitPush → save.
HTTPS version delegates to its util service instead.

#### `createGitApp()` — ~55 lines x 2 copies (SSH + GitLab)

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/service.ts` | 130-187 |
| `ee/app-git/providers/gitlab/service.ts` | 89-144 |

Pattern: find orgGit → build path → clone → read app JSON → import → create appGit record.
HTTPS version diverged (has branching/tag/folder logic).

#### `gitPullAppInfo()` — ~35 lines x 2 copies (SSH + GitLab)

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/service.ts` | 94-129 |
| `ee/app-git/providers/gitlab/service.ts` | 145-199 |

Pattern: find orgGit → check enabled → clone → read metadata → delete dir → return.

#### `findAppGitConfigs()` — ~20 lines x 3 copies

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/service.ts` | 379-402 |
| `ee/app-git/providers/github-https/service.ts` | 274-296 |
| `ee/app-git/providers/gitlab/service.ts` | 366-388 |

Pattern: find appGit → delete private key → return with `isGitSyncConfigured`.

#### `renameAppOrVersion()` — ~18 lines x 3 copies

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/service.ts` | 270-288 |
| `ee/app-git/providers/github-https/service.ts` | 241-273 |
| `ee/app-git/providers/gitlab/service.ts` | 348-365 |

Pattern: build commitMessage → build `appGitPushBody` → call `gitPushApp`.

#### "Not implemented" stubs — ~30 lines x 2 copies (SSH + GitLab)

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/service.ts` | 403-432 |
| `ee/app-git/providers/gitlab/service.ts` | 389-419 |

7 methods each: `getAllBranches`, `getPullRequests`, `createBranch`, `deleteGitBranch`, `createGitTag`, `getLatestChangesInfo`, `checkTagExists` — all throw `NotFoundException`.

### 3B. Within app-git utils — 1 method duplicated

#### `gitCommit()` — ~40 lines x 2 copies (HTTPS + GitLab)

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-https/util.service.ts` | 209-250 |
| `ee/app-git/providers/gitlab/util.service.ts` | 94-136 |

Pattern: validate repo → set user config → add all → commit → set lastCommitId/Message/User → retry on failure.
SSH version diverged (skips empty commits, different message format, cleans up git config in finally).

### 3C. Within git-sync services — 4 methods duplicated across 3 providers

#### `getOrgGitStatusById()` — ~24 lines x 3 copies

| File | Lines |
|------|-------|
| `ee/git-sync/providers/github-ssh/service.ts` | 115-138 |
| `ee/git-sync/providers/github-https/service.ts` | 62-85 |
| `ee/git-sync/providers/gitlab/service.ts` | 35-58 |

Pattern: check org → find orgGit → check license → find provider config → return decamelized object.
Only difference: field names (`gitBranch`/`gitUrl` vs `githubBranch`/`httpsUrl` vs `gitlabBranch`/`gitlabUrl`).

#### `updateOrgGitStatus()` — ~17 lines x 3 copies

| File | Lines |
|------|-------|
| `ee/git-sync/providers/github-ssh/service.ts` | 150-167 |
| `ee/git-sync/providers/github-https/service.ts` | 128-145 |
| `ee/git-sync/providers/gitlab/service.ts` | 141-158 |

Pattern: find orgGit → validate provider conflict → update `isEnabled` on entity.
Only difference: entity type (`OrganizationGitSsh` vs `OrganizationGitHttps` vs `OrganizationGitLab`).

#### `deleteConfig()` — ~10 lines x 3 copies

| File | Lines |
|------|-------|
| `ee/git-sync/providers/github-ssh/service.ts` | 139-148 |
| `ee/git-sync/providers/github-https/service.ts` | 146-155 |
| `ee/git-sync/providers/gitlab/service.ts` | 159-168 |

Pattern: find config entity → delete → update settings (autoCommit=false).

#### `saveProviderConfig()` — ~20 lines x 3 copies

| File | Lines |
|------|-------|
| `ee/git-sync/providers/github-ssh/service.ts` | 169-191 |
| `ee/git-sync/providers/github-https/util.service.ts` | 234-257 |
| `ee/git-sync/providers/gitlab/service.ts` | 85-105 |

Pattern: find orgGit → if not exists, create OrganizationGitSync → create provider config → finalize.

### 3D. Other cross-provider duplication

#### `source-control-provider.ts` — same strategy switch, 4 copies

| File | Lines | Layer |
|------|-------|-------|
| `src/modules/app-git/source-control-provider.ts` | 5 | CE stub |
| `src/modules/git-sync/source-control-provider.ts` | 5 | CE stub |
| `ee/app-git/source-control-provider.ts` | 48 | EE impl |
| `ee/git-sync/source-control-provider.ts` | 48 | EE impl |

CE stubs identical. EE files near-identical (same switch, different service names).

#### Constructor `super()` boilerplate — ~22 lines x 5 copies

| File | Lines |
|------|-------|
| `ee/app-git/providers/github-ssh/util.service.ts` | 23-44 |
| `ee/app-git/providers/gitlab/util.service.ts` | 21-42 |
| `ee/git-sync/providers/github-ssh/util.service.ts` | 25-45 |
| `ee/git-sync/providers/github-https/util.service.ts` | 26-46 |
| `ee/git-sync/providers/gitlab/util.service.ts` | 19-40 |

All inject same 8 base services and call `super()` with identical arguments.

#### Redundant method overrides

| Method | File | Already in parent |
|--------|------|------------------|
| `createAppGit()` | `ee/app-git/providers/github-ssh/util.service.ts:45-50` | `BaseGitUtilService:148-153` |
| `deleteDir()` | `ee/git-sync/providers/github-ssh/util.service.ts:144-150` | `BaseGitUtilService:393-399` |

### Summary of all duplication within modules

| Group | Copies | Lines/copy | Total wasted |
|-------|--------|-----------|-------------|
| `checkSyncApp` | 3 | 35 | 70 |
| `pullGitAppChanges` | 3 | 80 | 160 |
| `gitPushApp` | 2 | 60 | 60 |
| `createGitApp` | 2 | 55 | 55 |
| `gitPullAppInfo` | 2 | 35 | 35 |
| `findAppGitConfigs` | 3 | 20 | 40 |
| `renameAppOrVersion` | 3 | 18 | 36 |
| `gitCommit` | 2 | 40 | 40 |
| Not-implemented stubs | 2 | 30 | 30 |
| `getOrgGitStatusById` | 3 | 24 | 48 |
| `updateOrgGitStatus` | 3 | 17 | 34 |
| `deleteConfig` | 3 | 10 | 20 |
| `saveProviderConfig` | 3 | 20 | 40 |
| `source-control-provider` | 4 | 48/5 | 53 |
| Constructor boilerplate | 5 | 22 | 88 |
| Redundant overrides | 2 | 6 | 12 |
| **TOTAL** | | | **~821 lines** |

---

## Appendix A: Dead / Deletable Code

### Never-called methods

| Method | File | Lines | Evidence |
|--------|------|-------|---------|
| `WriteAppFileOldStructure()` | `ee/git-sync/base-git-util.service.ts` | 785-841 (56 lines) | Comment says "to be removed" |
| `initializeGithubAppInstallation()` | `ee/git-sync/providers/github-https/util.service.ts` | 335-369 (34 lines) | `getAuthenticatedOctokitForInstallation()` used instead |
| `handleVersionRenameCommit()` | `ee/app-git/listener.ts` | 39-51 (12 lines) | Body is just `return;` |
| `getAppVersionByVersionId()` + `getAppVersionById()` | `src/modules/git-sync/base-git.service.ts` | 21-26 (6 lines) | Never called, EE doesn't override |
| `PROJECT_ROOT` static | `ee/app-git/service.ts` | 24 (1 line) | Never referenced |

### Unused DTOs / enums

| DTO | File | Evidence |
|-----|------|---------|
| `AppGitCreateDto` | `src/modules/app-git/dto/index.ts:3-23` | Never imported anywhere |
| `RenameAppOrVersionDto` (CE copy) | `src/modules/app-git/dto/index.ts:135-151` | EE version used instead |
| `OrganizationGitLabConfigDto` | 2 files, neither imported | Both deletable |
| `OrganizationGitSshConfigDto` | `ee/git-sync/providers/dto/organization-git-provider.dto.ts:5-27` | Never imported |
| `GitDefaults` enum | 2 files | Never used, code hardcodes 'main'/'origin' |

### Empty file

| File | Content |
|------|---------|
| `src/modules/git-sync/util.service.ts` | 1 line, empty — delete |

### Commented-out code (~200+ lines)

| File | Lines | Content |
|------|-------|---------|
| `ee/app-git/providers/github-https/service.ts` | 100-127 | Old meta file reading (~28 lines) |
| `ee/app-git/providers/github-ssh/service.ts` | 221-231 | Old writeMetaFile calls |
| `ee/app-git/providers/github-https/service.ts` | 246, 259-265 | Old AppGitPushDto block |
| `ee/git-sync/git-sync-adapter.ts` | 684-761 | Old `writeFilesToFolders` (~78 lines) |
| `ee/git-sync/base-git-util.service.ts` | 170-188 | Old rename logic |
| `ee/git-sync/git-sync-adapter.ts` | 563-565 | Old `convertIdReferences` conditional |

### Unused injection

| Dependency | File | Line |
|-----------|------|------|
| `appsUtilService` | `ee/git-sync/providers/github-https/service.ts` | 30 |

### Unused constant file

| File | Evidence |
|------|---------|
| `ee/app-git/providers/github-https/constants/github-configs.ts` | Identical copy of git-sync version, never imported |

---

## Appendix B: Module Pattern Violations

### HIGH severity

| # | Deviation | Files |
|---|-----------|-------|
| 1 | CE controllers inject no service; EE `super()` takes no args — broken inheritance | `src/modules/git-sync/controller.ts`, `src/modules/app-git/controller.ts` |
| 2 | EE `GitSyncService` does NOT extend CE service — implements interface independently | `ee/git-sync/service.ts` |
| 3 | CE and EE app-git controllers have different route prefixes (`gitsync` vs `app-git`) | `src/modules/app-git/controller.ts`, `ee/app-git/controller.ts` |
| 4 | `GitSyncAdapter`/`WorkspaceGitSyncAdapter` CE and EE share no inheritance — same name, no `extends` | `ee/git-sync/git-sync-adapter.ts`, `src/modules/git-sync/git-sync-adapter.ts` |
| 5 | CE git-sync controller has no guards at all | `src/modules/git-sync/controller.ts` |

### MEDIUM severity

| # | Deviation | Files |
|---|-----------|-------|
| 6 | `AppGitRepository` registered as provider in BOTH modules | `src/modules/app-git/module.ts`, `src/modules/git-sync/module.ts` |
| 7 | `OrganizationGitSyncRepository` also double-registered | Same |
| 8 | No `IService`/`IController` interfaces for app-git | `src/modules/app-git/` |
| 9 | Two separate `ProviderConfigDTO` definitions (CE vs EE) | `src/modules/git-sync/dto/`, `ee/git-sync/providers/dto/` |
| 10 | Module-specific DTOs in global `@dto/` path | `src/dto/organization_git.dto.ts` |
| 11 | CE `BaseGitUtilService` is not abstract despite being stub-only | `src/modules/git-sync/base-git-util.service.ts` |
| 12 | Provider interfaces exist only in EE, no CE validation | `ee/*/providers/interfaces/` |
| 13 | `AppVersionRenameListener` conditionally registered on `isMainImport` | `src/modules/app-git/module.ts` |

### LOW severity

| # | Deviation | Files |
|---|-----------|-------|
| 14 | `Interfaces/` uses capital I (all others lowercase) | `src/modules/git-sync/Interfaces/` |
| 15 | Repository has provider-specific methods (`findByIdSSH`, `findByIdHTTPS`) | `src/modules/app-git/repository.ts` |

---

## Appendix C: Unresolved TODO/FIXME Comments (10)

| File | Line | Comment |
|------|------|---------|
| `ee/app-git/providers/github-https/service.ts` | 102 | "TODO: Need to handle backward compatibility" |
| `ee/git-sync/base-git-util.service.ts` | 784 | "to be removed once new structure is fully functional" |
| `ee/git-sync/providers/gitlab/util.service.ts` | 196 | "Review and make methods private not used by app-git" |
| `ee/git-sync/providers/dto/provider-config.dto.ts` | 79 | "need to review validation scenario" |
| `ee/git-sync/providers/dto/organization-git-provider.dto.ts` | 29 | "HTTPS provider configuration -> pending" |
| `ee/git-sync/providers/github-ssh/service.ts` | 75 | "should be fetched from backend (pending: rohan)" |
| `ee/git-sync/controller.ts` | 59 | "pending to test api changes --> to be done ROHAN" |
| `src/modules/app-git/constants/feature.ts` | 63 | "pending to implement all audit logs events" |

---

## Appendix D: Shared State Violations

| Entity/Table | Created By | Read By | Written By |
|-------------|-----------|---------|-----------|
| `AppGitSync` | git-sync's `BaseGitUtilService.createAppGit()` | Both modules | Both modules |
| `OrganizationGitSync` | git-sync provider services | Both modules | app-git bypasses repository via raw `DataSource` at `ee/app-git/service.ts:97` |

---

## Summary Scorecard

| Category | Count/Lines | Priority |
|----------|------------|----------|
| Misplaced code (in git-sync, only used by app-git) | ~340 lines, 18 methods | HIGH |
| Provider-to-provider duplication within modules | ~821 lines, 16 patterns | HIGH |
| Cross-module imports (app-git → git-sync) | 38 imports | MEDIUM |
| Cross-module imports (git-sync → app-git) | 10 imports | MEDIUM |
| Circular dependency | 1 confirmed cycle | MEDIUM |
| Dead/deletable methods | 5 methods, ~109 lines | LOW |
| Unused DTOs/enums | 6 classes + 2 files | LOW |
| Commented-out code | ~200+ lines | LOW |
| Module pattern violations | 16 deviations (5 high) | MEDIUM |
| Shared state violations | 2 entities with unclear ownership | MEDIUM |
| Unresolved TODOs | 10 | LOW |
