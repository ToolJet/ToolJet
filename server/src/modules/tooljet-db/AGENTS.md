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
| `services/tooljet-db-migration-recorder.service.ts` | Bookkeeping for the migration chain: `record`/`confirm`/`discard`/`adjudicatePending`. Wired into every one of the nine structured `perform()` ops (see invariant below); `view_table` calls `adjudicatePending` only. The `*Applications`/`confirm`/`discard`/`adjudicatePending` methods take an optional trailing `manager?` so a data migration can drive them on its own transaction's connection. |
| `services/tooljet-db-environment-assignment.service.ts` | Rollout migration B's per-table routine: re-points a migration-A relation (`id === internal_table_id`) to the highest-priority environment and materializes an empty `LIKE`-cloned development twin. Every app-DB statement runs on a caller-supplied `appManager` (no `this.manager`) so migration B can share migration A's transaction; idempotent on the `id === internal_table_id` predicate. Also called by task 7 for a single repaired table. Also owns the two read routes below. |
| `services/tooljet-db-promote.service.ts` (CE stub, real logic in `server/ee/tooljet-db/services/`) | `POST .../table/:tableId/promote`: resolves source → next-highest-priority target environment, finds-or-creates the target relation, computes the missing migration set (`computeMissingMigrations`), and replays it via `applyMigrations`. CE throws `ForbiddenException`; the licence/permission gates live in EE. |
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
- **That same equality doubles as migration B's idempotency discriminator.** `id === internal_table_id`
  identifies "a relation migration A produced, still unclaimed" — a re-run's own inserts (fresh uuids)
  and every relation `create_table` has ever minted never satisfy it, so filtering work by this
  predicate rather than by `environment_id` makes a re-run a clean no-op instead of re-promoting a
  relation B already moved. `TooljetDbEnvironmentAssignmentService.assignExistingTableToEnvironments`
  is the one caller.
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
- Fail-closed, ownership first then position: a uuid owned by this workspace but absent from the
  requested (environment, branch) is 404 in every position — it exists, just not promoted here. Only
  once ownership is ruled out does position decide: an unowned uuid in the URL **path** is 404 (the
  table doesn't exist here); an unowned uuid in an embedded **querystring** reference (a `select=`
  join) is 400 (malformed request). Nothing reaches PostgREST unrewritten in either case.
- **Every runtime path that resolves a table reference does so through one of five seams**, each
  independently wireable to `environmentId` — an omission at any one of them silently resolves to
  development rather than failing loudly:

  | Seam | Where | Reached by |
  |---|---|---|
  | Proxy path | `PostgrestProxyService.resolveAndRewrite()` | `list_rows`, `create_row`, `update_rows`, `delete_rows` |
  | Table-name resolve | `TooljetDbTableOperationsService.resolveTable()` | `sql_execution` |
  | Table-id resolve | `TooljetDbTableOperationsService.resolveTableById()` | both bulk ops' write target |
  | View-table shape read | `TooljetDbTableOperationsService.viewTable()` (via `perform('view_table', ...)`) | `bulk_upsert_with_primary_key`'s shape check |
  | Join resolve | `TooljetDbTableOperationsService`'s join-table resolution | `join_tables` |

  A new caller resolves through one of these five, never by constructing its own rewritten
  reference. DDL (`create_table`, `edit_table`, etc.) deliberately resolves with no environment —
  schema edits are development-only.
- **`bulk_upsert_with_primary_key` resolves its write target and its shape lookup independently** —
  `resolveTableById` for the row it writes, `perform('view_table', ...)` for the shape it validates
  against. Both calls must always receive the same `environmentId`, or the operation silently
  validates against one environment's shape while writing another's rows. Any future change to
  either call site must change both in the same commit.
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
- **`perform()`'s wiring of the recorder around each of the nine structured ops is uniform except
  `create_table`.** For the other eight: `record()` (its own committed transaction, `request` = the
  handler's raw `params`, not `normalize()`'s output) runs between `normalize*` and `apply*`;
  `confirm()` runs after the handler's own commits, using its still-open `tjdbQueryRunner`, before
  release; a caught DDL failure calls `discard()` first, then falls through to the handler's existing
  rollback/rethrow untouched. `create_table` is the exception: `record()` takes `queryRunner.manager`
  as its 4th argument so the insert folds into `create_table`'s own still-open app-DB transaction
  (there is no table id to record against until the `InternalTable`/`InternalTableRelation` rows are
  saved) — a rollback there erases the migration with everything else, so it needs no `discard()`.
  `create_foreign_key`/`update_foreign_key`/`delete_foreign_key` thread `migration` through as an
  explicit parameter to their `apply*` methods instead, since their `normalize*`/`apply*` pair isn't
  called from inside one shared try/catch the way the other six are. `adjudicatePending` is called
  once by each of the eight existing-table handlers, immediately before that handler's own
  `record()` (`create_table` has no such call - no prior relation exists to adjudicate), once
  more in `viewTable()`, right after the relation resolves and before it reads the relation's shape,
  and once more in `applyMigrations` before it records its own replay migration — never the
  PostgREST read path. It is deliberately not inside `record()` itself: a single
  request can call `record()` more than once against the same relation before any of them are
  applied — `record()` itself makes no such guarantee, only every handler wired into `perform()`
  happens to call it once — and a migration this same request just recorded is indistinguishable
  from a crashed one to `adjudicatePending`'s predicate — its DDL simply hasn't run yet.
  `adjudicatePending` also leaves any pending row younger than a 3-second grace window alone
  entirely (compared against the database's own `now()`, not `Date.now()`), closing the same
  problem's cross-*request* shape: a different request touching this relation before this one's DDL
  has run must not discard this one's migration as crashed, or this request's own `confirm()` call
  becomes a no-op against a row that's already gone.
- `drop_table`'s `applyDropTable` clears the surviving relation's `configurations` to
  `{ column_names: {}, configurations: {} }` after the physical `DROP TABLE` — without this the
  relation row (which survives as the migration chain's anchor) would keep describing columns of a
  table that no longer exists, breaking the invariant every other `apply*` maintains.
- **`TooljetDbTableOperationsService.applyMigrations(migrationIds, targetRelation,
  connectionManagers?)` replays a table's own migration chain into a different relation** (no
  controller route — the replay-triggering flow, e.g. promote, is a later module's job). It reuses
  the exact same nine `apply*` methods `perform()` calls, never a copy: a structured migration's
  stored `{action, request}` is reassembled into whatever shape that op's `apply*` expects by
  `replayStructuredMigration`, and a baseline migration's `{ddl, refs, column_uuids}` is executed
  directly by `replayBaselineMigration`. It records one `internal_table_migration_application` row
  per migration id being replayed — up front, before any DDL runs, all still pending — then commits
  and confirms **per migration**, in `(sequence, id)` order, not once for the whole batch: each
  migration gets its own app-DB + TJDB transaction, committed and confirmed before the next one
  replays. A failure partway through discards only the pending rows the call never reached, never
  the ones already confirmed, and rethrows — the batch is resumable from exactly that migration on
  the next promote, never skipped. This is deliberate, not a shortcut: `replayRawSqlMigration`
  always opens its own tenant connection (raw SQL must never run as admin, replay included), so a
  structured migration's DDL sitting uncommitted in a shared batch transaction would be invisible to
  a raw_sql migration replayed right after it in the same batch. Never mints a synthetic "replay"
  migration of its own; every applied row points at a real migration that already exists on the
  source relation's chain.
  - **No `uuidv4()` here either.** A column a migration minted the first time it ran is already
    sitting in that migration's own `resulting_schema` (confirm() wrote it there when it first
    applied) — replay reads it from there (the migration's own schema for a column it inserted,
    the *prior* migration's schema for a column it edited or deleted by its old name) instead of
    minting again. This also means a later rename on the source relation can't corrupt replay of
    an earlier migration in the chain — resulting_schema is a fixed point-in-time record, not "the
    source relation's current configuration".
  - **The three foreign-key ops keep self-managing their own transaction and their own
    confirm/discard during replay, same as they do in `perform()`.** Replay hands them a
    never-persisted stand-in `InternalTableMigration` (real `internalTableId`, random `id`) instead
    of its own real migration row, so their internal `confirm()`/`discard()` calls become harmless
    no-op updates/deletes; the real DDL still runs exactly as it does on the live path, and the
    real application row for that migration is recorded/confirmed by `applyMigrations`' own
    per-migration commit, same as every other op kind.
  - `buildEditTableColumnDiff` is `normalizeEditTable`'s column-diff logic (insert/update/delete,
    every uuid) pulled out as a pure function so replay's `edit_table` case can reuse it unchanged
    — only `mintColumnUuid` differs (`uuidv4()` live, a `resulting_schema` read on replay).
  - Migration A's baseline payload (`buildCreateTableDdl`/`buildForeignKeyDdl` in
    `data-migrations/1787564882760-TjdbRolloutMigrationASubstrate.ts`) never bakes in a physical
    relation id: `"{{self}}"` is the relation being replayed onto, every other `{{ref_N}}`
    placeholder is a key into the payload's `refs` map (placeholder → `co_relation_id`, resolved at
    replay time through `resolveSiblingByCoRelationId` against the *target's* environment/branch).
    The tenant schema itself is baked in as a literal, not a placeholder — it's one per
    organization, identical for every environment, unlike a relation id. `column_uuids` (the
    baselined table's own `column_names` map) rides alongside the DDL so a replayed baseline
    assigns the same column identities the source table already had. The same rule applies to a
    `serial`/identity column's default: its introspected `nextval(...)` references the sequence
    Postgres named after the table being baselined, which `buildCreateTableDdl` detects and rewrites
    to a `{{self}}`-derived sequence name (created fresh via a `CREATE SEQUENCE` prepended to the
    DDL) — left as a literal, replay would give the target relation's id column a default pointing
    at the *source's* sequence object.
  - `loadMigrationsInOrder` throws if any migration in the requested chain has `resultingSchema ===
    null` (authoring never confirmed) — every uuid lookup below depends on reading that field, and
    would otherwise silently resolve to `undefined`.
  - **Known preconditions/gaps, most inherited from before `applyMigrations` had a real request-path
    caller:**
    1. Replay's `edit_column` case never calls `writeThroughColumnConfigurations` — that's a
       settings-only write with nothing to promote, and lives in the *handler* between `normalize`
       and `apply`, not in either. A promoted/replayed relation gets correct column *identity* but
       only whatever display-setting configuration was in place at replay time via the *inserting*
       migration, not every display-setting change ever recorded against the column.
    2. `applyMigrations` requires `targetRelation` (and any FK sibling relations it references) to
       already be committed and visible to a fresh read — `record()`'s own transaction and
       `resolveSiblingByCoRelationId`'s lookup can't see a relation created inside the caller's
       still-open transaction. This is the two-phase recorder's requirement (`recordApplications`
       needs a real relation id to insert against), not a design flaw: a crash between that commit
       and `applyMigrations` running is self-healing, because `computeMissingMigrations`' set
       difference against the target's confirmed applications sees the same "everything missing"
       state either way — a retry (e.g. promote's own retry) replays the full chain again instead of
       leaving the relation stuck half-created.
    3. A replayed `serial` column's sequence always starts at 1 on the target — correct for a
       schema-only replay (nothing to seed it from), but a future replay that also copies rows
       would need to advance the target's sequence past whatever it inserts, or later inserts will
       collide with the copied ids.

- **A physical table is owned by `user_<organizationId>`, never the TJDB admin, at every place one is
  physically created** — `applyCreateTable`, `TooljetDbEnvironmentAssignmentService`'s migration-B
  `LIKE`-clone step, and `replayBaselineMigration` each call `transferTableOwnershipToTenant` right
  after `CREATE TABLE`. Postgres requires ownership, not a grantable privilege, to run DDL as the
  tenant role — without this, raw SQL (below) could only ever run DML.
- **`applyMigrations`'s replay dispatch is three-way, not two**: `baseline` → `replayBaselineMigration`,
  `raw_sql` → `replayRawSqlMigration`, everything else → `replayStructuredMigration`.
- **`recordRawSql` breaks the record-then-confirm shape every structured op uses** — it writes
  `resultingSchema` and the application's `appliedAt` together, in the same transaction as the SQL
  itself, with no pending row ever visible. There is no shape-based predicate `adjudicatePending`
  could ask of arbitrary SQL the way `ADJUDICATION_PREDICATES` asks of a structured action, so a
  pending window here would risk a crash getting wrongly discarded as failed when it had actually
  succeeded.
- **Revert's "this is destructive" check is a single inline discriminator in
  `TooljetDbRawSqlMigrationService.revert()`** (`kind === 'structured' && payload.action ===
  'add_column'`), separate from `ADJUDICATION_PREDICATES` — extending "what's destructive" means
  adding a case there, not in the recorder.

- **Two org-scoped read routes**: `GET .../organizations/:organizationId/baseline-report`
  (`listBaselineErrors` — every relation currently carrying a `baseline_error`) and
  `GET .../organizations/:organizationId/table/:tableId/migrations` (`getTableMigrations` — one
  table's full migration chain plus per-environment applied state, **licence-filtered like
  `view_tables`**: unlicensed orgs see only the priority-1 environment). `listBaselineErrors` is
  **not** licence-filtered — it inner-joins `InternalTableRelation`→`AppEnvironment`, so an
  environment that never got a relation can't appear, but a relation created while licensed (e.g. by
  migration B) still shows up if the org's license later lapses. Known, accepted gap: the route is
  admin/`tjdbCRUD`-gated and repair-oriented, not a general-audience read — add the same filter here
  only if that audience assumption changes.
  `TABLE_MIGRATIONS` is gated in the open `can([VIEW_TABLE, VIEW_TABLES, JOIN_TABLES, ...])` block
  (`ability/index.ts`), not behind `tjdbCRUD` — same as `VIEW_TABLE`/`VIEW_TABLES`. `BASELINE_REPORT`
  stays behind `tjdbCRUD`/admin.
- **`view_tables`' per-environment shape**: `{ environment_id, environment_name, has_relation,
  baseline_error }` — matches `getTableMigrations`/`listBaselineErrors`'s field names. `has_relation`
  is `view_tables`'s own addition (no equivalent elsewhere): the other two routes imply "no relation"
  by omission or an empty applied set, but `view_tables` is the one place a caller needs "no relation
  at all" made explicit. `view_table` (singular) takes an `environmentId` query param and reads
  through the resolved `InternalTableRelation` for that environment, not `internal_tables` directly.
- **"Applied on environment X" is always `computeMissingMigrations(internalTableId, sourceRelation,
  targetRelation: null, manager)`, never a second/duplicate query** — called with `targetRelation:
  null` it drops the anti-join and returns X's entire confirmed set. `getTableMigrations`
  relies on this; don't re-derive "applied" some other way. (`listBaselineErrors` doesn't need it —
  it reports `baseline_error` directly off the relation row, not migration-applied state.)

- **A column type change splits on whether the cast's outcome depends on the rows.** The three
  lossless widening pairs in `helpers/column-type-change.ts`
  (`integer→bigint`, `integer→double precision`, `bigint→double precision`) are applied by
  `applyEditColumn` through TypeORM's `changeColumn`, which emits no `USING` clause - correct only
  because Postgres casts these implicitly and no row can fail them, which is what makes them safe
  to replay into an environment whose data the migration has never seen. Every other cast is a
  user-reviewed `raw_sql` migration carrying an explicit `USING`, generated by the frontend
  (`frontend/src/TooljetDatabase/columnTypeChange.js`) and seeded into the migration modal's SQL
  step. Since no cast expression is ever generated on the backend, that allowlist carries no
  append-only obligation - but the frontend's `lossless` tier must stay in lockstep with it.
- **Every path that runs DDL must `NOTIFY pgrst, 'reload schema'`, or the data layer cannot see
  what it created.** PostgREST serves reads and writes off a cached schema: a column added without
  the notify exists in Postgres but returns `PGRST204 Could not find the '<column>' column ... in
  the schema cache` on the next write, until some unrelated operation happens to notify. Roughly 15
  sites do this (structured operations, import/export, `applyMigrations`, bootstrap);
  `recordRawSqlMigration` was missed and had to be fixed. Issue it on the DDL's own transaction
  rather than after commit, so a rolled-back migration never announces a schema it didn't leave.
  There is no test coverage for any of these sites and it is not cheaply addable — the e2e suite
  mocks PostgREST with Polly.js, so a proxy write succeeds whether the cache was reloaded or not.
- **Raw SQL cannot introduce a column type outside `TJDB` — a guardrail, not an enforced
  invariant.** `recordRawSqlMigration` snapshots every table the migration touches before and after
  the SQL and rejects it (`assertNoUnsupportedColumnTypes` → `unsupportedColumnTypes` in
  `helpers/column-type-change.ts`) if a column came out new-or-type-changed with an unsupported
  type; the tenant transaction's rollback undoes the DDL, so nothing is recorded. Three things not
  to rediscover the hard way: (1) it only fires on columns *this* migration made new or changed — a
  pre-existing unsupported column is deliberately grandfathered, or one bad column would block
  every future migration on the table; (2) "every table it touches" means self plus each `refs`
  target, since cross-table DDL legally reaches siblings — but an author hardcoding a relation UUID
  instead of a `{{placeholder}}` escapes the list entirely, which is why this is a guardrail and not
  a guarantee; (3) **the replay path is deliberately ungated** — gating `replayRawSqlMigration` would
  stop already-recorded migrations from promoting. The gate is temporary: deleting it once native
  Postgres types are escalated into `TJDB` is the intended end state. The parallel hole on app
  import is closed separately, by the `data_type` `enum` in
  `src/dto/validators/schemas/*/tooljet_database.json`.
- **`applyEditColumn` introspects the column's current type; it is never told what changed.**
  `record()` stores the handler's raw `params` and `replayStructuredMigration` calls the same
  `applyEditColumn` with them, so there is no client on the replay path to set a flag - and
  comparing against the live column is what makes replay idempotent (a target already at the type is
  not a change). `buildEditTableColumnDiff`'s `typeChanged` predates this and still diffs the
  *client-supplied* `old_column`; do not copy that shape. A type change also resets that column's
  entry in the relation's `configurations` (same rule `applyEditTable` already applies), because a
  column's display settings describe its old type.
- **Revert's destructiveness check has two discriminators, not one.** `add_column` is recognised
  from the payload; a type change cannot be, since `request.column.data_type` records only the type
  changed *to*. `findTypeChangedColumns` compares the target migration's `resulting_schema` against
  its predecessor's, matched on column uuid - which also catches a type change made through a
  `raw_sql` migration, whose payload is arbitrary text.
- **Both raw SQL paths set `SET LOCAL lock_timeout = '3s'`** after their `SET search_path`
  (`recordRawSqlMigration` and `replayRawSqlMigration`, each on its own tenant connection). The tjdb
  pool sets `statement_timeout` (60s, `ormconfig.ts:82`) but no `lock_timeout`, so without this a
  migration blocked behind an app query burns the whole statement budget queued. Note the ceiling
  this leaves: a table whose rewrite exceeds `statement_timeout` cannot have a column type changed
  at all.

## Related modules

- `app-environments` — owns environment/branch resolution; the relation resolver defers to it rather
  than re-implementing priority-1 pinning or licence checks.
- `git-sync` — `co_relation_id` is git-sync's identity, not this module's; do not repurpose it as an
  environment or relation discriminator.
