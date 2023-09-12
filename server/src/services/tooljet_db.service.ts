import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { isString } from 'lodash';

export type TableColumnSchema = {
  column_name: string;
  data_type: SupportedDataTypes;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  is_nullable: 'YES' | 'NO';
  constraint_type: string | null;
  keytype: string | null;
};

export type SupportedDataTypes = 'character varying' | 'integer' | 'serial' | 'double precision' | 'boolean';

@Injectable()
export class TooljetDbService {
  constructor(
    private readonly manager: EntityManager,
    @Optional()
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager
  ) {}

  async perform(organizationId: string, action: string, params = {}) {
    switch (action) {
      case 'view_tables':
        return await this.viewTables(organizationId);
      case 'view_table':
        return await this.viewTable(organizationId, params);
      case 'create_table':
        return await this.createTable(organizationId, params);
      case 'drop_table':
        return await this.dropTable(organizationId, params);
      case 'add_column':
        return await this.addColumn(organizationId, params);
      case 'drop_column':
        return await this.dropColumn(organizationId, params);
      case 'rename_table':
        return await this.renameTable(organizationId, params);
      default:
        throw new BadRequestException('Action not defined');
    }
  }

  private async viewTable(organizationId: string, params): Promise<TableColumnSchema[]> {
    const { table_name: tableName, id: id } = params;

    const internalTable = await this.manager.findOne(InternalTable, {
      where: {
        organizationId,
        ...(tableName && { tableName }),
        ...(id && { id }),
      },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    return await this.tooljetDbManager.query(
      `
        SELECT c.COLUMN_NAME, c.DATA_TYPE, 
              CASE 
                  WHEN pk.CONSTRAINT_TYPE = 'PRIMARY KEY' 
                      THEN c.Column_default 
                  WHEN c.Column_default LIKE '%::%' 
                      THEN replace(substring(c.Column_default from '^''?(.*?)''?::'), '''', '')
                  ELSE c.Column_default 
              END AS Column_default, 
              c.character_maximum_length, c.numeric_precision, c.is_nullable, 
              pk.CONSTRAINT_TYPE,
              CASE 
                  WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PRIMARY KEY' 
                  ELSE '' 
              END AS KeyType
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
                  SELECT ku.TABLE_CATALOG,ku.TABLE_SCHEMA,ku.TABLE_NAME,ku.COLUMN_NAME, tc.CONSTRAINT_TYPE
                  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
                  INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku
                      ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                ) pk
        ON  c.TABLE_CATALOG = pk.TABLE_CATALOG
                  AND c.TABLE_SCHEMA = pk.TABLE_SCHEMA
                  AND c.TABLE_NAME = pk.TABLE_NAME
                  AND c.COLUMN_NAME = pk.COLUMN_NAME
        WHERE c.TABLE_NAME = '${internalTable.id}'
        ORDER BY c.TABLE_SCHEMA,c.TABLE_NAME, c.ORDINAL_POSITION;
      `
    );
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

  private async createTable(organizationId: string, params) {
    let primaryKeyExist = false;

    // primary keys are only supported as serial type
    params.columns = params.columns.map((column) => {
      if (column['constraint_type'] === 'PRIMARY KEY') {
        primaryKeyExist = true;
        return { ...column, data_type: 'serial', column_default: null };
      }
      return column;
    });

    if (!primaryKeyExist) {
      throw new BadRequestException();
    }

    const {
      table_name: tableName,
      columns: [column, ...restColumns],
    } = params;

    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const internalTable = queryRunner.manager.create(InternalTable, {
        tableName,
        organizationId,
      });
      await queryRunner.manager.save(internalTable);

      const createTableString = `CREATE TABLE "${internalTable.id}" `;
      let query = `${column['column_name']} ${column['data_type']}`;
      if (column['column_default']) query += ` DEFAULT ${this.addQuotesIfString(column['column_default'])}`;
      if (column['constraint_type']) query += ` ${column['constraint_type']}`;

      if (restColumns)
        for (const col of restColumns) {
          query += `, ${col['column_name']} ${col['data_type']}`;
          if (col['column_default']) query += ` DEFAULT ${this.addQuotesIfString(col['column_default'])}`;
          if (col['constraint_type']) query += ` ${col['constraint_type']}`;
        }

      // if tooljetdb query fails in this connection, we must rollback internal table
      // created in the other connection
      await this.tooljetDbManager.query(createTableString + '(' + query + ');');

      await queryRunner.commitTransaction();
      return { id: internalTable.id, table_name: tableName };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await queryRunner.release();
    }
  }

  private async dropTable(organizationId: string, params) {
    const { table_name: tableName } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(InternalTable, { id: internalTable.id });

      const query = `DROP TABLE "${internalTable.id}"`;
      // if tooljetdb query fails in this connection, we must rollback internal table
      // created in the other connection
      await this.tooljetDbManager.query(query);

      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      await queryRunner.release();
    }
  }

  private async renameTable(organizationId: string, params) {
    const { table_name: tableName, new_table_name: newTableName } = params;

    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    const newInternalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName: newTableName },
    });

    if (newInternalTable) throw new BadRequestException('Table name already exists: ' + newTableName);

    await this.manager.update(InternalTable, { id: internalTable.id }, { tableName: newTableName });
  }

  private async addColumn(organizationId: string, params) {
    const { table_name: tableName, column } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    let query = `ALTER TABLE "${internalTable.id}" ADD ${column['column_name']} ${column['data_type']}`;
    if (column['column_default']) query += ` DEFAULT ${this.addQuotesIfString(column['column_default'])}`;
    if (column['constraint']) query += ` ${column['constraint']};`;

    const result = await this.tooljetDbManager.query(query);
    await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
    return result;
  }

  private async dropColumn(organizationId: string, params) {
    const { table_name: tableName, column } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);

    const query = `ALTER TABLE "${internalTable.id}" DROP COLUMN ${column['column_name']}`;

    const result = await this.tooljetDbManager.query(query);
    await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
    return result;
  }
}
