import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
import { LicenseService } from '@licensing/service';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '@licensing/helper';
import { generatePayloadForLimits, formatJoinsJSONBPath, formatJSONB } from 'src/helpers/utils.helper';
import { isString, isEmpty, camelCase } from 'lodash';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActionTypes, ResourceTypes } from 'src/entities/audit_log.entity';
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
} from 'src/helpers/tooljet_db.helper';
import { OrganizationTjdbConfigurations } from 'src/entities/organization_tjdb_configurations.entity';
const crypto = require('crypto');
import {
  PostgrestError,
  TooljetDatabaseColumn,
  TooljetDatabaseDataTypes,
  TooljetDatabaseError,
  TooljetDatabaseForeignKey,
  TooljetDbActions,
  TJDB,
} from 'src/modules/tooljet_db/tooljet-db.types';
import { v4 as uuidv4 } from 'uuid';
import { QueryError } from '@tooljet/plugins/packages/common';
import { ConfigService } from '@nestjs/config';

enum AggregateFunctions {
  sum = 'SUM',
  count = 'COUNT',
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

@Injectable()
export class TooljetDbService {
  constructor(
    private readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager,
    private eventEmitter: EventEmitter2,
    private licenseService: LicenseService,
    private readonly configService: ConfigService
  ) { }

  async perform(
    organizationId: string,
    action: string,
    params = {},
    connectionManagers: Record<string, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ) {
    const actionHandler = this.getActionHandler(action);
    if (!actionHandler) {
      throw new BadRequestException('Action not defined');
    }
    return await actionHandler.call(this, organizationId, params, connectionManagers);
  }

  private getActionHandler(action: string): ((organizationId: string, params: any) => Promise<any>) | undefined {
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

  private async viewTable(
    organizationId: string,
    params,
    connectionManagers: Record<string, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ): Promise<{
    foreign_keys: TooljetDatabaseForeignKey[];
    columns: TooljetDatabaseColumn[];
    configurations: any;
  }> {
    const { table_name: tableName, id: id } = params;
    const { appManager, tjdbManager } = connectionManagers;

    const internalTable = await appManager.findOne(InternalTable, {
      where: {
        organizationId,
        ...(tableName && { tableName }),
        ...(id && { id }),
      },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);
    const tenantSchema = findTenantSchema(organizationId);
    let foreign_keys = await tjdbManager.query(`
      select
        (SELECT pgcls.relname FROM pg_class as pgcls where pgcls.oid = pgc.confrelid) as referenced_table_name,
        pgc.conname as constraint_name,
        ARRAY(SELECT attname FROM pg_attribute WHERE attrelid = pgc.conrelid AND attnum = any(pgc.conkey)) AS column_names,
        ARRAY(select attname from pg_attribute where attrelid = pgc.confrelid and attnum = any(pgc.confkey)) as referenced_column_names,
        case pgc.confupdtype 
              WHEN 'a' THEN 'NO ACTION'
              WHEN 'r' THEN 'RESTRICT'
              WHEN 'c' THEN 'CASCADE'
              WHEN 'n' THEN 'SET NULL'
              WHEN 'd' THEN 'SET DEFAULT'
              ELSE NULL
        end as on_update,
        case pgc.confdeltype 
          when 'a' then 'NO ACTION'
          when 'r' then 'RESTRICT'
          when 'c' then 'CASCADE'
          when 'n' then 'SET NULL'
          when 'd' then 'SET DEFAULT'
        end as on_delete
      from pg_constraint as pgc 
      join pg_class as cls on cls.oid = pgc.conrelid
      join pg_namespace as ns on ns.oid = cls.relnamespace
      where cls.relname = '${internalTable.id}' and pgc.contype = 'f' and ns.nspname = '${tenantSchema}'
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

    const referenced_tables_info = await this.fetchAndCheckIfValidForeignKeyTables(
      referenced_table_list,
      organizationId,
      'TABLEID',
      appManager
    );

    foreign_keys = foreign_keys.map((foreign_key_detail) => {
      return {
        ...foreign_key_detail,
        referenced_table_id: foreign_key_detail.referenced_table_name,
        referenced_table_name: referenced_tables_info[foreign_key_detail.referenced_table_name],
      };
    });

    const columns = await tjdbManager.query(`
    SELECT c.COLUMN_NAME,
        c.DATA_TYPE,
        CASE
            WHEN c.Column_default LIKE '%::%' THEN REPLACE(SUBSTRING(c.Column_default FROM '^''?(.*?)''?::'), '''', '')
            ELSE c.Column_default
        END AS Column_default,
        c.character_maximum_length,
        c.numeric_precision,
        JSON_BUILD_OBJECT(
            'is_not_null',
            CASE WHEN c.is_nullable = 'NO' THEN true ELSE false END,
            'is_primary_key',
            CASE WHEN pk.is_primary = true THEN true ELSE false END,
            'is_unique',
            CASE WHEN uk.is_unique = true THEN true ELSE false END
        ) AS constraints_type,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END AS KeyType
    FROM INFORMATION_SCHEMA.COLUMNS c
    LEFT JOIN (
          SELECT
            ku.TABLE_CATALOG,
            ku.TABLE_SCHEMA,
            ku.TABLE_NAME,
            ku.COLUMN_NAME,
            tc.CONSTRAINT_TYPE,
            CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN true else false END AS is_primary
        FROM
            INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
        INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          where tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.TABLE_CATALOG = pk.TABLE_CATALOG
        AND c.TABLE_SCHEMA = pk.TABLE_SCHEMA
        AND c.TABLE_NAME = pk.TABLE_NAME
        AND c.COLUMN_NAME = pk.COLUMN_NAME
    LEFT JOIN (
          SELECT
            ku.TABLE_CATALOG,
            ku.TABLE_SCHEMA,
            ku.TABLE_NAME,
            ku.COLUMN_NAME,
            tc.CONSTRAINT_TYPE,
            CASE WHEN tc.constraint_type = 'UNIQUE' THEN true else false END AS is_unique
        FROM
            INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
        INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          where tc.constraint_type = 'UNIQUE'
    ) as uk ON c.TABLE_CATALOG = uk.TABLE_CATALOG
        AND c.TABLE_SCHEMA = uk.TABLE_SCHEMA
        AND c.TABLE_NAME = uk.TABLE_NAME
        AND c.COLUMN_NAME = uk.COLUMN_NAME
    WHERE c.TABLE_NAME = '${internalTable.id}'
    ORDER BY
        c.TABLE_SCHEMA,
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
      configurations: internalTable.configurations,
    };
  }

  private async viewTables(organizationId: string) {
    return await this.manager.find(InternalTable, {
      where: { organizationId },
      select: ['id', 'tableName'],
      order: { tableName: 'ASC' },
    });
  }

  private addQuotesIfString(value) {
    if (isString(value)) return `'${value}'`;
    return value;
  }

  private addQuotesIfMissing(value) {
    if (!!value && !value.includes("'")) return `'${value}'`;
    return value;
  }

  private async createTable(
    organizationId: string,
    params,
    connectionManagers: Record<string, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ) {
    const tenantSchema = findTenantSchema(organizationId);
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

    if (!isEmpty(tableWithSameName)) throw new ConflictException(`Table with with name "${tableName}" already exists`);

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
      const columnNames = {};
      const columnConfigrations = {};
      for (const column of params.columns) {
        const columnUuid = uuidv4();
        columnNames[column.column_name] = columnUuid;
        columnConfigrations[columnUuid] = column?.configurations || {};
      }

      const configurations = {
        columns: {
          column_names: columnNames,
          configurations: columnConfigrations,
        },
      };

      const internalTable = queryRunner.manager.create(InternalTable, {
        tableName,
        organizationId,
        configurations,
      });

      await queryRunner.manager.save(internalTable);

      await tjdbQueryRunner.createTable(
        new Table({
          schema: tenantSchema,
          name: internalTable.id,
          columns: this.prepareColumnListForCreateTable(params.columns),
          ...(foreign_keys.length && {
            foreignKeys: this.prepareForeignKeyDetailsJSON(foreign_keys, referenced_tables_info, tenantSchema),
          }),
        })
      );

      const tableNameWithSchema = concatSchemaAndTableName(tenantSchema, internalTable.id);
      await tjdbQueryRunner.createPrimaryKey(tableNameWithSchema, primaryKeyColumnList);
      // await tjdbQueryRunner.createPrimaryKey(
      //   new Table({ schema: tenantSchema, name: internalTable.id }),
      //   primaryKeyColumnList
      // );

      await queryRunner.commitTransaction();
      await tjdbQueryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");

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

  private async dropTable(organizationId: string, params) {
    const { table_name: tableName } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    const tenantSchema = findTenantSchema(organizationId);
    const queryRunner = this.manager.connection.createQueryRunner();
    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();

    await queryRunner.connect();
    await tjdbQueryRunner.connect();

    await queryRunner.startTransaction();
    await tjdbQueryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(InternalTable, { id: internalTable.id });
      await tjdbQueryRunner.dropTable(new Table({ schema: tenantSchema, name: internalTable.id }));

      await queryRunner.commitTransaction();
      await tjdbQueryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      await tjdbQueryRunner.rollbackTransaction();
      throw new TooljetDatabaseError(
        err.message,
        {
          origin: 'drop_table',
          internalTables: [internalTable],
        },
        err
      );
    } finally {
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await queryRunner.release();
      await tjdbQueryRunner.release();
    }
  }

  private async editTable(organizationId: string, params) {
    const { table_name: tableName, columns } = params;

    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();
    const tenantSchema = findTenantSchema(organizationId);

    try {
      const tableName = concatSchemaAndTableName(tenantSchema, internalTable.id);
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

      const columnNames = internalTable.configurations.columns.column_names;
      const columnConfigurations = internalTable.configurations.columns.configurations;

      columnstoBeUpdated.forEach((column) => {
        const newColumn = column.newColumn;
        const oldColumn = column.oldColumn;
        const columnUuid = columnNames[oldColumn.name];
        if (columnUuid) {
          columnNames[newColumn.name] = columnUuid;
          if (newColumn.type !== oldColumn.type) {
            columnConfigurations[columnUuid] = {};
          }
          columnConfigurations[columnUuid] = {
            ...columnConfigurations[columnUuid],
            ...columnConfigurationMap[newColumn.name],
          };
          if (oldColumn.name !== newColumn.name) {
            delete columnNames[oldColumn.name];
          }
        }
      });

      columnsToBeDeleted.forEach((column) => {
        const columnUuid = columnNames[column];
        delete columnNames[column];
        delete columnConfigurations[columnUuid];
      });

      columnsToBeInserted.forEach((column) => {
        const columnUuid = uuidv4();
        columnNames[column.name] = columnUuid;
        columnConfigurations[columnUuid] = columnConfigurationMap[column.name];
      });

      const configurations = {
        columns: {
          column_names: columnNames,
          configurations: columnConfigurations,
        },
      };

      await queryRunner.manager.update(InternalTable, { id: internalTable.id }, { configurations });

      if (isEmpty(updatedPrimaryKeys)) throw new BadRequestException('Primary key is mandatory');

      if (!isEmpty(columnsToBeDeleted)) await tjdbQueryRunner.dropColumns(tableName, columnsToBeDeleted);
      if (!isEmpty(columnsToBeInserted)) await tjdbQueryRunner.addColumns(tableName, columnsToBeInserted);
      if (!isEmpty(columnstoBeUpdated)) await tjdbQueryRunner.changeColumns(tableName, columnstoBeUpdated);

      if (params.new_table_name) {
        const { new_table_name } = params;
        const newInternalTable = await queryRunner.manager.findOne(InternalTable, {
          where: { organizationId, tableName: new_table_name },
        });

        if (newInternalTable) throw new BadRequestException('Table name already exists: ' + new_table_name);
        await queryRunner.manager.update(InternalTable, { id: internalTable.id }, { tableName: new_table_name });
      }

      await tjdbQueryRunner.commitTransaction();
      await queryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await tjdbQueryRunner.release();
      await queryRunner.release();
    } catch (error) {
      await tjdbQueryRunner.rollbackTransaction();
      await queryRunner.rollbackTransaction();
      await tjdbQueryRunner.release();
      await queryRunner.release();

      throw new TooljetDatabaseError(error.message, { origin: 'edit_table', internalTables: [internalTable] }, error);
    }
  }

  private async addColumn(organizationId: string, params) {
    const { table_name: tableName, column, foreign_keys } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

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

    const tenantSchema = findTenantSchema(organizationId);
    const tjdbQueryRunnner = this.tooljetDbManager.connection.createQueryRunner();
    await tjdbQueryRunnner.connect();
    await tjdbQueryRunnner.startTransaction();

    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tableName = concatSchemaAndTableName(tenantSchema, internalTable.id);
      const columnNames = internalTable.configurations.columns.column_names;
      const columnConfigurations = internalTable.configurations.columns.configurations;
      const columnUuid = uuidv4();
      columnNames[column['column_name']] = columnUuid;
      columnConfigurations[columnUuid] = column?.configurations || {};
      const configurations = {
        columns: {
          column_names: columnNames,
          configurations: columnConfigurations,
        },
      };

      await queryRunner.manager.update(InternalTable, { id: internalTable.id }, { configurations });

      await tjdbQueryRunnner.addColumn(
        tableName,
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

      if (foreign_keys.length) {
        const foreignKeys = this.prepareForeignKeyDetailsJSON(foreign_keys, referenced_tables_info, tenantSchema).map(
          (foreignkeydetail) => new TableForeignKey({ ...foreignkeydetail })
        );
        await tjdbQueryRunnner.createForeignKeys(tableName, foreignKeys);
      }

      await queryRunner.commitTransaction();
      await tjdbQueryRunnner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await queryRunner.release();
      await tjdbQueryRunnner.release();
    } catch (err) {
      await tjdbQueryRunnner.rollbackTransaction();
      await tjdbQueryRunnner.release();
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
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
          internalTables: [internalTable, ...referencedColumnInfoForError],
        },
        err
      );
    }
  }

  private async dropColumn(organizationId: string, params) {
    const { table_name: tableName, column } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    const tjdbQueryRunnner = this.tooljetDbManager.connection.createQueryRunner();
    const queryRunner = this.manager.connection.createQueryRunner();

    await tjdbQueryRunnner.connect();
    await queryRunner.connect();

    await queryRunner.startTransaction();
    await tjdbQueryRunnner.startTransaction();

    const tenantSchema = findTenantSchema(organizationId);

    try {
      const columnNames = internalTable.configurations.columns.column_names;
      const columnConfigurations = internalTable.configurations.columns.configurations;
      const columnUuid = columnNames[column['column_name']];
      delete columnNames[column['column_name']];
      delete columnConfigurations[columnUuid];
      const configurations = {
        columns: {
          column_names: columnNames,
          configurations: columnConfigurations,
        },
      };
      await queryRunner.manager.update(InternalTable, { id: internalTable.id }, { configurations });

      const tableName = concatSchemaAndTableName(tenantSchema, internalTable.id);
      const result = await tjdbQueryRunnner.dropColumn(tableName, column['column_name']);

      await tjdbQueryRunnner.commitTransaction();
      await queryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");

      return result;
    } catch (error) {
      await tjdbQueryRunnner.rollbackTransaction();
      await queryRunner.rollbackTransaction();
      throw new TooljetDatabaseError(error.message, { origin: 'drop_column', internalTables: [internalTable] }, error);
    } finally {
      await queryRunner.release();
      await tjdbQueryRunnner.release();
    }
  }

  async getTablesLimit() {
    const licenseTerms = await this.licenseService.getLicenseTerms([LICENSE_FIELD.TABLE_COUNT, LICENSE_FIELD.STATUS]);
    return {
      tablesCount: generatePayloadForLimits(
        licenseTerms[LICENSE_FIELD.TABLE_COUNT] !== LICENSE_LIMIT.UNLIMITED
          ? await this.manager.createQueryBuilder(InternalTable, 'internal_table').getCount()
          : 0,
        licenseTerms[LICENSE_FIELD.TABLE_COUNT],
        licenseTerms[LICENSE_FIELD.STATUS],
        LICENSE_LIMITS_LABEL.TABLES
      ),
    };
  }

  private async joinTable(organizationId: string, params: Record<string, any>) {
    const { joinQueryJson, dataQuery, user } = params;
    if (!Object.keys(joinQueryJson).length) throw new BadRequestException("Input can't be empty");

    const tjdbTenantConfigs = await this.manager.findOne(OrganizationTjdbConfigurations, {
      where: { organizationId },
    });
    if (!tjdbTenantConfigs) throw new NotFoundException(`Tooljet database schema configuration doesn't exists`);

    // Gathering tables used, from Join coditions
    const tableSet = new Set();
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
    const internalTableIdToNameMap = tableIdList.reduce((acc, tableId) => {
      return {
        ...acc,
        [tableId]: internalTables.find((table) => table.id === tableId).tableName,
      };
    }, {});

    const { pgPassword, pgUser } = tjdbTenantConfigs;
    const tjdbPassKey = await decryptTooljetDatabasePassword(pgPassword);
    const tenantSchema = findTenantSchema(organizationId);
    const { tooljetDbTenantConnection } = await createTooljetDatabaseConnection(tjdbPassKey, pgUser, tenantSchema);

    try {
      const queryBuilder = this.buildJoinQuery(joinQueryJson, internalTableIdToNameMap, tooljetDbTenantConnection);
      return await queryBuilder.getRawMany();
    } catch (error) {
      const errorObj = new QueryFailedError(error, [], new PostgrestError(error));
      const tjdbErrorObj = new TooljetDatabaseError(
        error.message,
        {
          origin: 'join_tables',
          internalTables: internalTables,
        },
        errorObj
      );
      const alteredErrorMessage = tjdbErrorObj.toString();
      throw new QueryError(alteredErrorMessage, alteredErrorMessage, {});
    } finally {
      await tooljetDbTenantConnection.destroy();
      if (!isEmpty(dataQuery) && !isEmpty(user)) {
        this.eventEmitter.emit('auditLogEntry', {
          userId: user.id,
          organizationId,
          resourceId: dataQuery.id,
          resourceName: dataQuery.name,
          resourceType: ResourceTypes.DATA_QUERY,
          actionType: ActionTypes.DATA_QUERY_RUN,
          metadata: {},
        });
      }
    }
  }

  private buildJoinQuery(
    queryJson,
    internalTableIdToNameMap,
    // eslint-disable-next-line deprecation/deprecation
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
    queryBuilder.from(queryJson.from.name, internalTableIdToNameMap[queryJson.from.name]);

    // join tables with conditions
    queryJson.joins.forEach((join) => {
      const joinAlias = internalTableIdToNameMap[join.table];
      const conditions = this.constructFilterConditions(join.conditions, internalTableIdToNameMap);

      const joinFunction = queryBuilder[camelCase(join.joinType) + 'Join'];
      joinFunction.call(queryBuilder, join.table, joinAlias, conditions.query, conditions.params);
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
  private constructFilterConditions(conditions, internalTableIdToNameMap) {
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

  private async findOrFailInternalTableFromTableId(requestedTableIdList: Array<string>, organizationId: string) {
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

  private async editColumn(organizationId: string, params) {
    const { table_name: tableName, column, foreign_key_id_to_delete } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();
    const queryRunner = this.manager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await queryRunner.connect();

    await tjdbQueryRunner.startTransaction();
    await queryRunner.startTransaction();
    const tenantSchema = findTenantSchema(organizationId);

    try {
      const columnNames = internalTable.configurations.columns.column_names;
      const columnConfigurations = internalTable.configurations.columns.configurations;
      const columnUuid = columnNames[column.column_name];
      columnConfigurations[columnUuid] = {
        ...columnConfigurations[columnUuid],
        ...(column?.configurations || {}),
      };
      if (column?.new_column_name) {
        columnNames[column.new_column_name] = columnUuid;
        delete columnNames[column.column_name];
      }

      const configurations = {
        columns: {
          column_names: columnNames,
          configurations: columnConfigurations,
        },
      };

      await queryRunner.manager.update(InternalTable, { id: internalTable.id }, { configurations });

      const tableName = concatSchemaAndTableName(tenantSchema, internalTable.id);
      if (foreign_key_id_to_delete) await tjdbQueryRunner.dropForeignKey(tableName, foreign_key_id_to_delete);
      await tjdbQueryRunner.changeColumn(
        tableName,
        column.column_name,
        new TableColumn({
          name: column.column_name,
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

      if (column?.column_name && column?.new_column_name) {
        await tjdbQueryRunner.renameColumn(tableName, column?.column_name, column?.new_column_name);
      }

      await tjdbQueryRunner.commitTransaction();
      await queryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await tjdbQueryRunner.release();
      await queryRunner.release();
    } catch (error) {
      await tjdbQueryRunner.rollbackTransaction();
      await tjdbQueryRunner.release();
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw new TooljetDatabaseError(error.message, { origin: 'edit_column', internalTables: [internalTable] }, error);
    }
  }

  private prepareColumnListForCreateTable(columns: TooljetDatabaseColumn[]) {
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

  private prepareForeignKeyDetailsJSON(
    foreign_keys: TooljetDatabaseForeignKey[],
    referenced_tables_info,
    tenantSchema
  ) {
    if (!foreign_keys.length) return [];
    const foreignKeyList = foreign_keys.map((foreignKeyDetail) => {
      const {
        column_names,
        referenced_table_name,
        referenced_column_names,
        on_delete = '',
        on_update = '',
      } = foreignKeyDetail;

      return {
        columnNames: column_names,
        referencedTableName: referenced_tables_info[referenced_table_name],
        referencedColumnNames: referenced_column_names,
        referencedSchema: tenantSchema,
        ...(on_delete && { onDelete: on_delete }),
        ...(on_update && { onUpdate: on_update }),
      };
    });
    return foreignKeyList;
  }

  // Method to check : Tables mentioned in Foreignkey is valid or not ( based on 'type' of input logic differs)
  private async fetchAndCheckIfValidForeignKeyTables(
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

    const referenced_tables_info = {};
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
    return referenced_tables_info;
  }

  private async createForeignKey(
    organizationId: string,
    params,
    connectionManagers: Record<string, EntityManager> = {
      appManager: this.manager,
      tjdbManager: this.tooljetDbManager,
    }
  ) {
    const { table_name, foreign_keys, shouldDestroyDbConnection = true } = params;
    const { appManager, tjdbManager } = connectionManagers;
    if (!foreign_keys?.length) throw new BadRequestException('Foreign key details are missing');

    const internalTable = await appManager.findOne(InternalTable, {
      where: { organizationId: organizationId, tableName: table_name },
    });
    if (!internalTable) throw new NotFoundException('Internal table not found: ' + table_name);

    let referenced_tables_info = {};
    const referenced_table_list = foreign_keys.map((foreign_key) => foreign_key.referenced_table_name);
    referenced_tables_info = await this.fetchAndCheckIfValidForeignKeyTables(
      referenced_table_list,
      organizationId,
      'TABLENAME',
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

    const tjdbQueryRunner = tjdbManager?.queryRunner || tjdbManager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();
    const tenantSchema = findTenantSchema(organizationId);

    try {
      const tableName = concatSchemaAndTableName(tenantSchema, internalTable.id);
      const foreignKeys = this.prepareForeignKeyDetailsJSON(foreign_keys, referenced_tables_info, tenantSchema).map(
        (foreignkeydetail) => new TableForeignKey({ ...foreignkeydetail })
      );
      await tjdbQueryRunner.createForeignKeys(tableName, foreignKeys);
      await tjdbQueryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      //@ts-expect-error queryRunner has property transactionDepth which is not defined in type EntityManager
      if (!tjdbQueryRunner?.transactionDepth || tjdbQueryRunner.transactionDepth < 1) await tjdbQueryRunner.release();

      return {
        statusCode: 200,
        message: 'Foreign key relation created successfully!',
      };
    } catch (err) {
      // Error code: 42710 - indicates FK constraint exists
      if (!shouldDestroyDbConnection && err.code === '42710') {
        await tjdbQueryRunner.rollbackTransaction();
      }

      if (shouldDestroyDbConnection) {
        await tjdbQueryRunner.rollbackTransaction();
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
            origin: 'create_foreign_key',
            internalTables: [internalTable, ...referencedColumnInfoForError],
          },
          err
        );
      }
    }
  }

  private async updateForeignKey(organizationId: string, params) {
    const { table_name, foreign_key_id, foreign_keys } = params;
    if (!foreign_key_id) throw new BadRequestException('Foreign key id is mandatory');
    if (!foreign_keys?.length) throw new BadRequestException('Foreign key details are missing');

    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId: organizationId, tableName: table_name },
    });
    if (!internalTable) throw new NotFoundException('Internal table not found: ' + table_name);

    let referenced_tables_info = {};
    const referenced_table_list = foreign_keys.map((foreign_key) => foreign_key.referenced_table_name);
    referenced_tables_info = await this.fetchAndCheckIfValidForeignKeyTables(
      referenced_table_list,
      organizationId,
      'TABLENAME'
    );

    const isFKfromCompositePK = await this.checkIfForeignKeyReferencedColumnsAreFromCompositePrimaryKey(
      foreign_keys,
      organizationId
    );

    if (isFKfromCompositePK)
      throw new ConflictException(
        'Foreign key cannot be created as the referenced column is in the composite primary key.'
      );

    const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();
    await tjdbQueryRunner.connect();
    await tjdbQueryRunner.startTransaction();
    const tenantSchema = findTenantSchema(organizationId);

    try {
      const tableName = concatSchemaAndTableName(tenantSchema, internalTable.id);
      await tjdbQueryRunner.dropForeignKey(tableName, foreign_key_id);

      const foreignKeys = this.prepareForeignKeyDetailsJSON(foreign_keys, referenced_tables_info, tenantSchema).map(
        (foreignkeydetail) => new TableForeignKey({ ...foreignkeydetail })
      );
      await tjdbQueryRunner.createForeignKeys(tableName, foreignKeys);

      await tjdbQueryRunner.commitTransaction();
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await tjdbQueryRunner.release();
      return {
        statusCode: 200,
        message: 'Foreign key relation created successfully!',
      };
    } catch (err) {
      await tjdbQueryRunner.rollbackTransaction();
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
          origin: 'update_foreign_key',
          internalTables: [internalTable, ...referencedColumnInfoForError],
        },
        err
      );
    }
  }

  private async deleteForeignKey(organizationId: string, params) {
    const { table_name, foreign_key_id } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId: organizationId, tableName: table_name },
    });
    if (!internalTable) throw new NotFoundException('Internal table not found: ' + table_name);
    try {
      const tenantSchema = findTenantSchema(organizationId);
      const tableName = concatSchemaAndTableName(tenantSchema, internalTable.id);
      const tjdbQueryRunner = this.tooljetDbManager.connection.createQueryRunner();

      await tjdbQueryRunner.connect();
      await tjdbQueryRunner.dropForeignKey(tableName, foreign_key_id);
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      return {
        statusCode: 200,
        message: 'Foreign key relation deleted successfully!',
      };
    } catch (error) {
      throw new TooljetDatabaseError(
        error.message,
        {
          origin: 'delete_foreign_key',
          internalTables: [internalTable],
        },
        error
      );
    }
  }

  private async checkIfForeignKeyReferencedColumnsAreFromCompositePrimaryKey(
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

  async createTooljetDbTenantSchemaAndRole(organizationId: string, entityManager: EntityManager) {
    const dbUser = `user_${organizationId}`;
    const dbSchema = `workspace_${organizationId}`;
    const dbPassword = crypto.randomBytes(8).toString('hex');
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
