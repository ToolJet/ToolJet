# Part 5: App Push/Pull Flow

## App-Git Module Endpoints

**File:** `server/ee/app-git/controller.ts`

| # | Method | Route | Purpose |
|---|--------|-------|---------|
| 1 | `POST` | `/app-git/gitpush/:appGitId/:versionId` | **Push** app to git |
| 2 | `GET` | `/app-git/gitpull` | Get all apps from git (meta) |
| 3 | `GET` | `/app-git/gitpull/app/:appId` | Check for updates on one app |
| 4 | `POST` | `/app-git/gitpull/app` | **Import** (create) app from git |
| 5 | `POST` | `/app-git/gitpull/app/:appId` | **Pull** updates for existing app |
| 6 | `GET` | `/app-git/:workspaceId/app/:versionId` | Check sync status / init sync |
| 7 | `PUT` | `/app-git/app/:appId/rename` | Rename app/version in git |
| 8 | `PUT` | `/app-git/:appId/configs` | Update app git settings (allowEditing) |
| 9 | `GET` | `/app-git/:workspaceId/app/:versionId/configs` | Get app git configs (public) |

## DTOs

**File:** `server/src/modules/app-git/dto/index.ts`

```ts
AppGitPushDto {
  gitAppName: string       // folder name in git
  versionId: string        // TJ version ID
  lastCommitMessage: string // user-entered commit message
  gitVersionName: string   // filename in git (e.g., "v1")
}

AppGitPullDto {
  gitAppId: string
  gitVersionId: string
  lastCommitMessage: string
  lastCommitUser: string
  lastPushDate: string
  organizationGitId: string
  gitAppName: string
  gitVersionName: string
  appName: string
  allowEditing?: boolean
}

AppGitPullUpdateDto {
  gitVersionId: string
  lastCommitMessage: string
  lastCommitUser: string
  lastPushDate: string
  gitAppName: string
  gitVersionName: string
}

AppGitUpdateDto {
  allowEditing: boolean
}
```

## Flow A: Push App to Git

**Endpoint:** `POST /app-git/gitpush/:appGitId/:versionId`
**Guards:** `JwtAuthGuard -> AppResourceGuard -> FeatureAbilityGuard`

### Complete Push Flow (SSH provider)

```
POST /app-git/gitpush/:appGitId/:versionId
  |
  +-- 1. VALIDATE
  |     appGitRepository.findAppGitByIdSSH(appGitId)
  |       -> loads: AppGitSync + orgGit + gitSsh
  |     Check: appGit exists? -> else "Need to set up app git info"
  |     Check: gitSsh.isEnabled? -> else "Git is not enabled"
  |
  +-- 2. PREPARE TEMP DIRECTORY
  |     gitRepoPath = "tooljet/gitsync/{userId}-{orgId}-{appName}-pushing-{timestamp}"
  |     fs.mkdirSync(gitRepoPath, { recursive: true })
  |
  +-- 3. CLONE (shallow, single branch)
  |     sshAppGitUtilityService.gitClone(gitRepoPath, orgGit)
  |       -> Write SSH private key to temp file
  |       -> GIT_SSH_COMMAND = "ssh -i <keyfile> -o StrictHostKeyChecking=no"
  |       -> simpleGit().clone(gitUrl, path, ['--depth', '1', '--branch', branch])
  |
  +-- 4. WRITE APP FILE
  |     baseGitUtilService.WriteAppFile(user, repoPath, appGit, version, app)
  |       -> importExportResourcesService.export(user, exportDto)
  |          Returns: { app: [...], tooljet_database: [...] }
  |       -> Handle renames (folder/file rename if names changed)
  |       -> Update appGit record (gitAppName, gitVersionName, versionId)
  |       -> Write: {repoPath}/{gitAppName}/{gitVersionName}.json
  |
  +-- 5. WRITE META FILE
  |     baseGitUtilService.writeMetaFile(user, repoPath, appGit, body)
  |       -> Read/create .meta/meta.json
  |       -> Update entry keyed by gitAppId
  |       -> Write back
  |
  +-- 6. GIT COMMIT
  |     gitCommit(repoPath, commitMessage, user, appGit)
  |       -> git config user.name/email
  |       -> git add .
  |       -> git commit "Version {versionName} of {appName} : {message}"
  |       -> Capture: lastCommitId, lastCommitMessage, lastCommitUser
  |
  +-- 7. GIT PUSH
  |     gitPush(repoPath, appGit, 'origin')
  |       -> Write SSH key to temp file (again!)
  |       -> simpleGit().push('origin', branch)
  |       -> Cleanup SSH key temp file
  |
  +-- 8. ON SUCCESS
  |     -> deleteDir(gitRepoPath)
  |     -> appGit.lastPushDate = new Date()
  |     -> manager.save(AppGitSync, appGit)
  |
  +-- 9. ON ERROR / FINALLY
        -> deleteDir(gitRepoPath)
        -> Map errors: BRANCH_NOT_FOUND, BRANCH_NAME_MISMATCH, GENERIC_CLONE_ERROR
```

## Git Repository File Structure

```
<repo-root>/
+-- .meta/
|   +-- meta.json              <- Maps appId -> metadata
+-- MyApp/                     <- Folder per app (gitAppName)
|   +-- v1.json                <- JSON per version (gitVersionName)
+-- AnotherApp/
|   +-- v1.json
|   +-- v2.json
```

**meta.json:**
```json
{
  "app-uuid-1": {
    "gitAppName": "MyApp",
    "gitVersionId": "v1",
    "gitVersionName": "v1",
    "lastCommitMessage": "Initial commit",
    "lastpushDate": "2025-01-15T...",
    "lastCommitUser": "John"
  }
}
```

**App JSON file** (e.g., `MyApp/v1.json`):
```json
{
  "app": [{ /* full app definition */ }],
  "tooljet_database": [{ /* TJ DB table definitions */ }],
  "tooljet_version": "3.5.0"
}
```

## Flow B: Check Sync / Init App Git Record

**Endpoint:** `GET /app-git/:workspaceId/app/:versionId`

```
  +-- 1. Find existing app_git_sync for this app
  |
  +-- 2A. EXISTS:
  |     -> Test connection
  |     -> If OK -> return appGit (private key deleted)
  |     -> If fail -> return connection error
  |
  +-- 2B. DOESN'T EXIST:
        -> Find org git config
        -> Test connection
        -> If OK -> CREATE new app_git_sync:
          { gitAppName: app.name, gitAppId: app.id,
            organizationGitId: orgGit.id, appId: app.id,
            allowEditing: true }
        -> Return new appGit
```

**Key insight:** Creates app_git_sync on first access. Tests connection EVERY modal open.

## Flow C: Pull App Info (Read-only metadata)

**Endpoint:** `GET /app-git/gitpull` (all apps) or `GET /app-git/gitpull/app/:appId` (one app)

```
  -> Clone repo to temp path
  -> Read .meta/meta.json
  -> For each app in meta: check if app name EXISTS in workspace
  -> Return: { metaData, orgGit } (with private keys deleted)
  -> Cleanup temp dir
```

## Flow D: Import App from Git (Create)

**Endpoint:** `POST /app-git/gitpull/app`

```
  -> Clone repo
  -> readAppJson(appName, versionName, repoPath)
  -> checkVersionCompatibility(tooljet_version)
  -> importExportResourcesService.import(user, importDto, false, true)
     -> Creates the app via standard import
  -> Create app_git_sync record
  -> Return app
```

## Flow E: Pull Updates for Existing App

**Endpoint:** `POST /app-git/gitpull/app/:appId`

```
  -> Clone repo
  -> readAppJson(appName, versionName)
  -> Import ToolJet DB tables (with overwrite=true)
  -> validateAppJsonForImport (schema unification)
  -> Find matching version by name
     -> If exists: DELETE old version first
  -> Keep app.name and app.slug unchanged
  -> setupImportedAppAssociations() + updateEntityReferencesForImportedApp()
  -> Update app_git_sync record (lastPullDate, versionId, etc.)
```

**Conflict strategy:** No merge — version is DELETED and re-imported.

## Flow F: Rename App/Version in Git

**Endpoint:** `PUT /app-git/app/:appId/rename`
**Also triggered by events:** `app-rename-commit`, `version-rename-commit`

```
  -> Build commit message: "App {prev} is renamed to {new}"
  -> Call gitPushApp() (full push flow handles the rename in WriteAppFile)
```

## Issues for Refactoring

1. **SSH key written twice per push** — Once in gitClone, again in gitPush
2. **Connection tested every modal open** — Slow, unnecessary if verified recently
3. **No git diff check before push** — Always clones/writes/commits even if nothing changed
4. **Mixed error handling** — .then/.catch chained inside try/catch/finally; cleanup runs twice on error
5. **`gitVersionId = gitVersionName`** — Always same value in DB, redundant column
6. **All 3 providers duplicate push/pull flow** — Only util service differs
7. **Synchronous I/O** — fs.mkdirSync, fs.existsSync, fs.readFileSync block event loop
8. **No concurrency protection** — Two users pushing same app simultaneously could corrupt repo
9. **Pull deletes version then re-imports** — Destructive strategy, no merge
