import { BadRequestException, HttpException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { EntityManager, In, QueryFailedError } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { isString, isEmpty } from 'lodash';

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

    const { finalQuery, sqlParamsList } = await this.buildJoinQuery(
      organizationId,
      joinQueryJson,
      internalTableIdToNameMap
    );

    console.log('Finaly Query---------------', finalQuery);
    console.log('sqlParamsList*************', sqlParamsList);

    try {
      return await this.tooljetDbManager.query(finalQuery, sqlParamsList);
    } catch (error) {
      // custom error handling - for Query error
      if (error instanceof QueryFailedError) {
        let customErrorMessage: string = (error as QueryFailedError).message;
        Object.entries(internalTableIdToNameMap).forEach(([key, value]) => {
          customErrorMessage = customErrorMessage.replace(key, value as string);
        });
        throw new HttpException(customErrorMessage, 422);
      }
      throw error;
    }
  }

  private async buildJoinQuery(_organizationId: string, queryJson, internalTableIdToNameMap) {
    // Pending: For Subquery, Alias is its table name. Need to handle it on Internal Table details mapping
    // Pending: SELECT Statement - Nested params --> SUM( price * quantity )
    const sqlParamsCounter = {
      counter: 0,
    };

    const sqlParamsList = [];

    // @description: Only SELECT & FROM statement is Mandatory, else is Optional
    let finalQuery = ``;
    finalQuery += `SELECT ${await this.constructSelectStatement(
      queryJson.fields,
      internalTableIdToNameMap,
      sqlParamsCounter,
      sqlParamsList
    )}`;

    finalQuery += `\nFROM ${await this.constructFromStatement(
      queryJson,
      internalTableIdToNameMap,
      sqlParamsCounter,
      sqlParamsList
    )}`;

    if (queryJson?.joins?.length)
      finalQuery += `\n${await this.constructJoinStatements(
        queryJson.joins,
        internalTableIdToNameMap,
        sqlParamsCounter,
        sqlParamsList
      )}`;

    if (
      queryJson?.conditions &&
      Object.keys(queryJson?.conditions).length &&
      queryJson?.conditions?.conditionsList.length
    )
      finalQuery += `\nWHERE ${await this.constructWhereStatement(
        queryJson.conditions,
        internalTableIdToNameMap,
        sqlParamsCounter,
        sqlParamsList
      )}`;

    // if (queryJson?.group_by?.length)
    //   finalQuery += `\nGROUP BY ${await this.constructGroupByStatement(
    //     queryJson.group_by,
    //     internalTableIdToNameMap,
    //     sqlParamsCounter,
    //     sqlParamsList
    //   )}`;

    // if (queryJson?.having && Object.keys(queryJson?.having).length)
    //   finalQuery += `\nHAVING ${await this.constructWhereStatement(
    //     queryJson.having,
    //     internalTableIdToNameMap,
    //     sqlParamsCounter,
    //     sqlParamsList
    //   )}`;

    if (queryJson?.order_by?.length)
      finalQuery += `\nORDER BY ${await this.constructOrderByStatement(
        queryJson.order_by,
        internalTableIdToNameMap,
        sqlParamsCounter,
        sqlParamsList
      )}`;

    if (queryJson?.limit && queryJson?.limit.length) {
      sqlParamsList.push(queryJson.limit);
      finalQuery += `\nLIMIT $${++sqlParamsCounter.counter}`;
    }

    if (queryJson?.offset && queryJson?.offset.length) {
      sqlParamsList.push(queryJson.offset);
      finalQuery += `\nOFFSET $${++sqlParamsCounter.counter}`;
    }

    return { finalQuery, sqlParamsList };
  }

  // Assuming tableId is being passed, tableName to tableId mapping is removed
  private constructSelectStatement(
    selectStatementInputList,
    internalTableIdToNameMap,
    sqlParamsCounter,
    sqlParamsList
  ) {
    if (selectStatementInputList.length) {
      const selectQueryFields = selectStatementInputList
        .map((field) => {
          let fieldExpression = ``;
          if (field.function) fieldExpression += `${field.function}(`;
          fieldExpression += `${field.table ? '"' + field.table + '"' + '.' : ''}${field.name}`;
          if (field.function) fieldExpression += `)`;
          if (field.alias) {
            fieldExpression += ` AS ${field.alias}`;
          } else {
            // By Default Alias has been added here for tooljetdb join flow
            fieldExpression += ` AS ${internalTableIdToNameMap[field.table]}_${field.name}`;
          }
          return fieldExpression;
        })
        .join(', ');
      return selectQueryFields;
    }

    // if (selectStatementInputList.length) {
    //   const selectQueryFields = selectStatementInputList
    //     .map((field) => {
    //       let fieldExpression = ``;

    //       if (field.function) {
    //         sqlParamsList.push(field.function);
    //         fieldExpression += `$${++sqlParamsCounter.counter}(`;
    //       }

    //       // HANDLE!!
    //       // if (field.table) sqlParamsList.push(field.table);
    //       // sqlParamsList.push(`${field.table ? '"' + field.table + '"' + '.' : ''}`);
    //       sqlParamsList.push(field.name);
    //       // fieldExpression += `$${++sqlParamsCounter.counter}$${++sqlParamsCounter.counter}`;
    //       fieldExpression += `${field.table ? '"' + field.table + '"' + '.' : ''}$${++sqlParamsCounter.counter}`;

    //       if (field.function) fieldExpression += `)`;
    //       if (field.alias) {
    //         sqlParamsList.push(field.alias);
    //         fieldExpression += ` AS $${++sqlParamsCounter.counter}`;
    //       } else {
    //         sqlParamsList.push(field.name);
    //         // By Default Alias has been added here for tooljetdb join flow
    //         fieldExpression += ` AS ${internalTableIdToNameMap[field.table]}_$${++sqlParamsCounter.counter}`;
    //       }
    //       return fieldExpression;
    //     })
    //     .join(', ');
    //   return selectQueryFields;
    // }

    throw new BadRequestException('Select statement is empty');
  }

  private constructFromStatement(queryJson, _internalTableIdToNameMap, sqlParamsCounter, sqlParamsList) {
    const { from } = queryJson;
    if (from.name) {
      return `${'"' + from.name + '"'} ${from.alias ? from.alias : ''}`;
    }

    // if (from.name) {
    //   if (from.alias) sqlParamsList.push(from.alias);
    //   // HANDLE!!
    //   return `${'"' + from.name + '"'} ${from.alias ? '$' + ++sqlParamsCounter.counter : ''}`;
    // }

    throw new BadRequestException('From table is not selected');
  }

  private constructJoinStatements(joinsInputList, internalTableIdToNameMap, sqlParamsCounter, sqlParamsList) {
    // const joinStatementOutput = joinsInputList
    //   .map((joinCondition) => {
    //     const { table, joinType, conditions } = joinCondition;

    //     sqlParamsList.push(joinType);
    //     if (joinCondition.alias) sqlParamsList.push(joinCondition.alias);
    //     // HANDLE!!
    //     return `$${++sqlParamsCounter.counter} JOIN ${'"' + table + '"'} ${
    //       joinCondition.alias ? '$' + ++sqlParamsCounter.counter : ''
    //     } ON ${this.constructWhereStatement(conditions, internalTableIdToNameMap, sqlParamsCounter, sqlParamsList)}`;
    //   })
    //   .join('\n');
    // return joinStatementOutput;

    const joinStatementOutput = joinsInputList
      .map((joinCondition) => {
        const { table, joinType, conditions } = joinCondition;
        return `${joinType} JOIN ${'"' + table + '"'} ${
          joinCondition.alias ? joinCondition.alias : ''
        } ON ${this.constructWhereStatement(conditions, internalTableIdToNameMap, sqlParamsCounter, sqlParamsList)}`;
      })
      .join('\n');
    return joinStatementOutput;
  }

  private constructWhereStatement(whereStatementConditions, internalTableIdToNameMap, sqlParamsCounter, sqlParamsList) {
    // const { operator = 'AND', conditionsList = [] } = whereStatementConditions;
    // const whereConditionOutput = conditionsList
    //   .map((condition) => {
    //     // @description: Recursive call to build - Sub-condition
    //     if (condition.conditions)
    //       return `(${this.constructWhereStatement(
    //         condition.conditions,
    //         internalTableIdToNameMap,
    //         sqlParamsCounter,
    //         sqlParamsList
    //       )})`;
    //     // @description: Building a Condition for 'WHERE & HAVING statements' - LHS, operator and RHS
    //     // @description: In LHS & RHS it is not mandatory to provide table name, but column name is mandatory
    //     // @description: In LHS & RHS - We get function only in HAVING statement
    //     const { operator, leftField, rightField } = condition;
    //     // @desc: When 'IS' operator is choosed, 'NULL' & 'NOT NULL' keywords will be provided as value and it should not be converted to string
    //     const keywords = ['NULL', 'NOT NULL'];

    //     let leftSideInput = ``;
    //     if (leftField.type === 'Value') {
    //       const dontAddQuotes =
    //         (keywords.includes(leftField.value) && operator === 'IS') || operator === 'IN' || operator === 'NOT IN';

    //       dontAddQuotes
    //         ? sqlParamsList.push(leftField.value)
    //         : sqlParamsList.push(this.addQuotesIfString(leftField.value));
    //       leftSideInput += dontAddQuotes ? `$${++sqlParamsCounter.counter}` : `$${++sqlParamsCounter.counter}`;
    //     } else {
    //       if (leftField.function) {
    //         sqlParamsList.push(leftField.function);
    //         leftSideInput += `$${++sqlParamsCounter.counter}(`;
    //       }
    //       // HANDLE!!
    //       sqlParamsList.push(leftField.columnName);
    //       leftSideInput += `${leftField.table ? '"' + leftField.table + '"' + '.' : ''}$${++sqlParamsCounter.counter}`;
    //       if (leftField.function) leftSideInput += `)`;
    //     }

    //     let rightSideInput = ``;
    //     if (rightField.type === 'Value') {
    //       const dontAddQuotes =
    //         (keywords.includes(rightField.value) && operator === 'IS') || operator === 'IN' || operator === 'NOT IN';

    //       dontAddQuotes
    //         ? sqlParamsList.push(rightField.value)
    //         : sqlParamsList.push(this.addQuotesIfString(rightField.value));
    //       rightSideInput += dontAddQuotes ? `$${++sqlParamsCounter.counter}` : `$${++sqlParamsCounter.counter}`;
    //     } else {
    //       if (rightField.function) {
    //         sqlParamsList.push(rightField.function);
    //         rightSideInput += `$${++sqlParamsCounter.counter}(`;
    //       }
    //       // HANDLE!!
    //       sqlParamsList.push(rightField.columnName);
    //       rightSideInput += `${
    //         rightField.table ? '"' + rightField.table + '"' + '.' : ''
    //       }$${++sqlParamsCounter.counter}`;
    //       if (rightField.function) rightSideInput += `)`;
    //     }

    //     return `${leftSideInput} ${operator} ${rightSideInput}`;
    //   })
    //   .join(` ${operator} `);
    // return whereConditionOutput;

    const { operator = 'AND', conditionsList = [] } = whereStatementConditions;
    const whereConditionOutput = conditionsList
      .map((condition) => {
        // @description: Recursive call to build - Sub-condition
        if (condition.conditions)
          return `(${this.constructWhereStatement(
            condition.conditions,
            internalTableIdToNameMap,
            sqlParamsCounter,
            sqlParamsList
          )})`;
        // @description: Building a Condition for 'WHERE & HAVING statements' - LHS, operator and RHS
        // @description: In LHS & RHS it is not mandatory to provide table name, but column name is mandatory
        // @description: In LHS & RHS - We get function only in HAVING statement
        const { operator, leftField, rightField } = condition;
        // @desc: When 'IS' operator is choosed, 'NULL' & 'NOT NULL' keywords will be provided as value and it should not be converted to string
        const keywords = ['NULL', 'NOT NULL'];

        let leftSideInput = ``;
        if (leftField.type === 'Value') {
          const dontAddQuotes =
            (keywords.includes(leftField.value) && operator === 'IS') || operator === 'IN' || operator === 'NOT IN';

          leftSideInput += dontAddQuotes ? leftField.value : this.addQuotesIfString(leftField.value);
        } else {
          if (leftField.function) leftSideInput += `${leftField.function}(`;
          leftSideInput += `${leftField.table ? '"' + leftField.table + '"' + '.' : ''}${leftField.columnName}`;
          if (leftField.function) leftSideInput += `)`;
        }

        let rightSideInput = ``;
        if (rightField.type === 'Value') {
          const dontAddQuotes =
            (keywords.includes(rightField.value) && operator === 'IS') || operator === 'IN' || operator === 'NOT IN';

          rightSideInput += dontAddQuotes ? rightField.value : this.addQuotesIfString(rightField.value);
        } else {
          if (rightField.function) rightSideInput += `${rightField.function}(`;
          rightSideInput += `${rightField.table ? '"' + rightField.table + '"' + '.' : ''}${rightField.columnName}`;
          if (rightField.function) rightSideInput += `)`;
        }

        return `${leftSideInput} ${operator} ${rightSideInput}`;
      })
      .join(` ${operator} `);
    return whereConditionOutput;
  }

  private constructGroupByStatement(groupByInputList, _internalTableIdToNameMap, sqlParamsCounter, sqlParamsList) {
    return groupByInputList
      .map((groupByInput) => {
        sqlParamsList.push(groupByInput.columnName);
        // HANDLE!!
        return `${'"' + groupByInput.table + '"'}.$${++sqlParamsCounter.counter}`;
      })
      .join(', ');
  }

  private constructOrderByStatement(orderByInputList, internalTableIdToNameMap, sqlParamsCounter, sqlParamsList) {
    // @description: For "ORDER BY" statement table field is optional. But column_name & order_by direction is mandatory
    return orderByInputList
      .map((orderByInput) => {
        const { columnName, direction } = orderByInput;
        return `${orderByInput.table ? '"' + orderByInput.table + '"' + '.' : ''}${columnName} ${direction}`;
      })
      .join(`, `);

    // // @description: For "ORDER BY" statement table field is optional. But column_name & order_by direction is mandatory
    // return orderByInputList
    //   .map((orderByInput) => {
    //     const { columnName, direction } = orderByInput;

    //     sqlParamsList.push(columnName);
    //     sqlParamsList.push(direction);
    //     // HANDLE!!
    //     return `${
    //       orderByInput.table ? '"' + orderByInput.table + '"' + '.' : ''
    //     }$${++sqlParamsCounter.counter} $${++sqlParamsCounter.counter}`;
    //   })
    //   .join(`, `);
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
}
