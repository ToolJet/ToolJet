import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  Connection,
  EntityManager,
  In,
  ObjectLiteral,
  QueryFailedError,
  SelectQueryBuilder,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { InternalTableRelation } from 'src/entities/internal_table_relation.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { TooljetDbRelationResolverService } from './relation-resolver.service';
import { formatJoinsJSONBPath, formatJSONB, getTooljetEdition } from 'src/helpers/utils.helper';
import { isString, isEmpty, camelCase } from 'lodash';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  findTenantSchema,
  encryptTooljetDatabasePassword,
  createNewTjdbRole,
  createAndGrantSchemaPrivilege,
  grantSequencePrivilege,
  createAndGrantTablePrivilege,
  updatePasswordToOrganizationTable,
  concatSchemaAndTableName,
  createTooljetDatabaseConnection,
  decryptTooljetDatabasePassword,
  grantTenantRoleToTjdbAdminRole,
  isSQLModeDisabled,
  generateTJDBPasswordForRole,
  transferTableOwnershipToTenant,
} from 'src/helpers/tooljet_db.helper';
import { OrganizationTjdbConfigurations } from 'src/entities/organization_tjdb_configurations.entity';
import {
  PostgrestError,
  TooljetDatabaseColumn,
  TooljetDatabaseDataTypes,
  TooljetDatabaseError,
  TooljetDatabaseForeignKey,
  TooljetDbActions,
  TJDB,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { QueryError } from '@tooljet/plugins/packages/common';
import { ConfigService } from '@nestjs/config';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '@modules/licensing/constants';
import { generatePayloadForLimits } from '@modules/licensing/helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { buildTableSchemaSnapshot, fetchForeignKeys, TableSchemaSnapshot } from '../helpers/table-schema-snapshot';
import { assertStructuredTypeChangeAllowed, normalizeRequestedType } from '../helpers/column-type-change';
import { TooljetDbMigrationRecorderService, StructuredMigrationPayload } from './tooljet-db-migration-recorder.service';
import { reconcileColumns } from './tooljet-db-raw-sql-migration.service';
import { InternalTableMigration } from 'src/entities/internal_table_migration.entity';
import { InternalTableRepository } from '../repository';

enum AggregateFunctions {
  sum = 'SUM',
  count = 'COUNT',
}

/**
 * Structural identity of a foreign key, independent of the constraint name Postgres/TypeORM gives
 * it on any one relation - that name is minted from the physical table name, so it never survives
 * being looked up again against a different relation for the same logical table.
 * `referenced_table` is a co_relation_id (internal_tables' portable id), not a relation id: the
 * relation it resolves to depends on which relation this spec is being applied against. Used both
 * by the three foreign-key-mutation ops and by create_table/add_column's own embedded foreign_keys.
 */
interface FkSpec {
  column_names: string[];
  referenced_table: string;
  referenced_column_names: string[];
  on_delete?: string;
  on_update?: string;
}

// Column order is part of a composite key's identity (conkey ordinality), not just its member set.
function sameOrderedColumnList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((column, index) => column === b[index]);
}

// Patching TypeORM SelectQueryBuilder to handle for right and full outer joins
declare module 'typeorm' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SelectQueryBuilder<Entity> {
    rightJoin(entityOrProperty: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    fullOuterJoin(entityOrProperty: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;
  }
}

SelectQueryBuilder.prototype.rightJoin = function (entityOrProperty, alias, condition, parameters) {
  this.join('RIGHT', entityOrProperty, alias, condition, parameters);
  return this;
};

SelectQueryBuilder.prototype.fullOuterJoin = function (entityOrProperty, alias, condition, parameters) {
  this.join('FULL OUTER', entityOrProperty, alias, condition, parameters);
  return this;
};

type ConnectionManagerKey = 'appManager' | 'tjdbManager';

@Injectable()
export class TooljetDbTableOperationsService {
  constructor(
    protected readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    protected readonly tooljetDbManager: EntityManager,
    protected eventEmitter: EventEmitter2,
    protected licenseTermsService: LicenseTermsService,
    protected readonly configService: ConfigService,
    protected readonly relationResolverService: TooljetDbRelationResolverService,
    protected readonly migrationRecorderService: TooljetDbMigrationRecorderService
  ) {}

  /**
   * environmentId is required, not optional: a caller with no environment to name must write
   * `undefined` deliberately, so a new call site can't silently read development by omission. Most
   * no-environment callers are DDL actions (schema edits are development-only); view_tables and
   * view_table are the exception - they're editor reads whose environment selector lands in H8, not
   * DDL. join_tables and view_table are the two actions that resolve a table reference internally -
   * environmentId rides in on params for them to read, rather than as an extra positional argument
   * the loosely-typed actionHandler.call() dispatch below would have to account for.
   */
  async perform(
    organizationId: string,
    action: string,
    params,
    environmentId: string | undefined,
    connectionManagers: Record<ConnectionManagerKey, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ) {
    const actionHandler = this.getActionHandler(action);
    if (!actionHandler) {
      throw new BadRequestException('Action not defined');
    }
    return await actionHandler.call(this, organizationId, { ...params, environmentId }, connectionManagers);
  }

  protected getActionHandler(action: string): ((organizationId: string, params: any) => Promise<any>) | undefined {
    const actionHandlers: Partial<Record<TooljetDbActions, (organizationId: string, params: any) => Promise<any>>> = {
      view_tables: this.viewTables,
      view_table: this.viewTable,
      create_table: this.createTable,
      drop_table: this.dropTable,
      add_column: this.addColumn,
      drop_column: this.dropColumn,
      edit_table: this.editTable,
      join_tables: this.joinTable,
      edit_column: this.editColumn,
      create_foreign_key: this.createForeignKey,
      update_foreign_key: this.updateForeignKey,
      delete_foreign_key: this.deleteForeignKey,
    };
    return actionHandlers[action];
  }

  /**
   * Single door from a display name to the physical table it currently means. Every DDL handler
   * that names an existing table funnels through here instead of building
   * concatSchemaAndTableName(tenantSchema, internalTable.id) itself — that construction names a
   * table that does not exist, because a relation id is independent of its logical table id.
   * Public: the bulk upload service, which is not a subclass, needs to resolve tables too.
   */
  async resolveTable(
    organizationId: string,
    tableName: string,
    environmentId: string | undefined,
    manager?: EntityManager
  ): Promise<{ internalTable: InternalTable; relation: InternalTableRelation; physicalName: string }> {
    const entityManager = manager || this.manager;
    const internalTable = await entityManager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    const relation = await this.relationResolverService.getRelation(
      organizationId,
      internalTable.id,
      environmentId,
      manager
    );
    const physicalName = concatSchemaAndTableName(findTenantSchema(organizationId), relation.id);

    return { internalTable, relation, physicalName };
  }

  /**
   * Id-based sibling to resolveTable, for callers that already have the internal table's logical
   * id rather than its display name (e.g., bulk upload, which is not a subclass and can't reach
   * relationResolverService directly - it's protected on this service).
   */
  async resolveTableById(
    organizationId: string,
    internalTableId: string,
    environmentId: string | undefined,
    manager?: EntityManager
  ): Promise<{ relation: InternalTableRelation }> {
    const relation = await this.relationResolverService.getRelation(
      organizationId,
      internalTableId,
      environmentId,
      manager
    );

    return { relation };
  }

  protected async viewTable(
    organizationId: string,
    params,
    connectionManagers: Record<ConnectionManagerKey, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ): Promise<{
    foreign_keys: TooljetDatabaseForeignKey[];
    columns: TooljetDatabaseColumn[];
    configurations: any;
  }> {
    const { table_name: tableName, id: id, environmentId } = params;
    const { appManager, tjdbManager } = connectionManagers;

    const internalTable = await appManager.findOne(InternalTable, {
      where: {
        organizationId,
        ...(tableName && { tableName }),
        ...(id && { id }),
      },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);
    const relation = await this.relationResolverService.getRelation(
      organizationId,
      internalTable.id,
      environmentId,
      appManager
    );

    // Crash-recovery sweep: resolves any migration left pending by a process that died between
    // record() and confirm()/discard() on this relation, before the view reflects its shape.
    await this.migrationRecorderService.adjudicatePending(internalTable, relation);

    const tenantSchema = findTenantSchema(organizationId);
    let foreign_keys = await tjdbManager.query(`
      select (SELECT pgcls.relname FROM pg_class as pgcls where pgcls.oid = pgc.confrelid)                         as referenced_table_name,
             pgc.conname                                                                                           as constraint_name,
             ARRAY(SELECT attname
                   FROM pg_attribute
                   WHERE attrelid = pgc.conrelid
                     AND attnum = any (pgc.conkey))                                                                AS column_names,
             ARRAY(select attname
                   from pg_attribute
                   where attrelid = pgc.confrelid
                     and attnum = any (pgc.confkey))                                                               as referenced_column_names,
             case pgc.confupdtype
               WHEN 'a' THEN 'NO ACTION'
               WHEN 'r' THEN 'RESTRICT'
               WHEN 'c' THEN 'CASCADE'
               WHEN 'n' THEN 'SET NULL'
               WHEN 'd' THEN 'SET DEFAULT'
               ELSE NULL
               end                                                                                                 as on_update,
             case pgc.confdeltype
               when 'a' then 'NO ACTION'
               when 'r' then 'RESTRICT'
               when 'c' then 'CASCADE'
               when 'n' then 'SET NULL'
               when 'd' then 'SET DEFAULT'
               end                                                                                                 as on_delete
      from pg_constraint as pgc
             join pg_class as cls on cls.oid = pgc.conrelid
             join pg_namespace as ns on ns.oid = cls.relnamespace
      where cls.relname = '${relation.id}'
        and pgc.contype = 'f'
        and ns.nspname = '${tenantSchema}'
    `);

    // Transforming the Query response
    const referenced_table_list = [];
    foreign_keys = foreign_keys.map((foreign_key_detail) => {
      const { referenced_table_name, column_names, referenced_column_names } = foreign_key_detail;
      referenced_table_list.push(referenced_table_name);
      return {
        ...foreign_key_detail,
        referenced_table_name: referenced_table_name,
        column_names: column_names.slice(1, -1).split(','),
        referenced_column_names: referenced_column_names.slice(1, -1).split(','),
      };
    });

    // pg_class only knows the physical relation name; recover the logical table id it belongs to
    // before handing the list to the workspace-ownership check below, which looks up by logical id.
    const logicalIdsByRelationId = await this.relationResolverService.resolveLogicalIds(
      organizationId,
      referenced_table_list,
      appManager
    );
    const referenced_table_logical_id_list = referenced_table_list.map((relationId) => {
      const logicalId = logicalIdsByRelationId.get(relationId);
      // A relname pg_class just handed back that doesn't map to one of this workspace's internal
      // tables means a foreign key to something outside internal_tables entirely - not reachable
      // via the API today. Raise rather than silently dropping the constraint from the response.
      if (!logicalId) {
        throw new InternalServerErrorException(
          `Foreign key references relation "${relationId}", which does not resolve to a known internal table`
        );
      }
      return logicalId;
    });

    const referenced_tables_info = await this.fetchAndCheckIfValidForeignKeyTables(
      referenced_table_logical_id_list,
      organizationId,
      'TABLEID',
      appManager
    );

    foreign_keys = foreign_keys.map((foreign_key_detail) => {
      const logicalId = logicalIdsByRelationId.get(foreign_key_detail.referenced_table_name);
      return {
        ...foreign_key_detail,
        referenced_table_id: logicalId,
        referenced_table_name: referenced_tables_info[logicalId],
      };
    });

    const columns = await tjdbManager.query(`
      SELECT c.COLUMN_NAME,
             c.DATA_TYPE,
             CASE
               WHEN c.Column_default LIKE '%::%'
                 THEN REPLACE(SUBSTRING(c.Column_default FROM '^''?(.*?)''?::'), '''', '')
               ELSE c.Column_default
               END                                                               AS Column_default,
             c.character_maximum_length,
             c.numeric_precision,
             JSON_BUILD_OBJECT(
               'is_not_null',
               CASE WHEN c.is_nullable = 'NO' THEN true ELSE false END,
               'is_primary_key',
               CASE WHEN pk.is_primary = true THEN true ELSE false END,
               'is_unique',
               CASE WHEN uk.is_unique = true THEN true ELSE false END
             )                                                                   AS constraints_type,
             CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END AS KeyType
      FROM INFORMATION_SCHEMA.COLUMNS c
             LEFT JOIN (SELECT ku.TABLE_CATALOG,
                               ku.TABLE_SCHEMA,
                               ku.TABLE_NAME,
                               ku.COLUMN_NAME,
                               tc.CONSTRAINT_TYPE,
                               CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN true else false END AS is_primary
                        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
                               INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku
                                          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                        where tc.constraint_type = 'PRIMARY KEY'
                          and ku.TABLE_SCHEMA = '${tenantSchema}'
                          and ku.TABLE_NAME = '${relation.id}') pk ON c.TABLE_CATALOG = pk.TABLE_CATALOG
        AND c.TABLE_SCHEMA = pk.TABLE_SCHEMA
        AND c.TABLE_NAME = pk.TABLE_NAME
        AND c.COLUMN_NAME = pk.COLUMN_NAME
             LEFT JOIN (SELECT ku.TABLE_CATALOG,
                               ku.TABLE_SCHEMA,
                               ku.TABLE_NAME,
                               ku.COLUMN_NAME,
                               tc.CONSTRAINT_TYPE,
                               CASE WHEN tc.constraint_type = 'UNIQUE' THEN true else false END AS is_unique
                        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
                               INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku
                                          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                        where tc.constraint_type = 'UNIQUE'
                          and ku.TABLE_SCHEMA = '${tenantSchema}'
                          and ku.TABLE_NAME = '${relation.id}') as uk ON c.TABLE_CATALOG = uk.TABLE_CATALOG
        AND c.TABLE_SCHEMA = uk.TABLE_SCHEMA
        AND c.TABLE_NAME = uk.TABLE_NAME
        AND c.COLUMN_NAME = uk.COLUMN_NAME
      WHERE c.TABLE_NAME = '${relation.id}'
        AND c.TABLE_SCHEMA = '${tenantSchema}'
      ORDER BY c.TABLE_SCHEMA,
               c.TABLE_NAME,
               c.ORDINAL_POSITION;
    `);

    const transformedColumnDefaultValues = columns.map((column) => {
      return {
        ...column,
        column_default: column.data_type === 'jsonb' ? JSON.parse(column.column_default) : column.column_default,
      };
    });

    return {
      foreign_keys,
      columns: transformedColumnDefaultValues,
      configurations: relation.configurations,
    };
  }

  /**
   * Per table, which environments have a relation. Shape is edition-agnostic: CE's org has exactly
   * one app_environments row (its implicit environment) so `environments` comes back with one
   * entry; EE/licensed orgs get one entry per licensed environment. Callers (frontend) read the
   * same field names regardless of edition - only the entry count differs.
   */
  protected async viewTables(organizationId: string) {
    const tables = await this.manager.find(InternalTable, {
      where: { organizationId },
      select: ['id', 'tableName'],
      order: { tableName: 'ASC' },
    });
    if (isEmpty(tables)) return tables;

    // Same gate resolveEnvironmentId() uses: every org has all app_environments rows seeded
    // (seedOrgEnvironmentsAndDefaultBranch runs unconditionally), so licensing has to filter the
    // list here rather than at row-creation time - a CE org's other rows exist in the DB, they're
    // just not this org's to see.
    const multiEnvironmentEnabled = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.MULTI_ENVIRONMENT,
      organizationId
    );
    const allEnvironments = await this.manager.find(AppEnvironment, {
      where: { organizationId },
      order: { priority: 'ASC' },
    });
    const environments = multiEnvironmentEnabled
      ? allEnvironments
      : allEnvironments.filter((environment) => environment.priority === 1);
    const branchId = await this.relationResolverService.resolveBranchIdFor(organizationId, this.manager);
    const relations = await this.manager.find(InternalTableRelation, {
      where: { internalTableId: In(tables.map((table) => table.id)), branchId },
    });

    const relationsByTable = new Map<string, InternalTableRelation[]>();
    for (const relation of relations) {
      const list = relationsByTable.get(relation.internalTableId);
      if (list) list.push(relation);
      else relationsByTable.set(relation.internalTableId, [relation]);
    }

    return tables.map((table) => ({
      id: table.id,
      tableName: table.tableName,
      environments: environments.map((environment) => {
        const relation = relationsByTable.get(table.id)?.find((r) => r.environmentId === environment.id);
        return {
          environment_id: environment.id,
          environment_name: environment.name,
          has_relation: !!relation,
          baseline_error: relation?.baselineError ?? null,
        };
      }),
    }));
  }

  protected addQuotesIfString(value) {
    if (isString(value)) return `'${value}'`;
    return value;
  }

  protected addQuotesIfMissing(value) {
    if (!!value && !value.includes("'")) return `'${value}'`;
    return value;
  }

  /**
   * Resolves names and mints identity for create_table: a uuid per column and a co_relation_id per
   * embedded foreign key's referenced table (the portable identity, not a physical name - apply()
   * resolves that back to a relation right before it builds the DDL). No writes, no DDL.
   */
  protected async normalizeCreateTable(organizationId: string, params, appManager: EntityManager) {
    const columnNames = {};
    const columnConfigurations = {};
    for (const column of params.columns) {
      const columnUuid = uuidv4();
      columnNames[column.column_name] = columnUuid;
      columnConfigurations[columnUuid] = column?.configurations || {};
    }

    const foreignKeys = await this.resolveForeignKeyCoRelationIds(
      params.foreign_keys || [],
      organizationId,
      appManager
    );

    return {
      organizationId,
      columns: params.columns,
      columnNames,
      columnConfigurations,
      foreignKeys,
    };
  }

  /**
   * Physical DDL for create_table plus the new relation's configurations write. Takes an
   * already-existing relation - placing the InternalTable/InternalTableRelation rows is the
   * caller's job, not apply's, so the same apply() shape works once promote/replay create a
   * relation before calling this instead of createTable() minting one itself.
   */
  protected async applyCreateTable(
    payload: {
      organizationId: string;
      columns: TooljetDatabaseColumn[];
      columnNames: Record<string, string>;
      columnConfigurations: Record<string, unknown>;
      foreignKeys: FkSpec[];
    },
    relation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ) {
    const { appManager, tjdbManager } = connectionManagers;
    const tjdbQueryRunner = tjdbManager.queryRunner;
    const tenantSchema = findTenantSchema(payload.organizationId);

    relation.configurations = {
      columns: {
        column_names: payload.columnNames,
        configurations: payload.columnConfigurations,
      },
    };
    await appManager.save(relation);

    const foreignKeyDetails = await this.resolveForeignKeyDetailsForApply(
      payload.foreignKeys,
      payload.organizationId,
      relation,
      tenantSchema,
      appManager
    );

    const primaryKeyColumnList = payload.columns
      .filter((column) => column.constraints_type.is_primary_key)
      .map((column) => column.column_name);

    await tjdbQueryRunner.createTable(
      new Table({
        schema: tenantSchema,
        name: relation.id,
        columns: this.prepareColumnListForCreateTable(payload.columns),
        ...(foreignKeyDetails.length && { foreignKeys: foreignKeyDetails }),
      })
    );

    const tableNameWithSchema = concatSchemaAndTableName(tenantSchema, relation.id);
    await tjdbQueryRunner.createPrimaryKey(tableNameWithSchema, primaryKeyColumnList);

    if (!isSQLModeDisabled()) {
      await transferTableOwnershipToTenant(
        tjdbQueryRunner,
        tenantSchema,
        relation.id,
        `user_${payload.organizationId}`
      );
    }
  }

  protected async createTable(
    organizationId: string,
    params,
    connectionManagers: Record<string, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ) {
    const primaryKeyColumnList = params.columns
      .filter((column) => column.constraints_type.is_primary_key)
      .map((column) => column.column_name);

    if (isEmpty(primaryKeyColumnList)) throw new BadRequestException('Primary key is mandatory');

    const { table_name: tableName, foreign_keys = [] } = params;
    const { appManager, tjdbManager } = connectionManagers;
    const tableWithSameName = await appManager.findOne(InternalTable, {
      where: {
        tableName,
        organizationId,
      },
    });

    if (!isEmpty(tableWithSameName)) throw new ConflictException(`Table with name "${tableName}" already exists`);

    let referenced_tables_info = {};
    if (foreign_keys.length) {
      const referenced_table_list = foreign_keys.map((foreign_key) => foreign_key.referenced_table_name);
      referenced_tables_info = await this.fetchAndCheckIfValidForeignKeyTables(
        referenced_table_list,
        organizationId,
        'TABLENAME',
        appManager
      );
    }

    const isFKfromCompositePK = await this.checkIfForeignKeyReferencedColumnsAreFromCompositePrimaryKey(
      foreign_keys,
      organizationId,
      connectionManagers
    );

    if (isFKfromCompositePK)
      throw new ConflictException(
        'Foreign key cannot be created as the referenced column is in the composite primary key.'
      );

    const queryRunner = appManager?.queryRunner || appManager.connection.createQueryRunner();
    const tjdbQueryRunner = tjdbManager?.queryRunner || tjdbManager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();

    try {
      const payload = await this.normalizeCreateTable(organizationId, params, queryRunner.manager);

      const internalTable = queryRunner.manager.create(InternalTable, {
        tableName,
        organizationId,
        co_relation_id: uuidv4(),
      });

      await queryRunner.manager.save(internalTable);

      // The relation id is independent of the logical table id: it is minted here and is the physical
      // Postgres table name. Rows inserted by migration A still satisfy relation.id === internalTable.id,
      // so both shapes coexist - never assume either holds generally. create_table only creates the
      // development-environment relation; higher environments get their own relation when the table is
      // first promoted (not yet built).
      const environmentId = await this.relationResolverService.resolveEnvironmentIdFor(
        organizationId,
        queryRunner.manager
      );
      const branchId = await this.relationResolverService.resolveBranchIdFor(organizationId, queryRunner.manager);

      const relation = await queryRunner.manager.save(
        queryRunner.manager.create(InternalTableRelation, {
          id: uuidv4(),
          internalTableId: internalTable.id,
          environmentId,
          branchId,
        })
      );

      // Folded into this same app-DB transaction: if it rolls back, nothing was created and
      // nothing was recorded either. Every other structured op records after its own DDL has
      // already committed - create_table is the one exception, because there is no table id to
      // record against until these two rows exist.
      const migration = await this.migrationRecorderService.record(
        { action: 'create_table', request: params },
        internalTable,
        relation,
        queryRunner.manager
      );

      await this.applyCreateTable(payload, relation, {
        appManager: queryRunner.manager,
        tjdbManager: tjdbQueryRunner.manager,
      });

      await queryRunner.commitTransaction();
      await tjdbQueryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunner);

      //@ts-expect-error queryRunner has property transactionDepth which is not defined in type EntityManager
      if (!queryRunner?.transactionDepth || queryRunner.transactionDepth < 1) await queryRunner.release();
      //@ts-expect-error queryRunner has property transactionDepth which is not defined in type EntityManager
      if (!tjdbQueryRunner?.transactionDepth || tjdbQueryRunner.transactionDepth < 1) await tjdbQueryRunner.release();
      return { id: internalTable.id, table_name: tableName };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await tjdbQueryRunner.rollbackTransaction();
      await queryRunner.release();
      await tjdbQueryRunner.release();
      const referencedColumnInfoForError = Object.entries(referenced_tables_info).map(
        ([tableName, tableId]): { id: string; tableName: string } => {
          return {
            id: tableId as string,
            tableName: tableName,
          };
        }
      );

      throw new TooljetDatabaseError(
        err.message,
        {
          origin: 'create_table',
          internalTables: [...referencedColumnInfoForError],
        },
        err
      );
    }
  }

  /** No uuid minting: drop_table just resolves the table name to its relation. */
  protected async normalizeDropTable(organizationId: string, tableName: string) {
    const { internalTable, relation } = await this.resolveTable(organizationId, tableName, undefined);
    return { organizationId, internalTable, relation };
  }

  protected async applyDropTable(
    payload: { organizationId: string; internalTable: InternalTable },
    relation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ) {
    const { appManager, tjdbManager } = connectionManagers;
    const tenantSchema = findTenantSchema(payload.organizationId);

    await appManager.softDelete(InternalTable, { id: payload.internalTable.id });
    await tjdbManager.queryRunner.dropTable(new Table({ schema: tenantSchema, name: relation.id }));

    // The relation row survives drop_table (it's the migration chain's anchor), but its physical
    // columns don't - clear configurations so it stops describing a table that no longer exists.
    relation.configurations = { columns: { column_names: {}, configurations: {} } };
    await appManager.save(relation);
  }

  protected async dropTable(organizationId: string, params) {
    const { table_name: tableName } = params;
    const { internalTable, relation } = await this.normalizeDropTable(organizationId, tableName);

    // Same check the /dependents route reports as a soft warning - constructed directly rather
    // than injected, since `InternalTableRepository` needs only the DataSource this.manager already
    // carries (TypeORM 0.3's own pattern for a custom repository outside the DI graph). `relation`
    // here is already the development relation (resolveTable resolved it with environmentId:
    // undefined), so no second resolve is needed for the foreign-key lookup.
    const internalTableRepository = new InternalTableRepository(this.manager.connection);
    const [{ count: appQueryCount }, foreignKeyTables] = await Promise.all([
      internalTableRepository.findDependents(internalTable.id, organizationId),
      internalTableRepository.findForeignKeyDependents(organizationId, relation.id, this.tooljetDbManager),
    ]);

    if (appQueryCount) {
      throw new BadRequestException(
        `Table can't be deleted, it is referenced by ${appQueryCount} app quer${
          appQueryCount === 1 ? 'y' : 'ies'
        }. Remove those references first.`
      );
    }
    if (foreignKeyTables.length) {
      throw new BadRequestException(
        `Table can't be deleted, it has a foreign key referencing it from: ${foreignKeyTables
          .map((table) => table.name)
          .join(', ')}. Remove those foreign keys first.`
      );
    }

    await this.migrationRecorderService.adjudicatePending(internalTable, relation);
    const migration = await this.migrationRecorderService.record(
      { action: 'drop_table', request: params },
      internalTable,
      relation
    );

    const queryRunner = this.manager.connection.createQueryRunner();
    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();

    await queryRunner.connect();
    await tjdbQueryRunner.connect();

    await queryRunner.startTransaction();
    await tjdbQueryRunner.startTransaction();

    try {
      await this.applyDropTable({ organizationId, internalTable }, relation, {
        appManager: queryRunner.manager,
        tjdbManager: tjdbQueryRunner.manager,
      });

      await queryRunner.commitTransaction();
      await tjdbQueryRunner.commitTransaction();
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunner);
      return true;
    } catch (err) {
      await this.migrationRecorderService.discard(migration, relation);
      await queryRunner.rollbackTransaction();
      await tjdbQueryRunner.rollbackTransaction();
      throw new TooljetDatabaseError(
        err.message,
        {
          origin: 'drop_table',
          // Raw Postgres error text names the physical relation, not the logical table - key on
          // relation.id so the translation actually matches what the driver reported.
          internalTables: [{ id: relation.id, tableName: internalTable.tableName }],
        },
        err
      );
    } finally {
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await queryRunner.release();
      await tjdbQueryRunner.release();
    }
  }

  /**
   * Builds the column diff (insert/update/delete) and resolves a uuid for every column in it: read
   * from the source relation's own column_names for edits and deletes, minted fresh for inserts.
   * The rename trap: an updated column's uuid is read here, from the relation normalize resolved -
   * apply() must use this uuid as-is and never re-index into whatever relation it is handed by name.
   */
  protected async normalizeEditTable(organizationId: string, params, appManager: EntityManager) {
    const { table_name: tableName } = params;
    const { internalTable, relation } = await this.resolveTable(organizationId, tableName, undefined, appManager);

    // Uuids are resolved against the relation normalize just read - the source of the request -
    // never against whatever relation apply() ends up pointed at.
    const sourceColumnNames = relation.configurations.columns.column_names;
    const diff = this.buildEditTableColumnDiff(params, sourceColumnNames, () => uuidv4());

    return {
      organizationId,
      internalTable,
      relation,
      ...diff,
      newTableName: params.new_table_name,
    };
  }

  /**
   * Pure column-diff builder shared by the live edit_table path and replay: which columns to
   * insert/update/delete, and every one of their uuids. `sourceColumnNames` is where an
   * update/delete's uuid is read from - the live path's relation.configurations at request time,
   * replay's prior-migration resulting_schema. `mintColumnUuid` is the one seam that differs
   * between them: uuidv4() live, a read from this migration's own resulting_schema on replay - the
   * only place in this function identity is created rather than looked up.
   */
  protected buildEditTableColumnDiff(
    params: { columns: any[] },
    sourceColumnNames: Record<string, string>,
    mintColumnUuid: (columnName: string) => string
  ) {
    const { columns } = params;
    const updatedPrimaryKeys = [];
    const columnstoBeUpdated = [];
    const columnsToBeInserted = [];
    const columnsToBeDeleted = [];
    const columnConfigurationMap = {};

    columns.forEach((column) => {
      const { new_column = {} } = column;
      columnConfigurationMap[new_column.column_name] = new_column?.configurations || {};
    });

    columns.forEach((column) => {
      const { old_column = {}, new_column = {} } = column;

      // Filter Primary Key column
      if (!isEmpty(new_column) && new_column?.constraints_type.is_primary_key) {
        updatedPrimaryKeys.push(
          new TableColumn({
            name: new_column.column_name,
            type: new_column.data_type,
          })
        );
      }

      // Columns to be deleted
      if (!isEmpty(old_column) && isEmpty(new_column)) {
        if (old_column.column_name) columnsToBeDeleted.push(old_column.column_name);
      }

      // New columns to be inserted
      if (isEmpty(old_column) && !isEmpty(new_column)) {
        const is_primary_key_column = new_column?.constraints_type.is_primary_key || false;
        columnsToBeInserted.push(
          new TableColumn({
            name: new_column.column_name,
            type: new_column.data_type,
            ...(new_column?.column_default &&
              new_column.data_type !== 'serial' && {
                default:
                  new_column.data_type === 'character varying'
                    ? this.addQuotesIfString(new_column.column_default)
                    : new_column.column_default,
              }),
            isNullable: !new_column?.constraints_type.is_not_null,
            isUnique: new_column?.constraints_type.is_unique && !is_primary_key_column ? true : false,
            isPrimary: new_column?.constraints_type.is_primary_key || false,
          })
        );

        // To Sync with Other States - Adding it to the Update Array as well
        columnstoBeUpdated.push({
          oldColumn: new TableColumn({
            name: new_column.column_name,
            type: new_column.data_type,
            ...(new_column?.column_default &&
              new_column.data_type !== 'serial' && {
                default:
                  new_column.data_type === 'character varying'
                    ? this.addQuotesIfString(new_column.column_default)
                    : new_column.column_default,
              }),
            isNullable: !new_column?.constraints_type.is_not_null,
            isUnique: new_column?.constraints_type.is_unique && !is_primary_key_column ? true : false,
            isPrimary: new_column?.constraints_type.is_primary_key || false,
          }),
          newColumn: new TableColumn({
            name: new_column.column_name,
            type: new_column.data_type,
            ...(new_column?.column_default &&
              new_column.data_type !== 'serial' && {
                default:
                  new_column.data_type === 'character varying'
                    ? this.addQuotesIfString(new_column.column_default)
                    : new_column.column_default,
              }),
            isNullable: !new_column?.constraints_type.is_not_null,
            isUnique: new_column?.constraints_type.is_unique && !is_primary_key_column ? true : false,
            isPrimary: new_column?.constraints_type.is_primary_key || false,
          }),
        });
      }

      // Columns to be updated
      if (!isEmpty(old_column) && !isEmpty(new_column)) {
        const is_primary_key_column = new_column?.constraints_type.is_primary_key || false;
        columnstoBeUpdated.push({
          oldColumn: new TableColumn({
            name: old_column.column_name,
            type: old_column.data_type,
            ...(old_column?.column_default &&
              old_column.data_type !== 'serial' && {
                default:
                  old_column.data_type === 'character varying'
                    ? this.addQuotesIfString(old_column.column_default)
                    : old_column.column_default,
              }),
            isNullable: !old_column?.constraints_type.is_not_null,
            isUnique: old_column?.constraints_type.is_unique,
            isPrimary: old_column?.constraints_type.is_primary_key || false,
          }),
          newColumn: new TableColumn({
            name: new_column.column_name,
            type: new_column.data_type,
            ...(new_column?.column_default &&
              new_column.data_type !== 'serial' && {
                default:
                  new_column.data_type === 'character varying'
                    ? this.addQuotesIfString(new_column.column_default)
                    : new_column.column_default,
              }),
            isNullable: !new_column?.constraints_type.is_not_null,
            isUnique: new_column?.constraints_type.is_unique && !is_primary_key_column ? true : false,
            isPrimary: new_column?.constraints_type.is_primary_key || false,
          }),
        });
      }
    });

    const columnUuidPatches = [];
    columnstoBeUpdated.forEach((column) => {
      const { newColumn, oldColumn } = column;
      const columnUuid = sourceColumnNames[oldColumn.name];
      if (columnUuid) {
        columnUuidPatches.push({
          oldName: oldColumn.name,
          newName: newColumn.name,
          uuid: columnUuid,
          typeChanged: newColumn.type !== oldColumn.type,
          configurations: columnConfigurationMap[newColumn.name],
        });
      }
    });

    const deletedColumns = columnsToBeDeleted.map((name) => ({ name, uuid: sourceColumnNames[name] }));

    const insertedColumns = columnsToBeInserted.map((column) => ({
      name: column.name,
      uuid: mintColumnUuid(column.name),
      configurations: columnConfigurationMap[column.name],
    }));

    return {
      updatedPrimaryKeys,
      columnsToBeDeleted,
      columnsToBeInserted,
      columnstoBeUpdated,
      columnUuidPatches,
      deletedColumns,
      insertedColumns,
    };
  }

  /** Physical DDL for edit_table plus the relation's configurations write, keyed by the payload's uuids. */
  protected async applyEditTable(
    payload,
    relation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ) {
    const { appManager, tjdbManager } = connectionManagers;
    const tjdbQueryRunner = tjdbManager.queryRunner;
    const physicalName = concatSchemaAndTableName(findTenantSchema(payload.organizationId), relation.id);

    const columnNames = relation.configurations.columns.column_names;
    const columnConfigurations = relation.configurations.columns.configurations;

    payload.columnUuidPatches.forEach(({ oldName, newName, uuid, typeChanged, configurations }) => {
      columnNames[newName] = uuid;
      if (typeChanged) columnConfigurations[uuid] = {};
      columnConfigurations[uuid] = { ...columnConfigurations[uuid], ...configurations };
      if (oldName !== newName) delete columnNames[oldName];
    });

    payload.deletedColumns.forEach(({ name, uuid }) => {
      delete columnNames[name];
      delete columnConfigurations[uuid];
    });

    payload.insertedColumns.forEach(({ name, uuid, configurations }) => {
      columnNames[name] = uuid;
      columnConfigurations[uuid] = configurations;
    });

    relation.configurations = {
      columns: { column_names: columnNames, configurations: columnConfigurations },
    };
    await appManager.save(relation);

    if (!isEmpty(payload.columnsToBeDeleted))
      await tjdbQueryRunner.dropColumns(physicalName, payload.columnsToBeDeleted);
    if (!isEmpty(payload.columnsToBeInserted))
      await tjdbQueryRunner.addColumns(physicalName, payload.columnsToBeInserted);
    if (!isEmpty(payload.columnstoBeUpdated))
      await tjdbQueryRunner.changeColumns(physicalName, payload.columnstoBeUpdated);
  }

  protected async editTable(organizationId: string, params) {
    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();

    // Resolved inside the transaction (queryRunner.manager), same manager the original code used
    // for its own getRelation call - reading the relation outside the transaction here would be a
    // read-your-own-writes hazard for any future write this handler makes before this point.
    let internalTable: InternalTable;
    let relation: InternalTableRelation;
    let migration: InternalTableMigration;
    try {
      const payload = await this.normalizeEditTable(organizationId, params, queryRunner.manager);
      internalTable = payload.internalTable;
      relation = payload.relation;

      if (isEmpty(payload.updatedPrimaryKeys)) throw new BadRequestException('Primary key is mandatory');

      await this.migrationRecorderService.adjudicatePending(internalTable, relation);
      migration = await this.migrationRecorderService.record(
        { action: 'edit_table', request: params },
        internalTable,
        relation
      );

      await this.applyEditTable(payload, relation, {
        appManager: queryRunner.manager,
        tjdbManager: tjdbQueryRunner.manager,
      });

      if (payload.newTableName) {
        const newInternalTable = await queryRunner.manager.findOne(InternalTable, {
          where: { organizationId, tableName: payload.newTableName },
        });

        if (newInternalTable) throw new BadRequestException('Table name already exists: ' + payload.newTableName);
        await queryRunner.manager.update(InternalTable, { id: internalTable.id }, { tableName: payload.newTableName });
      }

      await tjdbQueryRunner.commitTransaction();
      await queryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunner);
      await tjdbQueryRunner.release();
      await queryRunner.release();
    } catch (error) {
      if (migration) await this.migrationRecorderService.discard(migration, relation);
      await tjdbQueryRunner.rollbackTransaction();
      await queryRunner.rollbackTransaction();
      await tjdbQueryRunner.release();
      await queryRunner.release();

      // resolveTable's "not found" is not a QueryFailedError - TooljetDatabaseError's constructor
      // assumes one (it indexes error.driverError) and would crash on the wrap instead of
      // surfacing the real "not found" message.
      if (error instanceof NotFoundException) throw error;

      // Raw Postgres error text names the physical relation, not the logical table - key on
      // relation.id so the translation actually matches what the driver reported.
      throw new TooljetDatabaseError(
        error.message,
        { origin: 'edit_table', internalTables: [{ id: relation.id, tableName: internalTable.tableName }] },
        error
      );
    }
  }

  /**
   * Mints a uuid for the new column and converts add_column's embedded foreign_keys (referenced by
   * display name) into co_relation_id-keyed FkSpecs - the same conversion create_table does.
   */
  protected async normalizeAddColumn(organizationId: string, params, appManager: EntityManager) {
    const { table_name: tableName, column, foreign_keys = [] } = params;
    const { internalTable, relation } = await this.resolveTable(organizationId, tableName, undefined, appManager);

    const columnUuid = uuidv4();
    const foreignKeys = await this.resolveForeignKeyCoRelationIds(foreign_keys, organizationId, appManager);

    return { organizationId, internalTable, relation, column, columnUuid, foreignKeys };
  }

  protected async applyAddColumn(
    payload: {
      organizationId: string;
      column: TooljetDatabaseColumn & { configurations?: Record<string, unknown> };
      columnUuid: string;
      foreignKeys: FkSpec[];
    },
    relation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ) {
    const { appManager, tjdbManager } = connectionManagers;
    const tjdbQueryRunner = tjdbManager.queryRunner;
    const tenantSchema = findTenantSchema(payload.organizationId);
    const physicalName = concatSchemaAndTableName(tenantSchema, relation.id);
    const { column, columnUuid, foreignKeys } = payload;

    const columnNames = relation.configurations.columns.column_names;
    const columnConfigurations = relation.configurations.columns.configurations;
    columnNames[column['column_name']] = columnUuid;
    columnConfigurations[columnUuid] = column?.configurations || {};
    relation.configurations = {
      columns: {
        column_names: columnNames,
        configurations: columnConfigurations,
      },
    };

    await appManager.save(relation);

    await tjdbQueryRunner.addColumn(
      physicalName,
      new TableColumn({
        name: column['column_name'],
        type: column['data_type'],
        ...(column['column_default'] && {
          default:
            column['data_type'] === 'character varying'
              ? this.addQuotesIfString(column['column_default'])
              : column['column_default'],
        }),
        isNullable: !column?.constraints_type.is_not_null || false,
        isUnique: column?.constraints_type.is_unique || false,
        ...(column?.constraints_type.is_primary_key && { isPrimary: true }),
      })
    );

    if (foreignKeys.length) {
      const foreignKeyDetails = await this.resolveForeignKeyDetailsForApply(
        foreignKeys,
        payload.organizationId,
        relation,
        tenantSchema,
        appManager
      );
      const tableForeignKeys = foreignKeyDetails.map((detail) => new TableForeignKey({ ...detail }));
      await tjdbQueryRunner.createForeignKeys(physicalName, tableForeignKeys);
    }
  }

  protected async addColumn(organizationId: string, params) {
    const { foreign_keys } = params;

    let referenced_tables_info = {};
    if (foreign_keys.length) {
      const referenced_table_list = foreign_keys.map((foreign_key) => foreign_key.referenced_table_name);
      referenced_tables_info = await this.fetchAndCheckIfValidForeignKeyTables(
        referenced_table_list,
        organizationId,
        'TABLENAME'
      );
    }

    const isFKfromCompositePK = await this.checkIfForeignKeyReferencedColumnsAreFromCompositePrimaryKey(
      foreign_keys,
      organizationId
    );

    if (isFKfromCompositePK)
      throw new ConflictException(
        'Foreign key cannot be created as the referenced column is in the composite primary key.'
      );

    const tjdbQueryRunnner = this.tooljetDbManager.connection.createQueryRunner();
    await tjdbQueryRunnner.connect();
    await tjdbQueryRunnner.startTransaction();

    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Resolved inside the transaction (queryRunner.manager), same manager the original code used
    // for its own getRelation call - reading the relation outside the transaction here would be a
    // read-your-own-writes hazard for any future write this handler makes before this point.
    let internalTable: InternalTable;
    let relation: InternalTableRelation;
    let migration: InternalTableMigration;
    try {
      const payload = await this.normalizeAddColumn(organizationId, params, queryRunner.manager);
      internalTable = payload.internalTable;
      relation = payload.relation;

      await this.migrationRecorderService.adjudicatePending(internalTable, relation);
      migration = await this.migrationRecorderService.record(
        { action: 'add_column', request: params },
        internalTable,
        relation
      );

      await this.applyAddColumn(payload, relation, {
        appManager: queryRunner.manager,
        tjdbManager: tjdbQueryRunnner.manager,
      });

      await queryRunner.commitTransaction();
      await tjdbQueryRunnner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunnner);
      await queryRunner.release();
      await tjdbQueryRunnner.release();
    } catch (err) {
      if (migration) await this.migrationRecorderService.discard(migration, relation);
      await tjdbQueryRunnner.rollbackTransaction();
      await tjdbQueryRunnner.release();
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      // resolveTable's "not found" is not a QueryFailedError - TooljetDatabaseError's constructor
      // assumes one (it indexes error.driverError) and would crash on the wrap instead of
      // surfacing the real "not found" message.
      if (err instanceof NotFoundException) throw err;

      const referencedColumnInfoForError = Object.entries(referenced_tables_info).map(
        ([tableName, tableId]): { id: string; tableName: string } => {
          return {
            id: tableId as string,
            tableName: tableName,
          };
        }
      );

      throw new TooljetDatabaseError(
        err.message,
        {
          origin: 'add_column',
          // Raw Postgres error text names the physical relation, not the logical table - key on
          // relation.id so the translation actually matches what the driver reported.
          internalTables: [{ id: relation.id, tableName: internalTable.tableName }, ...referencedColumnInfoForError],
        },
        err
      );
    }
  }

  /** Reads the uuid of the column being dropped from the source relation; mints nothing. */
  protected async normalizeDropColumn(organizationId: string, params, appManager: EntityManager) {
    const { table_name: tableName, column } = params;
    const { internalTable, relation } = await this.resolveTable(organizationId, tableName, undefined, appManager);
    const columnName = column['column_name'];
    const columnUuid = relation.configurations.columns.column_names[columnName];

    return { organizationId, internalTable, relation, columnName, columnUuid };
  }

  protected async applyDropColumn(
    payload: { organizationId: string; columnName: string; columnUuid: string },
    relation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ) {
    const { appManager, tjdbManager } = connectionManagers;
    const physicalName = concatSchemaAndTableName(findTenantSchema(payload.organizationId), relation.id);

    const columnNames = relation.configurations.columns.column_names;
    const columnConfigurations = relation.configurations.columns.configurations;
    delete columnNames[payload.columnName];
    delete columnConfigurations[payload.columnUuid];
    relation.configurations = {
      columns: {
        column_names: columnNames,
        configurations: columnConfigurations,
      },
    };
    await appManager.save(relation);

    return await tjdbManager.queryRunner.dropColumn(physicalName, payload.columnName);
  }

  protected async dropColumn(organizationId: string, params) {
    const tjdbQueryRunnner = this.tooljetDbManager.connection.createQueryRunner();
    const queryRunner = this.manager.connection.createQueryRunner();

    await tjdbQueryRunnner.connect();
    await queryRunner.connect();

    await queryRunner.startTransaction();
    await tjdbQueryRunnner.startTransaction();

    // Resolved inside the transaction (queryRunner.manager), same manager the original code used
    // for its own getRelation call - reading the relation outside the transaction here would be a
    // read-your-own-writes hazard for any future write this handler makes before this point.
    let internalTable: InternalTable;
    let relation: InternalTableRelation;
    let migration: InternalTableMigration;
    try {
      const payload = await this.normalizeDropColumn(organizationId, params, queryRunner.manager);
      internalTable = payload.internalTable;
      relation = payload.relation;

      await this.migrationRecorderService.adjudicatePending(internalTable, relation);
      migration = await this.migrationRecorderService.record(
        { action: 'drop_column', request: params },
        internalTable,
        relation
      );

      const result = await this.applyDropColumn(payload, relation, {
        appManager: queryRunner.manager,
        tjdbManager: tjdbQueryRunnner.manager,
      });

      await tjdbQueryRunnner.commitTransaction();
      await queryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunnner);

      return result;
    } catch (error) {
      if (migration) await this.migrationRecorderService.discard(migration, relation);
      await tjdbQueryRunnner.rollbackTransaction();
      await queryRunner.rollbackTransaction();

      // resolveTable's "not found" is not a QueryFailedError - TooljetDatabaseError's constructor
      // assumes one (it indexes error.driverError) and would crash on the wrap instead of
      // surfacing the real "not found" message.
      if (error instanceof NotFoundException) throw error;

      // Raw Postgres error text names the physical relation, not the logical table - key on
      // relation.id so the translation actually matches what the driver reported.
      throw new TooljetDatabaseError(
        error.message,
        { origin: 'drop_column', internalTables: [{ id: relation.id, tableName: internalTable.tableName }] },
        error
      );
    } finally {
      await queryRunner.release();
      await tjdbQueryRunnner.release();
    }
  }

  async getTablesLimit(organizationId: string) {
    const licenseTerms = await this.licenseTermsService.getLicenseTerms(
      [LICENSE_FIELD.TABLE_COUNT, LICENSE_FIELD.STATUS],
      organizationId
    );
    if (licenseTerms[LICENSE_FIELD.TABLE_COUNT] === LICENSE_LIMIT.UNLIMITED) {
      return {
        tablesCount: generatePayloadForLimits(
          0,
          licenseTerms[LICENSE_FIELD.TABLE_COUNT],
          licenseTerms[LICENSE_FIELD.STATUS],
          LICENSE_LIMITS_LABEL.TABLES
        ),
      };
    }
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const tableCount =
      edition === TOOLJET_EDITIONS.Cloud
        ? await this.manager
            .createQueryBuilder(InternalTable, 'internal_table')
            .where('internal_table.organizationId = :organizationId', { organizationId })
            .getCount()
        : await this.manager.createQueryBuilder(InternalTable, 'internal_table').getCount();
    return {
      tablesCount: generatePayloadForLimits(
        tableCount,
        licenseTerms[LICENSE_FIELD.TABLE_COUNT],
        licenseTerms[LICENSE_FIELD.STATUS],
        LICENSE_LIMITS_LABEL.TABLES
      ),
    };
  }

  protected async joinTable(organizationId: string, params: Record<string, any>) {
    const { joinQueryJson: rawJoinQueryJson, dataQuery, user, environmentId } = params;
    if (!Object.keys(rawJoinQueryJson).length) throw new BadRequestException("Input can't be empty");
    const joinQueryJson = this.normalizeJoinQueryJsonToNewFormat(rawJoinQueryJson);

    // Known over-privileged fallback: TOOLJET_DB_USER can reach every workspace's schema. The
    // from/join table references reaching this query ARE validated against the caller's
    // workspace above; this is about the DB *role* used, not an unvalidated identifier. Left
    // as-is pending a workspace-scoped connection for the SQL-mode-disabled case — do not
    // remove without one.
    const tjdbTenantConfigs = isSQLModeDisabled()
      ? {
          pgUser: this.configService.get<string>('TOOLJET_DB_USER'),
          pgPassword: this.configService.get<string>('TOOLJET_DB_PASS'),
        }
      : await this.manager.findOne(OrganizationTjdbConfigurations, {
          where: { organizationId },
        });

    if (!tjdbTenantConfigs) throw new NotFoundException(`Tooljet database schema configuration doesn't exists`);

    // Gathering tables used, from Join coditions
    const tableSet = new Set();
    // The from-table reaches buildJoinQuery's .from() unvalidated otherwise, so it must join the rest here.
    if (joinQueryJson?.from?.name) tableSet.add(joinQueryJson.from.name);
    const joinOptions = joinQueryJson?.['joins'];
    (joinOptions || []).forEach((join) => {
      const { table, conditions } = join;
      tableSet.add(table);
      conditions?.conditionsList?.forEach((condition) => {
        const { leftField, rightField } = condition;
        if (leftField?.table) {
          tableSet.add(leftField?.table);
        }
        if (rightField?.table) {
          tableSet.add(rightField?.table);
        }
      });
    });

    const tables = [...tableSet].map((tableId: string) => ({
      name: tableId,
      type: 'Table',
    }));

    if (!tables?.length) throw new BadRequestException('Tables are not chosen');

    const tableIdList: Array<string> = tables
      .filter((table) => table.type === 'Table' && !isEmpty(table.name))
      .map((filteredTable) => filteredTable.name);

    const internalTables = await this.findOrFailInternalTableFromTableId(tableIdList, organizationId);
    // Alias map: logical id -> display name. Select fields, aggregates, group-bys, order-bys and
    // filter conditions all address columns through this alias, never the physical table name, so
    // these must stay display names. Only .from() and the join targets name a physical table.
    const internalTableIdToNameMap = tableIdList.reduce((acc, tableId) => {
      return {
        ...acc,
        [tableId]: internalTables.find((table) => table.id === tableId).tableName,
      };
    }, {});

    // Physical-name map: logical id -> relation id, resolved once for the whole table set.
    const relationIdByLogicalId = await this.relationResolverService.resolve(
      organizationId,
      tableIdList,
      environmentId
    );
    const logicalIdsWithoutRelation = tableIdList.filter((tableId) => !relationIdByLogicalId.has(tableId));
    if (logicalIdsWithoutRelation.length) {
      const namesWithoutRelation = logicalIdsWithoutRelation.map((tableId) => internalTableIdToNameMap[tableId]);
      // DEV-89: an (env, branch) with no relation is a 404, not a 400 - the table exists, it just
      // isn't promoted here.
      throw new NotFoundException(
        `Table(s) "${namesWithoutRelation.join('", "')}" have no relation in this environment`
      );
    }

    const { pgPassword, pgUser } = tjdbTenantConfigs;
    const tjdbPassKey = await decryptTooljetDatabasePassword(pgPassword);
    const tenantSchema = findTenantSchema(organizationId);
    const { tooljetDbTenantConnection } = await createTooljetDatabaseConnection(tjdbPassKey, pgUser, tenantSchema);

    try {
      const queryBuilder = this.buildJoinQuery(
        joinQueryJson,
        internalTableIdToNameMap,
        relationIdByLogicalId,
        tooljetDbTenantConnection
      );
      return await queryBuilder.getRawMany();
    } catch (error) {
      const errorObj = new QueryFailedError(error, [], new PostgrestError(error));
      const tjdbErrorObj = new TooljetDatabaseError(
        error.message,
        {
          origin: 'join_tables',
          internalTables: internalTables.map((table) => ({
            id: relationIdByLogicalId.get(table.id),
            tableName: table.tableName,
          })),
        },
        errorObj
      );
      const alteredErrorMessage = tjdbErrorObj.toString();
      throw new QueryError(alteredErrorMessage, alteredErrorMessage, {});
    } finally {
      await tooljetDbTenantConnection.destroy();
      if (!isEmpty(dataQuery) && !isEmpty(user)) {
        // this.eventEmitter.emit('auditLogEntry', {
        //   userId: user.id,
        //   organizationId,
        //   resourceId: dataQuery.id,
        //   resourceName: dataQuery.name,
        //   resourceType: ResourceTypes.DATA_QUERY,
        //   actionType: ActionTypes.DATA_QUERY_RUN,
        //   metadata: {},
        // });
      }
    }
  }

  private normalizeFieldToNewFormat(field: Record<string, any>): Record<string, any> {
    if (!field) return field;
    const result: Record<string, any> = { type: field.type };
    if (field.table !== undefined) result.table = field.table;
    result.columnName = field.columnName ?? field.column_name;
    if (field.value !== undefined) result.value = field.value;
    if (field.jsonpath !== undefined) result.jsonpath = field.jsonpath;
    return result;
  }

  private normalizeConditionsToNewFormat(conditions: Record<string, any>): Record<string, any> {
    if (!conditions) return conditions;
    const rawConditionsList: Array<Record<string, any>> = conditions.conditions_list ?? [];
    return {
      operator: conditions.operator,
      conditionsList: rawConditionsList.map((condition) => ({
        operator: condition.operator,
        leftField: this.normalizeFieldToNewFormat(condition.leftField ?? condition.left_field),
        rightField: this.normalizeFieldToNewFormat(condition.rightField ?? condition.right_field),
      })),
    };
  }

  private normalizeJoinQueryJsonToNewFormat(queryJson: Record<string, any>): Record<string, any> {
    if (!queryJson?.joins?.length) return queryJson;

    const firstJoin = queryJson.joins[0];
    const isOldFormat =
      'join_type' in firstJoin ||
      'conditions_list' in (firstJoin?.conditions ?? {}) ||
      'conditions_list' in (queryJson?.conditions ?? {});

    if (!isOldFormat) return queryJson;

    return {
      ...queryJson,
      joins: queryJson.joins.map((join) => ({
        id: join.id,
        table: join.table,
        joinType: join.joinType ?? join.join_type,
        conditions: this.normalizeConditionsToNewFormat(join.conditions),
      })),
      ...(queryJson.conditions && {
        conditions: this.normalizeConditionsToNewFormat(queryJson.conditions),
      }),
      order_by: (queryJson.order_by ?? []).map((orderByEntry) => ({
        table: orderByEntry.table,
        columnName: orderByEntry.columnName ?? orderByEntry.column_name,
        direction: orderByEntry.direction,
        ...(orderByEntry.jsonpath !== undefined && { jsonpath: orderByEntry.jsonpath }),
      })),
    };
  }

  protected buildJoinQuery(
    queryJson,
    internalTableIdToNameMap,
    relationIdByLogicalId: Map<string, string>,
    tooljetDbTenantConnection: Connection
  ): SelectQueryBuilder<any> {
    const queryBuilder: SelectQueryBuilder<any> = tooljetDbTenantConnection.createQueryBuilder();

    // Mandatory attributes
    if (isEmpty(queryJson.fields) && isEmpty(queryJson.aggregates))
      throw new BadRequestException('The Select and Aggregate statement is not present.');
    if (isEmpty(queryJson.from)) throw new BadRequestException('From table is not selected.');

    // Building `SELECT` statement with aliased column names
    if (!isEmpty(queryJson.fields) && isEmpty(queryJson.aggregates)) {
      queryJson.fields.forEach((field) => {
        const fieldName = field.jsonpath
          ? `"${internalTableIdToNameMap[field.table]}"."${field.name}"${formatJoinsJSONBPath(field.jsonpath)}`
          : `"${internalTableIdToNameMap[field.table]}"."${field.name}"`;

        const fieldAlias = `${internalTableIdToNameMap[field.table]}_${field.name}`;
        queryBuilder.addSelect(fieldName, fieldAlias);
      });
    }

    // Building `AGGREGATE` statement :
    if (!isEmpty(queryJson.aggregates)) {
      Object.entries(queryJson.aggregates).forEach(([_key, aggregateParams]) => {
        const { aggFx, column, table_id: tableId } = aggregateParams as any;
        if (isEmpty(column) || isEmpty(aggFx))
          throw new Error('There are empty values in certain aggregate conditions.');

        const allowedAggFunctions = ['sum', 'count'];
        if (!allowedAggFunctions.includes(aggFx)) {
          throw new BadRequestException('Invalid aggregate function');
        }

        queryBuilder.addSelect(
          `${AggregateFunctions[aggFx]}("${internalTableIdToNameMap[tableId]}"."${column}")`,
          `${internalTableIdToNameMap[tableId]}_${column}_${aggFx}`
        );
      });
    }

    // Building `GROUP_BY` statement :
    if (!isEmpty(queryJson.group_by)) {
      Object.entries(queryJson.group_by).forEach(([groupByTableId, groupByColumList]: [string, Array<string>]) => {
        if (!isEmpty(groupByColumList)) {
          groupByColumList.forEach((groupByColum) => {
            // The 'SELECT' statement needs to have 'GROUP_BY' columns added.
            queryBuilder.addSelect(
              `"${internalTableIdToNameMap[groupByTableId]}"."${groupByColum}"`,
              `${internalTableIdToNameMap[groupByTableId]}_${groupByColum}`
            );

            // Building `GROUP_BY` statement
            queryBuilder.addGroupBy(`"${internalTableIdToNameMap[groupByTableId]}"."${groupByColum}"`);
          });
        }
      });
    }

    // from table
    // Physical name is the relation id; the alias stays the display name every other clause reads.
    queryBuilder.from(relationIdByLogicalId.get(queryJson.from.name), internalTableIdToNameMap[queryJson.from.name]);

    // join tables with conditions
    queryJson.joins.forEach((join) => {
      const joinAlias = internalTableIdToNameMap[join.table];
      const conditions = this.constructFilterConditions(join.conditions, internalTableIdToNameMap);

      const joinFunction = queryBuilder[camelCase(join.joinType) + 'Join'];
      joinFunction.call(
        queryBuilder,
        relationIdByLogicalId.get(join.table),
        joinAlias,
        conditions.query,
        conditions.params
      );
    });

    // conditions
    if (queryJson.conditions) {
      const conditions = this.constructFilterConditions(queryJson.conditions, internalTableIdToNameMap);
      queryBuilder.where(conditions.query, conditions.params);
    }

    // order by
    if (queryJson.order_by) {
      queryJson.order_by.forEach((order) => {
        const orderByColumn = order.jsonpath
          ? `"${internalTableIdToNameMap[order.table]}"."${order.columnName}"${formatJoinsJSONBPath(order.jsonpath)}`
          : `"${internalTableIdToNameMap[order.table]}"."${order.columnName}"`;
        queryBuilder.addOrderBy(orderByColumn, order.direction as 'ASC' | 'DESC');
      });
    }
    // limit and offset
    if (queryJson.limit) queryBuilder.limit(parseInt(queryJson.limit, 10));
    if (queryJson.offset) queryBuilder.offset(parseInt(queryJson.offset, 10));

    return queryBuilder;
  }

  // Param: internalTableIdToNameMap - is the aliases of tablename
  protected constructFilterConditions(conditions, internalTableIdToNameMap) {
    let conditionString = '';
    const conditionParams = {};

    const maybeParameterizeValue = (operator, paramName, value) => {
      switch (operator) {
        case 'IS':
          if (value !== 'NULL' && value !== 'NOT NULL') {
            throw new BadRequestException('Invalid value for IS operator. Allowed values are NULL or NOT NULL.');
          }
          return value;
        case 'IN':
          if (!Array.isArray(value)) {
            throw new BadRequestException('Invalid value for IN operator. Expected an array.');
          }
          return `(:...${paramName})`;
        default:
          return `:${paramName}`;
      }
    };

    conditions.conditionsList.forEach((condition, index) => {
      const paramName = `${condition.leftField.columnName}_${index}`;

      let leftField;
      if (condition.leftField.type == 'Column') {
        leftField = condition.leftField.jsonpath
          ? `"${internalTableIdToNameMap[condition.leftField.table]}"."${
              condition.leftField.columnName
            }"${formatJoinsJSONBPath(condition.leftField.jsonpath)}`
          : `"${internalTableIdToNameMap[condition.leftField.table]}"."${condition.leftField.columnName}"`;
      } else {
        leftField = `${condition.leftField.columnName}`;
      }

      let rightField;
      if (condition.rightField.type == 'Column') {
        rightField = condition.rightField.jsonpath
          ? `"${internalTableIdToNameMap[condition.rightField.table]}"."${
              condition.rightField.columnName
            }"${formatJoinsJSONBPath(condition.rightField.jsonpath)}`
          : `"${internalTableIdToNameMap[condition.rightField.table]}"."${condition.rightField.columnName}"`;
      } else {
        rightField = maybeParameterizeValue(condition.operator, paramName, condition.rightField.value);
      }

      conditionString += `${leftField} ${condition.operator} ${rightField}`;

      conditionParams[paramName] = condition.rightField.value;

      if (index < conditions.conditionsList.length - 1) {
        conditionString += ` ${conditions.operator} `;
      }
    });

    return { query: `(${conditionString})`, params: conditionParams };
  }

  async findOrFailInternalTableFromTableId(requestedTableIdList: Array<string>, organizationId: string) {
    const internalTables = await this.manager.find(InternalTable, {
      where: {
        organizationId,
        id: In(requestedTableIdList),
      },
    });

    const obtainedTableNames = internalTables.map((t) => t.id);
    const tableNamesNotInOrg = requestedTableIdList.filter((tableId) => !obtainedTableNames.includes(tableId));

    if (isEmpty(tableNamesNotInOrg)) return internalTables;

    throw new NotFoundException('Some tables are not found');
  }

  /**
   * Resolves the column's uuid from the source relation before any transaction opens - callers
   * must throw NotFoundException from here, not from inside apply's try block. The rename trap:
   * this is the only place that reads column_names by name; apply() gets the uuid via the payload
   * and never re-indexes into whatever relation it is handed.
   */
  protected async normalizeEditColumn(organizationId: string, params) {
    const { table_name: tableName, column, foreign_key_id_to_delete } = params;
    const { internalTable, relation } = await this.resolveTable(organizationId, tableName, undefined);
    const columnUuid = relation.configurations.columns.column_names[column.column_name];
    if (!columnUuid) throw new NotFoundException('Column not found: ' + column.column_name);

    return {
      organizationId,
      internalTable,
      relation,
      column,
      columnName: column.column_name,
      newColumnName: column?.new_column_name,
      columnUuid,
      foreignKeyIdToDelete: foreign_key_id_to_delete,
    };
  }

  /**
   * Display-settings-only change - not schema, has nothing to promote, and its pre-feature
   * behaviour was that one setting applies everywhere. Writes through to every relation of this
   * internal table that currently holds this column uuid, keyed by uuid rather than by whatever
   * name that relation happens to use. Never called from apply(): apply only ever touches the one
   * relation it was handed, and this touches every relation the column has one.
   */
  protected async writeThroughColumnConfigurations(
    internalTableId: string,
    columnUuid: string,
    configurationsPatch: Record<string, unknown> | undefined,
    appManager: EntityManager
  ): Promise<void> {
    if (isEmpty(configurationsPatch)) return;

    const relations = await appManager.find(InternalTableRelation, { where: { internalTableId } });
    for (const rel of relations) {
      const columnNames = rel.configurations?.columns?.column_names || {};
      if (!Object.values(columnNames).includes(columnUuid)) continue;

      const columnConfigurations = rel.configurations.columns.configurations || {};
      columnConfigurations[columnUuid] = { ...columnConfigurations[columnUuid], ...configurationsPatch };
      rel.configurations = { columns: { column_names: columnNames, configurations: columnConfigurations } };
      await appManager.save(rel);
    }
  }

  /** Physical DDL for edit_column plus the rename bookkeeping on the relation apply was handed. */
  protected async applyEditColumn(
    payload: {
      organizationId: string;
      column: TooljetDatabaseColumn & { new_column_name?: string };
      columnName: string;
      newColumnName?: string;
      columnUuid: string;
      foreignKeyIdToDelete?: string;
    },
    relation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ) {
    const { appManager, tjdbManager } = connectionManagers;
    const tjdbQueryRunner = tjdbManager.queryRunner;
    const tenantSchema = findTenantSchema(payload.organizationId);
    const physicalName = concatSchemaAndTableName(tenantSchema, relation.id);
    const { column, columnName, newColumnName, columnUuid, foreignKeyIdToDelete } = payload;

    // Introspected, never taken from the request: `record()` stores the handler's raw params and
    // `replayStructuredMigration` calls this same method with them, so there is no client on the
    // replay path to tell us what the old type was. Comparing against the live column also makes
    // replay idempotent - a target already at this type is simply not a change.
    const [currentColumn] = await tjdbQueryRunner.query(
      `SELECT data_type, column_default FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2 AND column_name = $3`,
      [tenantSchema, relation.id, columnName]
    );
    if (!currentColumn) throw new NotFoundException(`Column not found on relation: ${columnName}`);

    const targetType = normalizeRequestedType(column['data_type']);
    const typeChanged = currentColumn.data_type !== targetType;
    if (typeChanged) {
      assertStructuredTypeChangeAllowed(columnName, currentColumn.data_type, targetType, currentColumn.column_default);

      // Changing the type of a column under a foreign key means changing both sides of the
      // constraint in the right order. Name the constraint and let the user drive it from a SQL
      // migration rather than half-doing it here. Only the referencing side is checked - Postgres
      // raises its own error if this column is the target of someone else's key and the types stop
      // matching.
      const foreignKeys = await fetchForeignKeys(tjdbQueryRunner, tenantSchema, relation.id);
      const involvedIn = foreignKeys.find((fk) => fk.column_names.includes(columnName));
      if (involvedIn) {
        throw new BadRequestException(
          `Cannot change the type of "${columnName}": it is part of foreign key "${involvedIn.name}". ` +
            `Drop the foreign key, change both columns, then re-add it - from a SQL migration.`
        );
      }

      // ALTER COLUMN TYPE takes ACCESS EXCLUSIVE and rewrites the table. Fail fast on contention
      // rather than spending the pool's 60s statement_timeout queued behind an app query.
      await tjdbQueryRunner.query(`SET LOCAL lock_timeout = '3s'`);
    }

    if (newColumnName || typeChanged) {
      // Re-read: writeThroughColumnConfigurations may have just updated this same relation row's
      // configurations - the rename and the settings reset must build on that, never on a copy
      // taken before that write.
      const currentRelation = await appManager.findOne(InternalTableRelation, { where: { id: relation.id } });
      const columnNames = currentRelation.configurations.columns.column_names;
      const columnConfigurations = currentRelation.configurations.columns.configurations;

      if (newColumnName) {
        columnNames[newColumnName] = columnUuid;
        delete columnNames[columnName];
      }

      // Same rule applyEditTable:1013 already applies: a column's display settings describe its
      // old type (a timestamp's `timezone`), so a type change invalidates them. Only this relation
      // needs it - a sibling still holding the old type still has correct settings, and gets reset
      // here in turn when this migration is promoted onto it.
      if (typeChanged) columnConfigurations[columnUuid] = {};

      currentRelation.configurations = {
        columns: { column_names: columnNames, configurations: columnConfigurations },
      };
      await appManager.save(currentRelation);
    }

    if (foreignKeyIdToDelete) await tjdbQueryRunner.dropForeignKey(physicalName, foreignKeyIdToDelete);

    await tjdbQueryRunner.changeColumn(
      physicalName,
      columnName,
      new TableColumn({
        name: columnName,
        type: column['data_type'],
        ...(column['column_default'] && {
          default:
            column['data_type'] === 'character varying'
              ? this.addQuotesIfString(column['column_default'])
              : column['column_default'],
        }),
        isNullable: !column?.constraints_type.is_not_null || false,
        isUnique: column?.constraints_type.is_unique || false,
        isPrimary: column?.constraints_type.is_primary_key || false,
      })
    );

    if (columnName && newColumnName) {
      await tjdbQueryRunner.renameColumn(physicalName, columnName, newColumnName);
    }
  }

  protected async editColumn(organizationId: string, params) {
    const { column } = params;

    // Resolved here, before the transactions open: the catch block below wraps whatever it
    // catches into a TooljetDatabaseError assuming a QueryFailedError shape (it indexes
    // errorObj.driverError), so throwing NotFoundException from inside the try would itself
    // crash on the wrap instead of surfacing "Column not found".
    const payload = await this.normalizeEditColumn(organizationId, params);
    const { internalTable, relation } = payload;

    await this.migrationRecorderService.adjudicatePending(internalTable, relation);
    const migration = await this.migrationRecorderService.record(
      { action: 'edit_column', request: params },
      internalTable,
      relation
    );

    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();
    const queryRunner = this.manager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await queryRunner.connect();

    await tjdbQueryRunner.startTransaction();
    await queryRunner.startTransaction();

    try {
      await this.writeThroughColumnConfigurations(
        internalTable.id,
        payload.columnUuid,
        column?.configurations,
        queryRunner.manager
      );

      await this.applyEditColumn(payload, relation, {
        appManager: queryRunner.manager,
        tjdbManager: tjdbQueryRunner.manager,
      });

      await tjdbQueryRunner.commitTransaction();
      await queryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunner);
      await tjdbQueryRunner.release();
      await queryRunner.release();
    } catch (error) {
      await this.migrationRecorderService.discard(migration, relation);
      await tjdbQueryRunner.rollbackTransaction();
      await tjdbQueryRunner.release();
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      // Neither is a QueryFailedError - TooljetDatabaseError's constructor assumes one (it indexes
      // error.driverError) and would crash on the wrap instead of surfacing the real 400/404.
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      // Raw Postgres error text names the physical relation, not the logical table - key on
      // relation.id so the translation actually matches what the driver reported.
      throw new TooljetDatabaseError(
        error.message,
        { origin: 'edit_column', internalTables: [{ id: relation.id, tableName: internalTable.tableName }] },
        error
      );
    }
  }

  protected prepareColumnListForCreateTable(columns: TooljetDatabaseColumn[]) {
    const columnList = columns.map((column) => {
      const { column_name, constraints_type = {} as any } = column;
      const is_primary_key_column = constraints_type?.is_primary_key || false;

      const prepareDataTypeAndDefault = (column): { data_type: TooljetDatabaseDataTypes; column_default: unknown } => {
        const { data_type, column_default = undefined } = column;
        const isSerial = () => data_type === TJDB.integer && /^nextval\(/.test(column_default);
        const isCharacterVarying = () => data_type === TJDB.character_varying;
        const isTimestampWithTimeZone = () => data_type === TJDB.timestampz;
        const isJSONB = () => data_type === TJDB.jsonb;

        if (isSerial()) return { data_type: TJDB.serial, column_default: undefined };
        if (isCharacterVarying())
          return {
            data_type,
            column_default: this.addQuotesIfString(column_default),
          };
        if (isTimestampWithTimeZone())
          return {
            data_type,
            column_default: this.addQuotesIfMissing(column_default),
          };
        if (isJSONB()) {
          if (typeof column_default === 'object') {
            return {
              data_type,
              column_default: formatJSONB(column_default, { data_type }),
            };
          }
        }

        return { data_type, column_default };
      };

      const { data_type, column_default } = prepareDataTypeAndDefault(column);

      return {
        name: column_name,
        type: data_type,
        default: column_default,
        isNullable: constraints_type?.is_not_null ? false : true,
        isUnique: constraints_type?.is_unique && !is_primary_key_column ? true : false,
      };
    });
    return columnList;
  }

  // Method to check : Tables mentioned in Foreignkey is valid or not ( based on 'type' of input logic differs)
  protected async fetchAndCheckIfValidForeignKeyTables(
    referenced_table_list,
    organisation_id,
    type: 'TABLEID' | 'TABLENAME',
    manager: EntityManager = this.manager
  ) {
    const valid_referenced_table_details = await manager.find(InternalTable, {
      where: {
        organizationId: organisation_id,
        ...(type === 'TABLENAME' && { tableName: In(referenced_table_list) }),
        ...(type === 'TABLEID' && { id: In(referenced_table_list) }),
      },
      select: ['tableName', 'id'],
    });

    const referenced_tables_info: Record<string, string> = {};
    const validReferencedTableSet = new Set(
      valid_referenced_table_details.map((referenced_table_detail) => {
        if (type === 'TABLEID') {
          referenced_tables_info[referenced_table_detail.id] = referenced_table_detail.tableName;
          return referenced_table_detail.id;
        }
        referenced_tables_info[referenced_table_detail.tableName] = referenced_table_detail.id;
        return referenced_table_detail.tableName;
      })
    );

    const invalid_tables = [];
    const is_all_tables_exist = referenced_table_list.every((referenced_table) => {
      if (validReferencedTableSet.has(referenced_table)) return true;
      invalid_tables.push(referenced_table);
      return false;
    });

    if (!is_all_tables_exist) {
      const errorMessage =
        type === 'TABLEID'
          ? 'Some tables used in Foreign key was not found'
          : `Tables: ${invalid_tables.join(',')} - used for Foreign key reference was not found`;
      throw new BadRequestException(errorMessage);
    }

    // TABLENAME: referenced_tables_info maps display name -> logical id at this point, but every
    // consumer (the referencedColumnInfoForError translation) treats the value as a physical table
    // name. Resolve logical ids to this (environment, branch)'s relation ids before returning, in
    // one batch call rather than per foreign key.
    if (type === 'TABLENAME') {
      const logicalIds = Object.values(referenced_tables_info);
      const relationIdsByLogicalId = await this.relationResolverService.resolve(
        organisation_id,
        logicalIds,
        undefined,
        manager
      );
      for (const tableName of Object.keys(referenced_tables_info)) {
        const logicalId = referenced_tables_info[tableName];
        const relationId = relationIdsByLogicalId.get(logicalId);
        // Tenancy validation above already proved this table belongs to the caller; a missing
        // relation here means it has no relation in this (environment, branch) - fail closed rather
        // than let a logical id leak through as a physical name.
        // DEV-89: an (env, branch) with no relation is a 404, not a 400 - same rule as the join path.
        if (!relationId) throw new NotFoundException(`Table "${tableName}" has no relation in this environment`);
        referenced_tables_info[tableName] = relationId;
      }
    }

    return referenced_tables_info;
  }

  /**
   * Converts the foreign keys embedded in a create_table/add_column payload from
   * referenced_table_name (a display name) to referenced_table (that table's co_relation_id).
   * Same lookup+shape as normalizeCreateForeignKey/normalizeUpdateForeignKey use for the same
   * purpose - delegates to resolveForeignKeyReferenceIds so a name that doesn't resolve throws
   * instead of silently producing an FkSpec with referenced_table: undefined.
   */
  protected async resolveForeignKeyCoRelationIds(
    foreignKeys: TooljetDatabaseForeignKey[],
    organizationId: string,
    manager: EntityManager
  ): Promise<FkSpec[]> {
    if (!foreignKeys?.length) return [];

    const referencedTableNames = foreignKeys.map((foreignKey) => foreignKey.referenced_table_name);
    const coRelationIdByTableName = await this.resolveForeignKeyReferenceIds(
      referencedTableNames,
      organizationId,
      manager
    );

    return foreignKeys.map((foreignKey) => this.toFkSpec(foreignKey, coRelationIdByTableName));
  }

  /**
   * apply()'s counterpart to resolveForeignKeyCoRelationIds: resolves each FkSpec's co_relation_id
   * back to a relation in the same (environment, branch) as the relation apply was handed - a
   * sibling lookup, never the licence-aware "current environment" resolution - and shapes the result
   * for TypeORM's Table/TableForeignKey DDL. create_foreign_key/update_foreign_key/delete_foreign_key
   * need the same sibling-lookup shape; reuse relationResolverService.resolveSiblingByCoRelationId
   * directly rather than re-deriving it.
   */
  protected async resolveForeignKeyDetailsForApply(
    foreignKeys: FkSpec[],
    organizationId: string,
    relation: InternalTableRelation,
    tenantSchema: string,
    manager: EntityManager
  ) {
    if (!foreignKeys.length) return [];

    const relationIdByCoRelationId = new Map<string, string>();
    for (const foreignKey of foreignKeys) {
      if (relationIdByCoRelationId.has(foreignKey.referenced_table)) continue;
      const referencedRelation = await this.relationResolverService.resolveSiblingByCoRelationId(
        organizationId,
        foreignKey.referenced_table,
        relation.environmentId,
        relation.branchId,
        manager
      );
      relationIdByCoRelationId.set(foreignKey.referenced_table, referencedRelation.id);
    }

    return foreignKeys.map((foreignKey) => ({
      columnNames: foreignKey.column_names,
      referencedTableName: relationIdByCoRelationId.get(foreignKey.referenced_table),
      referencedColumnNames: foreignKey.referenced_column_names,
      referencedSchema: tenantSchema,
      ...(foreignKey.on_delete && { onDelete: foreignKey.on_delete }),
      ...(foreignKey.on_update && { onUpdate: foreignKey.on_update }),
    }));
  }

  protected async createForeignKey(
    organizationId: string,
    params,
    connectionManagers: Record<string, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ) {
    const normalized = await this.normalizeCreateForeignKey(organizationId, params, connectionManagers);
    await this.migrationRecorderService.adjudicatePending(normalized.internalTable, normalized.relation);
    const migration = await this.migrationRecorderService.record(
      { action: 'create_foreign_key', request: params },
      normalized.internalTable,
      normalized.relation
    );
    return this.applyCreateForeignKey(organizationId, normalized, connectionManagers, migration);
  }

  /**
   * Pure-ish: validates the request and turns every `referenced_table_name` into an FkSpec keyed
   * by co_relation_id. Does no DDL and opens no connection of its own beyond the reads it needs.
   */
  protected async normalizeCreateForeignKey(
    organizationId: string,
    params,
    connectionManagers: Record<string, EntityManager>
  ): Promise<{
    internalTable: InternalTable;
    relation: InternalTableRelation;
    physicalName: string;
    shouldDestroyDbConnection: boolean;
    foreign_keys: FkSpec[];
  }> {
    const { table_name, foreign_keys, shouldDestroyDbConnection = true } = params;
    const { appManager } = connectionManagers;
    if (!foreign_keys?.length) throw new BadRequestException('Foreign key details are missing');

    const { internalTable, relation, physicalName } = await this.resolveTable(
      organizationId,
      table_name,
      undefined,
      appManager
    );

    const referencedTableNames = foreign_keys.map((foreign_key) => foreign_key.referenced_table_name);
    const coRelationIdByTableName = await this.resolveForeignKeyReferenceIds(
      referencedTableNames,
      organizationId,
      appManager
    );

    const isFKfromCompositePK = await this.checkIfForeignKeyReferencedColumnsAreFromCompositePrimaryKey(
      foreign_keys,
      organizationId,
      connectionManagers
    );

    if (isFKfromCompositePK)
      throw new ConflictException(
        'Foreign key cannot be created as the referenced column is in the composite primary key.'
      );

    return {
      internalTable,
      relation,
      physicalName,
      shouldDestroyDbConnection,
      foreign_keys: foreign_keys.map((foreignKey) => this.toFkSpec(foreignKey, coRelationIdByTableName)),
    };
  }

  /**
   * Resolves every FkSpec's referenced_table back to a physical relation and runs the DDL. The
   * only thing in the create path that touches Postgres.
   */
  protected async applyCreateForeignKey(
    organizationId: string,
    normalized: {
      internalTable: InternalTable;
      relation: InternalTableRelation;
      physicalName: string;
      shouldDestroyDbConnection: boolean;
      foreign_keys: FkSpec[];
    },
    connectionManagers: Record<string, EntityManager>,
    migration: InternalTableMigration
  ) {
    const { internalTable, relation, physicalName, shouldDestroyDbConnection, foreign_keys } = normalized;
    const { appManager, tjdbManager } = connectionManagers;
    const tenantSchema = findTenantSchema(organizationId);

    const referencedRelations = await this.resolveFkReferencedRelations(
      organizationId,
      foreign_keys,
      relation,
      appManager
    );

    const tjdbQueryRunner = tjdbManager?.queryRunner || tjdbManager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();

    try {
      const foreignKeys = foreign_keys.map(
        (fk) =>
          new TableForeignKey({
            columnNames: fk.column_names,
            referencedTableName: referencedRelations.get(fk.referenced_table).relationId,
            referencedColumnNames: fk.referenced_column_names,
            referencedSchema: tenantSchema,
            ...(fk.on_delete && { onDelete: fk.on_delete }),
            ...(fk.on_update && { onUpdate: fk.on_update }),
          })
      );
      await tjdbQueryRunner.createForeignKeys(physicalName, foreignKeys);
      await tjdbQueryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunner);
      //@ts-expect-error queryRunner has property transactionDepth which is not defined in type EntityManager
      if (!tjdbQueryRunner?.transactionDepth || tjdbQueryRunner.transactionDepth < 1) await tjdbQueryRunner.release();

      return {
        statusCode: 200,
        message: 'Foreign key relation created successfully!',
      };
    } catch (err) {
      await this.migrationRecorderService.discard(migration, relation);
      // Error code: 42710 - indicates FK constraint exists
      if (!shouldDestroyDbConnection && err.code === '42710') {
        await tjdbQueryRunner.rollbackTransaction();
      }

      if (shouldDestroyDbConnection) {
        await tjdbQueryRunner.rollbackTransaction();
        await tjdbQueryRunner.release();

        const referencedColumnInfoForError = [...referencedRelations.values()].map(({ relationId, tableName }) => ({
          id: relationId,
          tableName,
        }));

        throw new TooljetDatabaseError(
          err.message,
          {
            origin: 'create_foreign_key',
            // Raw Postgres error text names the physical relation, not the logical table - key on
            // relation.id so the translation actually matches what the driver reported.
            internalTables: [{ id: relation.id, tableName: internalTable.tableName }, ...referencedColumnInfoForError],
          },
          err
        );
      }
    }
  }

  protected async updateForeignKey(organizationId: string, params) {
    const normalized = await this.normalizeUpdateForeignKey(organizationId, params);
    await this.migrationRecorderService.adjudicatePending(normalized.internalTable, normalized.relation);
    const migration = await this.migrationRecorderService.record(
      { action: 'update_foreign_key', request: params },
      normalized.internalTable,
      normalized.relation
    );
    return this.applyUpdateForeignKey(organizationId, normalized, migration);
  }

  /**
   * Resolves table_name to the relation being edited, the constraint named by `foreign_key_id` to
   * an FkSpec (the "target" to drop), and every new `referenced_table_name` to an FkSpec. No DDL.
   */
  protected async normalizeUpdateForeignKey(
    organizationId: string,
    params
  ): Promise<{
    internalTable: InternalTable;
    relation: InternalTableRelation;
    physicalName: string;
    tenantSchema: string;
    target: FkSpec;
    foreign_keys: FkSpec[];
  }> {
    const { table_name, foreign_key_id, foreign_keys } = params;
    if (!foreign_key_id) throw new BadRequestException('Foreign key id is mandatory');
    if (!foreign_keys?.length) throw new BadRequestException('Foreign key details are missing');

    const { internalTable, relation, physicalName } = await this.resolveTable(organizationId, table_name, undefined);
    const tenantSchema = findTenantSchema(organizationId);

    const target = await this.foreignKeyToFkSpec(organizationId, tenantSchema, relation.id, foreign_key_id);

    const referencedTableNames = foreign_keys.map((foreign_key) => foreign_key.referenced_table_name);
    const coRelationIdByTableName = await this.resolveForeignKeyReferenceIds(
      referencedTableNames,
      organizationId,
      this.manager
    );

    const isFKfromCompositePK = await this.checkIfForeignKeyReferencedColumnsAreFromCompositePrimaryKey(
      foreign_keys,
      organizationId
    );

    if (isFKfromCompositePK)
      throw new ConflictException(
        'Foreign key cannot be created as the referenced column is in the composite primary key.'
      );

    return {
      internalTable,
      relation,
      physicalName,
      tenantSchema,
      target,
      foreign_keys: foreign_keys.map((foreignKey) => this.toFkSpec(foreignKey, coRelationIdByTableName)),
    };
  }

  /**
   * Re-resolves the target FkSpec to whichever constraint currently matches it on this relation
   * (not the name recorded at normalize time - that name may belong to a different relation
   * entirely once replay lands), drops it, and creates the replacement.
   */
  protected async applyUpdateForeignKey(
    organizationId: string,
    normalized: {
      internalTable: InternalTable;
      relation: InternalTableRelation;
      physicalName: string;
      tenantSchema: string;
      target: FkSpec;
      foreign_keys: FkSpec[];
    },
    migration: InternalTableMigration
  ) {
    const { internalTable, relation, physicalName, tenantSchema, target, foreign_keys } = normalized;

    const referencedRelations = await this.resolveFkReferencedRelations(
      organizationId,
      foreign_keys,
      relation,
      this.manager
    );
    const constraintName = await this.resolveFkConstraintName(
      organizationId,
      tenantSchema,
      relation,
      target,
      this.manager
    );

    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();

    try {
      await tjdbQueryRunner.dropForeignKey(physicalName, constraintName);

      const foreignKeys = foreign_keys.map(
        (fk) =>
          new TableForeignKey({
            columnNames: fk.column_names,
            referencedTableName: referencedRelations.get(fk.referenced_table).relationId,
            referencedColumnNames: fk.referenced_column_names,
            referencedSchema: tenantSchema,
            ...(fk.on_delete && { onDelete: fk.on_delete }),
            ...(fk.on_update && { onUpdate: fk.on_update }),
          })
      );
      await tjdbQueryRunner.createForeignKeys(physicalName, foreignKeys);

      await tjdbQueryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunner);
      await tjdbQueryRunner.release();
      return {
        statusCode: 200,
        message: 'Foreign key relation created successfully!',
      };
    } catch (err) {
      await this.migrationRecorderService.discard(migration, relation);
      await tjdbQueryRunner.rollbackTransaction();
      await tjdbQueryRunner.release();
      const referencedColumnInfoForError = [...referencedRelations.values()].map(({ relationId, tableName }) => ({
        id: relationId,
        tableName,
      }));

      throw new TooljetDatabaseError(
        err.message,
        {
          origin: 'update_foreign_key',
          // Raw Postgres error text names the physical relation, not the logical table - key on
          // relation.id so the translation actually matches what the driver reported.
          internalTables: [{ id: relation.id, tableName: internalTable.tableName }, ...referencedColumnInfoForError],
        },
        err
      );
    }
  }

  protected async deleteForeignKey(organizationId: string, params) {
    const normalized = await this.normalizeDeleteForeignKey(organizationId, params);
    await this.migrationRecorderService.adjudicatePending(normalized.internalTable, normalized.relation);
    const migration = await this.migrationRecorderService.record(
      { action: 'delete_foreign_key', request: params },
      normalized.internalTable,
      normalized.relation
    );
    return this.applyDeleteForeignKey(organizationId, normalized, migration);
  }

  /**
   * Resolves table_name and turns the constraint named by `foreign_key_id` into an FkSpec. No DDL.
   */
  protected async normalizeDeleteForeignKey(
    organizationId: string,
    params
  ): Promise<{
    internalTable: InternalTable;
    relation: InternalTableRelation;
    physicalName: string;
    tenantSchema: string;
    target: FkSpec;
  }> {
    const { table_name, foreign_key_id } = params;
    const { internalTable, relation, physicalName } = await this.resolveTable(organizationId, table_name, undefined);
    const tenantSchema = findTenantSchema(organizationId);
    const target = await this.foreignKeyToFkSpec(organizationId, tenantSchema, relation.id, foreign_key_id);

    return { internalTable, relation, physicalName, tenantSchema, target };
  }

  /**
   * No transaction: a single DROP CONSTRAINT is already atomic, and this handler never had one to
   * begin with - later recording work uses its own separate transaction, not this one.
   */
  protected async applyDeleteForeignKey(
    organizationId: string,
    normalized: {
      internalTable: InternalTable;
      relation: InternalTableRelation;
      physicalName: string;
      tenantSchema: string;
      target: FkSpec;
    },
    migration: InternalTableMigration
  ) {
    const { internalTable, relation, physicalName, tenantSchema, target } = normalized;
    const constraintName = await this.resolveFkConstraintName(
      organizationId,
      tenantSchema,
      relation,
      target,
      this.manager
    );

    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();

    try {
      await tjdbQueryRunner.connect();
      await tjdbQueryRunner.dropForeignKey(physicalName, constraintName);
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await this.migrationRecorderService.confirm(migration, relation, tjdbQueryRunner);
      return {
        statusCode: 200,
        message: 'Foreign key relation deleted successfully!',
      };
    } catch (error) {
      await this.migrationRecorderService.discard(migration, relation);
      throw new TooljetDatabaseError(
        error.message,
        {
          origin: 'delete_foreign_key',
          // Raw Postgres error text names the physical relation, not the logical table - key on
          // relation.id so the translation actually matches what the driver reported.
          internalTables: [{ id: relation.id, tableName: internalTable.tableName }],
        },
        error
      );
    }
  }

  protected toFkSpec(foreignKey: TooljetDatabaseForeignKey, coRelationIdByTableName: Record<string, string>): FkSpec {
    const { column_names, referenced_table_name, referenced_column_names, on_delete, on_update } = foreignKey;
    return {
      column_names,
      referenced_table: coRelationIdByTableName[referenced_table_name],
      referenced_column_names,
      ...(on_delete && { on_delete }),
      ...(on_update && { on_update }),
    };
  }

  /**
   * Display name -> co_relation_id, for every table a new foreign key names as `referenced_table_name`.
   * Existence-only: whether the referenced table has a relation in any particular environment is a
   * question for the relation this FkSpec eventually gets applied against, not this lookup.
   */
  protected async resolveForeignKeyReferenceIds(
    referencedTableNames: string[],
    organizationId: string,
    manager: EntityManager
  ): Promise<Record<string, string>> {
    if (!referencedTableNames.length) return {};
    const tables = await manager.find(InternalTable, {
      where: { organizationId, tableName: In(referencedTableNames) },
      select: ['tableName', 'co_relation_id'],
    });

    const coRelationIdByTableName: Record<string, string> = {};
    for (const table of tables) coRelationIdByTableName[table.tableName] = table.co_relation_id;

    const missing = referencedTableNames.filter((name) => !coRelationIdByTableName[name]);
    if (missing.length) {
      throw new BadRequestException(`Tables: ${missing.join(',')} - used for Foreign key reference was not found`);
    }

    return coRelationIdByTableName;
  }

  /**
   * Resolves each FkSpec's referenced_table (a co_relation_id) to the relation representing it in
   * the same (environment_id, branch_id) as `relation` - the same per-id sibling lookup
   * resolveForeignKeyDetailsForApply uses, batched over the distinct co_relation_ids in
   * `foreignKeys`. A referenced table with no relation there would let a foreign key point outside
   * the relation's own environment, so resolveSiblingByCoRelationId fails closed rather than
   * letting this skip it.
   */
  protected async resolveFkReferencedRelations(
    organizationId: string,
    foreignKeys: FkSpec[],
    relation: InternalTableRelation,
    manager: EntityManager
  ): Promise<Map<string, { relationId: string; tableName: string }>> {
    const resolved = new Map<string, { relationId: string; tableName: string }>();
    if (!foreignKeys.length) return resolved;

    const coRelationIds = [...new Set(foreignKeys.map((fk) => fk.referenced_table))];
    for (const coRelationId of coRelationIds) {
      const siblingRelation = await this.relationResolverService.resolveSiblingByCoRelationId(
        organizationId,
        coRelationId,
        relation.environmentId,
        relation.branchId,
        manager
      );
      resolved.set(coRelationId, {
        relationId: siblingRelation.id,
        tableName: siblingRelation.internalTable.tableName,
      });
    }
    return resolved;
  }

  /**
   * Forward direction: the constraint named `foreignKeyId` on the relation `relationId`, described
   * structurally. Only used to identify which foreign key a request means - never carries
   * on_delete/on_update, since dropping a constraint doesn't need its old policy.
   */
  protected async foreignKeyToFkSpec(
    organizationId: string,
    tenantSchema: string,
    relationId: string,
    foreignKeyId: string
  ): Promise<FkSpec> {
    const foreignKeys = await fetchForeignKeys(this.tooljetDbManager, tenantSchema, relationId);
    const match = foreignKeys.find((fk) => fk.name === foreignKeyId);
    if (!match) throw new NotFoundException(`Foreign key "${foreignKeyId}" not found on table "${relationId}"`);

    const logicalIdByRelationId = await this.relationResolverService.resolveLogicalIds(
      organizationId,
      [match.referenced_table],
      this.manager
    );
    const referencedLogicalId = logicalIdByRelationId.get(match.referenced_table);
    const referencedInternalTable =
      referencedLogicalId &&
      (await this.manager.findOne(InternalTable, {
        where: { organizationId, id: referencedLogicalId },
      }));
    if (!referencedInternalTable) {
      throw new InternalServerErrorException(
        `Foreign key "${foreignKeyId}" references relation "${match.referenced_table}", which does not resolve to a known internal table`
      );
    }

    return {
      column_names: match.column_names,
      referenced_table: referencedInternalTable.co_relation_id,
      referenced_column_names: match.referenced_column_names,
    };
  }

  /**
   * Reverse direction: which constraint on the relation `relation` currently matches `target`
   * structurally (same columns, same referenced relation, same referenced columns). This is
   * looked up fresh every time rather than reusing the name recorded when `target` was built -
   * that name may not even exist on this relation once replay applies the same FkSpec against a
   * different one. No match means the request names a foreign key this relation doesn't have;
   * that must fail rather than silently do nothing.
   */
  protected async resolveFkConstraintName(
    organizationId: string,
    tenantSchema: string,
    relation: InternalTableRelation,
    target: FkSpec,
    manager: EntityManager
  ): Promise<string> {
    const referencedRelations = await this.resolveFkReferencedRelations(organizationId, [target], relation, manager);
    const referencedRelationId = referencedRelations.get(target.referenced_table).relationId;

    const foreignKeys = await fetchForeignKeys(this.tooljetDbManager, tenantSchema, relation.id);
    const match = foreignKeys.find(
      (fk) =>
        fk.referenced_table === referencedRelationId &&
        sameOrderedColumnList(fk.column_names, target.column_names) &&
        sameOrderedColumnList(fk.referenced_column_names, target.referenced_column_names)
    );

    if (!match) {
      throw new NotFoundException(`No matching foreign key found on table "${relation.id}"`);
    }
    return match.name;
  }

  protected async checkIfForeignKeyReferencedColumnsAreFromCompositePrimaryKey(
    foreignKeys,
    organizationId,
    connectionManagers: Record<string, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ) {
    if (!foreignKeys.length) return;
    let isFKfromCompositePK = false;
    for (const foreignKeyDetails of foreignKeys) {
      const { referenced_table_name = '', referenced_column_names = [] } = foreignKeyDetails;
      // DDL path (foreign key create/edit validation) - always development, no environment key needed here.
      const referencedTableMetaData = await this.viewTable(
        organizationId,
        { table_name: referenced_table_name },
        connectionManagers
      );
      const { columns = [] } = referencedTableMetaData;
      const pkColumnList = [];

      if (columns.length) {
        columns.forEach((column: any) => {
          const { constraints_type = {} } = column;
          if (constraints_type?.is_primary_key) pkColumnList.push(column.column_name);
        });
      }

      if (
        pkColumnList.length > 1 &&
        referenced_column_names.some((referencedColumnName) => pkColumnList.includes(referencedColumnName))
      ) {
        isFKfromCompositePK = true;
      }
    }
    return isFKfromCompositePK;
  }

  // --- Replay: reapplies a table's own migration chain against a different (empty) relation for
  // the same logical table, e.g. the target of a promote. No controller route, no licence check,
  // no environment resolution beyond the sibling lookup apply() already does. ---

  /**
   * Replays `migrationIds` against `targetRelation` in (sequence, id) order, reproducing the
   * source's shape - including column identity - without minting anything new: every uuid a
   * migration minted the first time it ran is already sitting in that migration's own
   * `resulting_schema` (confirm() writes it there), so this reads it instead of calling uuidv4()
   * again. Reading identity from each migration's own snapshot rather than "whatever the source
   * relation currently looks like" also means a later rename on the source can't corrupt replay of
   * an earlier migration in the same chain.
   *
   * Ticks the real chain, not a synthetic stand-in: one pending application per member of
   * `migrationIds` is recorded against `targetRelation` before the DDL runs and flipped to
   * confirmed once it commits - no new `internal_table_migrations` row is minted for the replay,
   * and none of the source migrations' `resulting_schema` (authoring-time truth) is touched.
   *
   * Atomicity is per migration, not per batch: each migration gets its own app-DB + TJDB
   * transaction, committed and confirmed before the next one replays. This is deliberate, not a
   * shortcut - replayRawSqlMigration always opens its own tenant connection (raw SQL must never run
   * as admin, replay included), so a structured migration's DDL sitting uncommitted in a shared
   * batch transaction would be invisible to a raw_sql migration replayed right after it in the same
   * batch. A failure partway through discards only the pending rows this call never reached
   * (`discardApplications`, never the ones already confirmed) and rethrows, leaving the batch
   * resumable from exactly that migration on the next promote - never skipped, since an applied set
   * with a gap would let a later migration's missing-set computation apply it onto a target still
   * missing its prerequisite.
   */
  async applyMigrations(
    migrationIds: string[],
    targetRelation: InternalTableRelation,
    connectionManagers: Record<ConnectionManagerKey, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ): Promise<void> {
    if (!migrationIds.length) return;
    const { appManager, tjdbManager } = connectionManagers;

    const targetInternalTable = await appManager.findOne(InternalTable, {
      where: { id: targetRelation.internalTableId },
      withDeleted: true,
    });
    if (!targetInternalTable) throw new NotFoundException('Internal table not found for replay target');
    const organizationId = targetInternalTable.organizationId;

    const migrations = await this.loadMigrationsInOrder(migrationIds, appManager);

    // Thread `appManager` through every recorder call: when a data migration drives applyMigrations
    // (rollout migration B's foreign-key pass), the recorder's own injected manager is a different
    // pool that cannot see the migration transaction's uncommitted internal_table* rows.
    await this.migrationRecorderService.adjudicatePending(targetInternalTable, targetRelation, appManager);
    await this.migrationRecorderService.recordApplications(migrationIds, targetRelation, appManager);

    const queryRunner = appManager?.queryRunner || appManager.connection.createQueryRunner();
    const tjdbQueryRunner = tjdbManager?.queryRunner || tjdbManager.connection.createQueryRunner();
    await queryRunner.connect();
    await tjdbQueryRunner.connect();

    // Per-migration commit, not one transaction around the whole batch: replayRawSqlMigration runs
    // on its own tenant connection (raw SQL must never run as admin, replay included), so an
    // uncommitted structured change earlier in this same batch is invisible to it. Committing after
    // each migration - and confirming it immediately - makes every later migration in the batch see
    // everything before it, and turns a mid-batch failure into a resume point instead of a wipe:
    // discardApplications only touches the pending rows this call never got to.
    const remainingIds = new Set(migrationIds);
    let priorSchema: TableSchemaSnapshot | null = null;
    let appliedAny = false;

    try {
      const sharedConnectionManagers = { appManager: queryRunner.manager, tjdbManager: tjdbQueryRunner.manager };
      for (const sourceMigration of migrations) {
        await queryRunner.startTransaction();
        await tjdbQueryRunner.startTransaction();
        try {
          if (sourceMigration.kind === 'baseline') {
            await this.replayBaselineMigration(
              sourceMigration,
              organizationId,
              targetRelation,
              sharedConnectionManagers
            );
          } else if (sourceMigration.kind === 'raw_sql') {
            await this.replayRawSqlMigration(sourceMigration, organizationId, targetRelation, sharedConnectionManagers);
          } else {
            await this.replayStructuredMigration(
              sourceMigration,
              priorSchema,
              organizationId,
              targetRelation,
              sharedConnectionManagers
            );
          }
          await queryRunner.commitTransaction();
          await tjdbQueryRunner.commitTransaction();
        } catch (err) {
          await queryRunner.rollbackTransaction();
          await tjdbQueryRunner.rollbackTransaction();
          throw err;
        }

        appliedAny = true;
        remainingIds.delete(sourceMigration.id);
        await this.migrationRecorderService.confirmApplications([sourceMigration.id], targetRelation, appManager);
        priorSchema = sourceMigration.resultingSchema;
      }

      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
    } catch (err) {
      // Never skip: only the pending ids this call never reached are discarded, not the ones
      // already confirmed above - an applied set with a gap would make a later promote's missing-set
      // computation apply a downstream migration onto a target that never got its prerequisite.
      await this.migrationRecorderService.discardApplications(Array.from(remainingIds), targetRelation, appManager);
      // The schema did change for whatever committed before the failure - a partial-failure caller
      // still needs PostgREST to see it.
      if (appliedAny) await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");

      // TooljetDatabaseError's constructor assumes a QueryFailedError shape (it indexes
      // err.driverError) and throws a TypeError on anything else - a fail-closed NotFoundException
      // from a sibling resolver, e.g., would otherwise crash the wrap instead of surfacing itself.
      if (!(err instanceof QueryFailedError)) throw err;
      throw new TooljetDatabaseError(
        err.message,
        {
          origin: 'apply_migrations',
          internalTables: [{ id: targetRelation.id, tableName: targetInternalTable.tableName }],
        },
        err
      );
    } finally {
      //@ts-expect-error queryRunner has property transactionDepth which is not defined in type EntityManager
      if (!queryRunner?.transactionDepth || queryRunner.transactionDepth < 1) await queryRunner.release();
      //@ts-expect-error queryRunner has property transactionDepth which is not defined in type EntityManager
      if (!tjdbQueryRunner?.transactionDepth || tjdbQueryRunner.transactionDepth < 1) await tjdbQueryRunner.release();
    }
  }

  /**
   * Every uuid replay relies on - a column's identity, an FK's referenced table - comes from
   * reading a migration's own `resulting_schema`, never minting fresh. A migration whose authoring
   * was never confirmed (`resulting_schema IS NULL`: still pending, or a crash that hasn't been
   * adjudicated) has nothing there to read, so every one of those lookups would silently resolve
   * to `undefined` and get written into the target relation's identity map with no error. Fail
   * before any DDL runs rather than let that happen.
   */
  private async loadMigrationsInOrder(
    migrationIds: string[],
    appManager: EntityManager
  ): Promise<InternalTableMigration[]> {
    const migrations = await appManager.find(InternalTableMigration, { where: { id: In(migrationIds) } });
    const unconfirmed = migrations.find((migration) => migration.resultingSchema === null);
    if (unconfirmed) {
      throw new BadRequestException(`Migration ${unconfirmed.id} has not been confirmed, cannot be replayed`);
    }
    return migrations.sort((a, b) => Number(a.sequence) - Number(b.sequence) || a.id.localeCompare(b.id));
  }

  /** Substitutes `refs`/`{{self}}` into the stored DDL and runs it, then copies the payload's
   * column-uuid map onto the target relation - a baseline never mints, it only carries forward
   * identity the source table already had. */
  private async replayBaselineMigration(
    sourceMigration: InternalTableMigration,
    organizationId: string,
    targetRelation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ): Promise<void> {
    const { appManager, tjdbManager } = connectionManagers;
    const payload = sourceMigration.payload as {
      ddl: string;
      refs: Record<string, string>;
      column_uuids?: Record<string, string>;
    };
    const tjdbQueryRunner = tjdbManager.queryRunner;

    const resolvedIdByPlaceholder = await this.resolveRefPlaceholders(
      payload.refs,
      organizationId,
      targetRelation,
      appManager
    );
    const ddl = this.resolvePlaceholders(payload.ddl, resolvedIdByPlaceholder, sourceMigration.id);
    await tjdbQueryRunner.query(ddl);

    if (!isSQLModeDisabled()) {
      await transferTableOwnershipToTenant(
        tjdbQueryRunner,
        findTenantSchema(organizationId),
        targetRelation.id,
        `user_${organizationId}`
      );
    }

    if (payload.column_uuids && Object.keys(payload.column_uuids).length) {
      const columnNames = { ...(targetRelation.configurations?.columns?.column_names || {}), ...payload.column_uuids };
      const columnConfigurations = { ...(targetRelation.configurations?.columns?.configurations || {}) };
      for (const uuid of Object.values(payload.column_uuids)) columnConfigurations[uuid] ??= {};
      targetRelation.configurations = { columns: { column_names: columnNames, configurations: columnConfigurations } };
      await appManager.save(targetRelation);
    }
  }

  /** Resolves `refs`/`{{self}}` to concrete relation ids against `targetRelation`'s own
   * environment/branch - shared by every replay path that substitutes placeholders
   * (`replayBaselineMigration`, `replayRawSqlMigration`), so a sibling lookup can't drift between them.
   * `self` is seeded last, after the `refs` loop: `self` always means this table's own relation, even
   * if the caller's `refs` map also has a `self` key (same rule B1's authoring-time
   * `substitutePlaceholders` enforces - a `refs.self` entry must not be able to override it). */
  private async resolveRefPlaceholders(
    refs: Record<string, string> | undefined,
    organizationId: string,
    targetRelation: InternalTableRelation,
    appManager: EntityManager
  ): Promise<Map<string, string>> {
    const resolvedIdByPlaceholder = new Map<string, string>();
    for (const [placeholder, coRelationId] of Object.entries(refs || {})) {
      const sibling = await this.relationResolverService.resolveSiblingByCoRelationId(
        organizationId,
        coRelationId,
        targetRelation.environmentId,
        targetRelation.branchId,
        appManager
      );
      resolvedIdByPlaceholder.set(placeholder, sibling.id);
    }
    resolvedIdByPlaceholder.set('self', targetRelation.id);
    return resolvedIdByPlaceholder;
  }

  private resolvePlaceholders(
    ddlOrSql: string,
    resolvedIdByPlaceholder: Map<string, string>,
    migrationId: string
  ): string {
    return ddlOrSql.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
      const resolved = resolvedIdByPlaceholder.get(key);
      if (!resolved) throw new Error(`Unresolved placeholder "{{${key}}}" in migration ${migrationId}`);
      return resolved;
    });
  }

  /**
   * Executes a raw SQL migration's stored statement against `targetRelation` as the workspace's own
   * tenant role, on its own connection - never `tjdbQueryRunner`, the admin connection every other
   * replay path uses. This is the one place replay must not reuse the ambient admin connection every
   * other `apply*`/`replay*` method gets handed, since raw SQL's whole reason for existing is to
   * never run as admin, including on replay. Column reconciliation calls the exact same
   * `reconcileColumns` Task B1's live-authoring path uses (`tooljet-db-raw-sql-migration.service.ts`),
   * so replay can't drift from what authoring already recorded.
   */
  private async replayRawSqlMigration(
    sourceMigration: InternalTableMigration,
    organizationId: string,
    targetRelation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ): Promise<void> {
    const { appManager } = connectionManagers;
    const payload = sourceMigration.payload as { sql: string; refs: Record<string, string> };

    const resolvedIdByPlaceholder = await this.resolveRefPlaceholders(
      payload.refs,
      organizationId,
      targetRelation,
      appManager
    );
    const sql = this.resolvePlaceholders(payload.sql, resolvedIdByPlaceholder, sourceMigration.id);

    const tjdbTenantConfigs = await appManager.findOne(OrganizationTjdbConfigurations, { where: { organizationId } });
    if (!tjdbTenantConfigs) throw new NotFoundException(`Tooljet database schema configuration doesn't exist`);
    const { pgPassword, pgUser } = tjdbTenantConfigs;
    const tjdbPassKey = await decryptTooljetDatabasePassword(pgPassword);
    const tenantSchema = findTenantSchema(organizationId);
    const { tooljetDbTenantConnection } = await createTooljetDatabaseConnection(tjdbPassKey, pgUser, tenantSchema);

    // Same pattern as the authoring path in tooljet-db-raw-sql-migration.service.ts, and for the same
    // reason: `SET LOCAL` only holds for the life of an explicit transaction, so search_path,
    // lock_timeout and the migration SQL all have to run on one QueryRunner's connection inside one
    // transaction - calling `.query()` on the DataSource instead hands each statement a different
    // pooled connection, silently dropping both settings.
    const tjdbQueryRunner = tooljetDbTenantConnection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();

    try {
      await tjdbQueryRunner.query(`SET search_path TO "${tenantSchema}"`);
      await tjdbQueryRunner.query(`SET LOCAL lock_timeout = '3s'`);
      await tjdbQueryRunner.query(sql);

      const priorColumnNames = targetRelation.configurations?.columns?.column_names || {};
      const snapshot = await buildTableSchemaSnapshot(
        tjdbQueryRunner,
        tenantSchema,
        targetRelation.id,
        priorColumnNames
      );
      const reconciled = reconcileColumns(snapshot, targetRelation.configurations);
      targetRelation.configurations = { columns: reconciled };
      await appManager.save(targetRelation);

      await tjdbQueryRunner.commitTransaction();
    } catch (err) {
      await tjdbQueryRunner.rollbackTransaction();
      throw err;
    } finally {
      await tjdbQueryRunner.release();
      await tooljetDbTenantConnection.destroy();
    }
  }

  /**
   * Reassembles the shape `apply*` expects from a structured migration's stored `{action,
   * request}`, then calls the exact same `apply*` method perform() calls - never a copy of it.
   * `priorSchema`/the migration's own `resultingSchema` (both real TableSchemaSnapshots, built by
   * confirm() the first time this migration ran) stand in for normalize()'s uuid minting: a column
   * this migration inserted is looked up by name in its own resultingSchema, one it edited or
   * deleted is looked up by its old name in the prior migration's resultingSchema. Nothing here
   * calls uuidv4().
   */
  private async replayStructuredMigration(
    sourceMigration: InternalTableMigration,
    priorSchema: TableSchemaSnapshot | null,
    organizationId: string,
    targetRelation: InternalTableRelation,
    connectionManagers: Record<string, EntityManager>
  ): Promise<void> {
    const { appManager } = connectionManagers;
    const { action, request } = sourceMigration.payload as StructuredMigrationPayload;
    const postSchema = sourceMigration.resultingSchema as TableSchemaSnapshot | null;
    const uuidBefore = (name: string) => priorSchema?.columns.find((column) => column.name === name)?.uuid;
    const uuidAfter = (name: string) => postSchema?.columns.find((column) => column.name === name)?.uuid;
    const tenantSchema = findTenantSchema(organizationId);
    const physicalName = concatSchemaAndTableName(tenantSchema, targetRelation.id);

    switch (action) {
      case 'create_table': {
        const columnNames: Record<string, string> = {};
        const columnConfigurations: Record<string, unknown> = {};
        for (const column of request.columns) {
          const uuid = uuidAfter(column.column_name);
          columnNames[column.column_name] = uuid;
          columnConfigurations[uuid] = column?.configurations || {};
        }
        const foreignKeys = await this.resolveForeignKeyCoRelationIds(
          request.foreign_keys || [],
          organizationId,
          appManager
        );
        await this.applyCreateTable(
          { organizationId, columns: request.columns, columnNames, columnConfigurations, foreignKeys },
          targetRelation,
          connectionManagers
        );
        return;
      }
      case 'drop_table': {
        await this.applyDropTable(
          {
            organizationId,
            internalTable: targetRelation.internalTable ?? (await this.targetInternalTable(targetRelation, appManager)),
          },
          targetRelation,
          connectionManagers
        );
        return;
      }
      case 'add_column': {
        const columnUuid = uuidAfter(request.column.column_name);
        const foreignKeys = await this.resolveForeignKeyCoRelationIds(
          request.foreign_keys || [],
          organizationId,
          appManager
        );
        await this.applyAddColumn(
          { organizationId, column: request.column, columnUuid, foreignKeys },
          targetRelation,
          connectionManagers
        );
        return;
      }
      case 'drop_column': {
        const columnName = request.column.column_name;
        await this.applyDropColumn(
          { organizationId, columnName, columnUuid: uuidBefore(columnName) },
          targetRelation,
          connectionManagers
        );
        return;
      }
      case 'edit_column': {
        const { column } = request;
        const columnName = column.column_name;
        const newColumnName = column?.new_column_name;
        const columnUuid = uuidBefore(columnName);
        const foreignKeyIdToDelete = request.foreign_key_id_to_delete
          ? await this.resolveFkConstraintName(
              organizationId,
              tenantSchema,
              targetRelation,
              await this.fkSpecFromResultingSchema(
                priorSchema,
                request.foreign_key_id_to_delete,
                organizationId,
                appManager
              ),
              appManager
            )
          : undefined;
        await this.applyEditColumn(
          { organizationId, column, columnName, newColumnName, columnUuid, foreignKeyIdToDelete },
          targetRelation,
          connectionManagers
        );
        return;
      }
      case 'edit_table': {
        const sourceColumnNames: Record<string, string> = {};
        priorSchema?.columns.forEach((column) => (sourceColumnNames[column.name] = column.uuid));
        const diff = this.buildEditTableColumnDiff(request, sourceColumnNames, (name) => uuidAfter(name));
        await this.applyEditTable(
          { organizationId, ...diff, newTableName: request.new_table_name },
          targetRelation,
          connectionManagers
        );
        return;
      }
      case 'create_foreign_key': {
        const foreign_keys = await this.resolveForeignKeyCoRelationIds(
          request.foreign_keys,
          organizationId,
          appManager
        );
        const targetInternalTable =
          targetRelation.internalTable ?? (await this.targetInternalTable(targetRelation, appManager));
        await this.applyCreateForeignKey(
          organizationId,
          {
            internalTable: targetInternalTable,
            relation: targetRelation,
            physicalName,
            shouldDestroyDbConnection: true,
            foreign_keys,
          },
          { appManager: this.manager, tjdbManager: this.tooljetDbManager },
          this.replayDummyMigration(targetInternalTable.id)
        );
        return;
      }
      case 'update_foreign_key': {
        const target = await this.fkSpecFromResultingSchema(
          priorSchema,
          request.foreign_key_id,
          organizationId,
          appManager
        );
        const foreign_keys = await this.resolveForeignKeyCoRelationIds(
          request.foreign_keys,
          organizationId,
          appManager
        );
        const targetInternalTable =
          targetRelation.internalTable ?? (await this.targetInternalTable(targetRelation, appManager));
        await this.applyUpdateForeignKey(
          organizationId,
          {
            internalTable: targetInternalTable,
            relation: targetRelation,
            physicalName,
            tenantSchema,
            target,
            foreign_keys,
          },
          this.replayDummyMigration(targetInternalTable.id)
        );
        return;
      }
      case 'delete_foreign_key': {
        const target = await this.fkSpecFromResultingSchema(
          priorSchema,
          request.foreign_key_id,
          organizationId,
          appManager
        );
        const targetInternalTable =
          targetRelation.internalTable ?? (await this.targetInternalTable(targetRelation, appManager));
        await this.applyDeleteForeignKey(
          organizationId,
          { internalTable: targetInternalTable, relation: targetRelation, physicalName, tenantSchema, target },
          this.replayDummyMigration(targetInternalTable.id)
        );
        return;
      }
      default:
        throw new BadRequestException(`Cannot replay migration action "${action}"`);
    }
  }

  private async targetInternalTable(
    targetRelation: InternalTableRelation,
    appManager: EntityManager
  ): Promise<InternalTable> {
    return appManager.findOne(InternalTable, { where: { id: targetRelation.internalTableId }, withDeleted: true });
  }

  /**
   * The three foreign-key ops confirm/discard their own `migration` argument internally (they own
   * their own transaction, unlike the other six - see AGENTS.md). Replay's own bookkeeping is
   * applications-only against the real source migrations, so this hands them an unpersisted
   * stand-in instead: their internal confirm()/discard() calls become no-op updates/deletes
   * against a row that was never inserted, and the real DDL still runs exactly as it does on the
   * live path.
   */
  private replayDummyMigration(internalTableId: string): InternalTableMigration {
    return { id: uuidv4(), internalTableId } as InternalTableMigration;
  }

  /**
   * Rebuilds an FkSpec for a foreign key named `foreignKeyId` from a migration's own recorded
   * resulting_schema rather than introspecting a live relation - the physical constraint this name
   * pointed to on the source relation may not exist anymore by the time this replays.
   */
  private async fkSpecFromResultingSchema(
    schema: TableSchemaSnapshot | null,
    foreignKeyId: string,
    organizationId: string,
    appManager: EntityManager
  ): Promise<FkSpec> {
    const fk = schema?.foreign_keys.find((candidate) => candidate.name === foreignKeyId);
    if (!fk) throw new NotFoundException(`Foreign key "${foreignKeyId}" not found in migration history`);

    const logicalIdByRelationId = await this.relationResolverService.resolveLogicalIds(
      organizationId,
      [fk.referenced_table],
      appManager
    );
    const referencedLogicalId = logicalIdByRelationId.get(fk.referenced_table);
    const referencedInternalTable =
      referencedLogicalId &&
      (await appManager.findOne(InternalTable, {
        where: { organizationId, id: referencedLogicalId },
        withDeleted: true,
      }));
    if (!referencedInternalTable) {
      throw new InternalServerErrorException(
        `Foreign key "${foreignKeyId}" references relation "${fk.referenced_table}", which does not resolve to a known internal table`
      );
    }

    return {
      column_names: fk.column_names,
      referenced_table: referencedInternalTable.co_relation_id,
      referenced_column_names: fk.referenced_column_names,
    };
  }

  async createTooljetDbTenantSchemaAndRole(organizationId: string, entityManager: EntityManager) {
    if (isSQLModeDisabled()) return;

    const dbUser = `user_${organizationId}`;
    const dbSchema = `workspace_${organizationId}`;
    const dbPassword = generateTJDBPasswordForRole();
    const tjDbName = this.configService.get('TOOLJET_DB');
    const tooljetDbAdminUser = this.configService.get('TOOLJET_DB_USER');

    const encryptedValue = await encryptTooljetDatabasePassword(dbPassword);
    await updatePasswordToOrganizationTable(entityManager, organizationId, encryptedValue, dbUser);

    await this.tooljetDbManager.transaction(async (tooljetDbTransactionManager) => {
      await createNewTjdbRole(tooljetDbTransactionManager, dbUser, dbPassword, tjDbName);
      await createAndGrantSchemaPrivilege(tooljetDbTransactionManager, dbSchema, dbUser);
      await createAndGrantTablePrivilege(tooljetDbTransactionManager, dbSchema, dbUser, tooljetDbAdminUser);
      await grantSequencePrivilege(tooljetDbTransactionManager, dbSchema, dbUser, tooljetDbAdminUser);
      await grantTenantRoleToTjdbAdminRole(tooljetDbTransactionManager, dbUser, tooljetDbAdminUser);
      await tooljetDbTransactionManager.query("NOTIFY pgrst, 'reload schema'");
    });
  }

  async deleteTooljetDbTenantSchemaAndRole(organizationId: string) {
    const dbUser = `user_${organizationId}`;
    const dbSchema = `workspace_${organizationId}`;

    await this.tooljetDbManager.transaction(async (tooljetDbTransactionManager) => {
      await tooljetDbTransactionManager.query(`REVOKE USAGE ON SCHEMA "${dbSchema}" FROM "${dbUser}";`);
      await tooljetDbTransactionManager.query(`DROP SCHEMA "${dbSchema}" CASCADE;`);

      await tooljetDbTransactionManager.query(`DROP OWNED BY "${dbUser}"`);
      await tooljetDbTransactionManager.query(`DROP ROLE "${dbUser}";`);
    });
  }
}
