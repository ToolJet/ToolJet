# data-queries module

Owns the **Query** concept: a named, parameterized operation against a Data Source, belonging to an
App Version (`data_queries.app_version_id`). Handles Query CRUD and server-side execution — resolving
the right plugin, per-Environment credentials, and `{{ }}` templates before invoking the connector.

## Domain terms

- **Query** — connects an App to a Data Source; options hold the operation definition (glossary: /UBIQUITOUS_LANGUAGE.md)
- **Transformation** — JS/Python transform on results, applied on the frontend; not handled here
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

**Query Library** drafts belong directly to a workspace in `library_queries`; no backing app or app version is involved. Lifecycle routes and the service live in `query-library/`. Apps use its queries as **Library Queries**: kind `library`, options `{ libraryQueryId, libraryQueryVersionId, libraryKind, inputs }`; `libraryQueryVersionId` is a required UUID of a live named draft or saved version. Missing/sentinel refs are rejected. Helpers in `library/`: `library-lifecycle.util.ts` (pure rules); `query-library/lifecycle.service.ts` (transactions), `library-query.util.ts`, `library-export.util.ts`, `add-to-library.util.ts`; migration `1792600000000-AddLibraryQueryLifecycle`. Design: `nakul-workflow/superpowers/specs/2026-10-29-query-library-standalone-design.md`.

- **Standalone lifecycle/editor.** `query-library/` owns workspace drafts, immutable versions, catalog, usage and editor runs under `/query-library/*` (EE/Cloud only). It never needs a backing app/version. See `../query-library/AGENTS.md`.
- **Run path** (`runLibraryQuery`/`loadLibraryTarget`): routes `run-library` and `library-definition` take the **consumer** query id and nothing else (no `libraryQueryId`); auth, public access and environment come from the consumer app, mode is always `'view'`. Library target lookups are workspace-scoped against `library_queries`; foreign pins return 404. Consumer identity and app-version metadata stay intact, while `DataQueryExecutionOptions.library` forces default-branch source options. It resolves the exact UUID from saved storage first, then live drafts, scoped to the query; a version of another query is 404. The pinned version's environment is only a promote/release gate: run time uses the **consumer app's** environment credentials. No library-to-library calls: library RunJS scope is `moment, _, axios, constants, globals, input, timers` (no `queries`, no siblings, no depth cap, no `components`/`variables`). `inputs` merge over the library defaults; library queries have no `parameters`. Python transformations are refused. The result carries `libraryTransformation` and `libraryScope: { input }` (unresolved `{{constants.x}}`/`{{secrets.x}}` default text), so the browser never gets a resolved secret; `runLibraryQuery` strips `metadata.request`/`queryDefinition`. The catalog never exposes query text or URLs.
- Constants and secrets resolve only inside library DEFAULTS (`resolveLibraryServerReferences`, consumer's environment), never in caller-supplied values.
- **Consumer gates** (apps `util.service.ts`): `release` and the external API auto-deploy (`server/ee/external-apis/service.ts`, which sets the current version) run `checkLibraryQueriesReleasedInApp` (each direct pin ID must equal that query's Released version ID; storage status identifies draft pins regardless of names); `checkLibraryQueriesPromotableToEnvironment` blocks app/module promote when a pinned version has not reached the target environment (called from `server/ee/versions/service.ts` and `server/ee/external-apis/service.ts` for FRONT_END and MODULE). `GET /apps/:id/versions/:versionId/library-pins` returns `{ pins: LibraryPin[] }` with `releasedVersion`, `pinnedEnvironment` (`getLibraryPinsForAppVersion`; `VersionService.getLibraryPins` 404s a version not in the URL app). `queryLibraryConsumers` matches consumers by `libraryQueryId` across every app version; deleting a consumed query is refused.
- **Export/import**: export bundles each used query's draft and pinned versions (`collectLibraryExport` → `appV2.libraryQueries`, plus data sources and ToolJet DB tables); `importLibraryQueries` matches by `co_relation_id`, id, then name, and new versions land in **Development** of the importing workspace with nothing Released, then re-points consumer pins. Writing needs `isSuperAdmin || isAdmin || moduleCreate`. Git push/pull never carries library queries (`{ forGit: true }` → `withLibraryQueries: false`; `import` skips them when `isGitApp`).
- **Add to library** (`POST :id/versions/:versionId/add-to-library`, `DataQueriesService.addToLibrary`): one transaction copies an app query into the library root, saves **v1 in Development** (nothing Released) and rewrites the app row in place to a consumer (same id/name; app-level settings kept from the **stored** row). Client sends `sourceOptions` (must equal stored row, else 409), `libraryOptions`, `inputs`; server re-checks that options only read `input`/`constants`/`globals.currentUser` (+ built-ins, `moment`, `_`), inputs have empty defaults, no parameters, and import write permission. Because v1 is not Released, the app must pin a Released version before it can release.

## Edition split

- `server/ee/data-queries/` — `service.ts`, `util.service.ts`, `controller.ts` all extend CE bases and `super()`.
- EE service: `before/afterQuery*` hooks (App History), query folder mappings, permission-aware `getAll` (`getAllWithPermissions` in edit mode).
- EE util `runQuery`: query-level access check (`checkQueryAccess`) in `view` mode, gated by `LICENSE_FIELD.APP_PERMISSIONS_QUERY`; public app + any query permission = denied.
- EE controller adds `POST /workflow-node` and re-guards run/update (and `add-to-library`) endpoints.

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
- **Stale-save guard**: `update`, `bulkUpdateQueryOptions` and the builder-run write-back (`runQueryOnBuilder`) call `assertLibraryConsumerOptions`, refusing (400) options that drop the `libraryQueryId` the stored row already has (a fresh library query saves freely), so a stale editor (or another builder's) can't overwrite a converted query with its old options. Standalone library editor runs belong to `query-library`: supplied options preview an existing draft without write-back; saved-version runs use the immutable snapshot and reject options overrides.
- Never abbreviate `data_source` as `ds`.

## Related modules

- `data-sources` — parseSourceOptions, PluginsServiceSelector, OAuth token update/auth-url
- `app-environments` — per-Environment data source option resolution (`getOptions`)
- `versions` / `apps` — version scoping, promoted-version checks, app type (workflow vs app)
- `app-permissions` + `app-history` (EE) — query-level permissions; change history hooks
- `data-query-folders` (EE) — folder mappings created/removed with queries
- `tooljet-db`, `plugins` — ToolJet Database operations service; marketplace plugin loading

- **Add to library** keeps its app-scoped route and stored-options conflict check, but creates a workspace `LibraryQuery`, state and Development v1 through `QueryLibraryService`/`LibraryLifecycleService` using the same transaction as consumer conversion. It creates no backing app. Export reads workspace drafts/folders and `library_query_id` versions; deleted-source drafts still travel.
