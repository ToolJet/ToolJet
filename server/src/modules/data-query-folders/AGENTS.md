# data-query-folders module

Owns **Query folders**: a tree of folders and Queries inside one App Version, so builders can group the Queries of an app in the query panel. Stored as `data_query_folders` plus `data_query_folder_mappings` (parent, child, child type, index). Real logic is EE-only; the CE service is a stub.

## Domain terms

- **Folder** — named container in one App Version. Name is unique per version (advisory lock in the EE service).
- **Mapping** — row placing a folder or Query under a parent folder (or the root) at an index.
- **Delete mode** — `folder_only` moves children to the root; `folder_and_queries` deletes the Queries too.

## Key files

| File | Role |
|---|---|
| `controller.ts` | Class guards `JwtAuthGuard, QueryFolderScopeGuard, FeatureAbilityGuard`; routes are stubs in CE |
| `guards/query-folder-scope.guard.ts` | Pins the request to one App Version of the caller's workspace; sets `tj_app`, `tj_app_version` |
| `ability/` | Folder permissions = the caller's query permissions on that app (`defineAppQueryAbility`) |
| `repository.ts` | Folder and mapping queries |
| `ee/data-query-folders/` | EE controller, service, and `guards/query-folder-git-sync.guard.ts` |

## Edition split

- EE service extends the CE stub; writes capture App History deltas fire-and-forget.
- Nest merges class-level `@UseGuards` from the base class, so the CE guards also run in EE. A guard in the class list must not inject an edition-specific token: that is why the git-sync check is an EE-only method guard.

## Invariants & gotchas

- Ids in a body never decide scope. The scope guard collects every id of the request (`:id`, `appVersionId`, `childId`, `parentId`, batch items), resolves each to its version, requires all of them to be in the caller's workspace (404 otherwise) and in exactly one version (400 otherwise).
- It must run before `FeatureAbilityGuard`: that guard reads `request.tj_app` to pick app-level permissions and caches them on the request.
- Writes need a draft, unreleased version (400) and pass the git-sync edit lock (EE guard). GET needs only view access to the app.
- The service still takes bare ids; it relies on the guard having proven they belong together. A new route must be covered by the guard's id collection.
- Pinned by `ee/test/modules/data-query-folders/e2e/cross-workspace-scope.spec.ts`.

## Related modules

- `data-queries` — owns the Queries; EE `create` places a new Query in a folder after checking it is in the same version
- `git-sync-configs` — edit lock; `app-history` — change deltas
