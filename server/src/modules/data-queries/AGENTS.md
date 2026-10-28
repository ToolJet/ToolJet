# data-queries module

Owns the **Query** concept: a named, parameterized operation against a Data Source, belonging to an
App Version (`data_queries.app_version_id`). Handles Query CRUD and server-side execution — resolving
the right plugin, per-Environment credentials, and `{{ }}` templates before invoking the connector.

## Domain terms

- **Query** — connects an App to a Data Source; options hold the operation definition (glossary: /UBIQUITOUS_LANGUAGE.md)
- **Transformation** — JS/Python transform applied to query results *on the frontend*; not handled in this module
- **Run JavaScript / Run Python** — special query types against static data source kinds `runjs`/`runpy`
  (`DefaultDataSourceKinds` in `@modules/data-sources/constants`). Executed in the browser for apps;
  server-side only for workflows (see `ee/data-queries/guards/create-workflow-query.guards.ts`)

## Key files

| File | Role |
|---|---|
| `module.ts` | `register()` per SubModule pattern; per-(user, app) run throttling via `ThrottlerModule` (`DATA_QUERY_RUN_TTL`/`DATA_QUERY_RUN_LIMIT`, default 50/s, single-pod counters); exports `DataQueriesUtilService` |
| `controller.ts` | CRUD + `POST :id/versions/:versionId/run/:environmentId` (RUN_EDITOR), `POST :id/run` (RUN_VIEWER, `QueryAuthGuard` allows unauthenticated on public apps + `AppScopedThrottlerGuard`), preview, list-tables, change data source |
| `service.ts` | CRUD orchestration; `runQueryOnBuilder`/`runQueryForApp`/`preview` → `runAndGetResult` (wraps `QueryError` into `{status: 'failed'}`); `before/afterQuery*` hooks are CE no-ops for EE App History |
| `util.service.ts` | `runQuery` core: env option resolution, `parseQueryOptions` template resolution (`{{constants.}}`/`{{secrets.}}`/`{{globals.server.}}` via `resolveConstants`), OAuth refresh + `needs_oauth` flow, `query_timeout` abort, REST cookie/XFF forwarding, audit-log locals |
| `repository.ts` | `getAll`, `getAllWithPermissions`, `getOneById`, `getQueriesByVersionId`, `createOne`, `deleteDataQueryEvents`, `findPublicParentAppForModuleQuery` |
| `ability/app/`, `ability/data-source/` | two CASL guard factories: app-scoped (incl. workflow variant) and global-data-source-scoped |
| `guards/` | `query-auth.guard.ts` (public-app-aware JWT), `validate-query-app.guard.ts`, `validate-query-source.guard.ts` |
| `services/status.service.ts` | `DataQueryStatus` — timing/status metadata attached to results and audit logs |

## Execution flow (runQuery)

1. `AppEnvironmentUtilService.getOptions(dataSourceId, orgId, envId, branchId)` — picks the
   Environment-specific `data_source_options` row; `branchId` comes from `dataQuery.appVersion`
   (lazy-loaded), making credential resolution git-branch-aware.
2. `fetchServiceAndParsedParams` — `DataSourcesUtilService.parseSourceOptions` (decrypt credentials,
   resolve constants) + `parseQueryOptions` + `PluginsServiceSelector.getService(pluginId, kind)`
   (`@modules/data-sources/services/plugin-selector.service.ts`): `tooljetdb` →
   `TooljetDbDataOperationsService`; `pluginId` set → marketplace plugin eval'd from DB `indexFile`
   in a `vm` context (cached); else built-in `new allPlugins[kind]()` from `@tooljet/plugins/dist/server`.
3. `service.run(sourceOptions, parsedQueryOptions, '${dataSourceId}-${environmentId}', updatedAt, ctx)` —
   the third arg is the plugin connection-cache key; env-scoped so environments never share connections.

## Query libraries

One **Query Library** per workspace (a `query_library` app, created on first visit by the dashboard tab through `POST /apps`; app import uses `AppsUtilService.getOrCreateWorkspaceQueryLibrary`); its `data_queries` rows are the **drafts**, grouped in query folders. **Release** copies a draft (kind, data source, options) into `library_query_versions` as the next `vN` (immutable; soft delete via `deleted_at`, numbers never reused). Apps use them as **Library Queries**: kind `library`, options `{ libraryQueryId, libraryQueryVersionId, libraryKind, inputs, parameters }`; `libraryQueryVersionId` is a version row id or `'draft'` (**draft pin**, testing only). Helpers: `library/library-query.util.ts`, `library/library-export.util.ts`.

- Routes take the **consumer** query id (`run-library`, `library-definition`): auth, public access and environment come from the consumer app; mode is always `'view'` (library options never written back). `:versionId/library-usage`, `library-catalog`, `library-release` and `library-versions` take the library app version. Release: `Nothing changed since vN` when identical to the latest; `DELETE …/library-versions/:id` is 409 (`libraryUsedByMessage`) while any app/module version pins it. Python transformations are refused on release, on draft runs and on `library-definition`; the catalog never exposes query text or URLs.
- Run path (`loadLibraryTarget`): the pinned snapshot (or the draft), never the draft after a release (a version of another query → 404 `Library query version not found`); sibling calls from RunJS (`libraryQueryId` in the body) run the sibling's latest release. `inputs` (bound in the inspector) and `parameters` (runtime `.run()`) travel separately and are merged over the library defaults; templates see `input`, `parameters`, `moment`, `_`, `globals.currentUser`. The result carries `libraryTransformation` and `libraryScope: { input, parameters }` so the browser applies the library transformation before the app's own; `libraryScope` keeps the unresolved `{{constants.x}}`/`{{secrets.x}}` default text, so the browser never receives a resolved secret. Library RunJS and transformations can't see `components`, `variables` or app `queries`.
- Constants and secrets: `{{constants.x}}`/`{{secrets.x}}` are resolved only inside library DEFAULTS (`resolveLibraryServerReferences`, in the consumer's environment), never in caller-supplied values, so a caller can't read a secret by sending its name. `runLibraryQuery` strips `metadata.request`/`queryDefinition`: non-RunJS options never reach the browser. RunJS code does (browser-side, not a sandbox; `library-definition` is RunJS-only).
- Release gate: `AppsService.release` (apps and modules) runs `checkLibraryQueriesReleasedInApp` (apps `util.service.ts`): every library pin must be a live released version (any, not only the latest), and a pinned RunJS version must not call a never-released sibling. A newer release is a non-blocking warning from `GET /apps/:id/versions/:versionId/library-pins` (`getLibraryPinsForAppVersion`; `VersionService.getLibraryPins` 404s a version that isn't the URL app's, since `ValidAppGuard` ignores `versionId` for slugs). Usage and guards: `queryLibraryConsumers` matches consumers by `libraryQueryId` across every app version (apps and modules; `toLibraryUsage` → `{ apps, modules }`). Deleting a consumed query, or renaming/deleting one that a live released version of another query calls by name, is refused (`assertNotCalledByReleasedVersions`).
- Export/import: export bundles each used query's draft, pinned versions and RunJS siblings (`collectLibraryExport` → `appV2.libraryQueries`, plus their data sources and ToolJet DB tables); import (`importLibraryQueries`) finds or creates the workspace library, matches queries by `co_relation_id`, then id, then name, reuses identical versions or adds the next number, remaps data source and table ids, then re-points every consumer pin. Writing needs `isSuperAdmin || isAdmin || moduleCreate` (the Module permission bucket); a re-import that creates nothing needs none. Git push/pull never carries library queries: git callers pass `{ forGit: true }` to `ImportExportResourcesService.export` (→ `withLibraryQueries: false`), and `import` skips `importLibraryQueries` when `isGitApp`.

## Edition split

- `server/ee/data-queries/` — `service.ts`, `util.service.ts`, `controller.ts` all extend CE bases and `super()`.
- EE service: implements `before/afterQuery*` hooks (App History via `AppHistoryUtilService`), query
  folder mappings (`DataQueryFolderMappingRepository`), permission-aware `getAll` (`getAllWithPermissions` in edit mode).
- EE util `runQuery` override: query-level access check (`AppPermissionsUtilService.checkQueryAccess`)
  in `view` mode, gated by `LICENSE_FIELD.APP_PERMISSIONS_QUERY`; public app + any query permission = denied.
- EE controller adds `POST /workflow-node` (create workflow-node query) and re-guards run/update endpoints.

## Invariants & gotchas

- A Query belongs to an **App Version**, not an App — every CRUD route is version-scoped.
- Query name unique per app version — enforced via `pg_advisory_xact_lock` in `assertUniqueQueryName`
  (service.ts), not a DB constraint; keep name changes inside `dbTransactionWrap`.
- Create/update are blocked on promoted versions (`validateQueryActionsAgainstEnvironment`) — only the
  priority-1 (development) Environment version is editable.
- Data source credentials are per-Environment **and per-branch**: always pass `branchId` through to
  `getOptions`; `null` branchId falls back to the default data source option row.
- Delete removes query events first (`deleteDataQueryEvents`) inside the same transaction.
- `after*` history hooks are fire-and-forget — never await them in request flow.
- Never abbreviate `data_source` as `ds`.

## Related modules

- `data-sources` — parseSourceOptions, PluginsServiceSelector, OAuth token update/auth-url
- `app-environments` — per-Environment data source option resolution (`getOptions`)
- `versions` / `apps` — version scoping, promoted-version checks, app type (workflow vs app)
- `app-permissions` + `app-history` (EE) — query-level permissions; change history hooks
- `data-query-folders` (EE) — folder mappings created/removed with queries
- `tooljet-db`, `plugins` — ToolJet Database operations service; marketplace plugin loading
