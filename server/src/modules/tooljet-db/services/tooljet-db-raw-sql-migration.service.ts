import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { OrganizationTjdbConfigurations } from 'src/entities/organization_tjdb_configurations.entity';
import {
  createTooljetDatabaseConnection,
  decryptTooljetDatabasePassword,
  findTenantSchema,
} from 'src/helpers/tooljet_db.helper';
import { buildTableSchemaSnapshot, TableSchemaSnapshot } from '../helpers/table-schema-snapshot';
import { TooljetDbRelationResolverService } from './relation-resolver.service';
import { TooljetDbMigrationRecorderService } from './tooljet-db-migration-recorder.service';
import { RawSqlMigrationDto } from '../dto/raw-sql-migration.dto';

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
    protected readonly migrationRecorderService: TooljetDbMigrationRecorderService
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

    try {
      const sql = await this.substitutePlaceholders(
        dto,
        organizationId,
        relation.id,
        relation.environmentId,
        relation.branchId
      );

      // Bare, unqualified `{{placeholders}}` (e.g. the architecture doc's own
      // `ALTER TABLE {{students}} ...` example) need the tenant schema on the search path to
      // resolve - the same reason sqlExecution sets it before running caller SQL.
      await tooljetDbTenantConnection.query(`SET search_path TO "${tenantSchema}"`);
      await tooljetDbTenantConnection.query(sql);

      const queryRunner = tooljetDbTenantConnection.createQueryRunner();
      const priorColumnNames = relation.configurations?.columns?.column_names || {};
      const snapshot = await buildTableSchemaSnapshot(queryRunner, tenantSchema, relation.id, priorColumnNames);

      // Reconcile first, then patch the minted uuids back into the snapshot itself - resultingSchema
      // is recorded as this migration's output, and a later migration's replay reads column
      // identity from its predecessor's resultingSchema (see replayStructuredMigration). Recording
      // the pre-reconciliation snapshot would permanently record `undefined` as a new column's uuid.
      const reconciled = this.reconcileColumns(snapshot, relation.configurations);
      snapshot.columns.forEach((column) => (column.uuid = reconciled.column_names[column.name]));
      relation.configurations = { columns: reconciled };

      // One transaction: the relation's configurations write and the migration record must land
      // together, or a crash between them drops this step from a chain that never shrinks, with
      // nothing (no pending row) left for anything to later detect.
      return await this.manager.transaction(async (transactionManager) => {
        await transactionManager.save(relation);
        return this.migrationRecorderService.recordRawSql(
          { sql: dto.sql, refs: dto.refs },
          internalTable,
          relation,
          snapshot,
          dto.reverts_migration_id ?? null,
          transactionManager
        );
      });
    } finally {
      await tooljetDbTenantConnection.destroy();
    }
  }

  /**
   * Explicit `{{name}}` tokens only, resolved against the caller-supplied `refs` map - the same
   * closed-substitution regex `replayBaselineMigration` uses. Nothing here parses the SQL; a
   * placeholder-shaped token inside a string literal or comment is substituted exactly the same
   * as one that is not - the contract is "author placeholders carefully," not "we understood your
   * SQL."
   */
  private async substitutePlaceholders(
    dto: RawSqlMigrationDto,
    organizationId: string,
    selfRelationId: string,
    environmentId: string,
    branchId: string
  ): Promise<string> {
    const resolvedIdByPlaceholder = new Map<string, string>();
    for (const [placeholder, coRelationId] of Object.entries(dto.refs || {})) {
      const sibling = await this.relationResolverService.resolveSiblingByCoRelationId(
        organizationId,
        coRelationId,
        environmentId,
        branchId,
        this.manager
      );
      resolvedIdByPlaceholder.set(placeholder, sibling.id);
    }
    // Seeded last: `self` always means this table's own relation, even if the caller's `refs` map
    // also has a `self` key.
    resolvedIdByPlaceholder.set('self', selfRelationId);

    return dto.sql.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
      const resolved = resolvedIdByPlaceholder.get(key);
      if (!resolved) throw new BadRequestException(`Unresolved placeholder "{{${key}}}" in raw SQL migration`);
      return resolved;
    });
  }

  /**
   * A column present in the new snapshot with no prior uuid (`column.uuid` undefined - there is no
   * `normalize*` step for arbitrary SQL to have minted one) is new: mint one now, the one place
   * this standing invariant ("a column uuid is minted only in a normalize* method") deliberately
   * bends. A prior column no longer in the snapshot was dropped by the SQL - its entry is not
   * carried forward. Everything else keeps its existing uuid untouched.
   */
  private reconcileColumns(
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
}
