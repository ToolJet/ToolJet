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

## Edition split

- `server/ee/data-queries/` — `service.ts`, `util.service.ts`, `controller.ts` all extend CE bases and `super()`.
- EE service: implements `before/afterQuery*` hooks (App History via `AppHistoryUtilService`), query
  folder mappings (`DataQueryFolderMappingRepository`), permission-aware `getAll` (`getAllWithPermissions` in edit mode).
- EE util `runQuery` override: query-level access check (`AppPermissionsUtilService.checkQueryAccess`)
  in `view` mode, gated by `LICENSE_FIELD.APP_PERMISSIONS_QUERY`; public app + any query permission = denied.
- EE controller adds `POST /workflow-node` (create workflow-node query) and re-guards run/update endpoints.
- EE response cache (`ee/data-queries/cache/`, loaded by `module.ts` only for EE/Cloud): opt-in per query via
  saved `options.responseCache` (`enabled`, `ttlSeconds` ≤ 1 day, `keyByUser`). Entries live in Redis under a
  per-query token; Clear (`POST :id/versions/:versionId/cache/clear`, builder-only) replaces the token.
  Run body `cacheControl: 'refresh'` (`RunDataQueryDto` → `runExecutionOptions`) = replace the token, run, cache
  the result; Preview replaces only its own entry. CE accepts and ignores `cacheControl`. RunJS/RunPy are never
  cached; workflow queries are cached at the workflow trigger instead (see `workflows/AGENTS.md`).
  License: `QueryResultCacheService.begin` bypasses (no read, write or token change) unless the workspace license
  has `features.queryResponseCache` (`LICENSE_FIELD.QUERY_RESPONSE_CACHE`); a missing key or failed check means off.
  The builder disables the toggle with the upgrade crown; Clear stays available to free entries saved earlier.
  Memory: Redis is shared with BullMQ (`noeviction`), so `RedisQueryCacheStore` counts bytes itself
  (`MEMORY USAGE` per entry + `2 × key length + 224` for its index member and record) in 10-minute expiry windows
  (`tj:qc:usage:ws:{orgId}`, `tj:qc:usage:global`) and refuses writes over `QUERY_CACHE_MAX_WORKSPACE_BYTES` /
  `QUERY_CACHE_MAX_TOTAL_BYTES` (0 = no writes); it never evicts. A write reserves space, then a plain `SET … PXAT`
  to its own staging key (`<entry>:pending:<reservationId>`), then confirm `RENAME`s it onto the entry and charges the
  real size; the payload never goes through Lua. Only the save whose reservation the record holds publishes, in the
  same script that checks it, so a stale save can never overwrite a newer save's entry. Clear/refresh give bytes back immediately.
  Invariant: bytes are released only from the per-query record `tj:qc:{queryId}:rec` (`bytes|window|reservationId`),
  never by measuring a value (it may not be written yet); confirm acts only while the record holds its own id.
  Usage keys are outside the query hash tag, so the cache needs single-node Redis.

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
