import { Knex, knex } from 'knex';
import {
  ConnectionTestResult,
  QueryError,
  QueryResult,
  QueryService,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  createQueryBuilder,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { isEmpty } from '@tooljet-plugins/common';

const recognizedBooleans = {
  true: true,
  false: false,
};

function interpretValue(value: string): string | boolean | number {
  return recognizedBooleans[value.toLowerCase()] ?? (!isNaN(Number.parseInt(value)) ? Number.parseInt(value) : value);
}

export default class MssqlQueryService implements QueryService {
  private static _instance: MssqlQueryService;
  private STATEMENT_TIMEOUT;

  constructor() {
    this.STATEMENT_TIMEOUT =
      process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT && !isNaN(Number(process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT))
        ? Number(process.env.PLUGINS_SQL_DB_STATEMENT_TIMEOUT)
        : 120000;

    if (!MssqlQueryService._instance) {
      MssqlQueryService._instance = this;
    }
    return MssqlQueryService._instance;
  }

  sanitizeOptions(options: string[][]) {
    const _connectionOptions = (options || [])
      .filter((o) => o.every((e) => !!e))
      .map(([key, value]) => [key, interpretValue(value)]);

    return Object.fromEntries(_connectionOptions);
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    try {
      const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

      switch (queryOptions.mode) {
        case 'sql':
          return await this.handleRawQuery(knexInstance, queryOptions);
        case 'gui':
          return await this.handleGuiQuery(knexInstance, queryOptions);
        default:
          throw new Error("Invalid query mode. Must be either 'sql' or 'gui'.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      const errorDetails: any = {};

      if (err && err instanceof Error) {
        const msSqlError = err as any;
        const { code, severity, state, number, lineNumber, serverName, class: errorClass } = msSqlError;
        errorDetails.code = code || null;
        errorDetails.severity = severity || null;
        errorDetails.state = state || null;
        errorDetails.number = number || null;
        errorDetails.lineNumber = lineNumber || null;
        errorDetails.serverName = serverName || null;
        errorDetails.class = errorClass || null;
      }
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }
  }

  private async handleGuiQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { operation, table } = queryOptions;
    const queryBuilder = createQueryBuilder('mssql');

    switch (operation) {
      case 'list_rows': {
        const { where_filters, order_filters, aggregates, group_by, limit, offset } = queryOptions;
        const { query, params } = queryBuilder.listRows(table, {
          where_filters,
          order_filters,
          aggregates,
          group_by,
          limit,
          offset,
        }) as { query: string; params: unknown[] };
        const rows = await this.executeParameterizedQuery(knexInstance, query, params);
        return { status: 'ok', data: rows };
      }

      case 'create_row': {
        const { columns } = queryOptions;
        const { query, params } = queryBuilder.createRow(table, columns) as { query: string; params: unknown[] };
        const rows = await this.executeParameterizedQuery(knexInstance, query, params);
        return { status: 'ok', data: rows };
      }

      case 'update_rows': {
        const { columns, where_filters } = queryOptions;
        const { query, params } = queryBuilder.updateRows(table, { columns, where_filters }) as {
          query: string;
          params: unknown[];
        };
        const rows = await this.executeParameterizedQuery(knexInstance, query, params);
        return { status: 'ok', data: rows };
      }

      case 'delete_rows': {
        const { where_filters, limit } = queryOptions;
        const { query, params } = queryBuilder.deleteRows(table, { where_filters, limit }) as {
          query: string;
          params: unknown[];
        };
        const rows = await this.executeParameterizedQuery(knexInstance, query, params);
        return { status: 'ok', data: rows };
      }

      case 'bulk_insert': {
        const { records } = queryOptions;
        const { query, params } = queryBuilder.bulkInsert(table, { rows_insert: records }) as {
          query: string;
          params: unknown[];
        };
        const rows = await this.executeParameterizedQuery(knexInstance, query, params);
        return { status: 'ok', data: rows };
      }

      case 'bulk_update_pkey': {
        const { primary_key_column, records } = queryOptions;
        const { queries } = queryBuilder.bulkUpdateWithPrimaryKey(table, {
          primary_key: [primary_key_column],
          rows_update: records,
        }) as { queries: { query: string; params: unknown[] }[] };
        await this.executeBulkQueriesInTransaction(knexInstance, queries);
        return { status: 'ok', data: [] };
      }

      case 'bulk_upsert_pkey': {
        const { primary_key_column, records } = queryOptions;
        const { queries } = queryBuilder.bulkUpsertWithPrimaryKey(table, {
          primary_key: [primary_key_column],
          row_upsert: records,
        }) as { queries: { query: string; params: unknown[] }[] };
        await this.executeBulkQueriesInTransaction(knexInstance, queries);
        return { status: 'ok', data: [] };
      }

      default:
        throw new Error(`Unsupported GUI operation: "${operation}"`);
    }
  }

  private async executeParameterizedQuery(knexInstance: Knex, query: string, params: unknown[]): Promise<unknown> {
    const result = await knexInstance.raw(query, params as any[]).timeout(this.STATEMENT_TIMEOUT);
    return result;
  }

  private async executeBulkQueriesInTransaction(
    knexInstance: Knex,
    queries: { query: string; params: unknown[] }[]
  ): Promise<void> {
    await knexInstance.transaction(async (transaction) => {
      for (const { query, params } of queries) {
        await transaction.raw(query, params as any[]);
      }
    });
  }

  private async handleRawQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { query, query_params } = queryOptions;
    const queryParams = query_params || [];
    const sanitizedQueryParams: Record<string, any> = Object.fromEntries(queryParams.filter(([key]) => !isEmpty(key)));
    const result = await this.executeQuery(knexInstance, query, sanitizedQueryParams);

    return { status: 'ok', data: result };
  }

  private async executeQuery(knexInstance: Knex, query: string, sanitizedQueryParams: Record<string, any> = {}) {
    if (isEmpty(query)) throw new Error('Query is empty');

    const result = await knexInstance.raw(query, sanitizedQueryParams).timeout(this.STATEMENT_TIMEOUT);
    return result;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('select @@version;').timeout(this.STATEMENT_TIMEOUT);
    knexInstance.destroy();

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    const config: Knex.Config = {
      client: 'mssql',
      connection: {
        host: sourceOptions.host,
        user: sourceOptions.username,
        password: sourceOptions.password,
        database: sourceOptions.database,
        port: +sourceOptions.port,
        options: {
          encrypt: sourceOptions.azure ?? false,
          instanceName: sourceOptions.instanceName,
          ...(sourceOptions.connection_options && this.sanitizeOptions(sourceOptions.connection_options)),
        },
        pool: { min: 0 },
      },
    };

    return knex(config);
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<Knex> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const enhancedCacheKey = `${dataSourceId}_${optionsHash}`;
      let connection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);

      if (connection) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions);
        cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions);
    }
  }

  buildBulkUpdateQuery(queryOptions: QueryOptions): string {
    let queryText = '';

    const { table, primary_key_column, records } = queryOptions;

    for (const record of records) {
      const primaryKeyValue =
        typeof record[primary_key_column] === 'string' ? `'${record[primary_key_column]}'` : record[primary_key_column];

      queryText = `${queryText} UPDATE ${table} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primary_key_column) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primary_key_column} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }
}
