# Part 1: Database Schema & Entities

## The 5 Tables and Their Relationships

```
organization_git_sync (1 per workspace - the "hub")
  |-- OneToOne --> organization_git_ssh
  |-- OneToOne --> organization_git_https
  |-- OneToOne --> organization_gitlab
  |-- OneToMany --> app_git_sync[]
  |-- OneToOne --> organization
```

Only **one** of the three provider tables will have `isEnabled = true` at any time. Mutual exclusion is enforced at the service layer.

## Table 1: `organization_git_sync` — The Hub

**File:** `server/src/entities/organization_git_sync.entity.ts`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid PK | auto | Primary key |
| `organization_id` | string, NOT NULL | - | FK to the workspace |
| `auto_commit` | boolean | `false` | Auto-push on environment promotion |
| `is_branching_enabled` | boolean | `true` | Whether git branching feature is on |
| `schema_version` | string | `'1.0.0'` | Tracks app export schema version |
| `created_at` / `updated_at` | timestamp | `now()` | Standard timestamps |

**`GITConnectionType` enum** (defined in same file, lines 18-23):
```ts
export enum GITConnectionType {
  GITHUB_SSH = 'github_ssh',
  GITHUB_HTTPS = 'github_https',
  GITLAB = 'gitlab',
  DISABLED = 'disabled',
}
```

## Table 2: `organization_git_ssh` — SSH Provider Config

**File:** `server/src/entities/gitsync_entities/organization_git_ssh.entity.ts`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid PK | auto | - |
| `config_id` | FK -> `organization_git_sync.id` | - | Links to hub, **CASCADE DELETE** |
| `git_url` | string | - | SSH URL, e.g. `git@github.com:owner/repo.git` |
| `git_branch` | string | - | Target branch name |
| `ssh_private_key` | string | - | Generated PEM private key (stored in DB!) |
| `ssh_public_key` | string | - | Public key for user to add as deploy key |
| `key_type` | enum `['rsa', 'ed25519']` | `'ed25519'` | Key algorithm |
| `is_finalized` | boolean | `false` | Connection verified successfully |
| `is_enabled` | boolean | `false` | Currently active provider |

## Table 3: `organization_git_https` — GitHub App (HTTPS) Provider Config

**File:** `server/src/entities/gitsync_entities/organization_git_https.entity.ts`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid PK | auto | - |
| `config_id` | FK -> `organization_git_sync.id` | - | Links to hub |
| `https_url` | string | - | HTTPS repo URL |
| `github_branch` | string | - | Target branch |
| `github_app_id` | string | - | GitHub App ID |
| `github_installation_id` | string | - | GitHub App installation ID |
| `github_private_key` | string | - | GitHub App PEM private key |
| `github_enterprise_url` | string | `null` | For GitHub Enterprise Server |
| `github_enterprise_api_url` | string | `null` | GHE API base URL |
| `is_finalized` | boolean | `false` | Connection verified |
| `is_enabled` | boolean | `false` | Currently active |

## Table 4: `organization_gitlab` — GitLab Provider Config

**File:** `server/src/entities/gitsync_entities/organization_gitlab.entity.ts`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid PK | auto | - |
| `config_id` | FK -> `organization_git_sync.id` | - | Links to hub |
| `gitlab_url` | string | - | GitLab HTTPS repo URL |
| `gitlab_branch` | string | - | Target branch |
| `gitlab_project_id` | string | - | GitLab numeric project ID |
| `gitlab_project_access_token` | string | `null` | Project access token |
| `gitlab_enterprise_url` | string | `null` | Self-hosted GitLab URL |
| `is_finalized` | boolean | `false` | Connection verified |
| `is_enabled` | boolean | `false` | Currently active |

## Table 5: `app_git_sync` — Per-App Sync Tracking

**File:** `server/src/entities/app_git_sync.entity.ts`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid PK | auto | - |
| `organization_git_id` | FK -> `organization_git_sync.id` | - | Which workspace config |
| `app_id` | FK -> `apps.id` | - | Which ToolJet app (CASCADE DELETE, unique) |
| `version_id` | string, nullable | - | Local TJ version ID being synced |
| `git_app_name` | string, NOT NULL | - | App's folder name in git repo |
| `git_app_id` | string, NOT NULL | - | Key used in `.meta/meta.json` |
| `git_version_name` | string, nullable | - | Version filename in git (e.g. `v1`) |
| `git_version_id` | string, nullable | - | Version ID in git context |
| `last_commit_id` | string, nullable | - | SHA of last commit |
| `last_commit_message` | string, nullable | - | Last commit message |
| `last_commit_user` | string, nullable | - | Who made last commit |
| `last_push_date` | Date, nullable | - | When last pushed |
| `last_pull_date` | Date, nullable | - | When last pulled |
| `allow_editing` | boolean | `false` | Can this app both push AND pull? | // only used prop

**`allow_editing` determines UI mode:**
- `false` (default) = app was imported from git -> **pull-only** mode
- `true` = app can both push and pull -> **push+pull** mode

## How Data Flows Through These Tables

```
1. Admin configures git -> Creates 1 row in organization_git_sync
                        -> Creates 1 row in one provider table (ssh/https/gitlab)
                        -> Sets isFinalized=true, isEnabled=true after test

2. Dev pushes an app   -> Creates/updates 1 row in app_git_sync
                        -> Records commit SHA, message, user, push date

3. Dev pulls an app    -> Creates 1 row in app_git_sync (if new import)
                        -> Updates lastPullDate (if existing)

4. Admin switches provider -> Old provider: isEnabled=false
                           -> New provider: isEnabled=true
                           -> app_git_sync rows remain (they link to org_git_sync, not provider)
```

## Entity Inconsistencies (Refactoring Targets)

1. **SSH entity has duplicate relations** — `orgGit` and `orgGitSync` both point to the same FK (`config_id`)
2. **HTTPS entity has broken relation** — `orgGit` at line 46 lacks `@OneToOne` decorator
3. **GitLab entity is cleanest** — single `orgGitSync` relation, properly decorated
4. **SSH entity doesn't extend BaseEntity** — while HTTPS and GitLab do
5. **Column naming inconsistency** — SSH uses `git_branch`, HTTPS uses `github_branch`, GitLab uses `gitlab_branch`
6. **No encryption** — Private keys (SSH, GitHub App, GitLab token) are stored as plain text in the DB

## All Migrations

| Migration File | Description |
|----------------|-------------|
| `1693810306405-createAppGitTable.ts` | Initial `app_git_sync` table |
| `1695015661737-AddingOrganizationGitTablet.ts` | Initial `organization_git_sync` table |
| `1708320592518-AddAutoCommitColumnToOrgGitTable.ts` | Adds `auto_commit` column |
| `1708936138819-AddKeyTypeColumnsToOrgGit.ts` | Adds `key_type` enum column |
| `1742209024000-CreateTableGithubSSH.ts` | Creates `organization_git_ssh` table |
| `1742215405123-CreateTableGithubHTTPS.ts` | Creates `organization_git_https` table |
| `1742215921099-AddGitTypeEnumColumn.ts` | Adds `GITConnectionType` enum |
| `1744630818000-AddEnabledFlagAppGit.ts` | Adds `allow_editing` to app_git |
| `1746518671022-CreateTableGitLab.ts` | Creates `organization_gitlab` table |
| `1746526306001-AddGitLabEnum.ts` | Adds `gitlab` value to provider enum |
| `1747923859030-AddEnabledColumnProviderTable.ts` | Adds `is_enabled` to provider tables |
| `1748501592120-AddSSHBranchColumn.ts` | Adds `git_branch` to SSH table |
| `1761828716101-AddBranchingAndSchemaVersionToOrgGitSync.ts` | Adds `is_branching_enabled` + `schema_version` |
