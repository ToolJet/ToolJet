# Part 4: Org-Level Config Flow (Endpoints)

## All Endpoints

| # | Method | Route | Feature Key | Who Can Call |
|---|--------|-------|-------------|-------------|
| 1 | `GET` | `/git-sync/:id/status` | `GET_ORGANIZATION_GIT_STATUS` | **Any user** |
| 2 | `POST` | `/git-sync` | `CREATE_ORGANIZATION_GIT` | Admin/SuperAdmin |
| 3 | `POST` | `/git-sync/configs` | `SAVE_PROVIDER_CONFIGS` | Admin/SuperAdmin |
| 4 | `PUT` | `/git-sync/:id` | `UPDATE_PROVIDER_CONFIGS` | Admin/SuperAdmin |
| 5 | `PUT` | `/git-sync/finalize/:id` | `FINALIZE_CONFIGS` | Admin/SuperAdmin |
| 6 | `PUT` | `/git-sync/status/:id` | `UPDATE_ORGANIZATION_GIT_STATUS` | Admin/SuperAdmin |
| 7 | `DELETE` | `/git-sync/:id` | `DELETE_ORGANIZATION_GIT_CONFIGS` | Admin/SuperAdmin |
| 8 | `GET` | `/git-sync/:id` | `GET_ORGANIZATION_GIT` | Admin/SuperAdmin |

**Route order matters!** `GET :id` MUST be last because `:id` is a wildcard that matches `status`, `finalize`, `configs`.

## Authorization (CASL Ability)

**File:** `server/src/modules/git-sync/ability/index.ts`

```
Admin/SuperAdmin -> gets ALL 8 FEATURE_KEYs
Regular user     -> only gets GET_ORGANIZATION_GIT_STATUS
```

**Guard chain:** `Request -> JwtAuthGuard -> FeatureAbilityGuard`
- Reads `@InitModule(MODULES.GIT_SYNC)` and `@InitFeature(FEATURE_KEY.*)`
- Builds CASL ability via `FeatureAbilityFactory`

## DTOs

**Three sets exist (duplication issue):**

| DTO | File | Used For |
|-----|------|----------|
| `OrganizationGitCreateDto` | `server/src/dto/organization_git.dto.ts` | `POST /git-sync` (SSH only) |
| `OrganizationGitUpdateDto` | same file | `PUT /git-sync/:id` (gitUrl, autoCommit, keyType) |
| `OrganizationGitStatusUpdateDto` | same file | `PUT /git-sync/status/:id` (enable/disable) |
| `OrganizationGitHTTPSUpdateDto` | same file | **DEAD CODE - never used** |
| `OrganizationGitLabUpdateDto` | same file | **DEAD CODE - never used** |
| `ProviderConfigDTO` (CE) | `server/src/modules/git-sync/dto/provider-config.dto.ts` | CE stub |
| `ProviderConfigDTO` (EE) | `server/ee/git-sync/providers/dto/provider-config.dto.ts` | `POST /git-sync/configs` |

**`ProviderConfigDTO`** = union type: `GithubSshConfigDTO | GithubHttpsConfigDTO | GitLabConfigDTO`

All extend `BaseConfigDTO`:
- `gitType: GITConnectionType`
- `gitUrl: string`

Provider-specific fields:
- **SSH:** `branchName`, `keyType`, `sshPublicKey?`, `sshPrivateKey?`
- **HTTPS:** `branchName`, `githubAppId`, `githubAppInstallationId`, `githubAppPrivateKey`, `githubEnterpriseUrl?`, `githubEnterpriseApiUrl?`
- **GitLab:** `branchName`, `gitLabProjectId`, `gitLabProjectAccessToken`, `gitLabEnterpriseUrl?`

## Endpoint Flows

### Flow 1: Check Git Status (any user)

```
GET /git-sync/:id/status
  -> Validates: organizationId === userOrganizationId
  -> findOrgGitByOrganizationId(organizationId)
  -> If no config -> return undefined
  -> Check license: if !GIT_SYNC -> force isEnabled=false
  -> Return: { is_enabled, is_finalized, id }
```

### Flow 2: Create Git Config — SSH Only (Admin)

```
POST /git-sync?gitType=github_ssh
Body: { gitUrl: "git@github.com:owner/repo.git", gitType: "github_ssh" }
  -> Check/create OrganizationGitSync row
  -> Generate ed25519 key pair (Crypto.generateKeyPair)
  -> Create OrganizationGitSsh row (gitUrl, branch='main', keyType='ed25519')
  -> Delete sshPrivateKey from response
  -> Return: { org_git: { id, gitSsh: { sshPublicKey, ... } } }
```

User then copies public key to GitHub as deploy key.

### Flow 3: Save & Finalize Config — All Providers (Admin)

```
POST /git-sync/configs
  -> SourceControlProvider.getSourceControlService(null, gitType)
  -> strategy.saveProviderConfig(userId, orgId, configData)
     -> Create org if needed
     -> Save provider config
     -> testGitConnection()
     -> Set isFinalized=true, isEnabled=true
```

This is the main "Save Changes" endpoint. Does everything: create, save, test, finalize.

### Flow 4: Update Config (Admin)

```
PUT /git-sync/:id?gitType=...
  -> SSH: autoCommit update OR gitUrl/keyType -> regenerate keys
  -> HTTPS: update GitHub App fields
  -> GitLab: update project fields
```

### Flow 5: Enable/Disable Provider (Admin)

```
PUT /git-sync/status/:id
Body: { isEnabled: false, gitType: "github_ssh" }
  -> validateGitProviderConflict() — only one provider active at a time
  -> Update provider table: isEnabled = dto.isEnabled
```

### Flow 6: Delete Config (Admin)

```
DELETE /git-sync/:id?gitType=github_ssh
  -> Delete provider config row (NOT the org_git_sync hub row)
  -> Set autoCommit = false
```

### Flow 7: Get Full Config (Admin)

```
GET /git-sync/:id
  -> BaseGitSyncService.getProviderConfigs() — BYPASSES strategy pattern
  -> findOne(OrganizationGitSync, { relations: ['gitSsh', 'gitHttps', 'gitLab'] })
  -> Delete sshPrivateKey, detect active gitType
  -> Return: { organization_git: { id, autoCommit, gitSsh, gitHttps, gitLab, gitType } }
```

## Complete Lifecycle (Admin UI)

```
Admin opens Workspace Settings -> Configure Git
  |
  +-- 1. GET /git-sync/:orgId/status -> is configured?
  |
  +-- 2. Select provider card (SSH / HTTPS / GitLab)
  |      |
  |      +-- SSH: POST /git-sync -> get public key -> add to GitHub
  |      |        POST /git-sync/configs -> test + finalize
  |      |
  |      +-- HTTPS: POST /git-sync/configs -> test + finalize
  |      |
  |      +-- GitLab: POST /git-sync/configs -> test + finalize
  |
  +-- 3. Provider active (isEnabled=true, isFinalized=true)
  +-- 4. Toggle auto-commit: PUT /git-sync/:id { autoCommit: true }
  +-- 5. Disable: PUT /git-sync/status/:id { isEnabled: false }
  +-- 6. Delete: DELETE /git-sync/:id?gitType=...
  +-- 7. Switch: Delete old -> Configure new
```

## Issues for Refactoring

1. **SSH two-step vs HTTPS/GitLab one-step** — SSH needs key display, others don't
2. **`POST /git-sync/configs` and `PUT /git-sync/finalize/:id` are identical** — Both call `saveProviderConfig()`
3. **Duplicate DTO files** — CE and EE versions of `ProviderConfigDTO`
4. **Dead DTOs** — `OrganizationGitHTTPSUpdateDto`, `OrganizationGitLabUpdateDto` never used
5. **No `gitType` query param validation** — Raw string, no enum check at controller level
