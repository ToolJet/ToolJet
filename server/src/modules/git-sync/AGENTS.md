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
- Only one provider strategy is active per org; `deleteConfig` must still succeed when config rows
  are already gone (error swallowed) and evicts both branch and git-object caches for the repo.
- Both caches fail open: Redis down -> `remote-branch-cache` returns null (refetch), cache set errors
  swallowed. Multi-node eviction relies on Redis pub/sub channel `tj:git-cache:evict`.
- Version rename/match on pull: `findMatchingVersion(appId, gitVersionName)` +
  `deleteMatchingVersionIfExists` in EE `base-git-util.service.ts` — pulls replace the matching version.
- SSH keys are written to temp files per operation and cleaned up (`writeSSHKeyToFile`/`cleanupSSHKeys`).
- Testing: don't extend the monolithic git-sync lifecycle `it()` block in the e2e suite — write standalone specs instead (see `server/docs/testing.md`, Determinism).

## Related modules

- `app-git` (`src/modules/app-git/` + `ee/app-git/`): app-level push/pull/rename/branches/tags —
  `gitPushApp`, `pullGitAppChanges`, `createGitApp`, `createBranch`, `renameAppOrVersion`.
- `workspace-branches` (`src/modules/workspace-branches/` + `ee/workspace-branches/`): branch rows
  (`src/entities/workspace_branch.entity.ts`, meta-hash columns for drift detection), deletion-commit listener.
- `import-export-resources`: `GitSyncAdapter` delegates actual app export/import to
  `ImportExportResourcesService` (`ee/import-export-resources/service.ts`).
- `apps` / `versions`: imported by `module.ts`; version entities are what get pushed/pulled.
- `tooljet-db`, `plugins`: workspace serialization covers internal tables and marketplace plugin installs.
