# Refactor Plan

> **Goal:** Extract reusable branching business logic from `HTTPSAppGitUtilityService` into a new `BranchingBusinessUtil`, extend `ProviderContext` with `supportsBranching` and `defaultBranch` fields, and add branching-aware dispatch to the shared `AppGitOperationsUtil` — without changing SSH/GitLab behavior.
> **Requested by:** project-context/git-sync-refactor/18-branching-business-logic-analysis.md
> **Generated:** 2026-03-13
> **Baseline commit:** f23362b6543e617d1aef3d5d4fb95c625f558b74 (tagged as `refactor-plan-baseline` after this file is saved)
> **Test command:** `cd server && NODE_ENV=test jest --config jest.config.ts --detectOpenHandles`
> **Branch:** `refactor/git-sync`
> **Verification layers:**
>   - Layer 1: `cd server && npx tsc --noEmit` (TypeScript)
>   - Layer 2: `cd server && npx nest build` (NestJS build)
>   - Layer 3: Manual smoke — SSH push and GitLab push paths must still route through `AppGitOperationsUtil.gitPushApp` non-branching path unchanged

---

## Phase 1 — Create `BranchingBusinessUtil` (new file, no existing code changes)

### Scope
- `server/ee/app-git/shared/branching-business.util.ts` ← **NEW FILE**

### Assumptions
- No file at `server/ee/app-git/shared/branching-business.util.ts` exists yet — verified: `ls server/ee/app-git/shared/` shows only 4 files: `app-git-file-operations.util.ts`, `app-git-operations.util.ts`, `auth-factory.interface.ts`, `git-operations.util.ts`
- `normalizeGitTag` is currently a public method on `HTTPSAppGitUtilityService` (L1271-1276) — moving it to `BranchingBusinessUtil` makes it available to all consumers
- `normalizeGitTag` is called in 3 places inside `util.service.ts` (L737, L797-799, L900-901) and once in `service.ts` (L175 via `this.httpsAppGitUtilityService.normalizeGitTag`) — the `service.ts` call is in `fetchTagsForApp`, which stays HTTPS-only transport; it will be updated to call `BranchingBusinessUtil.normalizeGitTag` in Phase 6
- `snapshotDataSourcesForVersion` is `private` on `HTTPSAppGitUtilityService` (L842) with 1 call site at L774 inside `createGitTag` — moving it to `BranchingBusinessUtil` as a public method breaks no external caller
- All 6 business logic blocks (A–F from design doc) depend only on NestJS services already registered in the module (`AppVersionRepository`, `VersionUtilService`, `AppImportExportService`, `TooljetDbImportExportService`, `AppGitFileOperationsUtil`, `AppsUtilService`, `AppGitRepository`, `FolderAppsUtilService`, `FoldersUtilService`, `WorkspaceGitSyncAdapter`) — verified: constructor at L50-82 of `util.service.ts` shows all these are already injected there
- `DataSourceVersion` and `DataSourceVersionOptions` entities are imported in `util.service.ts` (L40-41) — they will need the same imports in `BranchingBusinessUtil`
- `WorkspaceBranch` entity is imported in `util.service.ts` (L34) and used in `orchestrateBranchingPull` (L410) — will need same import

### Changes
- [ ] Create `server/ee/app-git/shared/branching-business.util.ts` with `@Injectable()` class `BranchingBusinessUtil`
- [ ] Implement `normalizeGitTag(input: string): string` — copy from `HTTPSAppGitUtilityService` L1271-1276 (pure string, no deps)
- [ ] Implement `buildTagName(appName: string, versionName: string): string` — `${normalizeGitTag(appName)}/${normalizeGitTag(versionName)}`
- [ ] Implement `computeTargetBranch(isBranchingEnabled: boolean, version: AppVersion, allowMasterPush: boolean, defaultBranch: string, pushBody: AppGitPushDto): string` — extract from `gitPushApp` L624-635 of `util.service.ts`
- [ ] Implement `shouldUpdateMetadataOnPush(targetBranch: string, defaultBranch: string): boolean` — extract from `gitPushApp` L671 condition `targetBranch === organizationGit.gitHttps.githubBranch`
- [ ] Implement `snapshotDataSourcesForVersion(appVersionId: string, branchId: string): Promise<void>` — extract from L842-877 of `util.service.ts` (pure DB, uses `EntityManager` via `dbTransactionWrap`)
- [ ] Implement `matchBranchesToVersions(branches: RemoteBranch[], appId: string, defaultBranch: string, repoOwner: string, repoName: string): Promise<EnrichedBranch[]>` — extract from `getAllBranches` L1003-1059 of `util.service.ts`. Define minimal `RemoteBranch` and `EnrichedBranch` types locally in this file
- [ ] Implement `orchestrateBranchingPull(user: User, app: App, appGit: AppGitSync, appMetaBody: AppGitPullUpdateDto, appId: string, gitRepoPath: string, organizationId: string): Promise<App>` — extract from `pullLatestChangesWithBranching` L407-608 of `util.service.ts` (everything after `await this.checkoutCommitHash(...)`)
- [ ] Constructor: inject all required services (see Assumptions above)

### Why
This phase creates the new util in isolation with no changes to any existing file. It can be compiled and reviewed independently before any wiring. All 6 business logic blocks land here first; subsequent phases wire them in.

---

## Phase 2 — Extend `ProviderContext` with `supportsBranching` and `defaultBranch`

### Scope
- `server/ee/app-git/shared/app-git-operations.util.ts`

### Assumptions
- `ProviderContext` interface is defined at L48-84 of `app-git-operations.util.ts` — verified: full file read
- `supportsBranching` and `defaultBranch` fields do not exist in `ProviderContext` yet — verified: grep for `supportsBranching` and `defaultBranch` in `app-git-operations.util.ts` returned nothing
- All 3 provider services (`HTTPSAppGitService`, `SSHAppGitService`, `GitLabAppGitService`) construct a `providerContext` literal in their constructors — verified by reading all 3 service files. They will fail TypeScript compilation after this phase until Phase 3 wires them in — this is expected and acceptable since Phase 3 follows immediately
- `OrganizationGitSync` is already imported in `app-git-operations.util.ts` (L18) — the `defaultBranch` lambda signature `(orgGit: OrganizationGitSync) => string` needs no new import

### Changes
- [ ] Add `supportsBranching: boolean` field to `ProviderContext` interface after `appsFolder`
- [ ] Add `defaultBranch: (orgGit: OrganizationGitSync) => string` field to `ProviderContext` interface after `supportsBranching`
- [ ] Add a JSDoc comment on each new field explaining its purpose and expected values per provider

### Why
Adding the two fields to the interface is a prerequisite for Phase 3 (wiring providers) and Phases 4–5 (using them in shared ops). Keeping this as its own phase isolates the interface change and makes TypeScript catch any provider that forgets to wire the new fields.

---

## Phase 3 — Wire `supportsBranching` and `defaultBranch` in all 3 providers

### Scope
- `server/ee/app-git/providers/github-https/service.ts`
- `server/ee/app-git/providers/github-ssh/service.ts`
- `server/ee/app-git/providers/gitlab/service.ts`

### Assumptions
- `HTTPSAppGitService.providerContext` is constructed in the constructor at L47-56 of `service.ts` — verified: full file read. `githubBranch` field is on `orgGit.gitHttps.githubBranch` — verified: `organization_git_https.entity.ts` L23
- `SSHAppGitService.providerContext` is constructed at L41-51 of `ssh/service.ts` — verified: full file read. `gitBranch` field is on `orgGit.gitSsh.gitBranch` — verified: `organization_git_ssh.entity.ts` L21
- `GitLabAppGitService.providerContext` is constructed at L45-54 of `gitlab/service.ts` — verified: full file read. `gitlabBranch` field is on `orgGit.gitLab.gitlabBranch` — verified: `organization_gitlab.entity.ts` L23
- SSH and GitLab services have no branching behavior today (all branching methods throw `NotFoundException`) — verified: reading both service files. Setting `supportsBranching: false` means zero behavior change for them
- No new constructor parameters are needed in any provider service — `supportsBranching` is a literal `boolean` and `defaultBranch` is a lambda that reads from `orgGit` which is already available at call time

### Changes

**`github-https/service.ts`:**
- [ ] Add `supportsBranching: true` to `this.providerContext` object literal
- [ ] Add `defaultBranch: (orgGit) => orgGit.gitHttps.githubBranch` to `this.providerContext`

**`github-ssh/service.ts`:**
- [ ] Add `supportsBranching: false` to `this.providerContext` object literal
- [ ] Add `defaultBranch: (orgGit) => orgGit.gitSsh.gitBranch` to `this.providerContext`

**`gitlab/service.ts`:**
- [ ] Add `supportsBranching: false` to `this.providerContext` object literal
- [ ] Add `defaultBranch: (orgGit) => orgGit.gitLab.gitlabBranch` to `this.providerContext`

### Why
Three two-line additions (one per provider) unblock TypeScript compilation after Phase 2. SSH and GitLab remain unchanged at runtime. HTTPS gets the correct values that Phases 4–5 will use.

---

## Phase 4 — Add branching toggle to `pullGitAppChanges` in shared ops

### Scope
- `server/ee/app-git/shared/app-git-operations.util.ts`

### Assumptions
- `pullGitAppChanges` in `app-git-operations.util.ts` (L312-408) currently calls `ctx.utilService.gitClone(gitRepoPath, orgGit)` unconditionally (non-branching only) — verified: full file read shows no `isBranchingEnabled` check
- The HTTPS `util.service.ts` `pullGitAppChanges` at L262-270 dispatches to either `pullLatestChangesWithBranching` or `pullGitAppChangesWithoutBranching` based on `appGit?.orgGit?.isBranchingEnabled` — verified: grep result at L264-265
- `pullGitAppChangesWithoutBranching` (L272-383 in HTTPS util) is already faithfully replicated in the shared ops `pullGitAppChanges` (L312-408) — both call `gitClone` without branch, read `readAppJson`, run the same DB transaction. Confirmed by comparing both implementations line-by-line
- The branching path in `pullLatestChangesWithBranching` starts by calling `this.gitClone(gitRepoPath, orgGit, targetBranch)` then `this.checkoutCommitHash(...)` — these become `ctx.utilService.gitClone(gitRepoPath, orgGit, targetBranch)` and `ctx.utilService.checkoutCommitHash(gitRepoPath, commitHash)` in shared ops. `checkoutCommitHash` is currently `private` on `HTTPSAppGitUtilityService` (L1202) — it must be made `public` or `protected` before or alongside this phase (see Changes)
- `BranchingBusinessUtil` must be injected into `AppGitOperationsUtil` constructor — currently `AppGitOperationsUtil` has 6 constructor params (L94-101). A 7th param `branchingBusinessUtil: BranchingBusinessUtil` is added
- `isBranchingEnabled` comes from `appGit.orgGit.isBranchingEnabled` — this field is already read in HTTPS util at L264, confirming it exists on `OrganizationGitSync`
- `appMetaBody.gitBranchName` and `appMetaBody.commitHash` are fields on `AppGitPullUpdateDto` — verified: used in HTTPS util at L399 and referenced in `pullLatestChangesWithBranching`

### Changes
- [ ] In `HTTPSAppGitUtilityService`: change `private async checkoutCommitHash` to `async checkoutCommitHash` (remove `private`) so shared ops can call it via `ctx.utilService`
- [ ] Add `BranchingBusinessUtil` to the constructor of `AppGitOperationsUtil` (inject via NestJS DI)
- [ ] In `pullGitAppChanges`: after fetching `appGit`, read `const isBranchingEnabled = appGit.orgGit?.isBranchingEnabled ?? false`
- [ ] Add conditional branch: `if (isBranchingEnabled && ctx.supportsBranching)` → clone with `targetBranch = appMetaBody?.gitBranchName || ctx.defaultBranch(orgGit)`, call `ctx.utilService.checkoutCommitHash(gitRepoPath, appMetaBody?.commitHash)`, then delegate to `this.branchingBusinessUtil.orchestrateBranchingPull(...)`
- [ ] Else: existing non-branching code path unchanged
- [ ] Add import of `BranchingBusinessUtil` at top of `app-git-operations.util.ts`

### Why
This phase moves the pull branching dispatch from HTTPS-only into the shared util where it can serve all providers. The non-branching path (used by SSH, GitLab, and HTTPS without branching enabled) remains completely unchanged. The guard `ctx.supportsBranching` ensures SSH/GitLab never enter the branching path even if `isBranchingEnabled` is accidentally true.

---

## Phase 5 — Add branching toggle to `gitPushApp` in shared ops

### Scope
- `server/ee/app-git/shared/app-git-operations.util.ts`

### Assumptions
- `gitPushApp` in `app-git-operations.util.ts` (L239-306) currently clones unconditionally to `orgGit`'s default branch, writes, commits, pushes, and always saves `lastPushDate` — verified: full file read
- The HTTPS `gitPushApp` branching logic (L610-697 of `util.service.ts`) uses `ctx.utilService` for clone/commit/push and calls `BranchingBusinessUtil.computeTargetBranch()` and `shouldUpdateMetadataOnPush()` — the branch existence test via Octokit (`testBranchExistence`) stays in HTTPS util as transport — it is NOT called from shared ops
- `testBranchExistence` is HTTPS/Octokit-specific — there is no equivalent in the shared ops. For the branching push path in shared ops, the branch is assumed to already exist (HTTPS service's `createBranch` ensures this prior to push). The `BadRequestException` for missing branch stays in the HTTPS util's `gitPushApp` which is **removed** in Phase 6 (HTTPS delegates entirely to shared ops `gitPushApp` + `BranchingBusinessUtil`)
- `AppGitPushDto.allowMasterPush` field is referenced at L633 of HTTPS util `gitPushApp` — it is already a field on `AppGitPushDto` (confirmed by usage)
- The non-branching `gitPushApp` in shared ops always saves `lastPushDate` (L283-286). The branching path must only save `lastPushDate` when `targetBranch === ctx.defaultBranch(orgGit)` — this is `BranchingBusinessUtil.shouldUpdateMetadataOnPush()` block C
- `BranchingBusinessUtil` is already injected in Phase 4 — no new constructor param needed here

### Changes
- [ ] In `gitPushApp`: after fetching `organizationGit`, read `const isBranchingEnabled = appGit.orgGit?.isBranchingEnabled ?? false`
- [ ] Add conditional: `if (isBranchingEnabled && ctx.supportsBranching)` → compute `targetBranch` via `this.branchingBusinessUtil.computeTargetBranch(isBranchingEnabled, version, appGitPushBody.allowMasterPush, ctx.defaultBranch(organizationGit), appGitPushBody)`, clone to `targetBranch`, write/commit/push, then use `shouldUpdateMetadataOnPush(targetBranch, ctx.defaultBranch(organizationGit))` to decide whether to save `lastPushDate` and version metadata
- [ ] Else: existing non-branching code path unchanged (always saves `lastPushDate`, no `targetBranch` concept)
- [ ] The branching push path saves `versionId`, `lastPushDate`, `gitVersionName`, `gitVersionId`, `lastCommitMessage` on `appGit` (same fields as HTTPS util L672-680) when `shouldUpdateMetadataOnPush` returns true

### Why
The push branching dispatch moves to shared ops exactly as the pull dispatch did in Phase 4. SSH/GitLab continue to use the non-branching path. HTTPS `gitPushApp` in the util will be removed in Phase 6 since shared ops now handles both paths.

---

## Phase 6 — Rewire HTTPS `util.service.ts` to delegate to `BranchingBusinessUtil`

### Scope
- `server/ee/app-git/providers/github-https/util.service.ts`

### Assumptions
- `pullGitAppChanges` at L262-270 dispatches to `pullLatestChangesWithBranching` or `pullGitAppChangesWithoutBranching` — after Phase 4, shared ops handles both paths. This HTTPS method is no longer called: `HTTPSAppGitService.pullGitAppChanges` (L273-275 in `service.ts`) delegates directly to `appGitOpsUtil.pullGitAppChanges` — verified: reading `service.ts`. The HTTPS util `pullGitAppChanges` method is therefore dead code after Phase 4
- `pullGitAppChangesWithoutBranching` (L272-383 in util) is similarly dead after Phase 4 since `HTTPSAppGitService` never calls it directly — verified: `service.ts` L273-275 calls `appGitOpsUtil.pullGitAppChanges` only
- `pullLatestChangesWithBranching` (L385-608) is dead after `orchestrateBranchingPull` is moved to `BranchingBusinessUtil` and wired in Phase 4
- `gitPushApp` in HTTPS util (L610-697) is dead after Phase 5 since `HTTPSAppGitService.gitPushApp` (L263-271 in `service.ts`) delegates to `appGitOpsUtil.gitPushApp` — verified: reading `service.ts`
- `getAllBranches` branch-version matching (L1003-1059) is the only part that becomes a delegate call to `BranchingBusinessUtil.matchBranchesToVersions()`. The Octokit transport (L1036-1002 fetching remote branches) stays in the util
- `createGitTag` calls `this.normalizeGitTag` at L737-738 and `this.snapshotDataSourcesForVersion` at L774 — both move to `BranchingBusinessUtil` in Phase 1; Phase 6 replaces these with `this.branchingBusinessUtil.buildTagName(...)` and `this.branchingBusinessUtil.snapshotDataSourcesForVersion(...)`
- `checkTagExists` calls `this.normalizeGitTag` at L900-901 — replaced with `this.branchingBusinessUtil.normalizeGitTag`
- `deleteGitBranch` default branch guard at L1183 (`if (branchName === githubBranch)`) is already a simple inline check — the design doc notes this as reusable but it is already concise inline; it can stay inline (no `BranchingBusinessUtil` call needed here unless explicitly required)
- `renameGitTag` calls `this.normalizeGitTag` at L797-799 — replaced with `this.branchingBusinessUtil.normalizeGitTag`
- `normalizeGitTag` method on HTTPS util (L1271-1276) remains as a public pass-through (`return this.branchingBusinessUtil.normalizeGitTag(input)`) because `HTTPSAppGitService.fetchTagsForApp` (L175) calls `this.httpsAppGitUtilityService.normalizeGitTag(appName)` — changing that call site is inside `service.ts`, not `util.service.ts`. The pass-through preserves backward compatibility without touching `service.ts`
- `BranchingBusinessUtil` must be injected into `HTTPSAppGitUtilityService` constructor — adds 1 new constructor param

### Changes
- [ ] Add `BranchingBusinessUtil` to `HTTPSAppGitUtilityService` constructor
- [ ] In `createGitTag`: replace `this.normalizeGitTag(...)` calls with `this.branchingBusinessUtil.buildTagName(appGit.gitAppName, appVersion.name)` for tag name construction; replace `this.snapshotDataSourcesForVersion(...)` with `this.branchingBusinessUtil.snapshotDataSourcesForVersion(...)`
- [ ] In `checkTagExists`: replace `this.normalizeGitTag(appGit.gitAppName)` and `this.normalizeGitTag(versionName)` with `this.branchingBusinessUtil.normalizeGitTag(...)`
- [ ] In `renameGitTag`: replace `this.normalizeGitTag(...)` calls with `this.branchingBusinessUtil.normalizeGitTag(...)`
- [ ] In `getAllBranches`: keep Octokit `listBranches` call; replace the branch-version matching logic (L1003-1059) with a single call to `this.branchingBusinessUtil.matchBranchesToVersions(branches, appId, githubBranch, owner, repo)`
- [ ] Convert `normalizeGitTag` to a thin pass-through: `normalizeGitTag(input: string): string { return this.branchingBusinessUtil.normalizeGitTag(input); }`
- [ ] Delete `private async snapshotDataSourcesForVersion` (L842-877) — moved to `BranchingBusinessUtil` in Phase 1
- [ ] Delete `async pullGitAppChanges` (L262-270) — dead after Phase 4
- [ ] Delete `private async pullGitAppChangesWithoutBranching` (L272-383) — dead after Phase 4
- [ ] Delete `async pullLatestChangesWithBranching` (L385-608) — moved to `BranchingBusinessUtil.orchestrateBranchingPull` in Phase 1, wired in Phase 4
- [ ] Delete `async gitPushApp` (L610-697) — dead after Phase 5
- [ ] Delete `private async checkoutCommitHash` (L1202-1221) — made `public` in Phase 4, now lives on the util as a git transport method; keep it (do NOT delete — shared ops calls it via `ctx.utilService`)

### Why
This phase removes the now-dead branching code from the HTTPS util, leaving it as pure GitHub transport (Octokit calls, clone/commit/push, branch/tag management). The util shrinks by approximately 530 lines (43% reduction). All business logic is now in `BranchingBusinessUtil`, all orchestration in `AppGitOperationsUtil`.

---

## Phase 7 — Register `BranchingBusinessUtil` in the module

### Scope
- `server/src/modules/app-git/module.ts`

### Assumptions
- `AppGitModule` at `server/src/modules/app-git/module.ts` uses `this.getProviders(configs, 'app-git', [...])` to dynamically load providers by path — verified: full file read at L31-45
- The existing shared utils are loaded as `'shared/app-git-file-operations.util'`, `'shared/git-operations.util'`, `'shared/app-git-operations.util'` — verified: L42-44 of module
- `BranchingBusinessUtil` follows the same naming convention: it will be loaded as `'shared/branching-business.util'`
- `getProviders` destructures by exported class name — the new export `BranchingBusinessUtil` must be added to the destructure list at L18-31
- `BranchingBusinessUtil` is used by both `AppGitOperationsUtil` (Phase 4) and `HTTPSAppGitUtilityService` (Phase 6) — both are already in the providers array. `BranchingBusinessUtil` must appear before them (or order doesn't matter in NestJS DI — NestJS resolves by type token, not by array order)
- The module `exports` array at L77 currently exports `AppGitFileOperationsUtil`, `GitOperationsUtil`, `AppGitOperationsUtil` — `BranchingBusinessUtil` should be exported too so other modules can inject it if needed in the future

### Changes
- [ ] Add `'shared/branching-business.util'` to the paths array in `this.getProviders(...)`
- [ ] Add `BranchingBusinessUtil` to the destructured result from `this.getProviders(...)`
- [ ] Add `BranchingBusinessUtil` to the `providers` array
- [ ] Add `BranchingBusinessUtil` to the `exports` array

### Why
Without this registration, NestJS DI cannot inject `BranchingBusinessUtil` into `AppGitOperationsUtil` or `HTTPSAppGitUtilityService`. This is the final wiring phase and requires no logic changes.

---

## Notes

- Run verification after each phase: `cd server && npx tsc --noEmit` before proceeding to the next phase
- Phase execution order is strict: 1 → 2 → 3 → 7 → 4 → 5 → 6. Phase 7 must come before Phase 4 because `AppGitOperationsUtil` will inject `BranchingBusinessUtil` (Phase 4) and NestJS needs it registered first
- SSH and GitLab push/pull paths: after Phases 4–5, verify by tracing that `ctx.supportsBranching === false` for both — the non-branching `else` block must be hit unchanged
- The `checkoutCommitHash` method visibility change (Phase 4) is a prerequisite — make it before adding the dispatch in `pullGitAppChanges`
- `normalizeGitTag` on `HTTPSAppGitUtilityService` becomes a pass-through in Phase 6 rather than being deleted — this avoids touching `service.ts` for a trivial change and preserves the call in `fetchTagsForApp`
- If `matchBranchesToVersions` in `BranchingBusinessUtil` needs the `branchUrl` field (which currently contains `https://github.com/${owner}/${repo}/tree/${branch.name}`), pass `repoOwner` and `repoName` as parameters rather than encoding the URL template inside the util — keeps the util provider-agnostic


---

## Phase 8 — Create CE stub files for shared utils

### Scope
- `server/src/modules/app-git/shared/git-operations.util.ts` ← **NEW FILE**
- `server/src/modules/app-git/shared/app-git-file-operations.util.ts` ← **NEW FILE**
- `server/src/modules/app-git/shared/app-git-operations.util.ts` ← **NEW FILE**

### Status: COMPLETE (commit 8e91aba1d)

### Assumptions
- `server/src/modules/app-git/shared/` does not exist — verified
- `AppGitModule` registers the 3 shared utils via `getProviders()` paths `'shared/git-operations.util'`, `'shared/app-git-file-operations.util'`, `'shared/app-git-operations.util'`
- CE builds crash at NestJS DI startup because the stub files don't exist

### Changes
- [x] Create `server/src/modules/app-git/shared/git-operations.util.ts` — exports empty `@Injectable() class GitOperationsUtil {}`
- [x] Create `server/src/modules/app-git/shared/app-git-file-operations.util.ts` — exports empty `@Injectable() class AppGitFileOperationsUtil {}`
- [x] Create `server/src/modules/app-git/shared/app-git-operations.util.ts` — exports empty `@Injectable() class AppGitOperationsUtil {}`

### Why
CE builds crash without these stubs. No logic changes. Done first.

---

## Phase 9 — Add `GitOperationsUtil.sparseClone()`

### Scope
- `server/ee/app-git/shared/git-operations.util.ts`

### Status: COMPLETE (EE commit 5182e81, root 72f18018d)

### Assumptions
- `GitOperationsUtil` has 4 methods: `createGit`, `clone`, `commit`, `push` — verified
- No `sparseClone` exists — verified
- `CloneOptions` has no sparse fields — verified

### Changes
- [x] Added `sparseClone(targetPath, url, branch, appFolder, opts)` as 5th method
- [x] Implementation: delete path → build sparse args → optional sslDisabled/env → clone → sparse-checkout init/set → checkout
- [x] No changes to `CloneOptions`, `clone()`, or other existing methods

### Why
Sparse clone downloads only tree + blobs for a specific folder. Dedicated method keeps `CloneOptions` clean. Provider-agnostic — only auth (URL/env) differs, resolved by the caller.

---

## Phase 10 — Extract `ensureBranchVersion` + `createBranchVersionFromGit` into `AppGitOperationsUtil`

### Scope
- `server/ee/app-git/shared/app-git-operations.util.ts`
- `server/ee/app-git/providers/github-https/util.service.ts`

### Status: COMPLETE (EE commit c0bb842, root 6fc3b3bfc)

### Assumptions
- Both methods were `private` on `HTTPSAppGitUtilityService` — verified
- `gitSparseClone` was `private` on `HTTPSAppGitUtilityService` — verified
- All deps (`versionUtilService`, `appVersionRepository`, etc.) already in `AppGitOperationsUtil` — verified
- Phase 9 (sparseClone) was prerequisite — done

### Changes
- [x] Added `GitOperationsUtil` to `AppGitOperationsUtil` constructor
- [x] Added imports: `uuidv4`, `AppVersionStatus`, `AppVersionType`, `WorkspaceBranch`, `VersionCreateDto`, `GitOperationsUtil`
- [x] Moved `createBranchVersionFromGit` to `AppGitOperationsUtil` as private with `ctx: ProviderContext` param
  - `this.gitSparseClone(...)` → `ctx.utilService.getAuth()` + `this.gitOpsUtil.sparseClone(...)`
  - `this.appGitFileOpsUtil.*` → `ctx.fileOpsUtil.*`
  - `this.deleteDir(...)` → `ctx.utilService.deleteDir(...)`
- [x] Moved `ensureBranchVersion` to `AppGitOperationsUtil` as private — no substitutions needed
- [x] Deleted `gitSparseClone`, `createBranchVersionFromGit`, `ensureBranchVersion` from `HTTPSAppGitUtilityService` (242 lines removed)

### Why
Both methods are pure DB + import/export orchestration — zero HTTPS-specific code. Makes them available to all providers via `ctx`.

---

## Phase 11 — Hook `ensureBranchVersion` into `AppGitOperationsUtil.createGitApp()`

### Scope
- `server/ee/app-git/shared/app-git-operations.util.ts`
- `server/ee/app-git/providers/github-https/util.service.ts`

### Assumptions
- `AppGitOperationsUtil.createGitApp()` does NOT call `ensureBranchVersion` yet — Phase 10 only moved the definition
- `HTTPSAppGitUtilityService.createGitApp()` still calls `this.ensureBranchVersion(...)` — left in place by Phase 10
- `ProviderContext` does NOT yet have `supportsBranching` — that is Phase 2. Use `(ctx as any).supportsBranching ?? false` defensively, or check: if `supportsBranching` is already on the interface, use it directly
- `AppGitPullDto` has `workspaceBranchId` field — verify before using

### Changes
- [ ] In `AppGitOperationsUtil.createGitApp()`, after `app = await this.appsUtilService.findByAppId(app.id)` and before fire-and-forget `createAppGit`:
  ```typescript
  if (appMetaBody.workspaceBranchId && (ctx as any).supportsBranching) {
    await this.ensureBranchVersion(app.id, organizationId, appMetaBody, user);
  }
  ```
- [ ] In `HTTPSAppGitUtilityService.createGitApp()`: remove the `await this.ensureBranchVersion(...)` call

### Why
Branching version creation moves to shared ops. SSH/GitLab guarded by `supportsBranching === false`.

---

## Phase 12 — Fix `ExternalApisService` bypass

### Scope
- `server/ee/external-apis/service.ts`
- `server/ee/app-git/source-control-provider.ts`

### Status: COMPLETE (EE commit 5eb3cb1, 2026-03-25)

### Assumptions
- `ExternalApisService` injected `HTTPSAppGitUtilityService` and called `.createGitApp`, `.pullGitAppChanges`, `.gitPushApp` directly — verified
- The three main git operation call sites were fixed in the original Phase 12 pass (routing through `SourceControlProviderService`)
- One remaining direct call existed: `httpsAppGitUtilityService.findOrgGitByOrganizationId(organizationId)` in the `pushVersionToGit` "create appGit if missing" block (line 469)
- `SourceControlProviderService` already holds `OrganizationGitSyncRepository` internally — exposing `findOrgGit` on it is the minimal fix

### Changes
- [x] Added `findOrgGit(organizationId)` method to `SourceControlProviderService` — delegates to `organizationGitSyncRepository.findOrgGitByOrganizationId`
- [x] Replaced `this.httpsAppGitUtilityService.findOrgGitByOrganizationId(organizationId)` with `this.sourceControlProviderService.findOrgGit(organizationId)` in `pushVersionToGit`
- [x] Replaced `!organizationGit.gitHttps?.isEnabled` check with provider-agnostic: `!gitSsh?.isEnabled && !gitHttps?.isEnabled && !gitLab?.isEnabled`
- [x] Removed `HTTPSAppGitUtilityService` import and constructor injection from `ExternalApisService`

### Why
CI/CD integration path must be provider-agnostic. Hardcoding HTTPS blocks SSH/GitLab users from external API triggers.

---

## Phase 13 — Fix SSH and GitLab stub branch methods

### Scope
- `server/ee/app-git/providers/github-ssh/service.ts`
- `server/ee/app-git/providers/gitlab/service.ts`

### Assumptions
- Both services throw `Error` (not `BadRequestException`) for `getAllBranches`, `createBranch`, `deleteGitBranch`

### Changes
**Both services:**
- [ ] `getAllBranches` → return `[]`
- [ ] `createBranch` → throw `new BadRequestException('Branch management is not supported for this provider')`
- [ ] `deleteGitBranch` → throw `new BadRequestException('Branch management is not supported for this provider')`

### Why
Clean 400s. `getAllBranches` returning `[]` prevents UI crashes on branch list pages for SSH/GitLab workspaces.

---

## Phase 14 — Remove `supportsBranching` from `ProviderContext`; make dispatch data-driven

### Scope
- `server/ee/app-git/shared/app-git-operations.util.ts`
- `server/ee/app-git/providers/github-https/service.ts`
- `server/ee/app-git/providers/github-ssh/service.ts`
- `server/ee/app-git/providers/gitlab/service.ts`

### Status: COMPLETE (EE commit a5b5b7e, 2026-03-25)

### Problem
`supportsBranching: boolean` in `ProviderContext` conflated two separate concerns:
1. **Branch operations** (git clone/push to a named branch) — all providers support this via `gitClone(url, orgGit, branchName)`; it is git-protocol-level, not provider-specific.
2. **Branch management** (REST API: list/create/delete GitHub/GitLab branches) — provider-specific; SSH has no REST API for this.

By gating pull/push branching on `ctx.supportsBranching`, SSH and GitLab users could never do a versioned push or branch-aware pull even when `isBranchingEnabled` was `true` — despite git itself supporting it. The field was in the wrong layer.

### Changes
- [x] Removed `supportsBranching` field from `ProviderContext` interface in `app-git-operations.util.ts`
- [x] Removed `supportsBranching: true` from `HTTPSAppGitService.providerContext`
- [x] Removed `supportsBranching: false` from `SSHAppGitService.providerContext`
- [x] Removed `supportsBranching: false` from `GitLabAppGitService.providerContext`
- [x] In `pullGitAppChanges`: changed guard from `isBranchingEnabled && ctx.supportsBranching` → `isBranchingEnabled && appMetaBody.gitBranchName`
- [x] In `gitPushApp`: changed guard from `isBranchingEnabled && ctx.supportsBranching` → `isBranchingEnabled`

### Why
Data-driven dispatch based on runtime values (`isBranchingEnabled`, `gitBranchName`) is cleaner than a static provider flag. Branch management (REST API) is a separate concern handled directly in provider-specific `createBranch`/`deleteGitBranch`/`getAllBranches` methods — SSH/GitLab already throw `BadRequestException` there (Phase 13). The `ProviderContext` interface should not carry this distinction.

---

## Phase 15 — Extract `DataSourceBranchUtil`

### Scope
- `server/ee/workspace-branches/datasource-branch.util.ts` ← **NEW FILE**
- `server/ee/workspace-branches/service.ts`
- `server/ee/app-git/shared/branching-business.util.ts`
- `server/src/modules/app-git/module.ts`
- `server/src/modules/app-git/shared/datasource-branch.util.ts` ← **NEW CE STUB**

### Status: COMPLETE (EE commit 67ac0e0, 2026-03-25)

### Problem
DataSourceVersion (DSV) branch lifecycle operations were scattered across two files:
- `snapshotDataSourcesForVersion` — was in `BranchingBusinessUtil`, copying DSVs to a tagged version. This is a data concern, not a git branching concern.
- `cloneDataSourceVersions` — was a 45-line inline loop in `WorkspaceBranchesService.createBranch()`, copying DSVs between branches with credential row cloning.

Neither method belongs in its original location: `BranchingBusinessUtil` should contain only git branching logic, and service methods should not inline complex multi-step DB operations.

### Changes
- [x] Created `server/ee/workspace-branches/datasource-branch.util.ts` with `@Injectable() class DataSourceBranchUtil`
  - `cloneDataSourceVersions(sourceBranchId, targetBranchId, manager)` — extracted from 45-line inline loop in `WorkspaceBranchesService.createBranch()`; copies all DSVs from source branch to target branch, cloning credential rows per DSV
  - `snapshotDataSourcesForVersion(appVersionId, branchId)` — moved from `BranchingBusinessUtil`; copies DSVs to a tagged version (copies `credential_id` refs, does not clone credential rows)
- [x] Replaced inline DSV clone loop in `WorkspaceBranchesService.createBranch()` with `await this.dataSourceBranchUtil.cloneDataSourceVersions(sourceBranchId, savedBranch.id, manager)`
- [x] Removed `snapshotDataSourcesForVersion` from `BranchingBusinessUtil` (after pass-through phase — see Phase 16)
- [x] Registered `DataSourceBranchUtil` in `AppGitModule` (`getProviders`, `providers[]`, `exports[]`)
- [x] Created CE stub `server/src/modules/app-git/shared/datasource-branch.util.ts` — empty `@Injectable() class DataSourceBranchUtil {}`

### Why
`DataSourceBranchUtil` is cohesive: both methods share the same concern (DSV branch lifecycle), the same entity (`DataSourceVersion`), and the same dependency graph (`DataSource`, `Credential`, `EntityManager`). Extracting them makes `BranchingBusinessUtil` a pure git branching util and `WorkspaceBranchesService` a pure branch orchestration service.

---

## Phase 16 — Remove `snapshotDataSourcesForVersion` pass-through from `BranchingBusinessUtil`

### Scope
- `server/ee/app-git/shared/branching-business.util.ts`
- `server/ee/app-git/providers/github-https/util.service.ts`

### Status: COMPLETE (EE commits b29a710 + 5eb3cb1, 2026-03-25)

### Problem
After Phase 15 extracted `snapshotDataSourcesForVersion` into `DataSourceBranchUtil`, `BranchingBusinessUtil` still held a one-line wrapper that just delegated to `DataSourceBranchUtil.snapshotDataSourcesForVersion`. This is pointless indirection: callers could go directly to `DataSourceBranchUtil`. Additionally, the `DataSourceBranchUtil` import and constructor parameter were not removed from `BranchingBusinessUtil` after the wrapper was deleted.

### Changes
- [x] Removed `snapshotDataSourcesForVersion` wrapper method from `BranchingBusinessUtil`
- [x] Removed `DataSourceBranchUtil` import from `BranchingBusinessUtil`
- [x] Removed `DataSourceBranchUtil` constructor injection from `BranchingBusinessUtil` (no longer needed)
- [x] Added `DataSourceBranchUtil` constructor injection to `HTTPSAppGitUtilityService`
- [x] Changed call in `HTTPSAppGitUtilityService.createGitTag()` from `this.branchingBusinessUtil.snapshotDataSourcesForVersion(...)` → `this.dataSourceBranchUtil.snapshotDataSourcesForVersion(...)`

### Why
Eliminating the wrapper removes a layer of indirection with no benefit. `BranchingBusinessUtil` now has zero data-layer dependencies — it is a pure git branching logic util. `HTTPSAppGitUtilityService` gets a direct reference to `DataSourceBranchUtil` and calls it without going through an intermediary.

---

## Updated Notes

- Run verification after each phase: `cd server && npx tsc --noEmit` before proceeding
- **Full execution order:** 8 → 9 → 1 → 2 → 3 → 7 → 4 → 5 → 6 → 10 → 11 → 12 → 13 → 14 → 15 → 16
  - All phases complete as of 2026-03-25
  - Phase 9 before Phase 10: `sparseClone` must exist before `createBranchVersionFromGit` uses it
  - Phase 7 before Phase 4: `BranchingBusinessUtil` must be registered before `AppGitOperationsUtil` injects it
  - Phase 13 before Phase 14: SSH/GitLab branch management stubs should return clean errors before removing the `supportsBranching` gate
  - Phase 15 before Phase 16: `DataSourceBranchUtil` must exist before the pass-through is removed
- Design doc: `server/ee/project-context/git-sync-refactor/git-sync-architecture-design.md`
