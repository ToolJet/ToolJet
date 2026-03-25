# Git-Sync Deduplication Analysis — Full Findings

**Branch:** `feature/git-sync-phase-2.1` | **Date:** 2026-03-11

---

## Scope

This document covers all duplicated code across the 3 app-git providers (SSH, HTTPS, GitLab) — both service-layer orchestration and util-layer git operations. It also covers the proposed 2-layer refactoring approach and its bottlenecks.

---

## 1. Full Duplication Inventory

### 1.1 Util Layer (Git Operations)

| Method | SSH | HTTPS | GitLab | Duplicated? |
|--------|-----|-------|--------|-------------|
| `gitClone` | `util.service.ts:51` | `util.service.ts:74` | `util.service.ts:43` | **YES — all 3** |
| `gitCommit` | `util.service.ts:79` | `util.service.ts:209` | `util.service.ts:94` | **YES — all 3** |
| `gitPush` | `util.service.ts:105` | `util.service.ts:252` | `util.service.ts:69` | **YES — all 3** |
| `createAppGit` | `util.service.ts:45` | `util.service.ts:303` | — | **YES — SSH + HTTPS** |

### 1.2 Service Layer (Orchestration)

| Method | SSH | HTTPS | GitLab | Unifiable? |
|--------|-----|-------|--------|------------|
| `checkSyncApp` | `service.ts:56` | `service.ts:42` | `service.ts:55` | **YES** (~90% identical) |
| `gitPullAppInfo` | `service.ts:94` | `service.ts:76` | `service.ts:145` | **NO** (all 3 significantly different) |
| `createGitApp` | `service.ts:130` | delegates to util | `service.ts:89` | **YES** (~95% identical SSH/GitLab) |
| `gitPushApp` | `service.ts:188` | delegates to util | `service.ts:200` | **YES** (~85% identical, normalize first) |
| `pullGitAppChanges` | `service.ts:289` | delegates to util | `service.ts:260` | **YES** (~95% identical SSH/GitLab) |
| `renameAppOrVersion` | `service.ts:270` | `service.ts:241` | `service.ts:348` | **YES** (~90% identical) |
| `findAppGitConfigs` | `service.ts:379` | `service.ts:274` | `service.ts:366` | **YES** (~95% identical) |

### 1.3 Stub Methods (Leave As-Is)

7 methods are stubs in SSH/GitLab (throw `NotFoundException`), real only in HTTPS:
`getAllBranches`, `getPullRequests`, `createBranch`, `deleteGitBranch`, `createGitTag`, `getLatestChangesInfo`, `checkTagExists`

**Decision:** Leave stubs until branching is extended to SSH/GitLab.

### 1.4 HTTPS-Unique Methods (No Action)

- `fetchTagsForApp` — HTTPS service only
- `normalizeTagMessage` — HTTPS service only
- `pullLatestChangesWithBranching` — HTTPS util only
- `gitCloneWithSslDisabled` / `gitCloneWithSslEnabled` — HTTPS util internal

---

## 2. Util Layer — Behavioral Differences (gitClone/gitCommit/gitPush)

### 2.1 gitClone Differences

| Aspect | SSH | HTTPS | GitLab |
|--------|-----|-------|--------|
| Clone options | `--depth N --branch B` | `--depth N --branch B --single-branch -c credential.helper=` | `--depth N --single-branch --branch B` |
| Auth mechanism | `git.env({GIT_SSH_COMMAND})` | Token injected into URL | Token injected into URL |
| SSL handling | None | Has SSL-disabled path (`http.sslVerify=false` globally) | None |
| Pre-clone cleanup | None | `fs.rmSync(repoPath)` if exists | `fs.rmSync(repoPath)` if exists |
| Return value | `void` | `{success, path, branch, clone}` | `{success, path, branch, clone}` |
| Error type | `BadRequestException` | `new Error(...)` | `new Error(...)` |

**Bug:** SSH missing `--single-branch` — no functional impact (nothing reads branch refs after clone) but wastes bandwidth.

### 2.2 gitCommit Differences

| Aspect | SSH | HTTPS | GitLab |
|--------|-----|-------|--------|
| Empty commit check | **YES** — `status.files.length === 0 → return` | **NO** | **NO** |
| Commit message format | `"Version X of AppName: msg"` | Raw `commitMessage` | Raw `commitMessage` |
| User name format | `firstName + lastName` | `firstName` only | `firstName \|\| lastName` |
| Config cleanup | **YES** — unsets `user.name/email` in finally | **NO** | **NO** |
| Retry on failure | **NO** — throws immediately | **YES** — retries once | **YES** — retries once |
| Repo validation | **NO** | **YES** — checks `.git` exists | **YES** — checks `.git` exists |
| Timeout | None (default) | 60 seconds | 60 seconds |

### 2.3 gitPush Differences

| Aspect | SSH | HTTPS | GitLab |
|--------|-----|-------|--------|
| Auth | Write SSH key → set `GIT_SSH_COMMAND` env | Get token → inject into URL | Get token → inject into URL |
| Remote URL handling | Uses existing remote | `set-url` to auth URL → push → `set-url` back | `set-url` or `addRemote` (never resets) |
| Credential helper | None | Disables (`credential.helper=''`) | None |
| SSL handling | None | Conditionally disables/re-enables | None |
| Error handling | **Swallows error** (just `console.log`) | Throws error | Throws error |
| Timeout | 30 seconds | 60 seconds | 60 seconds |

---

## 3. Service Layer — Method-by-Method Comparison

### 3.1 `checkSyncApp` — Unifiable

~90% identical across all 3. Only differ in:
- Which repository query: `findAppGitByAppIdSSH` vs `findAppGitByAppIdHTTPS` vs `findAppGitByAppIdGitLab`
- Which config field: `orgGit.gitSsh.isEnabled` vs `orgGit.gitHttps.isEnabled` vs `orgGit.gitLab.isEnabled`
- SSH has extra: creates temp dir + passes `initPath` to `testGitConnection`
- SSH deletes `orgGit.gitSsh.sshPrivateKey` from response

### 3.2 `gitPullAppInfo` — NOT Unifiable

All 3 have meaningfully different implementations:
- **SSH**: Uses `readGitHistoryMetadata()` (new approach), clone depth 1, no `branchName` param
- **HTTPS**: Uses `readGitHistoryMetadata()` + `resolvedAppName()` + `hasLatestChanges` check + fetches tags via Octokit, clone depth **100**, has `branchName` param
- **GitLab**: Uses **old `.meta/meta.json`** approach (reads file, parses JSON), has `branchName` param, different error patterns (`incorrect/expired/improperly scoped`)

### 3.3 `createGitApp` — Unifiable

SSH and GitLab are near-identical copy-paste. HTTPS delegates entirely to util.
- Both have `await await` bug (double await)
- Same flow: clone → readAppJson → import → createAppGit → return app
- Only difference: which util service is called

### 3.4 `gitPushApp` — Unifiable (after normalization)

SSH and GitLab ~85% identical. HTTPS delegates to util.
- GitLab **still writes meta file** (`writeMetaFile`) — SSH has it commented out
- Different clone return handling: SSH uses `gitRepoPath`, GitLab uses `repo.path`
- Different error patterns in catch blocks

### 3.5 `pullGitAppChanges` — Unifiable

SSH and GitLab ~95% identical copy-paste. HTTPS delegates to util.
- Same flow: clone → readAppJson → import TJ DB → validate → delete version → import → updateAppGit
- Only difference: which util service is called

### 3.6 `renameAppOrVersion` — Unifiable

~90% identical. HTTPS has extra logic for `currentVersionId` (finds app first, uses `editingVersion` fallback).
SSH/GitLab use `appVersionRepository.getAppVersionById(appGit.versionId)`.

### 3.7 `findAppGitConfigs` — Unifiable

~95% identical. Only differ in:
- Which repository query method
- Which key to delete (`sshPrivateKey` vs `githubPrivateKey` vs none)

---

## 4. Existing Bugs Found

| # | Bug | Location | Severity |
|---|-----|----------|----------|
| 1 | SSH push **silently swallows errors** | `ssh/util.service.ts:128-129` — `catch(err) { console.log('err', err) }` no throw | High |
| 2 | HTTPS push **duplicated line** | `https/util.service.ts:261+263` — `credential.helper` disabled twice | Low |
| 3 | User name inconsistency in commit | SSH: `firstName + lastName`, HTTPS: `firstName` only, GitLab: `firstName \|\| lastName` | Medium |
| 4 | SSH clone missing `--single-branch` | `ssh/util.service.ts:66` | Low (perf only) |
| 5 | Global `http.sslVerify` race condition | `https/util.service.ts:121,271` — concurrent ops can corrupt global git config | Medium |
| 6 | `await await` double-await | `ssh/service.ts:160`, `gitlab/service.ts:118` | Low |
| 7 | GitLab still uses old `.meta/meta.json` | `gitlab/service.ts:159-181` — SSH/HTTPS moved to `readGitHistoryMetadata` | Medium |
| 8 | GitLab `createAppGit` not awaited | `gitlab/service.ts:137` — missing `await` | Medium |

---

## 5. Proposed 2-Layer Refactoring Approach

### Layer 1: Auth Factories (Provider-Specific)

Each provider only handles getting the authenticated connection:

```
SSH:    getAuth(orgGit) → { gitEnv, branch, url, cleanup() }
HTTPS:  getAuth(orgGit) → { getAuthUrl: () => Promise<string>, branch, rawUrl, sslDisabled, cleanup() }
GitLab: getAuth(orgGit) → { tokenUrl: string, branch, cleanup() }
```

Key design decisions:
- HTTPS returns `getAuthUrl()` as a **factory function** (not static URL) to solve token expiry
- SSH writes key once, cleans up once (vs current 2× per push flow)
- `cleanup()` centralizes teardown

### Layer 2: Shared Git Operations Helper

Thin wrapper — NOT a god function:

```typescript
class GitOperationsUtil {
  createGit(repoPath, timeout = 60000): SimpleGit

  clone(targetPath, url, branch, opts?: {
    env?: Record<string,string>,   // SSH uses this
    depth?: number,
    singleBranch?: boolean,        // normalized to true for all
    sslDisabled?: boolean          // HTTPS uses this
  })

  commit(repoPath, opts: {
    message: string,
    user: User,
    appGit: AppGitSync,
    skipEmpty?: boolean            // normalized behavior
  })

  push(repoPath, branch, remote, opts?: {
    env?: Record<string,string>,   // SSH uses this
    remoteUrl?: string,            // HTTPS sets before push
    resetUrl?: string,             // HTTPS resets after push
    sslDisabled?: boolean
  })
}
```

### Normalizations Required Before Extraction

1. Add `--single-branch` to SSH clone
2. Decide: all providers skip empty commits (SSH behavior) — **recommended: yes**
3. Decide: commit message format — **recommended: raw message, caller formats**
4. Decide: git config cleanup after commit — **recommended: always clean up**
5. Decide: push errors thrown or swallowed — **recommended: always throw**
6. Unify user name: `(firstName + lastName).trim()` for all
7. Unify timeout: 60 seconds for all operations

---

## 6. Refactoring Scope Summary

### Must Change (11 methods)

**Util layer — 4 methods:**
- `gitClone` (3 providers)
- `gitCommit` (3 providers)
- `gitPush` (3 providers)
- `createAppGit` (2 providers)

**Service layer — 6 methods** (gitPullAppInfo excluded):
- `checkSyncApp` (3 providers)
- `createGitApp` (3 providers)
- `gitPushApp` (3 providers)
- `pullGitAppChanges` (3 providers)
- `renameAppOrVersion` (3 providers)
- `findAppGitConfigs` (3 providers)

### Cannot Unify

- `gitPullAppInfo` — all 3 implementations significantly different

### Leave As-Is

- 7 stub methods (HTTPS-only branching features)
- HTTPS-unique methods (`fetchTagsForApp`, `normalizeTagMessage`, `pullLatestChangesWithBranching`)

---

## 7. New API Flow (Post-Refactoring)

### SSH Push Example

```
HTTP POST /app-git/push
  └─ SSHAppGitService.gitPushApp()
       ├─ 1. Get orgGit config from DB
       ├─ 2. Create temp dir
       ├─ 3. LAYER 1: sshAuthFactory.getAuth(orgGit)         ← ONE time
       │     └─ returns { gitEnv, branch, url, cleanup() }
       ├─ 4. LAYER 2: gitHelper.clone(tempDir, auth.url, auth.branch, { env: auth.gitEnv })
       ├─ 5. Export app JSON → write to cloned repo
       ├─ 6. LAYER 2: gitHelper.commit(repoPath, { message, user, appGit, skipEmpty: true })
       ├─ 7. LAYER 2: gitHelper.push(repoPath, auth.branch, 'origin', { env: auth.gitEnv })
       └─ 8. finally: auth.cleanup() + delete temp dir
```

### HTTPS Push Example

```
HTTP POST /app-git/push
  └─ HTTPSAppGitService.gitPushApp()
       ├─ 1. Get orgGit config from DB
       ├─ 2. Create temp dir
       ├─ 3. LAYER 1: httpsAuthFactory.getAuth(orgGit)
       │     └─ returns { getAuthUrl: () => Promise<string>, branch, rawUrl, sslDisabled, cleanup() }
       ├─ 4. authUrl = await auth.getAuthUrl()                ← fresh token
       │     gitHelper.clone(tempDir, authUrl, auth.branch, { sslDisabled: auth.sslDisabled })
       ├─ 5. Export app JSON → write to cloned repo
       ├─ 6. gitHelper.commit(repoPath, { message, user, appGit, skipEmpty: true })
       ├─ 7. authUrl = await auth.getAuthUrl()                ← fresh token (solves expiry)
       │     gitHelper.push(repoPath, auth.branch, 'origin', { remoteUrl: authUrl, resetUrl: auth.rawUrl })
       └─ 8. finally: auth.cleanup()
```
