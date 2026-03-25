# Branching Business Logic Analysis — What's Reusable vs Provider-Specific

**Branch:** `refactor/git-sync` | **Date:** 2026-03-12

---

## Context

Post-refactor (Phases 1-7.5), all branching code lives exclusively in HTTPS `util.service.ts` (~530 lines, 40% of the file). SSH/GitLab have stubs that throw `NotFoundException`.

This document breaks down each branching method into its component concerns to identify:
1. What is **git transport** (provider-specific API calls)
2. What is **reusable business logic** (provider-agnostic, trapped in HTTPS today)
3. What belongs in the **shared ops util** vs a **new business util**

### Design Constraints
- `AppGitOperationsUtil` = git orchestration ONLY (clone, checkout, commit, push with branch awareness)
- SSH/GitLab = don't break current behavior (no branching today)
- Future-proof = when SSH/GitLab need branching, they implement transport only, reuse all business logic

---

## 1. Method-by-Method Breakdown

### 1.1 `pullLatestChangesWithBranching` (L385-608, ~216 lines)

| Line Range | What It Does | Category |
|-----------|-------------|----------|
| L399-402 | `gitClone(path, orgGit, targetBranch)` + `checkoutCommitHash()` | **Git transport** |
| L407-419 | Find `WorkspaceBranch` by name, `deserializeWorkspaceResources()` | **Business logic** — workspace-level resource sync (data sources, constants, folders) |
| L425-435 | `resolvedAppName()` + rename tracking (update `appGit.gitAppName`, `app.name`) | **Reusable business logic** — app name resolution works the same regardless of provider |
| L437-454 | `readAppFromDistributedStructure()` + `readGitHistoryMetadata()` | **Reusable** — file operations, already in `AppGitFileOperationsUtil` |
| L455-462 | `tooljetDbImportExportService.import()` for each ToolJet DB table | **Business logic** — TJ database import, same for all providers |
| L464-467 | `validateAppJsonForImport()`, `extractMajorVersion()`, schema checks | **Reusable** — validation, already in file ops util |
| L468+ | Version resolution, delete existing version, `UpdateGitApp`, `setupImportedAppAssociations` | **Business logic** — app import/version management, same for all providers |

**Verdict:** Git part = 2 lines (clone + checkout). Everything else is ToolJet app import orchestration identical for all providers.

---

### 1.2 `gitPushApp` (L610-697, ~87 lines)

| Line Range | What It Does | Category |
|-----------|-------------|----------|
| L617-621 | Fetch appGit, orgGit, httpsConfigs | **Provider-specific lookup** |
| L624-635 | Compute `targetBranch` from `isBranchingEnabled`, `versionType`, `allowMasterPush` | **Reusable business logic** — branch selection rules are provider-agnostic |
| L645-655 | `testBranchExistence` via Octokit, auto-create if missing (non-branching), throw if missing (branching) | **Git transport** (GitHub-specific API) |
| L656-666 | Clone, write files, commit | **Git transport** — already in shared ops |
| L668-686 | Push to targetBranch, save `lastPushDate` only if pushing to default branch | **Reusable business logic** — "only update appGit metadata on default branch push" applies to all providers |

**Verdict:** Branch selection logic (L624-635) and metadata-save rule (L671-680) are provider-agnostic business rules.

---

### 1.3 `getAllBranches` (L979-1065, ~86 lines)

| Line Range | What It Does | Category |
|-----------|-------------|----------|
| L984-1002 | Fetch remote branches via Octokit `listBranches` | **Git transport** (GitHub-specific) |
| L1003-1004 | Fetch app versions from DB, create `versionMap` | **Business logic** — maps git branches to TJ versions |
| L1006-1018 | Filter branches matching version names, enrich with `versionId`/`createdAt`/`createdBy` | **Reusable business logic** — "match remote branches to local versions" works the same given any `RemoteBranch[]` |
| L1020-1035 | Find local versions without corresponding remote branches | **Reusable business logic** |
| L1037-1059 | Add master/default branch entry with draft version | **Reusable business logic** |

**Verdict:** Octokit call is transport (~20 lines). Branch-to-version matching and enrichment (~60 lines) is completely reusable — give it a `RemoteBranch[]` from any provider and it works unchanged.

---

### 1.4 `getPullRequests` (L895-977, ~82 lines)

| Line Range | What It Does | Category |
|-----------|-------------|----------|
| L896-908 | Fetch app, orgGit, parse owner/repo, get Octokit | **Provider-specific** |
| L910-958 | GraphQL query + pagination to fetch all PRs | **Git transport** (GitHub-specific, no SSH equivalent) |
| L960-976 | Filter PRs by app name prefix, map to response shape | **Reusable business logic** — filtering + mapping is provider-agnostic given a `RawPR[]` |

**Verdict:** GraphQL is 100% GitHub. Filter/map logic (~15 lines) is reusable if each provider returns a normalized PR list.

---

### 1.5 `createGitTag` (L699-778, ~78 lines)

| Line Range | What It Does | Category |
|-----------|-------------|----------|
| L700-728 | Fetch app, appGit, versions, orgGit, httpsConfigs, Octokit | **Provider-specific lookup** |
| L730-736 | Get latest commit SHA from branch via Octokit | **Git transport** |
| L737-739 | `normalizeGitTag()`, build `fullTagName = appName/versionName` | **Reusable business logic** — tag naming convention is provider-agnostic |
| L742-770 | Check if tag exists, create annotated tag via Octokit | **Git transport** (GitHub-specific) |
| L773-776 | `snapshotDataSourcesForVersion()` — clone DataSourceVersions + options | **Business logic** — pure DB, zero git, same for all providers |

**Verdict:** Tag naming + DS snapshot are reusable. Octokit calls are transport.

---

### 1.6 `checkTagExists` (L821-893, ~72 lines)

Similar structure to `createGitTag`:
- Provider-specific lookup + Octokit `getRef` check = transport
- Tag name construction (`normalizeGitTag`) = reusable

---

### 1.7 `createBranch` (L1067-1111, ~44 lines)

| What It Does | Category |
|-------------|----------|
| Parse owner/repo, get Octokit | **Provider-specific** |
| Get base branch SHA via `git.getRef` | **Git transport** |
| Create ref via `git.createRef` | **Git transport** |

**Verdict:** Nearly 100% GitHub transport. When SSH needs this: `git push origin HEAD:refs/heads/<branch>`.

---

### 1.8 `deleteGitBranch` (L1113-1143, ~30 lines)

| What It Does | Category |
|-------------|----------|
| Default branch guard (`branchName === githubBranch`) | **Reusable business logic** |
| Delete ref via Octokit | **Git transport** |

**Verdict:** The "cannot delete default branch" guard is reusable.

---

### 1.9 Helper Methods

| Method | Lines | Category |
|--------|-------|----------|
| `checkoutCommitHash` (L1145-1164) | 20 | **Git transport** — pure `simpleGit`, NOT GitHub-specific. Usable by all providers. |
| `createGitTagWithRef` (L1166-1213) | 47 | **Git transport** — GitHub Octokit only |
| `normalizeGitTag` (L1214-1219) | 5 | **Reusable** — pure string util |
| `snapshotDataSourcesForVersion` (L785-814) | 30 | **Business logic** — pure DB (DataSourceVersion), zero git |

---

## 2. Reusable Business Logic Catalog

Six blocks of business logic currently trapped inside HTTPS that are **identical across providers**:

### A. Branch-Version Matching (~60 lines)

```
Input:  RemoteBranch[] (from any provider's transport)
Output: enriched branches with versionId, createdAt, createdBy, missing local branches
```

**Used by:** `getAllBranches`
**Reusable because:** Given a normalized `RemoteBranch[]` from Octokit, `git ls-remote`, or GitLab API, the matching logic is identical.

### B. Target Branch Selection Rules (~15 lines)

```
Input:  isBranchingEnabled, versionType, allowMasterPush, defaultBranch, versionName
Output: targetBranch string
```

**Used by:** `gitPushApp`
**Reusable because:** Pure business rules — no git, no API. The decision tree is:
1. If branching disabled → use `defaultBranch`
2. If branching enabled AND version is `VERSION` type → use `defaultBranch` (if `allowMasterPush`)
3. If branching enabled AND version is `BRANCH` type → use `versionName` as branch

### C. Push Metadata Save Rule (~10 lines)

```
Input:  targetBranch, defaultBranch, appGit, pushBody
Output: updated appGit record (or no-op if not pushing to default branch)
```

**Used by:** `gitPushApp`
**Reusable because:** The rule "only update lastPushDate/versionId when pushing to the default branch" is provider-agnostic.

### D. Tag Naming Convention (~5 lines)

```
normalizeGitTag(input) → lowercase, replace special chars with '-'
buildFullTagName(appName, versionName) → `${normalize(appName)}/${normalize(versionName)}`
```

**Used by:** `createGitTag`, `checkTagExists`
**Reusable because:** Pure string transformation, no provider dependency.

### E. DataSource Snapshot (~30 lines)

```
snapshotDataSourcesForVersion(appVersionId, branchId)
→ Clone all active DataSourceVersions + their options from branch to version
```

**Used by:** `createGitTag`
**Reusable because:** Pure DB operation (DataSourceVersion entity). Zero git involvement. Could arguably live in `VersionUtilService` or a DS service rather than a git util.

### F. Branching Pull Orchestration (~150 lines)

```
Input:  appGit, targetBranch, commitHash, clonedRepoPath
Steps:
  1. Resolve app name from repo structure
  2. Track app renames (update appGit.gitAppName, app.name)
  3. Deserialize workspace resources (data sources, constants, folders)
  4. Read app from distributed file structure
  5. Read git history metadata
  6. Import ToolJet DB tables
  7. Validate app JSON + schema version check
  8. Delete existing version → reimport → update appGit
```

**Used by:** `pullLatestChangesWithBranching`
**Reusable because:** Every step above calls either `AppGitFileOperationsUtil` methods or NestJS services (import/export, version management). The only provider-specific part is how the repo was cloned — which already happened before this orchestration runs.

---

## 3. Proposed Architecture

### `AppGitOperationsUtil` (existing — git orchestration only)

Add to existing methods:

```
pullGitAppChanges():
  if (isBranchingEnabled && ctx.supportsBranching)
    → clone with targetBranch
    → checkout commitHash
    → delegate to BranchingBusinessUtil.orchestrateBranchingPull()
  else
    → existing non-branching code (unchanged)

gitPushApp():
  if (isBranchingEnabled && ctx.supportsBranching)
    → BranchingBusinessUtil.computeTargetBranch()
    → clone targetBranch
    → write, commit, push
    → BranchingBusinessUtil.shouldUpdateMetadataOnPush() → save or no-op
  else
    → existing non-branching code (unchanged)
```

**ProviderContext additions (2 fields):**

```typescript
/** Does this provider support multi-branch workflows? */
supportsBranching: boolean;

/** Default branch name from provider config */
defaultBranch: (orgGit: OrganizationGitSync) => string;
```

### `BranchingBusinessUtil` (NEW — reusable business logic)

```
BranchingBusinessUtil
  ├── matchBranchesToVersions(remoteBranches, appVersions, defaultBranch)     ← A
  ├── computeTargetBranch(isBranchingEnabled, versionType, ...)              ← B
  ├── shouldUpdateMetadataOnPush(targetBranch, defaultBranch)                ← C
  ├── buildTagName(appName, versionName)                                      ← D
  ├── snapshotDataSourcesForVersion(appVersionId, branchId)                   ← E
  └── orchestrateBranchingPull(user, appMetaBody, appId, repoPath, ctx)       ← F
```

Zero git calls. Zero provider-specific API calls. Pure business orchestration.

### Provider Utils (transport only)

```
HTTPS util (keeps GitHub-specific transport):
  ├── getAllBranches()    → Octokit listBranches → BranchingBusinessUtil.matchBranchesToVersions()
  ├── createBranch()      → Octokit createRef
  ├── deleteGitBranch()   → Octokit deleteRef (+ BranchingBusinessUtil default branch guard)
  ├── getPullRequests()   → Octokit GraphQL → filter/map
  ├── createGitTag()      → BranchingBusinessUtil.buildTagName() → Octokit createTag
  └── checkTagExists()    → BranchingBusinessUtil.buildTagName() → Octokit getRef

SSH util (future — when branching is needed):
  ├── getAllBranches()    → `git ls-remote` → SAME BranchingBusinessUtil.matchBranchesToVersions()
  ├── createBranch()      → `git push origin HEAD:refs/heads/...`
  ├── deleteGitBranch()   → `git push origin --delete refs/heads/...`
  └── (no getPullRequests — SSH has no PR concept)

GitLab util (future — when branching is needed):
  ├── getAllBranches()    → GitLab REST API → SAME BranchingBusinessUtil.matchBranchesToVersions()
  ├── createBranch()      → GitLab branches API
  ├── deleteGitBranch()   → GitLab branches API
  ├── getPullRequests()   → GitLab merge requests API → filter/map
  └── createGitTag()      → GitLab tags API
```

---

## 4. Impact on SSH/GitLab (Today)

| What | Change | Risk |
|------|--------|------|
| `pullGitAppChanges` | Shared util checks `ctx.supportsBranching = false` → non-branching path (existing code) | **None** |
| `gitPushApp` | Shared util checks `ctx.supportsBranching = false` → non-branching path (existing code) | **None** |
| Branching stubs | Stay as-is. Optionally improve error message to "Branching not supported for this provider" | **None** |
| **Total lines changed in SSH/GitLab** | **~2** (set `supportsBranching: false` in ProviderContext) | **None** |

---

## 5. Future: Adding Branching to SSH

When SSH needs multi-branch support:

1. Set `supportsBranching: true` in SSH's ProviderContext
2. Extend SSH `gitClone` to accept `branchName` param (clone specific branch)
3. Shared ops `pullWithBranching` path **just works** — calls `ctx.utilService.gitClone(path, orgGit, branch)` which routes through SSH auth
4. Shared ops `gitPushApp` branching path **just works** — uses `computeTargetBranch()` + existing push
5. Implement SSH-native transport for branch management endpoints:
   - `getAllBranches` → `git ls-remote --heads` → pass to `BranchingBusinessUtil.matchBranchesToVersions()`
   - `createBranch` → `git push origin HEAD:refs/heads/<name>`
   - `deleteGitBranch` → `git push origin --delete <name>`
6. No PRs for SSH (no remote PR concept)
7. Tags via `git tag -a` + `git push --tags` instead of Octokit

**Business logic reused from HTTPS: 100%**
**New code for SSH: transport only (~100 lines)**

---

## 6. Summary Table

| Business Logic Block | Lines | Currently In | Should Move To | Reusable By |
|----------------------|-------|-------------|---------------|-------------|
| A. Branch-version matching | ~60 | HTTPS `getAllBranches` | `BranchingBusinessUtil` | All providers |
| B. Target branch selection | ~15 | HTTPS `gitPushApp` | `BranchingBusinessUtil` | All providers |
| C. Push metadata save rule | ~10 | HTTPS `gitPushApp` | `BranchingBusinessUtil` | All providers |
| D. Tag naming convention | ~5 | HTTPS `createGitTag` | `BranchingBusinessUtil` | All providers |
| E. DataSource snapshot | ~30 | HTTPS `createGitTag` | `BranchingBusinessUtil` or `VersionUtilService` | All providers |
| F. Branching pull orchestration | ~150 | HTTPS `pullLatestChangesWithBranching` | `BranchingBusinessUtil` | All providers |
| **Total reusable** | **~270** | | | |
