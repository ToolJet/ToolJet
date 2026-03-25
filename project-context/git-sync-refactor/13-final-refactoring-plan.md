# Git-Sync Final Refactoring Plan

**Branch:** `feature/git-sync-phase-2.1` | **Date:** 2026-03-11

---

## Scope

### What We're Doing
1. Move app-git-only functions from git-sync module → app-git module
2. Bug fixes & normalizations across providers
3. 2-layer approach: Auth factories + shared git operations for duplicated util methods
4. Deduplicate 6 service-layer orchestration methods

### What We're Skipping
- Import/export services (no changes needed — git-aware but provider-agnostic)
- 7 stub methods (HTTPS-only branching features — leave as-is)
- `gitPullAppInfo` (too diverged across providers — leave provider-specific)
- Version status logic in `setupImportedAppAssociations()` (future branching toggle concern)

---

## Commit 1: Move Misplaced Code (git-sync → app-git)

### Problem
`server/ee/git-sync/base-git-util.service.ts` contains ~340 lines of methods that are **only called by app-git**, never by git-sync. This creates cross-module coupling — app-git has 38 tentacles reaching into git-sync internals.

### New File
`server/ee/app-git/shared/app-git-file-operations.util.ts` (~340 lines)

### Methods to Move

| Method | Current Location (base-git-util.service.ts) | What It Does |
|--------|---------------------------------------------|-------------|
| `readAppJson()` | lines 76-113 | Reads app JSON from cloned repo |
| `validateAppJsonForImport()` | lines 115-152 | Schema validation for import |
| `WriteAppFile()` | lines 154-209 | Exports app → writes JSON files to repo |
| `updateAppMeta()` | lines 212-242 | Writes `.app-meta.json` in repo root |
| `getAppPath()` | lines 244-324 | Resolves folder path in repo (handles co_relation_id) |
| `writeMetaFile()` | lines 326-352 | Writes `.meta/meta.json` (legacy format) |
| `UpdateGitApp()` | lines 354-369 | Updates app entity in DB with new definition |
| `updateAppGit()` | lines 371-380 | Updates AppGitSync record in DB |
| `readGitHistoryMetadata()` | lines 624-786 | Reads git-history folders for UI metadata |
| `readGitHistoryMetadataForApp()` | lines 468-622 | Helper for readGitHistoryMetadata |
| `WriteAppFileOldStructure()` | lines 785+ | Legacy write (old folder format) |
| `resolvedAppName()` | TBD | Resolves app name from co_relation_id |
| `checkVersionCompatibility()` | TBD | Validates tooljet version compatibility |
| `normalizeGitTag()` | TBD | Normalizes tag name for git |
| `createAppGit()` | duplicated in ssh/util + https/util | Creates AppGitSync record in DB |

### Changes to Existing Files
- `server/ee/git-sync/base-git-util.service.ts` — Remove ~340 lines
- All 3 provider util services — Update imports to use new shared util
- All 3 provider services — Update imports

### Verification
- All existing callers of these methods continue to work
- git-sync module has no broken references
- app-git module correctly resolves the new shared util

---

## Commit 2: Bug Fixes & Normalizations

### Purpose
Normalize behavioral differences across providers so shared code can have one consistent implementation.

### Fixes

| # | Fix | File | Line(s) | Change |
|---|-----|------|---------|--------|
| 1 | Add `--single-branch` to SSH clone | `ee/app-git/providers/github-ssh/util.service.ts` | 66 | Add `'--single-branch'` to clone options array |
| 2 | SSH push: throw errors instead of swallowing | `ee/app-git/providers/github-ssh/util.service.ts` | 128-129 | Change `console.log('err', err)` to `throw err` |
| 3 | Remove duplicated credential.helper disable | `ee/app-git/providers/github-https/util.service.ts` | 261+263 | Delete the duplicate `credential.helper` line |
| 4 | Unify user name in commit to `(firstName + lastName).trim()` | `ee/app-git/providers/github-https/util.service.ts` line 224, `ee/app-git/providers/gitlab/util.service.ts` line 109 | Match SSH's `${firstName \|\| ''} ${lastName \|\| ''}`.trim() |
| 5 | Add empty commit skip to HTTPS and GitLab | `ee/app-git/providers/github-https/util.service.ts` line 209, `ee/app-git/providers/gitlab/util.service.ts` line 94 | Add `const status = await git.status(); if (status.files.length === 0) return;` |
| 6 | Use raw commit message everywhere | `ee/app-git/providers/github-ssh/util.service.ts` | 91 | Remove `Version ${appGit.gitVersionName} of ${appGit.gitAppName}:` prefix — caller formats |
| 7 | Add git config cleanup to HTTPS and GitLab commit | `ee/app-git/providers/github-https/util.service.ts`, `ee/app-git/providers/gitlab/util.service.ts` | commit methods | Add `finally { git.raw(['config', '--unset', 'user.name']); git.raw(['config', '--unset', 'user.email']); }` |
| 8 | Fix `await await` double-await | `ee/app-git/providers/github-ssh/service.ts` line 160, `ee/app-git/providers/gitlab/service.ts` line 118 | Remove extra `await` |
| 9 | Fix missing `await` on createAppGit | `ee/app-git/providers/gitlab/service.ts` | 137 | Add `await` |
| 10 | Unify timeout to 60s | `ee/app-git/providers/github-ssh/util.service.ts` | line 118 (30s), line 80 (none) | Set `timeout: { block: 60000 }` |

### Post-Normalization State
After these fixes, all 3 providers behave identically for:
- Clone: `--depth N --single-branch --branch B` + provider-specific auth
- Commit: check empty → set user config → add → commit → unset config (all providers)
- Push: throw on error (all providers)
- User name: `(firstName + lastName).trim()` (all providers)
- Timeout: 60s (all providers)

---

## Commit 3: Create Shared Git Operations Util (Layer 2)

### New File
`server/ee/app-git/shared/git-operations.util.ts` (~120-150 lines)

### Interface

```typescript
@Injectable()
export class GitOperationsUtil {

  createGit(repoPath: string, timeout = 60000): SimpleGit

  async clone(targetPath: string, url: string, branch: string, opts?: {
    env?: Record<string, string>,      // SSH: GIT_SSH_COMMAND
    depth?: number,                     // default 1
    singleBranch?: boolean,            // default true
    sslDisabled?: boolean,             // HTTPS: -c http.sslVerify=false
    cleanExisting?: boolean,           // HTTPS/GitLab: rm existing dir before clone
  }): Promise<void>

  async commit(repoPath: string, opts: {
    message: string,                    // raw message, caller formats
    user: User,
    appGit: AppGitSync,
    skipEmpty?: boolean,               // default true
  }): Promise<void>

  async push(repoPath: string, branch: string, remote: string, opts?: {
    env?: Record<string, string>,      // SSH: GIT_SSH_COMMAND
    remoteUrl?: string,                // HTTPS: set-url before push
    resetUrl?: string,                 // HTTPS: reset-url after push
    sslDisabled?: boolean,             // HTTPS: http.sslVerify=false
    disableCredentialHelper?: boolean, // HTTPS: credential.helper=''
  }): Promise<void>
}
```

### What This Consolidates
- `simpleGit()` instance creation with consistent timeout
- Clone: options assembly, env-based vs URL-based auth, SSL handling, dir cleanup
- Commit: status check → user config → add → commit → config cleanup
- Push: optional remote URL dance, env-based auth, SSL handling, credential helper

---

## Commit 4: Add Auth Factories (Layer 1)

### New File
`server/ee/app-git/shared/auth-factory.interface.ts` (~20 lines)

```typescript
export interface GitAuthResult {
  url: string;                              // repo URL (raw for SSH, authenticated for GitLab)
  branch: string;                           // target branch name
  env?: Record<string, string>;             // SSH: { GIT_SSH_COMMAND: '...' }
  getAuthUrl?: () => Promise<string>;       // HTTPS: factory for fresh token URL (solves expiry)
  sslDisabled?: boolean;                    // HTTPS: needs SSL disabled
  rawUrl?: string;                          // HTTPS: URL without token (for reset after push)
  disableCredentialHelper?: boolean;        // HTTPS: disable credential caching
  cleanup: () => Promise<void>;             // teardown (SSH: delete key, HTTPS: unset SSL, GitLab: noop)
}
```

### Methods Added to Existing Files

| File | Method | What It Does |
|------|--------|-------------|
| `ssh/util.service.ts` | `async getAuth(orgGit): Promise<GitAuthResult>` | findSSHConfigs → writeSSHKeyToFile → return `{ url, branch, env: {GIT_SSH_COMMAND}, cleanup: deleteKeyDir }` |
| `https/util.service.ts` | `async getAuth(orgGit): Promise<GitAuthResult>` | findHttpsConfigs → return `{ url: rawUrl, branch, getAuthUrl: () => getToken(), sslDisabled, rawUrl, cleanup }` |
| `gitlab/util.service.ts` | `async getAuth(orgGit): Promise<GitAuthResult>` | findGitLabConfigs → getAuthenticatedUrl → return `{ url: tokenUrl, branch, cleanup: async () => {} }` |

### Key Design Decisions
- HTTPS `getAuthUrl` is a **factory function** (not static URL) — each call generates a fresh JWT + installation token, solving token expiry risk
- SSH key written **once** per flow (not twice like current code), cleaned up **once** in `cleanup()`
- `cleanup()` centralizes teardown — caller uses `try/finally { auth.cleanup() }`

---

## Commit 5: Refactor Provider Util Services

Replace `gitClone/gitCommit/gitPush` in each provider with thin wrappers.

### `ssh/util.service.ts`

```
BEFORE (137 lines):
├── createAppGit()     ← moved to shared in Commit 1
├── gitClone()         ← 27 lines: SSH key + clone mixed
├── gitCommit()        ← 25 lines: full commit logic
└── gitPush()          ← 32 lines: SSH key + push mixed

AFTER (~60 lines):
├── getAuth(orgGit)    ← from Commit 4
├── gitClone(path, orgGit, depth?)
│     └── auth = getAuth(orgGit)
│     └── gitOps.clone(path, auth.url, auth.branch, { env: auth.env, depth })
│     └── finally: auth.cleanup()
├── gitCommit(path, msg, user, appGit)
│     └── gitOps.commit(path, { message: msg, user, appGit })
└── gitPush(path, appGit, remote)
      └── auth = getAuth(orgGit)
      └── gitOps.push(path, auth.branch, remote, { env: auth.env })
      └── finally: auth.cleanup()
```

### `https/util.service.ts`

```
BEFORE: gitClone (133L) + gitCommit (40L) + gitPush (50L) = 223 lines of git ops

AFTER (~30 lines for git ops):
├── getAuth(orgGit)
├── gitClone(path, orgGit, branchName?, depth?)
│     └── auth = getAuth(orgGit)
│     └── authUrl = await auth.getAuthUrl()
│     └── gitOps.clone(path, authUrl, branch, { sslDisabled, cleanExisting: true })
│     └── finally: auth.cleanup()
├── gitCommit(path, msg, appGit, user)
│     └── gitOps.commit(path, { message: msg, user, appGit })
└── gitPush(path, orgGit, branchName?, remote?)
      └── auth = getAuth(orgGit)
      └── authUrl = await auth.getAuthUrl()
      └── gitOps.push(path, branch, remote, { remoteUrl: authUrl, resetUrl: auth.rawUrl, sslDisabled, disableCredentialHelper: true })
      └── finally: auth.cleanup()

Branching methods, createGitApp, pullGitAppChanges, gitPushApp, etc. — UNTOUCHED
```

### `gitlab/util.service.ts`

```
BEFORE (137 lines): gitClone (25L) + gitPush (25L) + gitCommit (43L) = 93 lines of git ops

AFTER (~25 lines for git ops):
├── getAuth(orgGit)
├── gitClone(path, orgGit, branchName?, depth?)
│     └── auth = getAuth(orgGit)
│     └── gitOps.clone(path, auth.url, auth.branch, { cleanExisting: true })
│     └── finally: auth.cleanup()
├── gitCommit(path, msg, appGit, user)
│     └── gitOps.commit(path, { message: msg, user, appGit })
└── gitPush(path, orgGit, remote?)
      └── auth = getAuth(orgGit)
      └── gitOps.push(path, auth.branch, remote, { remoteUrl: auth.url })
      └── finally: auth.cleanup()
```

---

## Commit 6: Create Shared Service-Layer Util

### New File
`server/ee/app-git/shared/app-git-operations.util.ts` (~300-350 lines)

### Provider Context Interface

```typescript
interface ProviderContext {
  findAppGitByAppId: (appId: string) => Promise<AppGitSync>;
  findAppGitById: (id: string) => Promise<AppGitSync>;
  isEnabled: (orgGit: OrganizationGitSync) => boolean;
  sensitiveKeyField: string | null;     // 'sshPrivateKey' | 'githubPrivateKey' | null
  utilService: any;                      // provider's util for clone/commit/push
  fileOpsUtil: AppGitFileOperationsUtil; // shared file operations
  testConnection: (...args) => Promise<any>;
  appsFolder: string;                   // 'apps' constant
}
```

### Methods

| Method | Source (copied from) | What It Does |
|--------|---------------------|-------------|
| `checkSyncApp(user, version, orgId, ctx)` | SSH:56, HTTPS:42, GitLab:55 | Test connection → find/create appGit record |
| `createGitApp(user, appMetaBody, ctx)` | SSH:130, GitLab:89 | Clone → readAppJson → import → createAppGit |
| `gitPushApp(user, appGitId, body, version, remote, ctx)` | SSH:188, GitLab:200 | Clone → WriteAppFile → commit → push → save |
| `pullGitAppChanges(user, appMetaBody, appId, ctx)` | SSH:289, GitLab:260 | Clone → readAppJson → import DB → validate → delete version → import → updateAppGit |
| `renameAppOrVersion(user, appId, dto, ctx)` | SSH:270, GitLab:348 | Build rename commit message → call gitPushApp |
| `findAppGitConfigs(user, version, orgId, ctx)` | SSH:379, GitLab:366 | Find appGit → delete sensitive key → return config |

---

## Commit 7: Refactor Provider Services to Delegate

### `ssh/service.ts`

```
BEFORE (433 lines):
├── checkSyncApp()        ← 37 lines inline
├── gitPullAppInfo()      ← stays (provider-specific)
├── createGitApp()        ← 57 lines inline
├── gitPushApp()          ← 80 lines inline
├── renameAppOrVersion()  ← 18 lines inline
├── pullGitAppChanges()   ← 89 lines inline
├── findAppGitConfigs()   ← 16 lines inline
├── 7 stub methods        ← stay

AFTER (~180 lines):
├── constructor()         ← sets up providerContext
├── checkSyncApp()        ← 1 line: this.appGitOpsUtil.checkSyncApp(user, version, orgId, this.ctx)
├── gitPullAppInfo()      ← stays (provider-specific)
├── createGitApp()        ← 1 line delegate
├── gitPushApp()          ← 1 line delegate
├── renameAppOrVersion()  ← 1 line delegate
├── pullGitAppChanges()   ← 1 line delegate
├── findAppGitConfigs()   ← 1 line delegate
├── 7 stub methods        ← stay
```

### `gitlab/service.ts`
```
BEFORE (420 lines) → AFTER (~170 lines)
Same pattern as SSH.
```

### `https/service.ts`
```
BEFORE (350 lines) → AFTER (~280 lines)
Already delegates createGitApp, gitPushApp, pullGitAppChanges to util.
Only checkSyncApp, findAppGitConfigs, renameAppOrVersion, gitPullAppInfo have inline logic.
gitPullAppInfo stays (provider-specific).
```

---

## File Summary

### New Files (4)

| File | Purpose | Est. Lines |
|------|---------|------------|
| `server/ee/app-git/shared/app-git-file-operations.util.ts` | Moved from git-sync: readAppJson, WriteAppFile, etc. | ~340 |
| `server/ee/app-git/shared/git-operations.util.ts` | Shared clone/commit/push (Layer 2) | ~120-150 |
| `server/ee/app-git/shared/auth-factory.interface.ts` | GitAuthResult interface (Layer 1) | ~20 |
| `server/ee/app-git/shared/app-git-operations.util.ts` | 6 deduplicated service methods | ~300-350 |

### Modified Files (8)

| File | Change |
|------|--------|
| `server/ee/git-sync/base-git-util.service.ts` | Remove ~340 lines (moved to app-git) |
| `server/ee/app-git/providers/github-ssh/util.service.ts` | Add getAuth(), slim git ops, bug fixes |
| `server/ee/app-git/providers/github-https/util.service.ts` | Add getAuth(), slim git ops, bug fixes |
| `server/ee/app-git/providers/gitlab/util.service.ts` | Add getAuth(), slim git ops, bug fixes |
| `server/ee/app-git/providers/github-ssh/service.ts` | Delegate 6 methods, bug fixes |
| `server/ee/app-git/providers/github-https/service.ts` | Delegate 3-4 methods |
| `server/ee/app-git/providers/gitlab/service.ts` | Delegate 6 methods, bug fixes |
| NestJS module file(s) | Register new shared services |

### Not Touched
- Import/export services (`ImportExportResourcesService`, `AppImportExportService`)
- 7 stub methods (HTTPS-only branching)
- `gitPullAppInfo` (stays provider-specific in all 3)
- HTTPS-unique methods (`fetchTagsForApp`, `normalizeTagMessage`, `pullLatestChangesWithBranching`)
- Frontend
- Database/entities

### Lines Impact

| File | Before | After | Delta |
|------|--------|-------|-------|
| `git-sync/base-git-util.service.ts` | ~856 | ~516 | **-340** |
| `ssh/util.service.ts` | 137 | ~60 | **-77** |
| `https/util.service.ts` | 1,320 | ~1,100 | **-220** |
| `gitlab/util.service.ts` | 137 | ~50 | **-87** |
| `ssh/service.ts` | 433 | ~180 | **-253** |
| `https/service.ts` | 350 | ~280 | **-70** |
| `gitlab/service.ts` | 420 | ~170 | **-250** |
| New shared files | 0 | ~830 | **+830** |
| **Total** | **3,653** | **~3,186** | **~-467** |

Net reduction ~470 lines. Real win: **duplication eliminated** — from 3 copies to 1 shared implementation + thin wrappers.

---

## Verification Strategy

Each commit is independently testable:

| Commit | How to Verify |
|--------|---------------|
| 1 (move code) | All existing git push/pull/create flows work unchanged |
| 2 (bug fixes) | SSH push now returns errors to UI; all providers commit/clone consistently |
| 3 (git ops util) | Unit test shared clone/commit/push with mock simpleGit |
| 4 (auth factories) | Unit test each getAuth() returns correct shape |
| 5 (slim provider utils) | All git push/pull flows work through new thin wrappers |
| 6 (service util) | Unit test shared service methods with mock providerContext |
| 7 (slim provider services) | Full E2E: push/pull/create for all 3 providers |

---

## Related Documents

| Doc | Content |
|-----|---------|
| [10-refactoring-audit.md](./10-refactoring-audit.md) | Original audit: misplaced code, duplication, coupling, dead code |
| [11-deduplication-analysis.md](./11-deduplication-analysis.md) | Provider deduplication: method inventory, behavioral diffs, 2-layer approach |
| [12-branching-toggle-analysis.md](./12-branching-toggle-analysis.md) | Branching toggle: OLD vs NEW architecture comparison |
