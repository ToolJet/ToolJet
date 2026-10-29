# tooljet-db module

Owns ToolJet Database (TJDB): user-created Postgres tables scoped to a Workspace, exposed to
Builders as DDL/DML actions and to running apps as a PostgREST-backed data source.

## Domain terms

- **Internal table** — the logical table a Builder creates and names; one row in `internal_tables`,
  identified by a UUID that outlives any environment or branch.
- **Relation** — the physical table a logical table resolves to in one (environment, branch); one
  row in `internal_table_relations`, holding `configurations` (column metadata) for that instance.
- Five names for one table, each read by a different layer: **display name** (`tableName`), **logical
  id** (`internal_tables.id`), **portable id** (`co_relation_id`, git-sync's identity), **relation id**
  (`internal_table_relations.id`, the actual Postgres table name), **schema**
  (`workspace_<organizationId>`, the tenant boundary).

## Key files

| File | Role |
|---|---|
| `services/relation-resolver.service.ts` | Resolves (logical id, environment, branch) → relation id. |
| `services/postgrest-proxy.service.ts` | Rewrites every table reference in a PostgREST request through the resolver before forwarding. |
| `services/tooljet-db-table-operations.service.ts` | DDL actions (`create_table`, `join_tables`, `view_table`, etc.) — the `perform()` dispatch table; also `applyMigrations` (replay). |
| `services/tooljet-db-data-operations.service.ts` | Row-level actions (`list_rows`, `create_row`, `update_rows`, `delete_rows`). |
| `services/tooljet-db-migration-recorder.service.ts` | Migration chain bookkeeping: `record`/`confirm`/`discard`/`adjudicatePending`. |
| `services/tooljet-db-environment-assignment.service.ts` | Rollout migration B: re-points a migration-A relation to the highest-priority environment and clones a development twin. Also owns the two org-scoped read routes. |
| `services/tooljet-db-promote.service.ts` (CE stub, real logic in `server/ee/tooljet-db/services/`) | `POST .../table/:tableId/promote` — computes and replays the missing migration set into the next-priority environment. |
| `helpers/table-schema-snapshot.ts` | Introspects a relation's current shape; shared byte-identical between the recorder and baseline synthesis. |
| `helpers/reconcile-columns.ts` | Mints a uuid for a raw-SQL-introduced column after DDL runs. Kept out of both callers' files — an inter-file import between them previously broke NestJS DI non-deterministically. |
| `controller.ts` | `/proxy/*` (PostgREST passthrough) plus the DDL/DML REST endpoints. |

## Edition split

- EE override: `server/ee/tooljet-db/` — `TooljetDbRelationResolverService` extends CE to swap in
  EE's `AppEnvironmentUtilService` (licence gate lives in `resolveEnvironmentId`, shared by both editions).
- The resolver is real logic in CE, not a stub — a stub would leave CE with nothing to resolve
  `perform()`'s table references to.
- Every service in `module.ts`'s `getProviders(...)` needs a same-path file under
  `server/ee/tooljet-db/services/` (even a pure `super()` forward) — `getImportPath()` swaps the
  whole services base path at once, and an omission only fails at EE/Cloud bootstrap.

## Invariants & gotchas

- **`internal_table_relations.id` and `internal_table_id` are unrelated in general** — a table's first
  relation (migration A's, or the development relation `create_table` makes) satisfies
  `id === internal_table_id`, so a release rolled back to still finds the physical table; promoted
  relations and migration B's development twins mint their own id. That equality is also migration B's
  idempotency discriminator. A physical table name always comes from the resolver, never a logical id.
- `configurations` (column metadata) lives on the relation row, not `internal_tables` — it's per
  (environment, branch).
- **Transition release:** `internal_tables.configurations` still exists so the previous release can
  boot, but it is frozen at upgrade time. Never read or write it; a later release drops it.
  `co_relation_id` is nullable with a `gen_random_uuid()` default instead of NOT NULL. After a
  rollback the previous release reads each table's `id === internal_table_id` relation: the
  development data of a table created after the upgrade, and the production data of a table migration B
  moved. Tables dropped after the upgrade are removed by the substrate schema's `down()`. Production
  data of a table created and promoted after the upgrade is orphaned, not deleted. A table created on
  the previous release gets no relation on roll-forward.
- Both proxy entry points (`PostgrestProxyService.proxy()`/`.perform()`) funnel through
  `resolveAndRewrite()`. Known third path: `server/ee/external-apis/service.ts`'s
  `exportTjdbTableAsCSV` calls PostgREST directly (needs `Accept: text/csv`); it resolves the
  relation id itself via the resolver — keep that if you touch it.
- Fail-closed: a uuid this workspace doesn't own is always 404. An owned-but-unpromoted uuid is 404
  in the URL path (doesn't exist here), 400 in an embedded querystring reference (malformed request).
- **Five independent resolution seams**, each wireable to `environmentId` — a miss silently resolves
  to development:

  | Seam | Where | Reached by |
  |---|---|---|
  | Proxy path | `PostgrestProxyService.resolveAndRewrite()` | `list_rows`, `create_row`, `update_rows`, `delete_rows` |
  | Table-name resolve | `TooljetDbTableOperationsService.resolveTable()` | `sql_execution` |
  | Table-id resolve | `TooljetDbTableOperationsService.resolveTableById()` | both bulk ops' write target |
  | View-table shape read | `viewTable()` (`perform('view_table', ...)`) | `bulk_upsert_with_primary_key`'s shape check |
  | Join resolve | `TooljetDbTableOperationsService`'s join-table resolution | `join_tables` |

  DDL (`create_table`, `edit_table`, etc.) resolves with no environment — schema edits are development-only.
- `bulk_upsert_with_primary_key` resolves its write target (`resolveTableById`) and shape check
  (`view_table`) independently — both must receive the same `environmentId`, always change together.
- `joinTable` falls back to the `TOOLJET_DB_USER` admin role when SQL mode is disabled (Cloud) — an
  over-privileged DB role, not an unvalidated identifier (from/join tables are still workspace-checked).
- Every table reference reaching a query builder must be workspace-validated first — same-shape leak
  as the proxy path if skipped.
- DDL ops (`create_table`, `drop_table`, `edit_table`, `add_column`, `drop_column`, `edit_column`)
  split `normalize*`/`apply*`: `normalize` resolves names→ids and mints every column uuid (the only
  place `uuidv4()` happens outside raw SQL); `apply` only writes DDL/`configurations` for the one
  relation it's handed. Exception: `editColumn`'s `writeThroughColumnConfigurations` (settings-only,
  fans out to every relation sharing that column uuid) lives in the handler, between `normalize` and `apply`.
- `drop_table` soft-deletes `internal_tables` and drops the physical table of **every** environment's
  relation, not just development's — once the registry row is soft-deleted nothing can reach a
  survivor again. Its foreign-key blocker checks inbound keys into all of those relations
  (`findRelationIds` → `findForeignKeyDependents`); the migration is still recorded against development.
  The resolver's raw joins add `deleted_at IS NULL` by hand since raw SQL skips TypeORM's automatic
  filter. The `(organization_id, table_name)` unique index is partial, so a dropped name is
  immediately reusable.
- `findDependents` (the drop blocker and `/dependents` warning) scans every non-stub version of every app
  type, drafts included - `apps.current_version_id` is the *released* version and `released_at` is never
  written, so filtering on either hid drafts. Matches `options.table_id`, join tables (incl.
  `join_table.from.name`) and SQL-mode queries by table name (`tableNamesInSqlQuery`). Superseded versions
  still count, so a table can stay undroppable until the old version is deleted; the dependents entry
  names the app and its queries, not the version.
- "Owned table, not in this (environment, branch)" is always worded by `tableNotInEnvironmentMessage`
  (`relation-resolver.service.ts`) and names the table, never its logical id - `getRelation()`, the proxy,
  join and `resolveTable` all route through it.
- The migration compiler's SQL (`compile()`) is display-only: history drawer, promote preview, raw-SQL
  response. Nothing executes it; replay re-runs the structured action instead.
- Baseline rows have no name/description in the DB (Migration A and `repairBaseline` write none), so
  `getTableMigrations` derives them on read (`baselineLabel`; a stored value wins) and compiles their
  SQL from `resulting_schema`, not `payload.ddl` (replay DDL: `{{self}}` placeholders, sequence
  statements). A foreign key's target is a physical relation id, resolved to a table name through the
  relation with `withDeleted` (a table dropped after the baseline still appears in it). The SQL is
  reconstructed: ON DELETE/ON UPDATE are not in the snapshot and are omitted.
- Licence lapse fails closed for migration-B tables only: `resolve()` 403s when an unlicensed table
  resolves to development while its migration-B relation (`id === internal_table_id`, re-pointed
  above an empty development twin) sits at a higher priority. `getRelation()` goes through
  `resolve()` so the single-table paths (`sql_execution`, bulk ops, `view_table`) refuse the same
  way. A table created after the rollout and promoted keeps its data in development (promote
  replays schema only), so it keeps serving development after a lapse.
- A lapse still lets a workspace export data from staging or production (dump prod to dev before leaving
  multi-environment); everything else in those environments is locked. `resolve()` takes `{ readOnly: true }`,
  which lets a request name an environment the licence no longer covers. Only the HTTP `/proxy/*` route
  (GET/HEAD: row count and CSV export) passes it. `view_table`, App queries (`perform()`), `sql_execution`,
  joins and bulk ops never do, so they still refuse. `view_tables` and `table/:tableId/migrations` keep listing
  an unlicensed environment that still holds a relation so the export picker can offer it; empty ones drop out.
  The frontend flags it `enabled: false` and, like the App Builder, locks it everywhere except that picker.
- **Promote never leaves a ghost relation.** `has_relation` (and the resolver, and the app-promote block)
  mean "a relation row exists", so a row with no table behind it reads as "available in staging".
  `promote` therefore (1) rejects with 400 `Promote "<parent>" first` before creating anything when a missing
  migration references a table with no relation in the target (`referencedTablesOf`: embedded FKs by name,
  baseline/raw-SQL `refs` by co_relation_id) - all-or-nothing on FK order; (2) if replay still fails, deletes the
  target relation only when no physical table backs it (`discardRelationIfNothingMaterialized`) - a relation
  backing a real table is never deleted, its id is the physical name. The frontend refetches tables and migrations on a failed promote too.
- **No per-environment access control.** TJDB has no environment permissions yet: admins and Builders reach every
  environment. `promote` / `promote/preview` gate on licence only - never on the app's granular `environmentAccess`.
- HTTP `/proxy/*` serves only admins/builders (dashboard, App Builder editor). App queries reach
  PostgREST in-process (`.perform()`), never through this route, so anyone else needs a data query of
  their own workspace to pass `FEATURE_KEY.PROXY_POSTGREST`.
- `internal_table_migrations.resulting_schema` and `internal_table_migration_applications.applied_at`
  are both NULL until `.confirm()` fills them together; `.discard()` deletes both rows.
  `.adjudicatePending()` is the crash-recovery sweep (ignores anything younger than 1 minute, so an
  in-flight sibling request's own pending row isn't discarded as crashed).
- FK identity is structural, never the constraint name (Postgres names constraints per-relation).
  `create/update/deleteForeignKey` convert to an `FkSpec` in `normalize`, re-resolve it to whatever
  constraint matches on the target relation in `apply` (`resolveFkConstraintName`, backed by
  `fetchForeignKeys`) — never trust a captured name. No FK sibling in the same (environment, branch) fails closed.
- `perform()`'s recorder wiring is uniform except `create_table`, which records inside its own
  still-open transaction (no table id exists to record against beforehand) and needs no `discard()`.
  FK ops thread `migration` explicitly to `apply*` instead of sharing the other six's try/catch.
- **`applyMigrations(migrationIds, targetRelation, connectionManagers?)` replays a chain into a
  different relation, reusing the same nine `apply*` methods.** One application row per migration,
  committed/confirmed per migration in order — resumable, never skips already-confirmed rows. Dispatch
  is three-way: `baseline` → `replayBaselineMigration`, `raw_sql` → `replayRawSqlMigration`, else →
  `replayStructuredMigration`. No `uuidv4()` on replay — uuids come from the migration's own
  `resulting_schema`. FK ops replay against a never-persisted stand-in `InternalTableMigration` so
  their internal confirm/discard become no-ops. Migration A's baseline DDL uses `{{self}}`/`{{ref_N}}`
  placeholders (resolved via `refs`/`resolveSiblingByCoRelationId`) and rewrites any `serial` default
  to a `{{self}}`-derived sequence — never bakes in a physical relation id. A baselined FK's target is a
  physical relation id; `buildForeignKeyDdl` maps it through `internal_table_relations` to the table's
  `co_relation_id` (a promoted or twin relation's id is not an internal table id), falling
  back to reading it as an `internal_tables` id for Migration A's not-yet-inserted targets.
  Known gaps: replay's `edit_column` never re-applies `writeThroughColumnConfigurations` (only the
  inserting migration's display settings survive); `targetRelation` and any FK sibling must already be
  committed/visible (a crash before `applyMigrations` runs is self-healing via retry, not stuck); a
  replayed `serial` column always starts its sequence at 1 (fine for schema-only replay).
- A physical table is owned by `user_<organizationId>`, never the TJDB admin —
  `transferTableOwnershipToTenant` runs after every physical `CREATE TABLE` (`applyCreateTable`,
  migration B's `LIKE`-clone, `replayBaselineMigration`); Postgres requires ownership, not a grant, to
  run DDL as the tenant role.
- `recordRawSql` writes `resultingSchema` and `appliedAt` together (no pending window) — there's no
  shape-based predicate `adjudicatePending` could apply to arbitrary SQL.
- Revert's destructiveness check has two separate discriminators: `add_column` is read off the
  payload directly; a type change is detected via `findTypeChangedColumns` (diffs `resulting_schema`
  against its predecessor, by column uuid) since the payload only records the type changed *to*, and
  this also catches a type change made through `raw_sql`.
- `reconcileColumns` (`helpers/reconcile-columns.ts`) is the one place a column uuid is minted outside
  `normalize*` (raw SQL has no normalize pass). Kept standalone — see Key files.
- Two org-scoped read routes on `TooljetDbEnvironmentAssignmentService`: `baseline-report`
  (`listBaselineErrors`, not licence-filtered — inner-joins relation→environment) and
  `table/:tableId/migrations` (`getTableMigrations`, licence-filtered like `view_tables`). Known
  accepted gap: a relation created while licensed still shows in `baseline-report` after the licence
  lapses — route is admin-gated and repair-oriented.
- `repairBaseline` synthesizes from the highest-priority relation but records and confirms the
  baseline on every sibling relation that has a physical table (twins are structural clones). A
  twin left with no applications reads as "nothing applied" to promote.
- `view_tables`'s per-environment shape adds `has_relation` (no equivalent in the other two routes,
  which imply "no relation" by omission). "Applied on environment X" is always
  `computeMissingMigrations(internalTableId, sourceRelation, targetRelation: null, manager)` — never
  re-derived another way.
- Column type change splits on cast safety: the three lossless widening pairs
  (`integer→bigint`, `integer→double precision`, `bigint→double precision`, `helpers/column-type-change.ts`)
  go through TypeORM's `changeColumn` with no `USING` clause; every other cast is a user-reviewed
  `raw_sql` migration with an explicit `USING`, generated by the frontend
  (`frontend/src/TooljetDatabase/columnTypeChange.js`) — its `lossless` tier must stay in lockstep with the backend allowlist.
- **Every DDL path must `NOTIFY pgrst, 'reload schema'`** (on the DDL's own transaction, not after
  commit) or PostgREST serves a stale cached schema (`PGRST204`). ~15 call sites do this;
  `recordRawSqlMigration` was missed once already. No test coverage — the e2e suite mocks PostgREST
  with Polly.js, so a missing notify doesn't fail a write in tests.
- Raw SQL can't introduce an unsupported column type — `recordRawSqlMigration` snapshots before/after
  and rejects (`assertNoUnsupportedColumnTypes`) if a column *this migration* made new/changed lands
  outside `TJDB`'s type set (pre-existing unsupported columns are grandfathered; a hardcoded relation
  UUID instead of a `{{placeholder}}` escapes the check). `replayRawSqlMigration` is deliberately
  ungated — gating it would block already-recorded migrations from promoting; the intended end state
  is deleting the CE-vs-native-type gate once native Postgres types are added to `TJDB`.
- `applyEditColumn` introspects the column's *current* type rather than being told what changed (so
  replay stays idempotent); `buildEditTableColumnDiff`'s `typeChanged` predates this and still diffs
  the client-supplied `old_column` — don't copy that shape for new code. A type change resets that
  column's `configurations` entry, same as `applyEditTable`.
- Both raw SQL paths (`recordRawSqlMigration`, `replayRawSqlMigration`) set
  `SET LOCAL lock_timeout = '3s'` after `search_path` — the tjdb pool sets `statement_timeout` (60s)
  but no `lock_timeout`, so a migration blocked behind an app query would otherwise burn the whole
  statement budget queued. Ceiling: a rewrite exceeding `statement_timeout` can't change a column type at all.
- Row limit (`getRowsCount`): counts rows in every environment's relation of every non-soft-deleted
  table — per workspace on Cloud, instance-wide otherwise — and skips relations whose physical table
  is missing. Every write path (create_row, CSV upload, bulk upsert, sql_execution INSERT) gates on
  that one total. sql_execution passes its transaction's runner so uncommitted inserts count; only
  the caller's own schema goes through it, since a tenant role can't read other workspaces' schemas.
- CSV upload has one implementation, `TooljetDbUtilService.bulkUploadCsv`; `TooljetDbBulkUploadService`
  delegates to it with the environment and remaining row capacity. Don't fork it again — the two
  copies drifted once (missing CSV fixes on one side).

## Related modules

- `app-environments` — owns environment/branch resolution; the relation resolver defers to it rather
  than re-implementing priority-1 pinning or licence checks.
- `git-sync` — `co_relation_id` is git-sync's identity, not this module's; do not repurpose it as an
  environment or relation discriminator. It is unique per workspace among live tables only
  (partial index `organization_id_co_relation_id_unique`): a dropped (soft-deleted) table keeps it,
  and re-importing or pulling that table reuses it.
