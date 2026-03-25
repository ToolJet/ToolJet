# Git-Sync Architecture: Before & After Refactoring

**Purpose:** Help developers understand how the code structure changes after refactoring.

---

## 1. Module Structure — Before vs After

### BEFORE

```
server/ee/
├── git-sync/                              ← ORG-LEVEL CONFIG MODULE
│   ├── base-git-util.service.ts           ← 856 lines (PROBLEM: ~340 lines are app-git-only)
│   │   ├── findOrgGitByOrganizationId()   ← shared (used by both modules)
│   │   ├── deleteDir()                    ← shared
│   │   ├── readAppJson()                  ← APP-GIT ONLY (misplaced)
│   │   ├── WriteAppFile()                 ← APP-GIT ONLY (misplaced)
│   │   ├── getAppPath()                   ← APP-GIT ONLY (misplaced)
│   │   ├── updateAppMeta()               ← APP-GIT ONLY (misplaced)
│   │   ├── writeMetaFile()               ← APP-GIT ONLY (misplaced)
│   │   ├── UpdateGitApp()                ← APP-GIT ONLY (misplaced)
│   │   ├── updateAppGit()               ← APP-GIT ONLY (misplaced)
│   │   ├── readGitHistoryMetadata()      ← APP-GIT ONLY (misplaced)
│   │   ├── validateAppJsonForImport()    ← APP-GIT ONLY (misplaced)
│   │   └── ... more misplaced methods
│   │
│   └── providers/
│       ├── github-ssh/util.service.ts     ← SSH org-level config (testConnection, setSshKey)
│       ├── github-https/util.service.ts   ← HTTPS org-level config (testConnection, JWT)
│       └── gitlab/util.service.ts         ← GitLab org-level config (testConnection)
│
└── app-git/                               ← PER-APP PUSH/PULL MODULE
    └── providers/
        ├── github-ssh/
        │   ├── service.ts                 ← 433 lines (7 methods DUPLICATED with GitLab)
        │   └── util.service.ts            ← 137 lines (gitClone/gitCommit/gitPush DUPLICATED)
        │
        ├── github-https/
        │   ├── service.ts                 ← 350 lines (delegates most to util)
        │   └── util.service.ts            ← 1320 lines (git ops + branching + orchestration)
        │
        └── gitlab/
            ├── service.ts                 ← 420 lines (7 methods DUPLICATED with SSH)
            └── util.service.ts            ← 137 lines (gitClone/gitCommit/gitPush DUPLICATED)
```

### AFTER

```
server/ee/
├── git-sync/                              ← ORG-LEVEL CONFIG MODULE (slimmed down)
│   ├── base-git-util.service.ts           ← ~516 lines (only shared methods remain)
│   │   ├── findOrgGitByOrganizationId()   ← shared (stays)
│   │   ├── deleteDir()                    ← shared (stays)
│   │   └── ... other shared methods
│   │
│   └── providers/                         ← unchanged
│       ├── github-ssh/util.service.ts
│       ├── github-https/util.service.ts
│       └── gitlab/util.service.ts
│
└── app-git/                               ← PER-APP PUSH/PULL MODULE
    ├── shared/                            ← NEW DIRECTORY
    │   ├── auth-factory.interface.ts      ← GitAuthResult interface
    │   ├── git-operations.util.ts         ← shared clone/commit/push (Layer 2)
    │   ├── app-git-file-operations.util.ts ← moved from git-sync (readAppJson, WriteAppFile, etc.)
    │   └── app-git-operations.util.ts     ← 6 deduplicated service methods
    │
    └── providers/
        ├── github-ssh/
        │   ├── service.ts                 ← ~180 lines (delegates to shared)
        │   └── util.service.ts            ← ~60 lines (getAuth + thin wrappers)
        │
        ├── github-https/
        │   ├── service.ts                 ← ~280 lines (delegates to shared)
        │   └── util.service.ts            ← ~1100 lines (getAuth + thin git ops + branching stays)
        │
        └── gitlab/
            ├── service.ts                 ← ~170 lines (delegates to shared)
            └── util.service.ts            ← ~50 lines (getAuth + thin wrappers)
```

---

## 2. Push API Flow — Before vs After

### BEFORE: SSH Push (Example)

```
┌──────────────────────────────────────────────────────────────────────┐
│  POST /app-git/push                                                  │
│  Controller → AppGitService → SourceControlProviderService           │
│                                    │                                 │
│                          selects SSHAppGitService                     │
└────────────────────────────────────┬─────────────────────────────────┘
                                     │
                    ┌────────────────▼──────────────────┐
                    │   SSHAppGitService.gitPushApp()    │
                    │   (ssh/service.ts — 80 lines)      │
                    │                                    │
                    │   ┌─ Duplicated with GitLab ─┐     │
                    │   │  Same orchestration logic │     │
                    │   │  Copy-pasted 80 lines     │     │
                    │   └──────────────────────────┘     │
                    └───────┬────────┬────────┬──────────┘
                            │        │        │
              ┌─────────────▼─┐  ┌───▼───┐  ┌─▼──────────────┐
              │ sshAppGitUtil  │  │       │  │ sshAppGitUtil   │
              │ .gitClone()   │  │       │  │ .gitPush()      │
              │               │  │       │  │                 │
              │ ┌───────────┐ │  │       │  │ ┌────────────┐  │
              │ │ Reaches   │ │  │       │  │ │ Reaches    │  │
              │ │ into      │ │  │       │  │ │ into       │  │
              │ │ git-sync  │ │  │       │  │ │ git-sync   │  │
              │ │ module:   │ │  │       │  │ │ module:    │  │
              │ │           │ │  │       │  │ │            │  │
              │ │ findSSH   │ │  │       │  │ │ findSSH    │  │ ← FETCHED TWICE
              │ │ Configs() │ │  │       │  │ │ Configs()  │  │
              │ │           │ │  │       │  │ │            │  │
              │ │ writeSSH  │ │  │       │  │ │ writeSSH   │  │ ← KEY WRITTEN TWICE
              │ │ KeyToFile │ │  │       │  │ │ KeyToFile  │  │
              │ │           │ │  │  SSH  │  │ │            │  │
              │ │ cleanup   │ │  │  key  │  │ │ cleanup    │  │ ← KEY DELETED TWICE
              │ │ SSHKeys() │ │  │ auth  │  │ │ SSHKeys()  │  │
              │ └───────────┘ │  │ mixed │  │ └────────────┘  │
              │               │  │ with  │  │                 │
              │  git.clone()  │  │ git   │  │  git.push()     │
              │  + auth ENV   │  │ ops   │  │  + auth ENV     │
              │  MIXED        │  │       │  │  MIXED          │
              └───────────────┘  │       │  └─────────────────┘
                                 │       │
                    ┌────────────▼───────▼──────────────┐
                    │  sshAppGitUtil.gitCommit()         │
                    │  (commit logic inline, 25 lines)   │
                    │                                    │
                    │  + calls base-git-util methods:     │
                    │    WriteAppFile()  ──┐              │
                    │    getAppPath()   ──┤ ALL DEFINED   │
                    │    updateAppMeta()──┤ IN GIT-SYNC   │
                    │    readAppJson()  ──┘ MODULE        │
                    │                     (misplaced)     │
                    └────────────────────────────────────┘

Problems:
  ✗ SSH configs fetched 2x (clone + push)
  ✗ SSH key written + deleted 2x (clone + push)
  ✗ Auth logic mixed inside git operations
  ✗ 80 lines of service logic duplicated with GitLab
  ✗ File operations defined in wrong module (git-sync)
  ✗ 3 cross-module calls into git-sync
```

### AFTER: SSH Push

```
┌──────────────────────────────────────────────────────────────────────┐
│  POST /app-git/push                                                  │
│  Controller → AppGitService → SourceControlProviderService           │
│                                    │                                 │
│                          selects SSHAppGitService                     │
└────────────────────────────────────┬─────────────────────────────────┘
                                     │
                    ┌────────────────▼──────────────────┐
                    │   SSHAppGitService.gitPushApp()    │
                    │   (ssh/service.ts — 1 line)        │
                    │                                    │
                    │   return this.appGitOpsUtil         │
                    │     .gitPushApp(..., this.ctx)      │
                    └────────────────┬──────────────────┘
                                     │ delegates to
                    ┌────────────────▼──────────────────┐
                    │  AppGitOperationsUtil.gitPushApp() │
                    │  (shared/app-git-operations.util)  │
                    │  ONE implementation for all 3      │
                    │                                    │
                    │  Uses providerContext to call:      │
                    │  ctx.utilService.gitClone()         │
                    │  ctx.utilService.gitCommit()        │
                    │  ctx.utilService.gitPush()          │
                    │  ctx.fileOpsUtil.WriteAppFile()     │
                    │  ctx.fileOpsUtil.getAppPath()       │
                    │  ctx.fileOpsUtil.updateAppMeta()    │
                    └───────┬────────┬────────┬──────────┘
                            │        │        │
              ┌─────────────▼─┐      │    ┌───▼──────────────┐
              │ sshUtil        │      │    │ sshUtil           │
              │ .gitClone()   │      │    │ .gitPush()        │
              │ (thin wrapper)│      │    │ (thin wrapper)    │
              │               │      │    │                   │
              │ auth = this   │      │    │ REUSES same auth  │ ← NO re-fetch
              │  .getAuth()   │      │    │ from clone step   │
              └──────┬────────┘      │    └────────┬──────────┘
                     │               │             │
         ┌───────────▼───────────┐   │   ┌─────────▼──────────┐
         │  LAYER 1: getAuth()   │   │   │                    │
         │  (ssh/util.service)   │   │   │  LAYER 2: shared   │
         │                       │   │   │  git-operations.util│
         │  findSSHConfigs()     │   │   │                    │
         │  writeSSHKeyToFile()  │   │   │  gitOps.push(      │
         │                       │   │   │    repoPath,       │
         │  returns {            │   │   │    auth.branch,    │
         │    url,               │   │   │    'origin',       │
         │    branch,            │   │   │    { env: auth.env }│
         │    env: {GIT_SSH_CMD},│   │   │  )                 │
         │    cleanup()          │   │   │                    │
         │  }                    │   │   │  Pure git.push()   │
         │                       │   │   │  No auth knowledge │
         │  DONE ONCE            │   │   └────────────────────┘
         └───────────────────────┘   │
                                     │
                    ┌────────────────▼──────────────────┐
                    │  LAYER 2: shared git-operations    │
                    │  gitOps.commit(repoPath, {         │
                    │    message, user, appGit            │
                    │  })                                │
                    │                                    │
                    │  Pure commit logic.                 │
                    │  No auth, no provider knowledge.    │
                    └────────────────────────────────────┘

                    ┌──────────────────────────────────────┐
                    │  File operations (shared util):       │
                    │  app-git-file-operations.util.ts      │
                    │                                      │
                    │  WriteAppFile()   ── lives in app-git │
                    │  getAppPath()     ── where it belongs │
                    │  updateAppMeta()  ── no cross-module  │
                    │  readAppJson()    ── calls             │
                    └──────────────────────────────────────┘

Improvements:
  ✓ SSH configs fetched 1x
  ✓ SSH key written 1x, deleted 1x
  ✓ Auth separated from git operations
  ✓ Service logic written once (shared util)
  ✓ File operations in correct module (app-git)
  ✓ Zero cross-module calls into git-sync
```

---

## 3. How Provider Services Change

### BEFORE: Each Provider Has Full Logic

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  SSH Service (433L)  │  │ HTTPS Service (350L) │  │ GitLab Service(420L)│
│                      │  │                      │  │                     │
│  checkSyncApp    37L │  │  checkSyncApp    33L │  │  checkSyncApp   33L │  ← SAME logic
│  gitPullAppInfo  35L │  │  gitPullAppInfo 102L │  │  gitPullAppInfo 55L │  ← DIFFERENT
│  createGitApp    57L │  │  createGitApp     1L │  │  createGitApp   54L │  ← SAME logic
│  gitPushApp      80L │  │  gitPushApp       1L │  │  gitPushApp     58L │  ← SAME logic
│  pullGitAppCh    89L │  │  pullGitAppCh     1L │  │  pullGitAppCh   87L │  ← SAME logic
│  renameApp       18L │  │  renameApp       32L │  │  renameApp      16L │  ← SAME logic
│  findAppGitCfg   16L │  │  findAppGitCfg   22L │  │  findAppGitCfg  21L │  ← SAME logic
│  7 stubs         30L │  │  7 delegates     14L │  │  7 stubs        30L │  ← stays
│                      │  │  2 unique        50L │  │                     │
└──────────────────────┘  └──────────────────────┘  └─────────────────────┘

  Total duplicated service logic: ~600 lines across 3 files
```

### AFTER: Providers Delegate to Shared Util

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  SSH Service (180L)  │  │ HTTPS Service (280L) │  │ GitLab Service(170L)│
│                      │  │                      │  │                     │
│  providerContext  20L│  │  providerContext  20L│  │  providerContext 20L│
│  checkSyncApp     1L │  │  checkSyncApp     1L │  │  checkSyncApp    1L │
│  gitPullAppInfo  35L │  │  gitPullAppInfo 102L │  │  gitPullAppInfo 55L │ ← stays unique
│  createGitApp     1L │  │  createGitApp     1L │  │  createGitApp    1L │
│  gitPushApp       1L │  │  gitPushApp       1L │  │  gitPushApp      1L │
│  pullGitAppCh     1L │  │  pullGitAppCh     1L │  │  pullGitAppCh    1L │
│  renameApp        1L │  │  renameApp        1L │  │  renameApp       1L │
│  findAppGitCfg    1L │  │  findAppGitCfg    1L │  │  findAppGitCfg   1L │
│  7 stubs         30L │  │  7 delegates     14L │  │  7 stubs        30L │
│                      │  │  2 unique        50L │  │                     │
└──────────┬───────────┘  └──────────┬───────────┘  └──────────┬──────────┘
           │                         │                          │
           │         all delegate to │                          │
           └─────────────┬───────────┴──────────────────────────┘
                         │
           ┌─────────────▼──────────────────────────────┐
           │  AppGitOperationsUtil (shared, ~300 lines)  │
           │                                             │
           │  checkSyncApp(user, version, orgId, ctx)    │
           │  createGitApp(user, body, ctx)               │
           │  gitPushApp(user, id, body, ver, remote, ctx)│
           │  pullGitAppChanges(user, body, appId, ctx)   │
           │  renameAppOrVersion(user, appId, dto, ctx)   │
           │  findAppGitConfigs(user, ver, orgId, ctx)    │
           │                                             │
           │  ctx = ProviderContext {                     │
           │    findAppGitByAppId,  ← provider-specific  │
           │    isEnabled,          ← provider-specific  │
           │    sensitiveKeyField,  ← provider-specific  │
           │    utilService,        ← provider-specific  │
           │    testConnection      ← provider-specific  │
           │  }                                          │
           └─────────────────────────────────────────────┘

  Duplicated logic: 0 lines (written once, used by all 3)
```

---

## 4. How Git Operations Change (Util Layer)

### BEFORE: Auth + Git Ops Mixed in Each Provider

```
┌─────────────────────────────────────────────────────────┐
│  SSH gitClone (27 lines)                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  findSSHConfigs()          ← auth                │   │
│  │  writeSSHKeyToFile()       ← auth                │   │
│  │  GIT_SSH_COMMAND = ...     ← auth                │   │
│  │  git.env(env).clone(...)   ← git op              │   │  Auth and git ops
│  │  cleanupSSHKeys()          ← auth cleanup        │   │  are INTERLEAVED
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  HTTPS gitClone (133 lines)                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  findHttpsConfigs()        ← auth                │   │
│  │  generateJWT()             ← auth                │   │
│  │  getInstallationToken()    ← auth                │   │
│  │  inject token into URL     ← auth                │   │
│  │  check SSL disabled?       ← auth                │   │
│  │  git.addConfig(sslVerify)  ← auth                │   │
│  │  git.clone(authUrl, ...)   ← git op              │   │  Same interleaving
│  │  git.addConfig(sslVerify)  ← auth cleanup        │   │  but 5x more auth
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  GitLab gitClone (25 lines)                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  findGitLabConfigs()       ← auth                │   │
│  │  getAuthenticatedUrl()     ← auth                │   │
│  │  git.clone(authUrl, ...)   ← git op              │   │  Same pattern
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### AFTER: Auth and Git Ops Separated (2 Layers)

```
LAYER 1 — Auth (provider-specific, each util service)
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  SSH getAuth()        │ │  HTTPS getAuth()      │ │  GitLab getAuth()    │
│                       │ │                       │ │                      │
│  findSSHConfigs()     │ │  findHttpsConfigs()   │ │  findGitLabConfigs() │
│  writeSSHKeyToFile()  │ │                       │ │  getAuthenticatedUrl│
│                       │ │  returns {            │ │                      │
│  returns {            │ │   getAuthUrl: () =>   │ │  returns {           │
│   url: gitUrl,        │ │     generateJWT() →   │ │   url: tokenUrl,    │
│   branch: gitBranch,  │ │     getToken() →      │ │   branch,           │
│   env: {GIT_SSH_CMD}, │ │     injectIntoUrl(),  │ │   cleanup: noop     │
│   cleanup:            │ │   branch,             │ │  }                   │
│     deleteKeyDir      │ │   rawUrl,             │ │                      │
│  }                    │ │   sslDisabled,        │ │                      │
│                       │ │   cleanup: unsetSSL   │ │                      │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬──────────┘
            │                         │                          │
            │   all return GitAuthResult                         │
            └─────────────┬───────────┴──────────────────────────┘
                          │
                          ▼
LAYER 2 — Git Operations (shared, provider-agnostic)
┌─────────────────────────────────────────────────────────┐
│  GitOperationsUtil (shared/git-operations.util.ts)       │
│                                                          │
│  clone(targetPath, url, branch, opts?)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  if opts.cleanExisting → rm existing dir          │   │
│  │  git = createGit(timeout: 60000)                  │   │
│  │  options = ['--depth', N, '--single-branch', ...] │   │
│  │  if opts.sslDisabled → add -c http.sslVerify=false│   │
│  │  if opts.env → git.env(opts.env)                  │   │
│  │  git.clone(url, targetPath, options)              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  commit(repoPath, opts)                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  git = createGit(repoPath)                        │   │
│  │  if skipEmpty && status.files.length === 0 →return │   │
│  │  git.addConfig('user.name', userName)             │   │
│  │  git.addConfig('user.email', userEmail)           │   │
│  │  git.add('.')                                     │   │
│  │  git.commit(message)                              │   │
│  │  update appGit.lastCommitId/Message/User          │   │
│  │  finally: git.raw --unset user.name/email         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  push(repoPath, branch, remote, opts?)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  git = createGit(repoPath)                        │   │
│  │  if opts.disableCredentialHelper → set config     │   │
│  │  if opts.sslDisabled → add -c http.sslVerify=false│   │
│  │  if opts.remoteUrl → git.remote set-url           │   │
│  │  if opts.env → git.env(opts.env)                  │   │
│  │  git.push(remote, branch)                         │   │
│  │  if opts.resetUrl → git.remote set-url back       │   │
│  │  finally: cleanup ssl/credential configs          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  KNOWS NOTHING ABOUT:                                    │
│  ✗ SSH keys           ✗ JWT tokens                       │
│  ✗ Octokit            ✗ GitLab access tokens             │
│  ✗ Provider configs   ✗ DB queries                       │
└──────────────────────────────────────────────────────────┘
```

---

## 5. File Operations — Before vs After

### BEFORE: App-Git Reaches Into Git-Sync Module

```
app-git/providers/ssh/service.ts
     │
     │  this.sshAppGitUtilityService.WriteAppFile(...)
     │  this.sshAppGitUtilityService.getAppPath(...)
     │  this.sshAppGitUtilityService.readAppJson(...)
     │  this.sshAppGitUtilityService.updateAppMeta(...)
     │
     └──► sshAppGitUtilityService extends BaseGitUtilService
              │
              │  inheritance chain:
              │  SSHAppGitUtilityService
              │    └── extends BaseGitUtilService (EE)     ← IN GIT-SYNC MODULE
              │          └── extends BaseGitUtilService (CE) ← IN GIT-SYNC MODULE
              │
              │  WriteAppFile() defined at:
              │  server/ee/git-sync/base-git-util.service.ts:154
              │  ^^^^^^^^^^^^^^^^^^^^
              │  WRONG MODULE — this is git-sync, not app-git
              │
              └──► Cross-module dependency
```

### AFTER: File Operations in Correct Module

```
app-git/providers/ssh/service.ts
     │
     │  delegates to shared util
     │
     └──► app-git/shared/app-git-operations.util.ts
              │
              │  this.fileOpsUtil.WriteAppFile(...)
              │  this.fileOpsUtil.getAppPath(...)
              │  this.fileOpsUtil.readAppJson(...)
              │  this.fileOpsUtil.updateAppMeta(...)
              │
              └──► app-git/shared/app-git-file-operations.util.ts
                        │
                        │  WriteAppFile()   ← IN APP-GIT MODULE ✓
                        │  getAppPath()     ← IN APP-GIT MODULE ✓
                        │  readAppJson()    ← IN APP-GIT MODULE ✓
                        │  updateAppMeta()  ← IN APP-GIT MODULE ✓
                        │
                        └──► No cross-module calls
```

---

## 6. Complete Request Flow — Before vs After

### BEFORE: SSH Push (Full Trace)

```
                    HTTP POST /app-git/push
                              │
                    ┌─────────▼──────────┐
                    │     Controller      │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   AppGitService     │
                    │   .gitPushApp()     │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────────┐
                    │ SourceControlProvider   │
                    │ .selectProvider('ssh')  │
                    └─────────┬──────────────┘
                              │
              ┌───────────────▼────────────────┐
              │  SSHAppGitService.gitPushApp()  │
              │  (ssh/service.ts — 80 lines)    │
              │                                 │
              │  1. findAppGitByIdSSH()         │──► AppGitRepository
              │  2. Validate isEnabled           │
              │  3. Create temp dir              │
              │  4. gitClone()                   │──► ssh/util ──► git-sync/util (SSH key)
              │  5. getAppPath()                 │──► git-sync/base-git-util (WRONG MODULE)
              │  6. WriteAppFile()               │──► git-sync/base-git-util (WRONG MODULE)
              │  7. updateAppMeta()              │──► git-sync/base-git-util (WRONG MODULE)
              │  8. gitCommit()                  │──► ssh/util (inline logic)
              │  9. gitPush()                    │──► ssh/util ──► git-sync/util (SSH key AGAIN)
              │  10. Save lastPushDate           │──► AppGitSync entity
              │  11. Cleanup temp dir            │
              └────────────────────────────────┘
```

### AFTER: SSH Push (Full Trace)

```
                    HTTP POST /app-git/push
                              │
                    ┌─────────▼──────────┐
                    │     Controller      │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   AppGitService     │
                    │   .gitPushApp()     │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────────┐
                    │ SourceControlProvider   │
                    │ .selectProvider('ssh')  │
                    └─────────┬──────────────┘
                              │
              ┌───────────────▼─────────────────┐
              │  SSHAppGitService.gitPushApp()   │
              │  (ssh/service.ts — 1 line)       │
              │                                  │
              │  return this.appGitOpsUtil        │
              │    .gitPushApp(..., this.ctx)     │
              └───────────────┬─────────────────┘
                              │ delegates
              ┌───────────────▼─────────────────┐
              │  AppGitOperationsUtil            │
              │  .gitPushApp()                   │
              │  (shared — ONE implementation)   │
              │                                  │
              │  1. ctx.findAppGitById()         │──► Provider-specific query
              │  2. ctx.isEnabled(orgGit)        │──► Provider-specific check
              │  3. Create temp dir              │
              │  4. ctx.utilService.gitClone()   │──► ssh/util.gitClone()
              │     └── getAuth() (1x)           │       └── Layer 1: auth
              │     └── gitOps.clone()           │       └── Layer 2: shared git op
              │     └── auth.cleanup()           │
              │  5. fileOpsUtil.getAppPath()     │──► app-git/shared (CORRECT MODULE)
              │  6. fileOpsUtil.WriteAppFile()   │──► app-git/shared (CORRECT MODULE)
              │  7. fileOpsUtil.updateAppMeta()  │──► app-git/shared (CORRECT MODULE)
              │  8. ctx.utilService.gitCommit()  │──► ssh/util.gitCommit()
              │     └── gitOps.commit()          │       └── Layer 2: shared git op
              │  9. ctx.utilService.gitPush()    │──► ssh/util.gitPush()
              │     └── getAuth() (1x)           │       └── Layer 1: auth
              │     └── gitOps.push()            │       └── Layer 2: shared git op
              │     └── auth.cleanup()           │
              │  10. Save lastPushDate           │──► AppGitSync entity
              │  11. Cleanup temp dir            │
              └─────────────────────────────────┘
```

---

## 7. Quick Reference: What Goes Where

| Concern | Before | After |
|---------|--------|-------|
| SSH key management | `git-sync/providers/ssh/util` (called from app-git) | `app-git/providers/ssh/util.getAuth()` |
| JWT + token generation | `git-sync/providers/https/util` (called from app-git) | `app-git/providers/https/util.getAuth()` |
| GitLab token URL | `git-sync/providers/gitlab/util` (called from app-git) | `app-git/providers/gitlab/util.getAuth()` |
| `git.clone()` / `git.push()` / `git.commit()` | Each provider's util (3 copies) | `app-git/shared/git-operations.util.ts` (1 copy) |
| `WriteAppFile`, `readAppJson`, etc. | `git-sync/base-git-util.service.ts` (wrong module) | `app-git/shared/app-git-file-operations.util.ts` |
| `checkSyncApp`, `gitPushApp`, etc. | Each provider's service (3 copies) | `app-git/shared/app-git-operations.util.ts` (1 copy) |
| `gitPullAppInfo` | Each provider's service (3 different implementations) | Each provider's service (stays — too diverged) |
| Branching methods (stubs) | SSH/GitLab service (throw NotFoundException) | Same (stays — extend later) |
