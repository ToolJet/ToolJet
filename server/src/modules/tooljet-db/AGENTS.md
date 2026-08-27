# tooljet-db module

Owns ToolJet Database (TJDB): user-created Postgres tables scoped to a Workspace, exposed to
Builders as DDL/DML actions and to running apps as a PostgREST-backed data source.

## Domain terms

- **Internal table** — the logical table a Builder creates and names; one row in `internal_tables`,
  identified by a UUID that outlives any environment or branch.
- **Relation** — the physical table a logical table resolves to in one (environment, branch); one
  row in `internal_table_relations`, holding `configurations` (column metadata) for that instance.
- A table therefore has five names, each read by a different layer: the **display name**
  (`tableName`, shown to the Builder), the **logical id** (`internal_tables.id`, stable identity),
  the **portable id** (`co_relation_id`, git-sync's cross-instance identity, unrelated to
  environments), the **relation id** (`internal_table_relations.id`, the actual Postgres table name),
  and the **schema** (`workspace_<organizationId>`, the tenant boundary in Postgres/PostgREST).

## Key files

| File | Role |
|---|---|
| `services/relation-resolver.service.ts` | Resolves (logical id, environment, branch) → relation id. The single source of truth for which physical table a logical id means right now. |
| `services/postgrest-proxy.service.ts` | Rewrites every table reference in a PostgREST request through the resolver before forwarding. |
| `services/tooljet-db-table-operations.service.ts` | DDL actions (`create_table`, `join_tables`, `view_table`, etc.) — the `perform()` dispatch table. |
| `services/tooljet-db-data-operations.service.ts` | Row-level actions (`list_rows`, `create_row`, `update_rows`, `delete_rows`). |
| `services/tooljet-db-migration-recorder.service.ts` | Bookkeeping for the migration chain: `record`/`confirm`/`discard`/`adjudicatePending`. Not wired into `perform()` yet — the nine structured ops don't call it. |
| `helpers/table-schema-snapshot.ts` | Introspects a relation's current shape (columns, primary key, unique constraints, indexes, foreign keys). Used by the recorder and by the rollout migration's baseline synthesis - kept byte-identical between the two on purpose. |
| `controller.ts` | `/proxy/*` (PostgREST passthrough) plus the DDL/DML REST endpoints. |

## Edition split

- EE override: `server/ee/tooljet-db/` — `TooljetDbRelationResolverService` extends the CE one to
  swap in EE's `AppEnvironmentUtilService`, which is a pass-through seam for later override; the
  licence gate itself lives in `AppEnvironmentUtilService.resolveEnvironmentId`, shared by both
  editions. Everything else in EE mirrors CE 1:1 today.
- The resolver is real logic in CE, not a stub: a relation id is the only way to name a physical
  table, so a stub here would leave CE with nothing to resolve `perform()`'s table references to.
- **Every service listed in `module.ts`'s `getProviders(...)` call needs a same-path file under
  `server/ee/tooljet-db/services/`**, even one that only `extends` the CE class and forwards its
  constructor to `super()` with no new logic. `getImportPath()` swaps the whole services list's base
  path for EE/Cloud at once, not per-file - an omission is invisible under `TOOLJET_EDITION=ce` and
  fails every e2e test (which runs EE) with "Cannot find module" at app bootstrap.

## Invariants & gotchas

- **Never assume any relation between `internal_table_relations.id` and `internal_table_id`.** Both
  shapes coexist permanently: rows inserted by migration A satisfy the equality, while `create_table`
  mints an independent relation id, so nothing created after that change does. A physical table name
  is only ever a relation id obtained from `TooljetDbRelationResolverService` (or the
  `resolveTable`/`resolveTableById` helpers on `TooljetDbTableOperationsService`) — never a logical id.
  A new call site that names a table by a logical id will fail immediately on any table created after
  the divergence landed, which is the point.
- `configurations` (column metadata) lives on the relation row, not on `internal_tables`. It moved
  there because a workspace-global settings map has no way to represent "this column was configured
  differently per environment" — `drop_column` would have to guess which environment's copy to edit.
- Both proxy entry points — `PostgrestProxyService.proxy()` (HTTP passthrough for direct table
  access) and `.perform()` (in-process, used by data queries) — funnel through the same
  `resolveAndRewrite()`. A new caller should go through one of these two, not construct its own
  rewritten URL. `server/ee/external-apis/service.ts`'s `exportTjdbTableAsCSV` is a known third
  path — it calls PostgREST directly via `got.get()` because it needs `Accept: text/csv` and a raw
  text body, which `perform()` cannot return. It resolves the relation id itself via
  `TooljetDbRelationResolverService`; if you touch it, keep that resolve in place.
- Fail-closed by position: an unresolvable table named in the URL **path** is 404 (the table doesn't
  exist here); an unresolvable table named in an embedded **querystring** reference (a `select=`
  join) is 400 (malformed request). Nothing reaches PostgREST unrewritten in either case.
- `joinTable` falls back to the `TOOLJET_DB_USER` admin role when SQL mode is disabled (Cloud
  today) — no workspace-scoped connection exists in that configuration. That role can read every
  workspace's schema; the from/join table references are still validated against the caller's
  workspace before reaching the query builder, so this is an over-privileged DB role, not an
  unvalidated identifier.
- Every table reference used to build a query (`join_tables`' `from` table included) must be
  validated against the caller's workspace before it reaches a query builder's `.from()`/`.join()` —
  an unvalidated id there is a same-shape leak to the one the resolver closes for the proxy paths.
- The six table/column DDL ops on `TooljetDbTableOperationsService` (`create_table`, `drop_table`,
  `edit_table`, `add_column`, `drop_column`, `edit_column`) split into a `normalize*`/`apply*` pair
  per op: `normalize` resolves names to ids and mints every column uuid (`uuidv4()` for a column
  never happens outside a `normalize*` method); `apply` takes `(payload, relation,
  connectionManagers)`, reads uuids from the payload, and only ever writes DDL and `configurations`
  for the one relation it was handed — never mints, never touches a sibling relation. A renamed
  column's uuid always comes from the *source* relation's `column_names` (read in `normalize`, or
  passed through the payload), never re-derived by indexing into whatever relation `apply` runs
  against. `editColumn`'s display-settings write-through (`writeThroughColumnConfigurations`) is the
  one deliberate exception — it is a settings-only change with nothing to promote, so it lives in the
  handler between `normalize` and `apply`, not inside either, and fans out to every relation holding
  that column uuid instead of just the one `apply` touches.
- `drop_table` soft-deletes `internal_tables` (`@DeleteDateColumn`), it never hard-deletes the row.
  The physical `DROP TABLE` still runs — the row is a name allocation and a chain anchor for the
  migration-recording tables (`ON DELETE CASCADE` on `internal_table_id`), not an existence claim.
  TypeORM excludes soft-deleted rows from every `find*`/entity-targeted `QueryBuilder` automatically;
  the resolver's three raw joins (`resolve`, `resolveLogicalIds`, `getRelation`) add
  `it.deleted_at IS NULL` by hand because raw joins don't get that filter for free. The
  `(organization_id, table_name)` unique index is partial (`WHERE deleted_at IS NULL`), so a dropped
  table's name is immediately free for reuse by a new `internal_tables` row.
- **`internal_table_migrations.resulting_schema` is nullable; NULL means authoring not yet
  confirmed** - the migration-side twin of `internal_table_migration_applications.applied_at IS
  NULL`. `TooljetDbMigrationRecorderService.record()` inserts both NULL; `.confirm()` fills both in
  together from a live introspection; `.discard()` deletes both rows rather than leaving either
  half-written. `.adjudicatePending()` is the crash-recovery sweep for rows a process died between
  `record()` and `confirm()`/`discard()` on.
- **A foreign key's identity is structural, never its constraint name.** Postgres/TypeORM name a
  constraint from the physical relation name, so the same logical foreign key is named differently
  on every relation it's replayed onto. `create/update/deleteForeignKey` in
  `tooljet-db-table-operations.service.ts` convert an incoming `foreign_key_id` to an `FkSpec`
  (columns + `referenced_table` as a `co_relation_id`) in `normalize`, then re-resolve that spec
  back to whichever constraint currently matches it on the target relation in `apply` (via
  `resolveFkConstraintName`/`foreignKeyToFkSpec`, backed by `fetchForeignKeys` in
  `helpers/table-schema-snapshot.ts`) — never trust a name captured earlier. `referenced_table`
  resolves to the sibling relation in the same `(environment_id, branch_id)`
  (`resolveFkReferencedRelations`); no sibling there fails closed rather than crossing environments.

## Related modules

- `app-environments` — owns environment/branch resolution; the relation resolver defers to it rather
  than re-implementing priority-1 pinning or licence checks.
- `git-sync` — `co_relation_id` is git-sync's identity, not this module's; do not repurpose it as an
  environment or relation discriminator.
