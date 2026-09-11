import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, LessThan, QueryFailedError } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { OrganizationTjdbConfigurations } from 'src/entities/organization_tjdb_configurations.entity';
import {
  createTooljetDatabaseConnection,
  decryptTooljetDatabasePassword,
  findTenantSchema,
} from 'src/helpers/tooljet_db.helper';
import { buildTableSchemaSnapshot, TableSchemaSnapshot } from '../helpers/table-schema-snapshot';
import { unsupportedColumnTypes } from '../helpers/column-type-change';
import { TJDB, TooljetDatabaseError } from '../types';
import { TooljetDbRelationResolverService } from './relation-resolver.service';
import { StructuredMigrationPayload, TooljetDbMigrationRecorderService } from './tooljet-db-migration-recorder.service';
import { TooljetDbTableOperationsService } from './tooljet-db-table-operations.service';
import { RawSqlMigrationDto } from '../dto/raw-sql-migration.dto';
import { RevertMigrationDto } from '../dto/revert-migration.dto';

/** A relation the type gate inspects. `tableLabel` is absent for the migrated table itself. */
type TouchedTable = { relationId: string; columnNames: Record<string, string>; tableLabel?: string };

type UnsupportedColumn = { name: string; dataType: string; tableLabel?: string };

/**
 * Records a raw SQL migration step: substitutes `{{placeholders}}`, runs the statement as the
 * workspace's own tenant role (never the TJDB admin - `sqlExecution`'s DML-only allow-list stays
 * untouched, this is a separate, already-gated authoring path), reconciles column identity, then
 * records the migration after success. No pending window: there is no adjudication predicate for
 * arbitrary SQL, so this never leaves a state `adjudicatePending` could wrongly resolve.
 */
@Injectable()
export class TooljetDbRawSqlMigrationService {
  constructor(
    protected readonly manager: EntityManager,
    protected readonly relationResolverService: TooljetDbRelationResolverService,
    protected readonly migrationRecorderService: TooljetDbMigrationRecorderService,
    protected readonly tableOperationsService: TooljetDbTableOperationsService
  ) {}

  async recordRawSqlMigration(
    organizationId: string,
    tableId: string,
    dto: RawSqlMigrationDto
  ): Promise<InternalTableMigration> {
    const internalTable = await this.manager.findOne(InternalTable, { where: { id: tableId, organizationId } });
    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableId);

    // Authoring always targets the table's own development relation - same resolution
    // create_table/add_column use with no environment_id supplied.
    const relation = await this.relationResolverService.getRelation(organizationId, tableId, undefined, this.manager);

    const tjdbTenantConfigs = await this.manager.findOne(OrganizationTjdbConfigurations, {
      where: { organizationId },
    });
    if (!tjdbTenantConfigs) throw new NotFoundException(`Tooljet database schema configuration doesn't exist`);

    const { pgPassword, pgUser } = tjdbTenantConfigs;
    const tjdbPassKey = await decryptTooljetDatabasePassword(pgPassword);
    const tenantSchema = findTenantSchema(organizationId);
    const { tooljetDbTenantConnection } = await createTooljetDatabaseConnection(tjdbPassKey, pgUser, tenantSchema);

    // The SQL runs inside its own transaction on this connection, held open until the migration
    // record (on the app DB) is safely written - a failure anywhere in between rolls the SQL back
    // too, so the SQL is never applied with no record of it (there being no pending-application row
    // for arbitrary SQL for anything to later detect and reconcile).
    const tjdbQueryRunner = tooljetDbTenantConnection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();

    try {
      const { sql, siblingRelations } = await this.substitutePlaceholders(
        dto,
        organizationId,
        relation.id,
        relation.environmentId,
        relation.branchId
      );

      // Bare, unqualified `{{placeholders}}` (e.g. the architecture doc's own
      // `ALTER TABLE {{students}} ...` example) need the tenant schema on the search path to
      // resolve - the same reason sqlExecution sets it before running caller SQL.
      await tjdbQueryRunner.query(`SET search_path TO "${tenantSchema}"`);
      // DDL in a migration takes ACCESS EXCLUSIVE. Fail fast on contention rather than spending
      // the pool's 60s statement_timeout queued behind an app query holding a conflicting lock.
      await tjdbQueryRunner.query(`SET LOCAL lock_timeout = '3s'`);

      const priorColumnNames = relation.configurations?.columns?.column_names || {};
      // Every table the migration can reach, self first. `refs` is how cross-table DDL (a foreign
      // key, say) legally touches a sibling, so a sibling needs the same before/after comparison
      // the addressed table gets - otherwise an unsupported type slips in through the side door.
      const touchedTables: TouchedTable[] = [
        { relationId: relation.id, columnNames: priorColumnNames },
        ...siblingRelations.map((sibling) => ({
          relationId: sibling.id,
          columnNames: sibling.configurations?.columns?.column_names || {},
          tableLabel: sibling.internalTable?.tableName ?? sibling.id,
        })),
      ];
      const snapshotTouchedTables = () =>
        Promise.all(
          touchedTables.map((table) =>
            buildTableSchemaSnapshot(tjdbQueryRunner, tenantSchema, table.relationId, table.columnNames)
          )
        );

      const before = await snapshotTouchedTables();
      await tjdbQueryRunner.query(sql);
      const after = await snapshotTouchedTables();

      this.assertNoUnsupportedColumnTypes(touchedTables, before, after);

      // Self is `touchedTables[0]` by construction, so its post-SQL snapshot is already here - and
      // it is the one recorded as this migration's resulting_schema below.
      const snapshot = after[0];

      // Reconcile first, then patch the minted uuids back into the snapshot itself - resultingSchema
      // is recorded as this migration's output, and a later migration's replay reads column
      // identity from its predecessor's resultingSchema (see replayStructuredMigration). Recording
      // the pre-reconciliation snapshot would permanently record `undefined` as a new column's uuid.
      const reconciled = reconcileColumns(snapshot, relation.configurations);
      snapshot.columns.forEach((column) => (column.uuid = reconciled.column_names[column.name]));
      relation.configurations = { columns: reconciled };

      // The relation's configurations write and the migration record must land together, or a
      // crash between them drops this step from a chain that never shrinks.
      const result = await this.manager.transaction(async (transactionManager) => {
        await transactionManager.save(relation);
        return this.migrationRecorderService.recordRawSql(
          { sql: dto.sql, refs: dto.refs, name: dto.name },
          internalTable,
          relation,
          snapshot,
          dto.reverts_migration_id ?? null,
          transactionManager
        );
      });

      // PostgREST serves the data layer off a cached schema, so a column this migration added is
      // invisible to it (PGRST204 on the next write) until the cache reloads - every other DDL path
      // notifies for the same reason. Issued on the tenant transaction, not after commit, so a
      // migration that rolls back never announces a schema it didn't leave behind.
      await tjdbQueryRunner.query("NOTIFY pgrst, 'reload schema'");

      await tjdbQueryRunner.commitTransaction();
      return result;
    } catch (err) {
      await tjdbQueryRunner.rollbackTransaction();

      // Same guard edit_column/apply_migrations use: TooljetDatabaseError's constructor assumes a
      // QueryFailedError shape (it indexes err.driverError) - a BadRequestException from
      // substitutePlaceholders/assertNoUnsupportedColumnTypes would crash the wrap instead of
      // surfacing itself.
      if (!(err instanceof QueryFailedError)) throw err;
      throw new TooljetDatabaseError(
        err.message,
        { origin: 'raw_sql', internalTables: [{ id: relation.id, tableName: internalTable.tableName }] },
        err
      );
    } finally {
      await tjdbQueryRunner.release();
      await tooljetDbTenantConnection.destroy();
    }
  }

  /**
   * A revert is just a user-authored raw SQL migration whose `reverts_migration_id` the caller
   * cannot spoof - it's forced from the URL, not the body. The chain only ever grows: this appends
   * a new migration, it never touches or removes the one being reverted.
   *
   * Only one destructive case exists today: undoing an `add_column` drops that column and its
   * data. Same discriminator `ADJUDICATION_PREDICATES.add_column` and `replayStructuredMigration`
   * use to identify the action - reimplementing it here would risk drifting from theirs.
   */
  async revert(
    organizationId: string,
    tableId: string,
    migrationId: string,
    dto: RevertMigrationDto
  ): Promise<InternalTableMigration> {
    // Org-scope before anything else: recordRawSqlMigration below re-checks this itself, but
    // deciding whether to reveal the destructive-column warning on `targetMigration` first would
    // leak that column's name to a caller who supplied someone else's org id.
    const internalTable = await this.manager.findOne(InternalTable, { where: { id: tableId, organizationId } });
    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableId);

    const targetMigration = await this.manager.findOne(InternalTableMigration, { where: { id: migrationId } });
    if (!targetMigration || targetMigration.internalTableId !== tableId) {
      throw new NotFoundException(`Migration not found for this table: ${migrationId}`);
    }

    const payload = targetMigration.payload as StructuredMigrationPayload;
    const isAddColumn = targetMigration.kind === 'structured' && payload?.action === 'add_column';
    if (isAddColumn && !dto.confirmed) {
      throw new BadRequestException(
        `Reverting this migration will drop column "${payload.request.column.column_name}" and permanently ` +
          `delete its data. Pass confirmed: true to proceed.`
      );
    }

    // The second irreversible operation. Reverting restores the column's *type*; values the
    // original cast coerced, rounded or rewrote are already gone and no revert SQL can bring them
    // back, so say so before the caller commits to it.
    if (!isAddColumn && !dto.confirmed) {
      const typeChanged = await this.findTypeChangedColumns(targetMigration);
      if (typeChanged.length) {
        const described = typeChanged.map(({ name, fromType }) => `"${name}" back to ${fromType}`).join(', ');
        throw new BadRequestException(
          `Reverting this migration changes ${described}. Values that the original type change coerced ` +
            `cannot be recovered. Pass confirmed: true to proceed.`
        );
      }
    }

    return this.recordRawSqlMigration(organizationId, tableId, {
      sql: dto.sql,
      refs: dto.refs,
      reverts_migration_id: migrationId,
    });
  }

  /**
   * Rejects a migration that left any touched table with a column type the structured routes
   * cannot represent.
   *
   * Post-flight rather than pre-flight: comparing resulting schemas means an ALTER, a CREATE TABLE
   * and a DO block all land in the same introspection, with no SQL parsing and no per-statement
   * special-casing. Running the DDL before rejecting it costs nothing, because the caller's `catch`
   * rolls the tenant transaction back on any throw - rejected DDL never survives to be observed.
   *
   * A guardrail against accident, not an enforced invariant: physical table names are UUIDs and
   * `search_path` is scoped to this workspace, so an author can hardcode a UUID instead of a
   * `{{placeholder}}` and reach a table absent from `touchedTables`. Schema isolation still holds -
   * only their own workspace's tables are reachable - so the omission costs safety, not isolation.
   * Don't later mistake this for a guarantee.
   *
   * Temporary: it exists until native Postgres types are escalated into `TJDB`, at which point
   * deleting it is the intended end state, not a regression.
   */
  private assertNoUnsupportedColumnTypes(
    touchedTables: TouchedTable[],
    before: TableSchemaSnapshot[],
    after: TableSchemaSnapshot[]
  ): void {
    const violations: UnsupportedColumn[] = touchedTables.flatMap((table, index) =>
      unsupportedColumnTypes(before[index].columns, after[index].columns).map((violation) => ({
        ...violation,
        tableLabel: table.tableLabel,
      }))
    );

    if (violations.length) throw new BadRequestException(buildUnsupportedColumnTypeMessage(violations));
  }

  /**
   * Columns whose `data_type` differs between this migration's `resulting_schema` and its
   * predecessor's.
   *
   * A type change cannot be recognised from a payload the way `add_column` can:
   * `request.column.data_type` records the type the column was changed *to*, never the one it
   * replaced. Comparing the two snapshots also covers a type change made through a raw SQL
   * migration, whose payload is arbitrary text.
   *
   * Matched on column uuid, never name - a rename in the same migration would otherwise read as a
   * dropped column plus a brand-new one. The first migration in a chain has no predecessor to
   * compare against; a baseline records a table as it already was, so there is nothing to warn on.
   */
  private async findTypeChangedColumns(
    migration: InternalTableMigration
  ): Promise<Array<{ name: string; fromType: string }>> {
    const resultingSchema = migration.resultingSchema as TableSchemaSnapshot | null;
    if (!resultingSchema?.columns?.length) return [];

    const previous = await this.manager.findOne(InternalTableMigration, {
      where: { internalTableId: migration.internalTableId, sequence: LessThan(migration.sequence) },
      order: { sequence: 'DESC' },
    });
    const previousColumns = (previous?.resultingSchema as TableSchemaSnapshot | null)?.columns;
    if (!previousColumns?.length) return [];

    const previousTypeByUuid = new Map(previousColumns.map((column) => [column.uuid, column.data_type]));

    return resultingSchema.columns
      .filter(
        (column) => previousTypeByUuid.has(column.uuid) && previousTypeByUuid.get(column.uuid) !== column.data_type
      )
      .map((column) => ({ name: column.name, fromType: previousTypeByUuid.get(column.uuid) }));
  }

  /**
   * Resolves `{{name}}` tokens against the caller-supplied `refs` map (unchanged - the closed
   * -substitution path baseline synthesis and replay both depend on), plus two additional forms
   * resolved independently of `refs`: `{{self}}` (this table's own relation, seeded last so it
   * always wins) and `{{table.<name>}}` (another table, resolved fresh by its current display
   * name via the same resolveTable() seed-data SQL uses - this is the user-facing path the
   * editor's autocomplete drives).
   *
   * `assertTableDdlTargetsAreTemplated` runs first and inspects the *original* SQL - it must see
   * literal table names before substitution replaces them.
   */
  private async substitutePlaceholders(
    dto: RawSqlMigrationDto,
    organizationId: string,
    selfRelationId: string,
    environmentId: string,
    branchId: string
  ): Promise<{ sql: string; siblingRelations: InternalTableRelation[] }> {
    this.assertTableDdlTargetsAreTemplated(dto.sql);

    const resolvedIdByPlaceholder = new Map<string, string>();
    // Keyed by relation id, not placeholder - two placeholders can legally point at the same
    // sibling, and the type gate must inspect each touched table once.
    const siblingRelationById = new Map<string, InternalTableRelation>();
    for (const [placeholder, coRelationId] of Object.entries(dto.refs || {})) {
      const sibling = await this.relationResolverService.resolveSiblingByCoRelationId(
        organizationId,
        coRelationId,
        environmentId,
        branchId,
        this.manager
      );
      resolvedIdByPlaceholder.set(placeholder, sibling.id);
      if (sibling.id !== selfRelationId) siblingRelationById.set(sibling.id, sibling);
    }

    // {{table.<name>}} - independent of refs. Deduped via Set: two placeholders naming the same
    // table only need resolving once.
    const tableNames = new Set<string>();
    for (const match of dto.sql.matchAll(/\{\{table\.([\w-]+)\}\}/g)) tableNames.add(match[1]);
    for (const tableName of tableNames) {
      const { internalTable, relation: sibling } = await this.tableOperationsService.resolveTable(
        organizationId,
        tableName,
        environmentId,
        this.manager
      );
      // resolveTable's relation has no internalTable eagerly loaded (unlike
      // resolveSiblingByCoRelationId, which attaches it) - the type gate's violation message
      // needs it for tableLabel, so attach it here the same way.
      sibling.internalTable = internalTable;
      resolvedIdByPlaceholder.set(`table.${tableName}`, sibling.id);
      if (sibling.id !== selfRelationId) siblingRelationById.set(sibling.id, sibling);
    }

    // Seeded last: `self` always means this table's own relation, even if the caller's `refs` map
    // also has a `self` key.
    resolvedIdByPlaceholder.set('self', selfRelationId);

    const sql = dto.sql.replace(/\{\{([\w.-]+)\}\}/g, (_match, key) => {
      const resolved = resolvedIdByPlaceholder.get(key);
      if (!resolved) throw new BadRequestException(`Unresolved placeholder "{{${key}}}" in raw SQL migration`);
      return resolved;
    });

    return { sql, siblingRelations: Array.from(siblingRelationById.values()) };
  }

  /**
   * Every `CREATE|ALTER|DROP TABLE` target must be an exact `{{self}}`/`{{table.<name>}}` token -
   * a literal table name (or a hardcoded uuid) is rejected here instead of left to fail at
   * execution or, worse, silently succeed against a table `assertNoUnsupportedColumnTypes` never
   * inspected. A token check, not a DDL parser: the only positions inspected are exact keyword
   * matches, so a placeholder-shaped token inside a string literal or comment isn't validated -
   * same accepted boundary as this file's placeholder substitution itself.
   */
  private assertTableDdlTargetsAreTemplated(sql: string): void {
    const targetPattern = /\b(?:CREATE|ALTER|DROP)\s+TABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?("?[^\s(;]+)/gi;
    const templatedPattern = /^"?\{\{(?:self|table\.[\w-]+)\}\}"?$/;

    for (const match of sql.matchAll(targetPattern)) {
      const target = match[1];
      if (!templatedPattern.test(target)) {
        throw new BadRequestException(
          `Table DDL must target "{{self}}" or "{{table.<name>}}", found literal identifier "${target}"`
        );
      }
    }
  }
}

/**
 * One exception naming every column the migration left with an unsupported type, across every
 * table it touched. `tableLabel` is set only for a sibling's violation (a fault on the migrated
 * table itself needs no table name - it's the one the caller already asked about).
 */
function buildUnsupportedColumnTypeMessage(violations: UnsupportedColumn[]): string {
  const supportedTypes = Object.values(TJDB).join(', ');
  const descriptions = violations.map((violation) =>
    violation.tableLabel
      ? `column "${violation.name}" in table "${violation.tableLabel}" uses type "${violation.dataType}"`
      : `column "${violation.name}" uses type "${violation.dataType}"`
  );
  return (
    `Cannot record this migration: ${descriptions.join('; ')}, which ToolJet Database does not support yet. ` +
    `Supported types: ${supportedTypes}. Change the column to a supported type, or remove it from this migration.`
  );
}

/**
 * A column present in the new snapshot with no prior uuid (`column.uuid` undefined - there is no
 * `normalize*` step for arbitrary SQL to have minted one) is new: mint one now, the one place this
 * standing invariant ("a column uuid is minted only in a normalize* method") deliberately bends. A
 * prior column no longer in the snapshot was dropped by the SQL - its entry is not carried forward.
 * Everything else keeps its existing uuid untouched.
 *
 * Module-level (not a class method): shared verbatim between this service's live-authoring path and
 * `TooljetDbTableOperationsService.replayRawSqlMigration` - both must reconcile identically or replay
 * can drift from what authoring recorded.
 */
export function reconcileColumns(
  snapshot: TableSchemaSnapshot,
  currentConfigurations: { columns?: { configurations?: Record<string, unknown> } }
): { column_names: Record<string, string>; configurations: Record<string, unknown> } {
  const priorConfigurations = currentConfigurations?.columns?.configurations || {};

  const column_names: Record<string, string> = {};
  const configurations: Record<string, unknown> = {};

  for (const column of snapshot.columns) {
    const uuid = column.uuid || uuidv4();
    column_names[column.name] = uuid;
    configurations[uuid] = priorConfigurations[uuid] ?? {};
  }

  return { column_names, configurations };
}
