# Part 8: Pull Flow (Detailed)

## Pull-Related Endpoints

| # | Method | Route | Purpose | Service Method |
|---|--------|-------|---------|----------------|
| 1 | `GET` | `/app-git/gitpull` | Get all apps from git repo | `gitPullAppInfo(user)` |
| 2 | `GET` | `/app-git/gitpull/app/:appId` | Check for updates on one app | `gitPullAppInfo(user, appId)` |
| 3 | `POST` | `/app-git/gitpull/app` | Import (create) new app from git | `createGitApp(user, body)` |
| 4 | `POST` | `/app-git/gitpull/app/:appId` | Pull updates for existing app | `pullGitAppChanges(user, body, appId)` |

## Flow A: Get Pull Info (Read Metadata)

**Endpoint:** `GET /app-git/gitpull` or `GET /app-git/gitpull/app/:appId`
**Method:** `SSHAppGitService.gitPullAppInfo()` (line 91-141)

```
GET /app-git/gitpull
  │
  ├── 1. VALIDATE
  │     findOrgGitByOrganizationId(user.organizationId)
  │     Check: orgGit exists? → else "Git Configuration does not exist"
  │     Check: gitSsh.isEnabled? → else "Git Sync is not enabled"
  │
  ├── 2. CLONE REPO (shallow)
  │     gitRepoPath = "tooljet/gitsync/{userId}-{orgId}-{timestamp}"
  │     sshAppGitUtilityService.gitClone(gitRepoPath, orgGit)
  │
  ├── 3. READ META FILE
  │     .meta/meta.json → parse JSON
  │
  ├── 4. CHECK APP EXISTENCE (for each app in meta)
  │     appUtilService.findByAppName(gitAppName, orgId)
  │     → Enriches with appNameExist: 'EXIST' | 'NOT_EXIST'
  │
  ├── 5. SINGLE APP MODE (if appId provided)
  │     Find app_git_sync record by appId
  │     Check: gitAppId exists in metaData? → else "App is not present in git repo"
  │     Filter metaData to just that app entry
  │
  └── 6. CLEANUP & RETURN
        deleteDir(gitRepoPath)
        Delete orgGit.gitSsh.sshPrivateKey (security)
        Return: { metaData, orgGit }
```

**Return shape (all apps):**
```json
{
  "metaData": {
    "app-uuid-1": {
      "gitAppName": "MyApp",
      "gitVersionId": "v1",
      "gitVersionName": "v1",
      "lastCommitMessage": "Initial commit",
      "lastpushDate": "2025-01-15T...",
      "lastCommitUser": "John",
      "appNameExist": "EXIST"
    },
    "app-uuid-2": { ... }
  },
  "orgGit": { /* org git config without private key */ }
}
```

**Return shape (single app):**
```json
{
  "metaData": {
    "gitAppName": "MyApp",
    "gitVersionId": "v1",
    ...
    "appNameExist": "EXIST"
  },
  "orgGit": { ... }
}
```

## Flow B: Import App from Git (Create New)

**Endpoint:** `POST /app-git/gitpull/app`
**Method:** `SSHAppGitService.createGitApp()` (line 142-199)
**Body:** `AppGitPullDto` (all metadata from meta.json)

```
POST /app-git/gitpull/app
Body: { gitAppId, gitVersionId, gitVersionName, gitAppName, appName,
        lastCommitMessage, lastCommitUser, lastPushDate,
        organizationGitId, allowEditing }
  │
  ├── 1. GET ORG CONFIG
  │     findOrgGitByOrganizationId(user.organizationId)
  │
  ├── 2. CLONE REPO
  │     sshAppGitUtilityService.gitClone(gitRepoPath, orgGit)
  │
  ├── 3. READ APP JSON
  │     readAppJson(user, appName, versionName, gitRepoPath)
  │       → reads {gitRepoPath}/{appName}/{versionName}.json
  │       → deletes clone dir (side effect!)
  │       → returns { app: [...], tooljet_database: [...], tooljet_version }
  │
  ├── 4. VERSION COMPATIBILITY CHECK
  │     checkVersionCompatibility(tooljet_version)
  │       → rejects if app from newer ToolJet version
  │
  ├── 5. IMPORT (standard import pipeline)
  │     importExportResourcesService.import(user, importDto, false, true)
  │       → arg3: false = not cloning
  │       → arg4: true = git import mode
  │     Wrapped in catchDbException for APP_NAME_UNIQUE constraint
  │
  ├── 6. CREATE APP_GIT_SYNC RECORD
  │     createAppGit({
  │       gitAppName, gitAppId, lastCommitUser, gitVersionName,
  │       gitVersionId, organizationGitId, lastCommitMessage,
  │       appId: app.id,
  │       lastPullDate: new Date(),
  │       lastPushDate: new Date(body.lastPushDate),
  │       versionId: app.editingVersion.id,
  │       allowEditing: body.allowEditing
  │     })
  │
  └── 7. RETURN: app entity
```

**Key detail:** `allowEditing` from the body controls whether the imported app is in push mode or pull-only mode.

## Flow C: Pull Updates for Existing App (DESTRUCTIVE)

**Endpoint:** `POST /app-git/gitpull/app/:appId`
**Method:** `SSHAppGitService.pullGitAppChanges()` (line 279-366)
**Body:** `AppGitPullUpdateDto`

```
POST /app-git/gitpull/app/:appId
Body: { gitVersionId, gitVersionName, gitAppName,
        lastCommitMessage, lastCommitUser, lastPushDate }
  │
  ├── 1. FIND EXISTING APP GIT RECORD
  │     appGitRepository.findAppGitByAppId(appId)
  │     orgGit = appGit.orgGit
  │
  ├── 2. CLONE REPO → READ APP JSON
  │     gitClone(gitRepoPath, orgGit)
  │     readAppJson(user, appName, versionName, gitRepoPath)
  │
  ├── 3. IMPORT TJ DB TABLES (overwrite=true) ⚠️
  │     For each table in tooljet_database:
  │       tooljetDbImportExportService.import(orgId, tjdbDto, true)
  │       Silently replaces existing tables
  │
  ├── 4. VALIDATE & UNIFY APP SCHEMA
  │     validateAppJsonForImport(appJson.definition, appName)
  │       → handle appV2 format
  │       → convert single-page to multi-page if needed
  │
  ├── 5. DB TRANSACTION:
  │     ├── 5a. Find version with matching name
  │     ├── 5b. DELETE that version entirely ⚠️
  │     ├── 5c. Preserve app name + slug (don't overwrite)
  │     ├── 5d. UpdateGitApp (metadata)
  │     ├── 5e. setupImportedAppAssociations
  │     └── 5f. updateEntityReferencesForImportedApp
  │
  ├── 6. UPDATE APP_GIT_SYNC RECORD
  │     lastPullDate = now, new versionId, commit info
  │
  └── 7. RETURN: app (reloaded)
```

## Conflict Resolution Strategy

**There is NO conflict resolution.** The pull strategy is:
1. Find version with matching name
2. **DELETE the entire version** from the database
3. Re-import the version from git

This means:
- Any local changes to that version are **permanently lost**
- No diff, no merge, no user prompt
- The transaction wraps steps 5a-5f, so if import fails after delete, the version deletion is also rolled back

## Key Helper Methods

| Helper | File | What it does |
|--------|------|-------------|
| `readAppJson` | `base-git-util.service.ts:65` | Reads `{app}/{version}.json`, **deletes clone dir as side effect** |
| `validateAppJsonForImport` | `base-git-util.service.ts:78` | Handles appV2 unwrap, single→multi page conversion |
| `checkVersionCompatibility` | `base-git-util.service.ts:237` | Rejects imports from newer ToolJet versions |

## Data Flow Diagram

```
Frontend (GitSyncModal)                     Backend
  │                                           │
  │  GET /app-git/gitpull                     │
  │  ─────────────────────────────────────>   │
  │                                           │ Clone repo
  │                                           │ Read .meta/meta.json
  │                                           │ Check app names exist
  │                                           │ Cleanup clone
  │  <─────────────────────────────────────   │
  │  { metaData, orgGit }                     │
  │                                           │
  │  User selects app to import               │
  │                                           │
  │  POST /app-git/gitpull/app                │  (NEW app)
  │  Body: { all meta fields, appName }       │
  │  ─────────────────────────────────────>   │
  │                                           │ Clone repo
  │                                           │ Read {app}/{version}.json
  │                                           │ Version compat check
  │                                           │ Import app + TJ DB tables
  │                                           │ Create app_git_sync record
  │  <─────────────────────────────────────   │
  │  { app }                                  │
  │                                           │
  │  --- OR ---                               │
  │                                           │
  │  POST /app-git/gitpull/app/:appId         │  (UPDATE existing)
  │  Body: { version meta fields }            │
  │  ─────────────────────────────────────>   │
  │                                           │ Clone repo
  │                                           │ Read app JSON
  │                                           │ Import TJ DB (overwrite)
  │                                           │ Delete matching version ⚠️
  │                                           │ Re-import version
  │                                           │ Update app_git_sync
  │  <─────────────────────────────────────   │
  │  { app }                                  │
```

## Issues for Refactoring

1. **Destructive pull** — Version deleted before re-import; no merge/diff/conflict resolution
2. **`readAppJson` deletes clone dir** — Side effect hidden inside a "read" method
3. **Synchronous file I/O** — `readFileSync`, `existsSync`, `mkdirSync` block event loop
4. **No git diff check** — Always does full clone even for "check for updates" flow
5. **`appNameExist` uses string values** — `'EXIST'` / `'NOT_EXIST'` instead of boolean
6. **Clone per operation** — Each pull info request clones the entire repo just to read meta.json
7. **`hasOwnProperty` with eslint-disable** — Should use `Object.hasOwn()` or `in` operator
8. **Missing cleanup edge case in createGitApp** — readAppJson already deleted clone, catch block also tries
9. **No pagination for pull info** — Returns all metadata at once for large repos
10. **TJ DB import with overwrite=true** — Silently overwrites database tables on pull
