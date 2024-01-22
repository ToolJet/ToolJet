import { BadRequestException, HttpException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { EntityManager, In, ObjectLiteral, QueryFailedError, SelectQueryBuilder, TypeORMError } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { isString, isEmpty, camelCase } from 'lodash';

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

export type SupportedDataTypes = 'character varying' | 'integer' | 'bigint' | 'serial' | 'double precision' | 'boolean';

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
      case 'join_tables':
        return await this.joinTable(organizationId, params);
      case 'edit_column':
        return await this.editColumn(organizationId, params);
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
    SELECT
      c.COLUMN_NAME,
      c.DATA_TYPE,
      CASE
          WHEN pk.CONSTRAINT_TYPE = 'PRIMARY KEY' THEN c.Column_default
          WHEN c.Column_default LIKE '%::%' THEN REPLACE(SUBSTRING(c.Column_default FROM '^''?(.*?)''?::'), '''', '')
          ELSE c.Column_default
      END AS Column_default,
      c.character_maximum_length,
      c.numeric_precision,
      JSON_BUILD_OBJECT(
          'is_not_null',
          CASE WHEN c.is_nullable = 'NO' THEN true ELSE false END,
          'is_primary_key',
          CASE WHEN pk.CONSTRAINT_TYPE = 'PRIMARY KEY' THEN true ELSE false END
      ) AS constraints_type,
      CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END AS KeyType
   FROM
      INFORMATION_SCHEMA.COLUMNS c
  LEFT JOIN (
      SELECT
          ku.TABLE_CATALOG,
          ku.TABLE_SCHEMA,
          ku.TABLE_NAME,
          ku.COLUMN_NAME,
          tc.CONSTRAINT_TYPE
      FROM
          INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
      INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
  ) pk ON c.TABLE_CATALOG = pk.TABLE_CATALOG
      AND c.TABLE_SCHEMA = pk.TABLE_SCHEMA
      AND c.TABLE_NAME = pk.TABLE_NAME
      AND c.COLUMN_NAME = pk.COLUMN_NAME
  WHERE
      c.TABLE_NAME = '${internalTable.id}'
  ORDER BY
      c.TABLE_SCHEMA,
      c.TABLE_NAME,
      c.ORDINAL_POSITION;
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
      if (column?.constraints_type?.is_primary_key ?? false) {
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
      if (column?.constraints_type?.is_primary_key ?? false) query += ` PRIMARY KEY`;
      if (column?.constraints_type?.is_not_null ?? false) query += ` NOT NULL`;

      if (restColumns)
        for (const col of restColumns) {
          query += `, ${col['column_name']} ${col['data_type']}`;
          if (col['column_default']) query += ` DEFAULT ${this.addQuotesIfString(col['column_default'])}`;
          if (col?.constraints_type?.is_primary_key ?? false) query += ` PRIMARY KEY`;
          if (col?.constraints_type?.is_not_null ?? false) query += ` NOT NULL`;
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
    if (column?.constraints_type?.is_primary_key ?? false) query += ` PRIMARY KEY`;
    if (column?.constraints_type?.is_not_null ?? false) query += ` NOT NULL`;

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

  private async joinTable(organizationId: string, params) {
    const { joinQueryJson } = params;
    if (!Object.keys(joinQueryJson).length) throw new BadRequestException("Input can't be empty");

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
      .filter((table) => table.type === 'Table')
      .map((filteredTable) => filteredTable.name);

    const internalTables = await this.findOrFailInternalTableFromTableId(tableIdList, organizationId);
    const internalTableIdToNameMap = tableIdList.reduce((acc, tableId) => {
      return {
        ...acc,
        [tableId]: internalTables.find((table) => table.id === tableId).tableName,
      };
    }, {});

    try {
      const queryBuilder = this.buildJoinQuery(joinQueryJson, internalTableIdToNameMap);
      return await queryBuilder.getRawMany();
    } catch (error) {
      // custom error handling - for Query error
      if (error instanceof QueryFailedError || error instanceof TypeORMError) {
        let customErrorMessage: string = error.message;
        Object.entries(internalTableIdToNameMap).forEach(([key, value]) => {
          customErrorMessage = customErrorMessage.replace(key, value as string);
        });
        throw new HttpException(customErrorMessage, 422);
      }
      throw error;
    }
  }

  private buildJoinQuery(queryJson, internalTableIdToNameMap): SelectQueryBuilder<any> {
    const queryBuilder: SelectQueryBuilder<any> = this.tooljetDbManager.createQueryBuilder();

    // mandatory attributes
    if (isEmpty(queryJson.fields)) throw new BadRequestException('Select statement is empty');
    if (isEmpty(queryJson.from)) throw new BadRequestException('From table is not selected');

    // select with aliased column names
    queryJson.fields.forEach((field) => {
      const fieldName = `"${internalTableIdToNameMap[field.table]}"."${field.name}"`;
      const fieldAlias = `${internalTableIdToNameMap[field.table]}_${field.name}`;
      queryBuilder.addSelect(fieldName, fieldAlias);
    });

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
        const orderByColumn = `"${internalTableIdToNameMap[order.table]}"."${order.columnName}"`;
        queryBuilder.addOrderBy(orderByColumn, order.direction as 'ASC' | 'DESC');
      });
    }
    // limit and offset
    if (queryJson.limit) queryBuilder.limit(parseInt(queryJson.limit, 10));
    if (queryJson.offset) queryBuilder.offset(parseInt(queryJson.offset, 10));

    return queryBuilder;
  }

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

      const leftField =
        condition.leftField.type == 'Column'
          ? `"${internalTableIdToNameMap[condition.leftField.table]}"."${condition.leftField.columnName}"`
          : `${condition.leftField.columnName}`;

      const rightField =
        condition.rightField.type == 'Column'
          ? `"${internalTableIdToNameMap[condition.rightField.table]}"."${condition.rightField.columnName}"`
          : maybeParameterizeValue(condition.operator, paramName, condition.rightField.value);

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
    const { table_name: tableName, column } = params;
    const { constraints_type = {} } = column;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });

    if (!internalTable) throw new NotFoundException('Internal table not found: ' + tableName);
    let query = '';

    if ('column_default' in column) {
      column.column_default.length
        ? (query += `ALTER TABLE "${internalTable.id}" ALTER COLUMN ${
            column.column_name
          } SET DEFAULT ${this.addQuotesIfString(column['column_default'])};`)
        : (query += `ALTER TABLE "${internalTable.id}" ALTER COLUMN ${column.column_name} DROP DEFAULT;`);
    }

    if ('is_not_null' in constraints_type) {
      constraints_type.is_not_null
        ? (query += `ALTER TABLE "${internalTable.id}" ALTER COLUMN ${column.column_name} SET NOT NULL;`)
        : (query += `ALTER TABLE "${internalTable.id}" ALTER COLUMN ${column.column_name} DROP NOT NULL;`);
    }

    if (column?.column_name && column?.new_column_name)
      query += `ALTER TABLE "${internalTable.id}" RENAME COLUMN ${column.column_name} TO ${column.new_column_name};`;
    const internalTableInfo = {};
    try {
      const result = await this.tooljetDbManager.query(query);
      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
      return result;
    } catch (error) {
      internalTableInfo[internalTable.id] = tableName;
      if (error instanceof QueryFailedError || error instanceof TypeORMError) {
        let customErrorMessage: string = error.message;
        Object.entries(internalTableInfo).forEach(([key, value]) => {
          customErrorMessage = customErrorMessage.replace(key, value as string);
        });
        throw new HttpException(customErrorMessage, 422);
      }
      throw error;
    }
  }
}
