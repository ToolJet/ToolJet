# Part 3: Provider Strategy Pattern

## How Provider Selection Works

Two **identical** `SourceControlProviderService` classes exist (copy-pasted code):
- `server/ee/git-sync/source-control-provider.ts` — selects org-config services
- `server/ee/app-git/source-control-provider.ts` — selects app-git services

## The Selection Algorithm

```ts
async getSourceControlService(organizationId: string, gitType?: string) {
  const data = await this.organizationGitSyncRepository
    .findOrgGitByOrganizationId(organizationId);
  // loads relations: ['gitSsh', 'gitHttps', 'gitLab']

  // If gitType explicitly provided -> use it directly
  if ((!data && gitType) || (data && gitType)) {
    switch (gitType) {
      case 'github_ssh':   return this.sshGitHubService;
      case 'github_https': return this.httpsGitHubService;
      case 'gitlab':       return this.gitLabService;
      default:             return null;  // BUG: returns null!
    }
  }

  // No data AND no gitType -> default to SSH (for creation flow)
  if (!data && !gitType) return this.sshGitHubService;

  // Data exists, no gitType -> auto-detect from isEnabled flags
  if (data?.gitSsh?.isEnabled)   return this.sshGitHubService;
  if (data?.gitHttps?.isEnabled) return this.httpsGitHubService;
  if (data?.gitLab?.isEnabled)   return this.gitLabService;

  throw new BadRequestException('No Git Provider is enabled for the workspace');
}
```

## Decision Flow

```
getSourceControlService(orgId, gitType?)
         |
         +-- gitType provided?
         |     +-- YES -> switch(gitType) -> return matching service
         |     |         +-- unknown type -> return null (BUG!)
         |     |
         |     +-- NO, and no data exists?
         |           +-- YES -> return SSH (default for creation)
         |           |
         |           +-- NO (data exists) -> check isEnabled:
         |                 +-- gitSsh.isEnabled   -> SSH service
         |                 +-- gitHttps.isEnabled  -> HTTPS service
         |                 +-- gitLab.isEnabled    -> GitLab service
         |                 +-- none enabled        -> throw error
```

## The Full Inheritance Chain

### Utility Services (file I/O, git operations)

```
CE BaseGitUtilService (stubs)
  server/src/modules/git-sync/base-git-util.service.ts
    |
    v extends
EE BaseGitUtilService (shared logic: file I/O, meta.json, DB helpers)
  server/ee/git-sync/base-git-util.service.ts
    |
    v extends
+-------------------+--------------------+--------------------+
| SSHGitSync        | HTTPSGitSync       | GitLabGitSync      |
| UtilityService    | UtilityService     | UtilityService     |
| (SSH key ops)     | (Octokit + JWT)    | (got + token URL)  |
+-------------------+--------------------+--------------------+
```

### Business Services (org config + app operations)

```
CE BaseGitSyncService (stubs)
  server/src/modules/git-sync/base-git.service.ts
    |
    v extends
EE BaseGitSyncService (shared: getProviderConfigs, updateAppGitConfig)
  server/ee/git-sync/base-git.service.ts
    |
    v extends
+-------------------+--------------------+--------------------+
| SSHGitSync        | HTTPSGitSync       | GitLabGitSync      |
| Service           | Service            | Service            |
| (org config ops)  | (org config ops)   | (org config ops)   |
+-------------------+--------------------+--------------------+

+-------------------+--------------------+--------------------+
| SSHAppGit         | HTTPSAppGit        | GitLabAppGit       |
| Service           | Service            | Service            |
| (push/pull ops)   | (push/pull ops)    | (push/pull ops)    |
+-------------------+--------------------+--------------------+
```

## Shared Interface — Methods Every Org-Config Provider Implements

| Method | Purpose | Called By |
|--------|---------|----------|
| `createOrganizationGit(dto, manager?)` | Create org_git_sync + provider config row | `POST /git-sync` |
| `updateOrgGit(orgId, id, dto)` | Update provider-specific fields | `PUT /git-sync/:id` |
| `updateOrgGitStatus(orgId, id, dto)` | Toggle `isEnabled` | `PUT /git-sync/status/:id` |
| `deleteConfig(orgId, gitId)` | Delete provider row, reset autoCommit | `DELETE /git-sync/:id` |
| `setFinalizeConfig(userId, orgId, gitId, manager?)` | Test connection -> finalize | `PUT /git-sync/finalize/:id` |
| `saveProviderConfig(userId, orgId, configData)` | Create-if-needed -> save -> finalize | `POST /git-sync/configs` |
| `getOrgGitStatusById(userOrgId, orgId)` | Return enabled/finalized/id | `GET /git-sync/:id/status` |

**NOTE:** No formal TypeScript interface exists for these! Implemented by convention only.

## Shared Interface — Methods Every App-Git Provider Implements

| Method | Purpose |
|--------|---------|
| `checkSyncApp(user, version, orgId)` | Test connection, create app_git_sync if needed |
| `gitPushApp(user, appGitId, pushBody, version, remoteName?)` | Clone -> write -> commit -> push |
| `gitPullAppInfo(user, appId?)` | Clone -> read meta.json -> return metadata |
| `createGitApp(user, appMetaBody)` | Clone -> read app JSON -> import -> create app_git_sync |
| `pullGitAppChanges(user, appMetaBody, appId)` | Clone -> read app JSON -> update existing app |
| `renameAppOrVersion(user, appId, dto)` | Push with rename commit message |
| `findAppGitConfigs(user, version, orgId)` | Return app_git_sync config or org config |
| `updateAppGitConfiguration(user, appId, dto)` | Update `allowEditing` flag |

## Auth Differences Per Provider

| | SSH | HTTPS (GitHub App) | GitLab |
|---|---|---|---|
| **Credentials** | ed25519/RSA key pair | App ID + Installation ID + PEM key | Project Access Token |
| **Auth mechanism** | `GIT_SSH_COMMAND` env var with temp key file | JWT -> Octokit -> Installation Token -> URL | Token in URL: `oauth2:<token>@` |
| **Connection test** | `git fetch` + `git push --dry-run` | JWT + Installation Token + Octokit repo access | HTTP calls to GitLab API v4 |
| **Key storage** | Private key in DB, temp file per op | PEM in DB, JWT signed per op | Token in DB, in clone URL |
| **Libraries** | `simple-git`, `crypto`, `sshpk` | `simple-git`, `@octokit/rest`, `node-forge`, `jsonwebtoken` | `simple-git`, `got` |

## Key Files

| File | Purpose |
|------|---------|
| `server/ee/git-sync/source-control-provider.ts` | Org-config provider selector |
| `server/ee/app-git/source-control-provider.ts` | App-git provider selector (identical logic) |
| `server/src/modules/git-sync/repository.ts` | `OrganizationGitSyncRepository` |
| `server/ee/git-sync/providers/github-ssh/service.ts` | SSH org-config provider |
| `server/ee/git-sync/providers/github-ssh/util.service.ts` | SSH utility (key gen, test connection) |
| `server/ee/git-sync/providers/github-https/service.ts` | HTTPS org-config provider |
| `server/ee/git-sync/providers/github-https/util.service.ts` | HTTPS utility (Octokit, JWT) |
| `server/ee/git-sync/providers/gitlab/service.ts` | GitLab org-config provider |
| `server/ee/git-sync/providers/gitlab/util.service.ts` | GitLab utility (got, API v4) |
| `server/ee/app-git/providers/github-ssh/service.ts` | SSH app-git provider |
| `server/ee/app-git/providers/github-https/service.ts` | HTTPS app-git provider |
| `server/ee/app-git/providers/gitlab/service.ts` | GitLab app-git provider |

## Issues for Refactoring

1. **No shared interface** — Providers implement methods by convention, not by TypeScript interface. Only SSH has `IGithubSSHServiceInterface`.
2. **Duplicate `SourceControlProviderService`** — git-sync and app-git versions are copy-pasted
3. **`return null` bug** — Unknown `gitType` returns `null` instead of throwing error
4. **`(!data && gitType) || (data && gitType)` simplifies to just `gitType`**
5. **`getOrgGitStatusById` duplicated across providers** — Same logic, different table query
6. **All three app-git providers duplicate push/pull flow** — Only difference is which util service handles clone/push
