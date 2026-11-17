# data-sources module

Owns Data Source connections: creating/configuring connectors (Postgres, REST API, marketplace plugins, ...) at the workspace level, storing their per-Environment credentials encrypted, testing connections, OAuth2 flows, and resolving plugin services that execute queries. Registered as `MODULES.GLOBAL_DATA_SOURCE`; controller route is `data-sources`.

## Domain terms

- **Global Data Source** — workspace-level connection, `scope = 'global'` (`DataSourceScopes.GLOBAL`). The normal case; shared across apps, gated by granular permissions.
- **App-Level Data Source** — legacy per-app connection, `scope = 'local'` (code says "local", UI says app-level). `changeScope`/`convertToGlobalSource` migrates local → global; nothing creates new local ones here.
- **Sample Data Source** — `type = 'sample'` (`DataSourceTypes.SAMPLE`); auto-created Postgres pointing at the shared `sample_db` (`SampleDataSourceService`), refreshed nightly by `SampleDBScheduler`. Cannot be deleted; options hidden from list responses.
- **Static/default Data Source** — `type = 'static'`, kinds in `DefaultDataSourceKinds` (`restapi`, `runjs`, `runpy`, `tooljetdb`, `workflows`); one `${kind}default` row per workspace, no user-editable options.
- **Kind vs type** — `kind` = connector identifier (plugin name); `type` = `static | default | sample`.
- **DSV / DSVO** — `DataSourceVersion` (branch-aware version row, `is_default` / `branch_id` / `is_active`) and `DataSourceVersionOptions` (options per DSV per Environment). Options live here, not on `data_sources`.

## Key files

| File | Role |
|---|---|
| `module.ts` | `SubModule.register()`; imports app-environments, encryption, organization-constants; exports `DataSourcesUtilService`, `SampleDataSourceService`, `PluginsServiceSelector` |
| `service.ts` | CRUD orchestration, scope change, test-connection, OAuth authorize, `invokeMethod` (plugin method invocation + OAuth token refresh/retry), audit-log context |
| `util.service.ts` | The heavy lifter: create/update with option encryption (`parseOptionsForCreate/Update`), `parseSourceOptions` (decrypt + resolve `{{constants.*}}`/`{{secrets.*}}`), OAuth token fetch/update, branch DSV creation, unique-name enforcement |
| `repository.ts` | `allGlobalDS()` — permission-filtered listing with branch/environment DSV+DSVO joins; static/default helpers |
| `controller.ts` | REST endpoints incl. `POST :id/test-connection`, `:id/scope`, `:id/authorize_oauth2`, `:id/invoke`, `dependent-queries/:datasource_id` |
| `services/plugin-selector.service.ts` | Resolves `kind` → plugin `QueryService` from `@tooljet/plugins/dist/server`; EE adds marketplace plugin lookup |
| `services/sample-ds.service.ts` | Creates/updates the sample Postgres source from `SAMPLE_PG_DB_*` env vars across all Environments; boot sync (`syncSampleDataSources`) re-points sources whose `sample_fingerprint` is stale |
| `ability/` | `FeatureAbilityFactory` — CASL rules from granular `GLOBAL_DATA_SOURCE` permissions (`isAllConfigurable`, `usableDataSourcesId`, ...) |
| `guards/whitelist-plugin.guard.ts` | Restricts `:id/invoke` to an allowlisted set of kinds |
| `guards/validate-query-source.guard.ts` | `ValidateDataSourceGuard` — loads + org-checks the data source for param `id` |
| `dto/index.ts` | `CreateDataSourceDto`, `UpdateDataSourceDto`, `TestDataSourceDto`, `InvokeDataSourceMethodDto`, `ValidateOptionsDto`, ... |
| `dashboard/activity.service.ts` + `activity.interceptor.ts` | Dashboard v2 view/edit attribution (see "Dashboard v2 schema" below) |
| `dashboard/dashboard.controller.ts` + `dashboard.service.ts` | `GET /api/v2/data-sources` — paginated root / folder / search list (see "Dashboard v2 list" below) |
| `dashboard/bulk.service.ts` + `bulk-folder-delete.service.ts` | v2 bulk delete / move / remove and folder bulk delete (see "Dashboard v2 bulk" below) |

## Edition split

- EE override: `server/ee/data-sources/` — all five providers extend CE and call `super()`. Deltas: `resolveConstants` adds `{{globals.server.*}}` (SERVER constants), controller adds `fetchGlobalDataSourcesForVersion`, plugin selector resolves marketplace plugins.
- Secrets/server constants and granular data-source permissions are license-gated (`LicenseTermsService`, `LICENSE_FIELD`).

## Invariants & gotchas

- **Options are encrypted at rest**: values marked `encrypted` are stored in the `credentials` table via `CredentialsService`; the options JSON keeps only `{ credential_id, encrypted: true }`. Decryption happens in `parseSourceOptions` at query/test time only. Never return decrypted values in list APIs (`getAll` strips sample options and restapi `tokenData`).
- **Options are per-Environment**: one `DataSourceVersionOptions` row per (DSV, environment). Creating a source writes options to every Environment of the workspace. There is no single "the options" — always resolve with an `environmentId`.
- Workspace-constant references (`{{constants.x}}` / `{{secrets.x}}`) inside encrypted fields are stored as `workspace_constant` alongside the credential and resolved per-environment at runtime — value follows the environment, not the stored string.
- **Constant resolution is session-workspace only**: `resolveConstants` trusts its `organizationId`, so HTTP entry points must pass `user.organizationId`, never a body/query id. `fetch-oauth2-base-url` (`DataSourcesService.getAuthUrl`) rejects a foreign `organization_id` (403) and an `environment_id` outside the workspace (404) before resolving; internal callers (data-queries `needs_oauth`) call the util directly with server-derived ids.
- Branch-aware behavior (this branch line): delete on a branch soft-deletes (`DataSourceVersion.isActive = false`); released apps read the `is_default` DSV. `branchId` only applies to global-scope sources.
- **`is_synced=false` on create in every mode** (git-off, multi-branch feature, single-branch default) — a brand-new DSV is never-committed, so it stays unsynced until a push (git-sync). There is no single-branch synced-on-create exemption (removed) — mirrors the apps/modules rule. A git-sync pull that finds a synced DSV absent from git **deactivates** it (`isActive=false`), it does not delete the row.
- Sample sources connect as a restricted `tooljet_sample_*` role (`helpers/sample-db-role.helper.ts`), provisioned on boot by `SAMPLE_PG_DB_USER` or `PG_USER`; never the admin user. If provisioning fails, `sample_sql_disabled` is set and queries are rejected. Role setup and `populate-sample-db` share one advisory lock.
- Scope change is one-way (local → global); sample sources can't be deleted; delete is blocked while dependent queries exist (`findQueriesLinkedToDatasource`).
- **Test connection SSRF check** (`validateTestConnectionOptionsForSSRF`): URL-style options are checked for every kind; `host`/`port`/`protocol` are checked for every kind, except that on EE (the SSRF runtime config is present) the built-in database drivers in `SSRF_UNCHECKED_DATABASE_KINDS` are skipped. CE and Cloud check the host for every kind. The skip never applies when the request carries a `plugin_id` (it picks a marketplace plugin whatever `kind` says). A new HTTP connector needs nothing; a new database driver (socket `host`) is added to that set.
- Marketplace plugins run in a `vm` sandbox (`PluginsServiceSelector.findMarketplacePluginService`). `...global` copies only enumerable globals, so web globals like `MessagePort`/`DOMException` must be listed explicitly or bundled libraries (e.g. undici 7) fail at load.
- NEVER abbreviate `data_source` as `ds` in code or docs.

## Dashboard v2 schema

- `data_sources.created_by` (nullable uuid, FK `users(id)` `ON DELETE SET NULL`) — set in `DataSourcesUtilService.create` only; git-sync import, sample and static sources leave it `NULL`.
- `user_data_source_activity` (`user_id`, `data_source_id`, `branch_id` composite PK) mirrors apps' `user_app_activity`. Writer: `dashboard/activity.interceptor.ts` (global `APP_INTERCEPTOR`, registered only when `isMainImport`) upserts `last_viewed_at` after a successful `GET :id/environment/:environment_id` and `last_edited_at` after a successful v1 `PUT :id` (version-agnostic route match, so the Task 6 v2 `PUT` is picked up too), keyed off `request.tj_data_source` set by `ValidateDataSourceGuard`. Same 5-minute / "still latest editor" throttle as apps' `DashboardActivityService`; best-effort (a failed upsert is logged, never fails the request).
- `pinned_items.data_source_id` extends the apps pin table (`chk_pinned_items_one_resource` now allows exactly one of `app_id`/`folder_id`/`data_source_id`; `uq_pinned_items_user_branch_data_source` enforces one pin per user+branch+data source).

## Dashboard v2 list

- `GET /api/v2/data-sources?page&page_size&folder_id&search&branch_id` mirrors apps' `GET /api/v2/apps` (`apps/dashboard/`): `queries.ts` CTEs (`visible_data_sources`, `visible_folders`, `pins`) reuse apps' `SqlParams`, `PIN_ORDER`, `ENTRY_ORDER`, `likePattern`.
- Rules in `dashboard/actions.ts` (pure, unit-tested): visibility copies `allGlobalDS`, folder visibility copies `FolderDataSourcesService.filterFoldersByPermissions`, folder actions copy `FoldersService.checkFolderManagePermission` / `assertFolderDeletable`. A data source's row on a branch = its active DSV there, else (no row at all there) the default branch's active DSV.
- Ordering column: edit-capable caller → own `last_edited_at`, else own `last_viewed_at`. `DataSourcesDashboardService` is factory-provided (edition-resolved `GitSyncConfigsUtilService`).

## Dashboard v2 pins

- `POST /api/v2/data-sources/pins`, `DELETE /api/v2/data-sources/pins/:resource_type/:resource_id`, `PUT /api/v2/data-sources/pins/order` (`dashboard/pins.controller.ts` + `pins.service.ts`). Per user, per branch; one pin space (`resource_type` is `data_source` or `folder`, no `type` field — unlike apps' pins, which fan out per app type).
- Visibility reuses the dashboard list's `visible_data_sources` / `visible_folders` CTEs (`queries.ts` `visibleIdsQuery`); an app-folder id is invisible here because `visible_folders` already filters to `DATA_SOURCE_FOLDER_TYPE`.
- Reorder (`pins.service.ts` `planReorder`) keys pins by `data_source_id ? 'data_source' : 'folder'` — copied from apps' `pins.service.ts` rather than reused, since the apps version keys `app_id ? 'app' : 'folder'` and would collapse every data-source pin to `folder:null`. Only the caller's data-source-page pins (rows with `data_source_id` set, or `folder_id` pointing at a data-source folder) are in scope; app / app-folder pins in the same `pinned_items` table keep their `position` slots.

## Dashboard v2 bulk

- `POST /api/v2/data-sources/{bulk-delete,bulk-move,bulk-remove,folders/bulk-delete}` → 200 `{ blocked_ids }`, all-or-nothing (apps' bulk pattern). Factory-provided `DataSourcesBulkService` / `DataSourcesBulkFolderDeleteService` (edition-resolved `DataSourcesService`, `FolderDataSourcesUtilService`, `FoldersService`, `GitSyncConfigsUtilService`).
- Delete checks (`splitDeletable`): workspace, not sample, `canDeleteDataSource`, no dependent queries, git edit rule on the branch row. Writes via `DataSourcesService.delete` with the raw `branch_id` (absent → whole data source), one `DATA_SOURCE_DELETE` audit entry each.
- Move / remove: `canManageFolderDataSources` (v1 folder-data-sources ability) on the target / source folder; `assertFolderWritable` guards git-locked default branches (403). Remove uses `FolderDataSourcesUtilService.bulkRemove`.
- Folder delete: `FoldersService.assertFolderDeletable` per folder; `folder_and_data_sources` deletes only data sources on the branch that pass the delete checks, the rest fall to root.

## Related modules

- `data-queries` — queries belong to a data source; `DataQueriesUtilService` is registered inside this module for option parsing.
- `app-environments` — `AppEnvironmentUtilService.getOptions()` is the canonical per-environment options read path.
- `encryption` — `CredentialsService` / `EncryptionService` for credential storage and column decryption.
- `organization-constants` — workspace constants/secrets resolved into options at runtime.
- `group-permissions` / `ability` — granular usable/configurable data-source permissions feeding `allGlobalDS` and CASL.
- `plugins` — plugin manifests/operations; `PluginsRepository` + marketplace plugin services.
