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

**Query Library** identities belong directly to a workspace in `library_queries`; independent editable snapshots live in `library_query_drafts`, and saved snapshots in `library_query_versions`; no backing app or app version is involved. Lifecycle routes and the service live in `query-library/`. Apps use its queries as **Library Queries**: kind `library`, options `{ libraryQueryId, libraryQueryVersionId, libraryKind, inputs }`; `libraryQueryVersionId` is a UUID of a named draft or saved version. Only a reference being set or changed is checked; a carried one (import, git pull, version create, edits of other fields) may point at a query this workspace lacks (rules: `../query-library/AGENTS.md`). Helpers in `library/`: `library-lifecycle.util.ts` (pure rules); `query-library/lifecycle.service.ts` (transactions), `library-query.util.ts`, `library-export.util.ts`, `add-to-library.util.ts`; migration `1792600000000-AddLibraryQueryLifecycle`.

- **Standalone lifecycle/editor.** `query-library/` owns workspace drafts, immutable versions, catalog, usage and editor runs under `/query-library/*` (EE/Cloud only). It never needs a backing app/version. See `../query-library/AGENTS.md`.
- **Run path** (`runLibraryQuery`/`loadLibraryTarget`): routes `run-library` and `library-definition` take the **consumer** query id and nothing else (no `libraryQueryId`); auth and public access come from the consumer app, mode is always `'view'`. End users run in the app's environment; the builder's editor route (EE, `:id/versions/:versionId/run-library/:environmentId`) runs in the selected environment behind `ValidateEnvironmentAccessGuard`. All three routes are rate limited like `:id/run`. Library target and data source lookups are workspace-scoped; foreign or missing targets return 404 `LIBRARY_QUERY_MISSING`/`LIBRARY_VERSION_MISSING`. Consumer identity and app-version metadata stay intact, while `DataQueryExecutionOptions.library` forces default-branch source options. It resolves the exact UUID from saved storage first, then live drafts, scoped to the query; a version of another query is 404. The pinned version's environment is only a promote/release gate: run time uses the run's environment credentials (see above). No library-to-library calls: library RunJS scope is `moment, _, axios, constants, globals, input, timers` (no `queries`, no siblings, no depth cap, no `components`/`variables`). `inputs` merge over the library defaults; library queries have no `parameters`. Python transformations are refused. The result carries `libraryTransformation` and `libraryScope: { input }` (unresolved `{{constants.x}}`/`{{secrets.x}}` default text), so the browser never gets a resolved secret; `runLibraryQuery` strips `metadata.request`/`queryDefinition`. The catalog never exposes query text or URLs.
- Constants and secrets resolve only inside library DEFAULTS (`resolveLibraryServerReferences`, consumer's environment), never in caller-supplied values.
- **Consumer gates** (apps `util.service.ts`): `release` and the external API auto-deploy (`server/ee/external-apis/service.ts`, which sets the current version) run `checkLibraryQueriesReleasedInApp` (each direct pin ID must equal that query's Released version ID; storage status identifies draft pins regardless of names); `checkLibraryQueriesPromotableToEnvironment` blocks app/module promote when a pinned version has not reached the target environment (called from `server/ee/versions/service.ts` and `server/ee/external-apis/service.ts` for FRONT_END and MODULE). `GET /apps/:id/versions/:versionId/library-pins` returns `{ pins: LibraryPin[] }` with `releasedVersion`, `pinnedEnvironment` (`getLibraryPinsForAppVersion`; `VersionService.getLibraryPins` 404s a version not in the URL app). `queryLibraryConsumers` matches consumers by `libraryQueryId` across every app version; deleting a consumed query is refused.
- **Export/import**: export bundles each used query's explicit named drafts and pinned saved versions (`collectLibraryExport` → `appV2.libraryQueries`, plus data sources and ToolJet DB tables); `importLibraryQueries` matches by `co_relation_id`, id, then name (like Modules), and maps draft/saved identities, saved environment placement and the Released pointer into the importing workspace, then re-points consumer pins. Destination release prerequisites and immutable snapshot conflicts are validated before commit. Writing refuses end users only, the library page rule (preflighted before ToolJet DB tables commit). Unlicensed: export bundles no definitions, import creates none, references are kept. A reference to a deleted query/version is exported as-is; a saved version whose environment the target lacks lands in its lowest environment. Git push/pull never carries library queries (`{ forGit: true }` → `withLibraryQueries: false`; `import` skips them when `isGitApp`).
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
- `runQueryOnBuilder` saves the sent `options` back (editor convenience) but skips the write when the
  git-sync edit rule forbids it (e.g. synced draft on the default branch under branching) — the run itself
  still executes. Update/create/delete enforce the same rule as a 403 via `GitSyncQueryEditGuard`.
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

- **Pin write/delete serialization:** create, update, bulk update, editor run write-back, source conversion and Add to library call `query-library/locking.ts` with their persistence transaction. Updates lock consumer rows before rereading their source/options; bulk updates lock consumer IDs then parent query IDs in sorted order. The parent lock remains held through the write, and the exact live draft/saved reference is revalidated after acquiring it. Ordinary read-only runs do not lock.

- **Named file bundles** (`library/library-export.util.ts`): export explicit `drafts[]` and named saved `versions[]` with nullable descriptions/parent UUIDs, environment placement and the query's Released pointer. Import requires this format; it preserves status/identity relationships and rejects conflicting names instead of inventing names or implicit draft pins. Module bundles carry the same format. `DataQueriesService.addToLibrary` creates and saves the initial `v1` draft with the same UUID and converts the consumer inside the same transaction; a conversion failure rolls back identity, state, draft and saved row.

## Explicit library reference resolution

Consumers require `options.libraryQueryId` plus `options.libraryQueryVersionId`, identifying one exact live draft or saved snapshot. `resolveLibraryReference` resolves saved storage first, then the live draft scoped to the authorized query. When a reference is set or changed, missing, empty, sentinel, conflicting and unknown references fail; carried references are kept and fail only when run (and at release/promote). No selected-draft fallback or name-based status exists. Standalone editor requests choose exactly one `draftId` or `libraryVersionId`. Saving preserves the UUID and freezes the snapshot, so consumers keep their pin. Runtime uses the run's environment credentials and existing workspace/source/environment authorization.

Query Library entitlement: running a consumer calls `assertLibraryConsumerAccess` (stored source kind). Writes (create/update/bulk/source change/editor-run write-back) go through `lockLibraryConsumers`, which needs the licence only when a write sets or changes a reference, and then also checks the builder can use the pinned snapshot's data source (`QueryLibraryService.authorizeDataSource`, the library page's rule; running needs no data source permission, like any app query); renames, other option edits and moving a query off the library keep working without it, like Modules. Bulk requests check every row before any write. Conversion, definition retrieval and library execution live in the selected EE service; CE refuses these operations. Internal library loading checks the consumer app workspace through QueryLibraryService.assertEnabled, including public apps. No caller header or libraryKind hint determines licensing.
