# git-sync module

Workspace-level Git connection for Git Sync (EE feature): configure, test, finalize, and delete a
workspace's git provider (GitHub SSH / GitHub HTTPS / GitLab), plus the serialization machinery that
turns an app into a distributed file tree in the repo and back. App push/pull endpoints live in
`app-git`; branch lifecycle lives in `workspace-branches`. CE ships stubs/empty shells; all real
logic is in `server/ee/git-sync/`.

## Domain terms

- **Organization git**: per-workspace connection config — `OrganizationGitSync` entity
  (`src/entities/organization_git_sync.entity.ts`, has `autoCommit`, `isBranchingEnabled`,
  `useEnvConfig`) with one-to-one provider rows in `src/entities/gitsync_entities/`
  (`OrganizationGitSsh`, `OrganizationGitHttps`, `OrganizationGitLab`).
- **Provider / source-control strategy**: `SSHGitSyncService` | `HTTPSGitSyncService` |
  `GitLabGitSyncService`. Chosen per org by `SourceControlProviderService.getSourceControlService()`:
  explicit `gitType` arg > `useEnvConfig`+`envGitProvider` > first enabled provider row > SSH default.
- **Finalize**: two-step setup — save provider config (`POST /git-sync/configs`), then
  `PUT /git-sync/finalize/:id` after connection test marks it usable.
- **git id / co_relation_id**: portable stable id written into repo files in place of DB UUIDs;
  persisted back into entity tables' `co_relation_id` column
  (`GitSyncAdapter.updateEntityGitId` raw-updates `UPDATE <table> SET co_relation_id ...`).
- **Distributed structure**: app serialized one-folder-per-entity-type (components, pages, queries,
  layouts, versions, tooljet_database...) — see `ENTITY_TABLE_MAP` in `ee/git-sync/git-sync-adapter.ts`.

## Key files

| File (relative to module dir) | CE (`src/modules/git-sync/`) | EE (`ee/git-sync/`) |
|---|---|---|
| `service.ts` | stub, throws | real: strategy dispatch, license check, cache eviction on disconnect |
| `controller.ts` | CRUD + status routes | adds `POST configs`, `POST test-connection` |
| `base-git.service.ts` | abstract stub (`BaseGitSyncService`) | version lookup helpers shared by providers |
| `base-git-util.service.ts` | stub | `findOrgGitByOrganizationId`, `readAppFromDistributedStructure`, `findMatchingVersion`, `deleteMatchingVersionIfExists` |
| `source-control-provider.ts` | base class | provider-selection logic |
| `providers/{github-ssh,github-https,gitlab}/service.ts` | stubs | per-provider config CRUD + `testConnection` (simple-git; SSH keygen ed25519/rsa for github-ssh) |
| `git-sync-adapter.ts` | empty class | 800-line app<->files serializer: git-id generation, UUID->git-id rewrite (incl. UUIDs embedded in strings), entity cleanup |
| `workspace-git-sync-adapter.ts` | empty class | workspace resources: serialize/deserialize, `reconcileDummyDataSources`, `ensureMarketplacePluginsInstalled` |
| `remote-branch-cache.service.ts` | empty | Redis cache of remote branch list per org (TTL `GIT_REMOTE_BRANCHES_CACHE_TTL_SECONDS`, default 300s) |
| `git-object-cache.service.ts` | empty | local git object cache dir + Redis pub/sub eviction channel; disable via `DISABLE_GIT_OBJECT_CACHE=true` |
| `repository.ts` (CE only) | `OrganizationGitSyncRepository` | — |
| `constants/index.ts`, `constants/feature.ts` | `FEATURE_KEY` enum + license map | — |
| `error-constants/` (CE), `error-handler/` (EE) | `GitErrorMessages` strings | maps raw git/ssh errors to user messages |

## Edition split — license gating

- `GitSyncModule.register()` (`module.ts`) resolves providers via `getProviders(configs, 'git-sync', ...)`
  — `TOOLJET_EDITION` routes to CE stubs or `ee/git-sync` implementations.
- `constants/feature.ts`: all mutating features gated on `LICENSE_FIELD.GIT_SYNC`; the two GET
  features (`GET_ORGANIZATION_GIT`, `GET_ORGANIZATION_GIT_STATUS`) are ungated.
- EE `service.ts` also injects `LicenseTermsService` for runtime checks.

## Invariants & gotchas

- `co_relation_id` is the cross-branch/cross-instance identity for app entities; adapter
  auto-generates missing git-ids on push and rewrites *all* UUID references (including UUIDs embedded
  inside strings) via `replaceEmbeddedUUIDsInAllStrings`. Breaking this mapping orphans entities on pull.
- **One `apps` row per `co_relation_id`**, per organization and type. Every pull lookup keys on it and
  keeps only the first match, so duplicates trip the `enforce_app_versions_*` name/slug triggers and the
  pull fails on every run. `idx_apps_co_relation_id` is non-unique and `CREATE TRIGGER` never validates
  existing rows, so duplicates accumulated silently until data-migrations/1793400000000 detached them and
  added `idx_apps_org_type_co_relation_id_unique`. `logConflictingRows`
  (`ee/platform-git-sync/pull.service.ts`) logs the colliding rows as versioned JSON; paste that line into
  `check-pull-error.html` at the repo root to get the app, the rule and the repair SQL.
- **A temp-app import must never reuse the identity of the app it is importing into.** Both import lanes
  build a throwaway app, drain its versions onto the real app and delete it: `hydrateStubApp`
  (`ee/platform-git-sync/pull.service.ts`, via `withTempAppIdentity`) and `importAndAttachVersion`
  (`ee/app-git/shared/app-git-operations.util.ts`). They run with `isGitApp=true`, which tells
  `createImportedAppForUser` to preserve `appV2.co_relation_id` verbatim instead of minting a fresh one —
  so the temp row would be a second `apps` row holding the target's identity, which the unique index above
  rejects. Nulling the field is not enough: the fallback is `co_relation_id ?? id`, and `id` is the
  identity an export without a `co_relation_id` was given. Override it with a fresh UUID.
- Only one provider strategy is active per org; `deleteConfig` must still succeed when config rows
  are already gone (error swallowed) and evicts both branch and git-object caches for the repo.
- Both caches fail open: Redis down -> `remote-branch-cache` returns null (refetch), cache set errors
  swallowed. Multi-node eviction relies on Redis pub/sub channel `tj:git-cache:evict`.
- Version rename/match on pull: `findMatchingVersion(appId, gitVersionName)` +
  `deleteMatchingVersionIfExists` in EE `base-git-util.service.ts` — pulls replace the matching version.
- SSH keys are written to temp files per operation and cleaned up (`writeSSHKeyToFile`/`cleanupSSHKeys`).
- **Slug-uniqueness triggers must exclude BOTH `av.app_id <> NEW.app_id` AND `av.id <> NEW.id`.**
  `enforce_app_versions_default_branch_slug_unique` fires on `UPDATE OF slug, branch_id, app_id`.
  Hydration re-parents a version row between apps (`UPDATE app_versions SET app_id = ...` in
  `ee/platform-git-sync/pull.service.ts`), and in a BEFORE UPDATE the row still carries its OLD
  `app_id` — so `app_id`-scoping alone makes the row collide with itself. The two predicates solve
  different problems: `app_id` exempts sibling rows of the same workflow (which intentionally share
  one slug), `id` exempts the row being updated. Dropping either one breaks a real flow. The
  workflow branch shipped without `av.id` (1782500000000) and broke hydration for every
  git-pulled workflow; fixed by 1793250001000.
- **The slug triggers are branch-BLIND; the name trigger is branch-scoped and asymmetric.**
  `enforce_app_versions_{default_branch_,}slug_unique` return early when the row being written has
  a NULL `branch_id`, but their `EXISTS` carries **no branch filter at all** — a slug on any
  branch, or on a branch-less row, collides with a write on the default branch.
  `resolveNonCollidingSlug` (`ee/platform-git-sync/pull.service.ts`) does NOT mirror that despite
  its docstring: it joins `is_default = true`, so its pre-flight misses cross-branch collisions.
  `applyVersionMetadataWithSlug` then retries with a UUID slug, `propagate_app_version_metadata`
  carries that into the app's feature-branch row, and the NAME trigger raises there — a
  non-slug error that `isSlugUniqueViolation` rethrows, failing the pull. So anything that takes
  an app off a slug must clear it on **every** branch.
  `enforce_app_versions_app_name_branch_unique` is the opposite: scoped to `NEW.branch_id`, and it
  exempts the app's own rows only on the DEFAULT branch (`av.app_id <> NEW.app_id`). On a feature
  branch two rows of one app — a stub and a non-stub, which `fetchLatestVersionsForBranch` relies
  on coexisting — cannot share a name. data-migrations/1793400000000 handles both: the default
  branch takes one name for every row, then each remaining row is written individually, one per
  branch keeping the plain name and the rest taking it plus their own version id.
- **A NULL `app_versions.status` counts as a DRAFT to every version trigger.** The column is
  nullable with no default (legacy rows), and the guards are written
  `IF status <> 'DRAFT' THEN RETURN NEW` — PL/pgSQL does not take a branch on a NULL condition, so
  the trigger body runs. SQL predicates that mirror those guards must use `IS NOT TRUE`, never
  `NOT (status = 'DRAFT' AND ...)`, or the row falls out of both sides of the split.
- **Redact secrets AFTER `ctx.isEnabled()`, never before.** For `useEnvConfig` orgs that call reaches
  `GitSyncConfigsUtilService.getDetails`, which replaces `orgGit.gitHttps` wholesale — reinstating
  `githubPrivateKey` if it was stripped earlier. `getDetails` now shallow-clones its argument, but
  the ordering in `findAppGitConfigs` is still the guard that matters.
- **Pass `{ manager }` to `getDetails` when you already hold a connection.** Without it, `getDetails`
  opens its own transaction (and `ensureResolved` its own lookup) — a second pooled connection per
  call. Called per row (e.g. `AppsSubscriber.afterLoad`), that exhausts the pool. The rare
  missing-default-branch fallback still writes in its own transaction, never on the caller's manager.
- **The app-git import lane creates referenced workflow rows, and gates them.** `createGitApp` (and the two tag-import helpers) pre-create + hydrate embedded **workflows** as well as modules, via `pullAndHydrateWorkflowRefs` → `hydrateReferencedWorkflowStubs`. Creating them requires `workflowCreate` (`assertWorkflowCreatePermission`), asserted **before** hydration — after it, the check would always see zero missing. Workflows reached through a module are handled by `hydrateStubApp` step 6b during that module's hydration, so this lane must not walk into modules.
- Pull / create-branch clone the default `organization_git_sync_branches` row's `branch_name`, not the
  configured branch. Env config keeps it in sync via `reconcileDefaultBranchName` (`ee/git-sync/default-branch.util.ts`)
  on restart hydration and on toggle; renames must also invalidate `RemoteBranchCacheService`.
- Testing: don't extend the monolithic git-sync lifecycle `it()` block in the e2e suite — write standalone specs instead (see `server/docs/testing.md`, Determinism).
- **Workspace pull reports where its time went.** `POST /workspace-branches/pull` returns `diagnostics`
  (stage `request`) and the `git-pull-branch` job puts the same shape (stage `job`) in its notification
  `metadata.diagnostics`; both also log `[pull-diagnostics] {json}`. Type: `PullDiagnostics`
  (`workspace-branches/types`). Collected through an AsyncLocalStorage in
  `ee/platform-git-sync/pull-diagnostics.util.ts`, so deep code records with `phase()` /
  `recordCategorySkip()` and stays a no-op outside a pull. Phase prefixes: `net_` git provider,
  `db_` our import, `wait_` Redis queue/lease. `pod` is a hashed hostname — the git mirror cache is per-pod disk.

## Related modules

- `app-git` (`src/modules/app-git/` + `ee/app-git/`): app-level push/pull/rename/branches/tags —
  `gitPushApp`, `pullGitAppChanges`, `createGitApp`, `createBranch`, `renameAppOrVersion`.
- `workspace-branches` (`src/modules/workspace-branches/` + `ee/workspace-branches/`): branch rows
  (`src/entities/workspace_branch.entity.ts`, meta-hash columns for drift detection), deletion-commit listener.
- `import-export-resources`: `GitSyncAdapter` delegates actual app export/import to
  `ImportExportResourcesService` (`ee/import-export-resources/service.ts`).
- `apps` / `versions`: imported by `module.ts`; version entities are what get pushed/pulled.
- `tooljet-db`, `plugins`: workspace serialization covers internal tables and marketplace plugin installs.
