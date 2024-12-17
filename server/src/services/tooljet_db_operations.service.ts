import { Injectable, NotFoundException } from '@nestjs/common';
import PostgrestQueryBuilder from 'src/helpers/postgrest_query_builder';
import { QueryService, QueryResult, QueryError } from '@tooljet/plugins/dist/packages/common/lib';
import { TooljetDbService } from './tooljet_db.service';
import { isEmpty } from 'lodash';
import { PostgrestProxyService } from './postgrest_proxy.service';
import { maybeSetSubPath } from 'src/helpers/utils.helper';
import { AST, Parser } from 'node-sql-parser/build/postgresql';
import {
  createTooljetDatabaseConnection,
  decryptTooljetDatabasePassword,
  findTenantSchema,
  modifyTjdbErrorObject,
} from 'src/helpers/tooljet_db.helper';
import { EntityManager, In, QueryFailedError } from 'typeorm';
import { OrganizationTjdbConfigurations } from 'src/entities/organization_tjdb_configurations.entity';
import { Organization } from 'src/entities/organization.entity';
import { InternalTable } from 'src/entities/internal_table.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { PostgrestError, TooljetDatabaseError } from '@modules/tooljet_db/tooljet-db.types';
import { ConfigService } from '@nestjs/config';
import { TooljetDbBulkUploadService } from './tooljet_db_bulk_upload.service';

// This service encapsulates all TJDB data manipulation operations
// which can act like any other datasource
@Injectable()
export class TooljetDbOperationsService implements QueryService {
  constructor(
    private readonly manager: EntityManager,
    private tooljetDbService: TooljetDbService,
    private postgrestProxyService: PostgrestProxyService,
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager,
    private readonly configService: ConfigService,
    private readonly tooljetDbBulkUploadService: TooljetDbBulkUploadService
  ) {}

  async run(
    _sourceOptions,
    queryOptions,
    _dataSourceCacheId,
    _dataSourceCacheUpdatedAt,
    context
  ): Promise<QueryResult> {
    switch (queryOptions.operation) {
      case 'list_rows':
        return this.listRows(queryOptions, context);
      case 'create_row':
        return this.createRow(queryOptions, context);
      case 'update_rows':
        return this.updateRows(queryOptions, context);
      case 'delete_rows':
        return this.deleteRows(queryOptions, context);
      case 'join_tables':
        // custom implementation without PostgREST
        return this.joinTables(queryOptions, context);
      case 'sql_execution':
        return this.sqlExecution(queryOptions, context);
      case 'bulk_update_with_primary_key':
        return this.bulkUpdateWithPrimaryKey(queryOptions, context);
      default:
        return {
          status: 'failed',
          data: {},
          errorMessage: 'Invalid operation',
        };
    }
  }

  private async proxyPostgrest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    headers: Record<string, string>,
    body: Record<string, any> = {}
  ): Promise<QueryResult> {
    const result: any = await this.postgrestProxyService.perform(url, method, headers, body);

    return { status: 'ok', data: result };
  }

  async bulkUpdateWithPrimaryKey(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'bulk_update_with_primary_key')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }

    try {
      const { table_id: tableId, bulk_update_with_primary_key: bulkUpdateWithPrimaryKey } = queryOptions;
      const { primary_key: primaryKeyColumn, rows_update: rowsToUpdate } = bulkUpdateWithPrimaryKey;
      const { organization_id: organizationId } = context.app;

      const result = await this.tooljetDbBulkUploadService.bulkUpdateRowsWithPrimaryKey(
        rowsToUpdate,
        tableId,
        primaryKeyColumn,
        organizationId
      );

      if (result.status === 'failed') {
        return {
          status: result?.status,
          errorMessage: result?.error,
          data: {},
        };
      } else if (result.status === 'ok') {
        return {
          status: 'ok',
          data: result.data,
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: error,
        data: {},
      };
    }
  }

  async listRows(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'list_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    try {
      const { table_id: tableId, list_rows: listRows } = queryOptions;
      const { organization_id: organizationId } = context.app;
      const query = [];

      if (!isEmpty(listRows)) {
        const {
          limit,
          where_filters: whereFilters,
          order_filters: orderFilters,
          offset,
          aggregates = {},
          group_by: groupBy = {},
        } = listRows;

        if (limit && isNaN(limit))
          throw new QueryError('An incorrect limit value.', 'Limit should be a valid integer', {});
        if (offset && isNaN(offset))
          throw new QueryError('An incorrect offset value.', 'Offset should be a valid integer', {});

        const internalTable = await this.manager.findOne(InternalTable, {
          where: {
            organizationId,
            id: tableId,
          },
        });

        if (!internalTable) throw new NotFoundException('Table not found');

        const whereQuery = buildPostgrestQuery(whereFilters);
        const orderQuery = buildPostgrestQuery(orderFilters);
        if (!isEmpty(aggregates) || !isEmpty(groupBy)) {
          const groupByAndAggregateQueryList = this.buildAggregateAndGroupByQuery(
            internalTable.tableName,
            aggregates,
            groupBy
          );
          if (groupByAndAggregateQueryList.length) query.push(`select=${groupByAndAggregateQueryList.join(',')}`);
        }
        !isEmpty(whereQuery) && query.push(whereQuery);
        !isEmpty(orderQuery) && query.push(orderQuery);
        !isEmpty(limit) && query.push(`limit=${limit}`);
        !isEmpty(offset) && query.push(`offset=${offset}`);
      }

      const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': organizationId };
      const url =
        query.length > 0
          ? `/api/tooljet-db/proxy/${tableId}` + `?${query.join('&')}`
          : `/api/tooljet-db/proxy/${tableId}`;

      return await this.proxyPostgrest(maybeSetSubPath(url), 'GET', headers);
    } catch (error) {
      throw new QueryError(error.message, error.message, {});
    }
  }

  async createRow(queryOptions, context): Promise<QueryResult> {
    const columns = Object.values(queryOptions.create_row).reduce((acc, colOpts: { column: string; value: any }) => {
      if (isEmpty(colOpts.column)) return acc;
      return Object.assign(acc, { [colOpts.column]: colOpts.value });
    }, {});
    const { organization_id: organizationId } = context.app;
    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': organizationId };

    const url = maybeSetSubPath(`/api/tooljet-db/proxy/${queryOptions.table_id}`);
    return await this.proxyPostgrest(url, 'POST', headers, columns);
  }

  async updateRows(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'update_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    const { table_id: tableId, update_rows: updateRows } = queryOptions;
    const { where_filters: whereFilters, columns } = updateRows;
    const { organization_id: organizationId } = context.app;

    const query = [];
    const whereQuery = buildPostgrestQuery(whereFilters);
    const body = Object.values<{ column: string; value: any }>(columns).reduce((acc, colOpts) => {
      if (isEmpty(colOpts.column)) return acc;
      return Object.assign(acc, { [colOpts.column]: colOpts.value });
    }, {});

    !isEmpty(whereQuery) && query.push(whereQuery);

    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': organizationId };
    const url = maybeSetSubPath(`/api/tooljet-db/proxy/${tableId}?` + query.join('&') + '&order=id');
    return await this.proxyPostgrest(url, 'PATCH', headers, body);
  }

  async deleteRows(queryOptions, context): Promise<QueryResult> {
    if (hasNullValueInFilters(queryOptions, 'delete_rows')) {
      return {
        status: 'failed',
        errorMessage: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
        data: {},
      };
    }
    const { table_id: tableId, delete_rows: deleteRows = { whereFilters: {} } } = queryOptions;
    const { where_filters: whereFilters, limit = 1 } = deleteRows;
    const { organization_id: organizationId } = context.app;

    const query = [];
    const whereQuery = buildPostgrestQuery(whereFilters);
    if (isEmpty(whereQuery)) {
      return {
        status: 'failed',
        errorMessage: 'Please provide a where filter or a limit to delete rows',
        data: {},
      };
    }

    if (limit && isNaN(limit)) {
      throw new QueryError('An incorrect limit value.', 'Limit should be a valid integer', {});
    }

    !isEmpty(whereQuery) && query.push(whereQuery);
    limit && limit !== '' && query.push(`limit=${limit}&order=id`);

    const headers = { 'data-query-id': queryOptions.id, 'tj-workspace-id': organizationId };
    const url = maybeSetSubPath(`/api/tooljet-db/proxy/${tableId}?` + query.join('&'));
    return await this.proxyPostgrest(url, 'DELETE', headers);
  }

  async joinTables(queryOptions, context): Promise<QueryResult> {
    const { organization_id: organizationId } = context.app;
    const { join_table = {} } = queryOptions;

    // Empty Input is restricted
    if (Object.keys(join_table).length === 0) {
      return {
        status: 'failed',
        errorMessage: `Input can't be empty`,
        data: {},
      };
    }

    const sanitizedJoinTableJson = { ...join_table };
    // If mandatory fields ( Select, Join & From section ), are empty throw error
    const mandatoryFieldsButEmpty = [];
    if (!sanitizedJoinTableJson?.fields.length && isEmpty(sanitizedJoinTableJson.aggregates))
      mandatoryFieldsButEmpty.push('Select and Aggregate');
    if (sanitizedJoinTableJson?.from && !Object.keys(sanitizedJoinTableJson?.from).length)
      mandatoryFieldsButEmpty.push('From');

    if (mandatoryFieldsButEmpty.length) {
      return {
        status: 'failed',
        errorMessage: `Empty values are found in the following section - ${mandatoryFieldsButEmpty.join(', ')}.`,
        data: {},
      };
    }

    if (sanitizedJoinTableJson.limit && isNaN(sanitizedJoinTableJson.limit)) {
      throw new QueryError('An incorrect limit value.', 'Limit should be a valid integer', {});
    }

    if (sanitizedJoinTableJson.offset && isNaN(sanitizedJoinTableJson.offset)) {
      throw new QueryError('An incorrect offset value.', 'Offset should be a valid integer', {});
    }

    // If non-mandatory fields ( Filter & Sort ) are empty - remove the particular field
    if (
      sanitizedJoinTableJson?.conditions &&
      (!Object.keys(sanitizedJoinTableJson?.conditions)?.length ||
        !sanitizedJoinTableJson?.conditions?.conditionsList?.length)
    ) {
      delete sanitizedJoinTableJson.conditions;
    }

    // Sanitise the GroupBy and Aggregate JSON properly
    if (sanitizedJoinTableJson.group_by && !Object.keys(sanitizedJoinTableJson.group_by)?.length) {
      delete sanitizedJoinTableJson.group_by;
    }

    if (sanitizedJoinTableJson.aggregates && !Object.keys(sanitizedJoinTableJson.aggregates)?.length) {
      delete sanitizedJoinTableJson.aggregates;
    }

    if (sanitizedJoinTableJson?.order_by && !sanitizedJoinTableJson?.order_by.length)
      delete sanitizedJoinTableJson.order_by;

    const result = await this.tooljetDbService.perform(organizationId, 'join_tables', {
      joinQueryJson: sanitizedJoinTableJson,
    });

    return { status: 'ok', data: { result } };
  }

  async sqlExecution(queryOptions, context): Promise<QueryResult> {
    if (this.configService.get<string>('TJDB_SQL_MODE_DISABLE') === 'true')
      throw new QueryError('SQL execution is disabled', 'Contact Admin to enable SQL execution', {});

    const { organization_id: organizationId } = context.app;
    const { sql_execution: sqlExecution = {} } = queryOptions;
    const { sqlQuery = '' } = sqlExecution;
    if (isEmpty(sqlQuery)) return;

    // Check for Workspace
    const workspaceDetails = await this.manager.findOne(Organization, {
      where: { id: organizationId },
    });
    if (!workspaceDetails) throw new NotFoundException(`Workspace doesn't exists`);

    // Check for Tjdb Configuration
    const tjdbTenantConfigs = await this.manager.findOne(OrganizationTjdbConfigurations, {
      where: { organizationId },
    });
    if (!tjdbTenantConfigs) throw new NotFoundException(`Tooljet database schema configuration doesn't exists`);

    const { pgPassword, pgUser } = tjdbTenantConfigs;
    const tjdbPassKey = await decryptTooljetDatabasePassword(pgPassword);
    const tenantSchema = findTenantSchema(organizationId);
    const { tooljetDbTenantConnection } = await createTooljetDatabaseConnection(tjdbPassKey, pgUser, tenantSchema);

    let ast;
    let tableList;
    const sqlParser = new Parser();

    try {
      const parsedSQL = sqlParser.parse(sqlQuery);
      ast = parsedSQL.ast;
      tableList = parsedSQL.tableList;
    } catch (error) {
      return {
        status: 'failed',
        errorMessage: 'Syntax error encountered',
        data: { name: error?.name, message: error?.message },
      };
    }

    const internalTableInfo = [];

    try {
      // Operation AllowList check
      const isValidCommand = await this.checkCommandAllowlist(ast);
      if (!isValidCommand) throw new Error('This SQL functionality is restricted.');

      // Updating SearchPath for a session
      await tooljetDbTenantConnection.query(`SET search_path TO "${tenantSchema}"`);

      const { tablesUsedInQuery, tableAndSchemaList } = this.parseTableListFromASTParser(tableList);
      // Validate tables are exists in workspace.
      const tableDetailsInList = await this.verifyTablesExistInWorkspace(tablesUsedInQuery, organizationId);
      const internalTableNameToIdMap = tablesUsedInQuery.reduce((acc, tableName) => {
        const tableId = tableDetailsInList.find((table) => table.tableName === tableName).id;
        internalTableInfo.push({ id: tableId, tableName: tableName });

        return {
          ...acc,
          [tableName]: tableId,
        };
      }, {});

      await this.validateSchemaAndTablePrivileges(
        this.tooljetDbManager,
        tenantSchema,
        pgUser,
        tableAndSchemaList,
        internalTableNameToIdMap
      );

      this.parseTableNameInAST(ast, internalTableNameToIdMap);
      const validSql = await sqlParser.sqlify(ast);
      const results = await tooljetDbTenantConnection.query(validSql);
      return { status: 'ok', data: { results } };
    } catch (error) {
      const modifiedErrorObj = modifyTjdbErrorObject(error);
      const errorObj = new QueryFailedError(error, [], new PostgrestError(modifiedErrorObj));
      const tjdbErrorObj = new TooljetDatabaseError(
        error.message,
        {
          origin: 'sql_execution',
          internalTables: internalTableInfo,
        },
        errorObj
      );
      const alteredErrorMessage = tjdbErrorObj.toString();
      throw new QueryError(alteredErrorMessage, alteredErrorMessage, {});
    } finally {
      await tooljetDbTenantConnection.destroy();
    }
  }

  /**
   * Helper function to UPDATE TableName with TableId in the parsed sql (AST)
   * @param parsedSql - AST Json for SQL
   * @param internalTableNameToIdMap - Object which holds tablename and its respective tableId
   */
  private parseTableNameInAST(parsedSql, internalTableNameToIdMap) {
    if (Array.isArray(parsedSql)) {
      parsedSql.forEach((item) => this.parseTableNameInAST(item, internalTableNameToIdMap));
    } else if (typeof parsedSql === 'object' && parsedSql !== null) {
      if (parsedSql['table'] && !isEmpty(internalTableNameToIdMap)) {
        parsedSql.table = internalTableNameToIdMap[parsedSql.table]
          ? internalTableNameToIdMap[parsedSql.table]
          : parsedSql.table;
      }
      Object.keys(parsedSql).forEach((key) => {
        this.parseTableNameInAST(parsedSql[key], internalTableNameToIdMap);
      });
    }
  }

  /**
   * Function to validate, if SQL operations are in allowlist else it is invalid SQL command.
   * @param parsedSqlAst
   * @returns boolean
   */
  private checkCommandAllowlist(parsedSqlAst: AST[] | AST): boolean {
    const allowList = ['select', 'insert', 'update', 'delete', 'transaction'];
    let isValidCommand = true;
    if (Array.isArray(parsedSqlAst)) {
      parsedSqlAst.forEach((sqlExpression) => {
        if (!allowList.includes(sqlExpression.type)) isValidCommand = false;
      });
    }

    if (!Array.isArray(parsedSqlAst) && parsedSqlAst.type) {
      if (!allowList.includes(parsedSqlAst.type)) isValidCommand = false;
    }
    return isValidCommand;
  }

  /**
   * Function to verify that all the tables mentioned in the SQL query are exists and valid.
   * @param tablesUsedInquery - Table names in list
   * @param organizationId - Workspace id
   * @returns Table details as list.
   */
  private async verifyTablesExistInWorkspace(tablesUsedInquery: Array<string>, organizationId: string) {
    const tableDetailsInList = await this.manager.find(InternalTable, {
      where: {
        organizationId: organizationId,
        tableName: In(tablesUsedInquery),
      },
    });
    const tableList = tableDetailsInList.map((table) => table.tableName);
    const tablesNotInOrg = tablesUsedInquery.filter((tableName) => !tableList.includes(tableName));
    if (isEmpty(tablesNotInOrg)) return tableDetailsInList;
    throw new NotFoundException(`Table: ${tablesNotInOrg.join(', ')} not found`);
  }

  /**
   * Function to parse tableList from SQL parser, which will be in specific format like <statement_type>::<schema>::<table>.
   * This function splits the mentioned format into schema and table separately.
   * @param tableList - Strings in list - String format will be <statement_type>::<schema>::<table>
   * @returns
   */
  private parseTableListFromASTParser(tableList: Array<string>): {
    tablesUsedInQuery: Array<string>;
    tableAndSchemaList: Array<{ schema: string; table: string }>;
  } {
    const tablesUsedInQuery = [];
    const results = tableList.map((parsedTable) => {
      const separatedString = parsedTable.split('::');
      if (!isEmpty(separatedString[2])) tablesUsedInQuery.push(separatedString[2]);
      return { schema: separatedString[1] !== 'null' ? separatedString[1] : null, table: separatedString[2] };
    });
    return { tablesUsedInQuery: tablesUsedInQuery, tableAndSchemaList: results };
  }

  /**
   * Function to validate Access to Schema and Tables mentioned in query for the Tenant user.
   * @param tooljetDbManager
   * @param tenantSchema - Schema for specific workspace.
   * @param pgUser - Tenant user
   * @param tableAndSchemaList
   * @param internalTableNameToIdMap
   */
  private async validateSchemaAndTablePrivileges(
    tooljetDbManager: EntityManager,
    tenantSchema: string,
    pgUser: string,
    tableAndSchemaList: Array<{ schema: string; table: string }>,
    internalTableNameToIdMap
  ) {
    // Validates if Tenant User has access to Workspace Schema.
    await this.validateSchemaPrivileges(tooljetDbManager, pgUser, tenantSchema);
    for (const tableAndSchema of tableAndSchemaList) {
      const { schema, table } = tableAndSchema;
      if (schema) await this.validateSchemaPrivileges(tooljetDbManager, pgUser, schema);
      if (!isEmpty(internalTableNameToIdMap[table]))
        await this.validateUserHasTablePrivileges(
          internalTableNameToIdMap,
          tooljetDbManager,
          pgUser,
          schema,
          table,
          tenantSchema
        );
    }
  }

  private async validateSchemaPrivileges(tooljetDbManager: EntityManager, pgUser: string, schema: string) {
    const [{ has_schema_privilege }] = await tooljetDbManager.query(
      `SELECT has_schema_privilege('${pgUser}', '${schema}', 'USAGE')`
    );
    if (!has_schema_privilege) throw new Error('You are not authorized to perform actions on some schemas.');
  }

  private async validateUserHasTablePrivileges(
    internalTableNameToIdMap,
    tooljetDbManager: EntityManager,
    pgUser: string,
    schema: string,
    tableName: string,
    tenantSchema: string
  ) {
    const queryToExecute = schema
      ? `SELECT has_table_privilege('${pgUser}', '${schema}.${internalTableNameToIdMap[tableName]}', 'SELECT')`
      : `SELECT has_table_privilege('${pgUser}', '${tenantSchema}.${internalTableNameToIdMap[tableName]}', 'SELECT')`;
    const [{ has_table_privilege }] = await tooljetDbManager.query(queryToExecute);
    if (!has_table_privilege) throw new Error('TJDB table permission denied');
  }

  private buildAggregateAndGroupByQuery(
    tableName: string,
    aggregates: { [key: string]: { aggFx: string; column: string } },
    groupBy: { [key: string]: Array<string> }
  ) {
    enum AggregateFunctions {
      sum = 'sum',
      count = 'count',
    }

    const query = [];
    if (!isEmpty(aggregates)) {
      Object.entries(aggregates).forEach(([_key, aggregateDetail]) => {
        const { aggFx, column } = aggregateDetail;
        if (isEmpty(column) || isEmpty(aggFx))
          throw new Error('There are empty values in certain aggregate conditions.');
        if (aggFx && column) query.push(`${tableName}_${column}_${aggFx}:${column}.${AggregateFunctions[aggFx]}()`);
      });
    }

    if (!isEmpty(groupBy)) {
      Object.entries(groupBy).forEach(([_key, groupByColumList]) => {
        if (!isEmpty(groupByColumList)) query.push(...groupByColumList);
      });
    }

    return query;
  }
}

function hasNullValueInFilters(queryOptions, operation) {
  const filters = queryOptions.operation?.where_filters;
  if (filters) {
    const filterKeys = Object.keys(filters);
    for (let i = 0; i < filterKeys.length; i++) {
      const filter = filters[filterKeys[i]];
      if (filter.operator !== 'is' && filter.value === null) {
        return true;
      }
    }
  }
  return false;
}

function buildPostgrestQuery(filters) {
  if (isEmpty(filters)) return null;

  const postgrestQueryBuilder = new PostgrestQueryBuilder();

  Object.keys(filters).map((key) => {
    if (!isEmpty(filters[key])) {
      const { column, operator, value, order, jsonpath = '' } = filters[key];

      if (!isEmpty(column) && !isEmpty(order)) {
        const columnName = jsonpath ? `${column}${jsonpath}` : column;
        postgrestQueryBuilder.order(columnName, order);
      }

      if (!isEmpty(column) && !isEmpty(operator)) {
        const columnName = jsonpath ? `${column}${jsonpath}` : column;
        postgrestQueryBuilder[operator](columnName, value);
      }
    }
  });
  return postgrestQueryBuilder.url.toString();
}
