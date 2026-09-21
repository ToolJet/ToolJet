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

- **`internal_table_relations.id` and `internal_table_id` are unrelated in general** — only migration-A
  rows satisfy `id === internal_table_id`; that equality is also migration B's idempotency
  discriminator. A physical table name always comes from the resolver, never a logical id.
- `configurations` (column metadata) lives on the relation row, not `internal_tables` — it's per
  (environment, branch).
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
- `drop_table` soft-deletes `internal_tables` (physical `DROP TABLE` still runs); the resolver's raw
  joins add `deleted_at IS NULL` by hand since raw SQL skips TypeORM's automatic filter. The
  `(organization_id, table_name)` unique index is partial, so a dropped name is immediately reusable.
- `internal_table_migrations.resulting_schema` and `internal_table_migration_applications.applied_at`
  are both NULL until `.confirm()` fills them together; `.discard()` deletes both rows.
  `.adjudicatePending()` is the crash-recovery sweep (ignores anything younger than 3s, so an
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
  to a `{{self}}`-derived sequence — never bakes in a physical relation id.
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

## Related modules

- `app-environments` — owns environment/branch resolution; the relation resolver defers to it rather
  than re-implementing priority-1 pinning or licence checks.
- `git-sync` — `co_relation_id` is git-sync's identity, not this module's; do not repurpose it as an
  environment or relation discriminator.
