import knex, { Knex } from 'knex';
import {
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  ConnectionTestResult,
  QueryService,
  QueryResult,
  QueryError,
  createQueryBuilder,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { isEmpty } from '@tooljet-plugins/common';

export default class MysqlQueryService implements QueryService {
  private static _instance: MysqlQueryService;
  private STATEMENT_TIMEOUT;

  constructor() {
    this.STATEMENT_TIMEOUT =
      process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT && !isNaN(Number(process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT))
        ? Number(process.env.PLUGINS_SQL_DB_STATEMENT_TIMEOUT)
        : 120000;

    if (MysqlQueryService._instance) {
      return MysqlQueryService._instance;
    }
    MysqlQueryService._instance = this;
    return MysqlQueryService._instance;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    let checkCache, knexInstance;
    if (sourceOptions['allow_dynamic_connection_parameters']) {
      if (sourceOptions.connection_type === 'hostname') {
        sourceOptions['host'] = queryOptions['host'] ? queryOptions['host'] : sourceOptions['host'];
        sourceOptions['database'] = queryOptions['database'] ? queryOptions['database'] : sourceOptions['database'];
      } else if (sourceOptions.connection_type === 'socket_path') {
        sourceOptions['database'] = queryOptions['database'] ? queryOptions['database'] : sourceOptions['database'];
      }
    }

    try {
      // If dynamic connection parameters is toggled on - We don't cache the connection also destroy the connection created.
      checkCache = sourceOptions['allow_dynamic_connection_parameters'] ? false : true;
      knexInstance = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);

      switch (queryOptions.mode) {
        case 'sql':
          return await this.handleRawQuery(knexInstance, queryOptions);
        case 'gui':
          return await this.handleGuiQuery(knexInstance, queryOptions);
        default:
          throw new Error("Invalid query mode. Must be either 'sql' or 'gui'.");
      }
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      const errorDetails: any = {};

      if (err instanceof Error) {
        const mysqlError = err as any;
        const { code, errno, sqlMessage, sqlState } = mysqlError;

        errorDetails.code = code || null;
        errorDetails.errno = errno || null;
        errorDetails.sqlMessage = sqlMessage || null;
        errorDetails.sqlState = sqlState || null;
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    } finally {
      if (!checkCache) await knexInstance.destroy();
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('select @@version;').timeout(this.STATEMENT_TIMEOUT);
    knexInstance.destroy();
    return { status: 'ok' };
  }

  private async handleGuiQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { operation, table } = queryOptions;
    const queryBuilder = createQueryBuilder('mysql');

    switch (operation) {
      case 'list_rows': {
        const { list_rows, limit, offset } = queryOptions;
        const { where_filters, order_filters, aggregates, group_by } = list_rows || {};
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
        const { columns } = queryOptions.create_row || {};
        const { query, params } = queryBuilder.createRow(table, columns) as { query: string; params: unknown[] };
        const insertedRows = await this.executeCreateRow(knexInstance, queryBuilder, table, columns, query, params);
        return { status: 'ok', data: insertedRows };
      }

      case 'update_rows': {
        const { allow_multiple_updates, zero_records_as_success } = queryOptions;
        const { columns, where_filters } = queryOptions.update_rows || {};
        const { query, params } = queryBuilder.updateRows(table, { columns, where_filters }) as {
          query: string;
          params: unknown[];
        };
        const { query: selectQuery, params: selectParams } = queryBuilder.listRows(table, {
          where_filters,
        }) as { query: string; params: unknown[] };
        const rows = await this.executeWriteQuery(knexInstance, query, params, selectQuery, selectParams, {
          allow_multiple_updates,
          zero_records_as_success,
          operationLabel: 'updated',
        });
        return { status: 'ok', data: rows };
      }

      case 'upsert_rows': {
        const { primary_key_column, allow_multiple_updates, zero_records_as_success } = queryOptions;
        const { columns } = queryOptions.upsert_rows || {};
        const { query, params } = queryBuilder.upsertRows(table, { primary_key_column, columns }) as {
          query: string;
          params: unknown[];
        };
        const columnEntries = Object.values(columns || {});
        const primaryKeyEntry = columnEntries.find((entry: any) => entry.column === primary_key_column) as any;
        const primaryKeyValue = primaryKeyEntry?.value;
        const whereFiltersForSelect = {
          [primary_key_column]: { column: primary_key_column, operator: 'eq', value: primaryKeyValue },
        };
        const { query: selectQuery, params: selectParams } = queryBuilder.listRows(table, {
          where_filters: whereFiltersForSelect,
        }) as { query: string; params: unknown[] };
        const rows = await this.executeWriteQuery(knexInstance, query, params, selectQuery, selectParams, {
          allow_multiple_updates,
          zero_records_as_success,
          operationLabel: 'upserted',
        });
        return { status: 'ok', data: rows };
      }

      case 'delete_rows': {
        const { limit, zero_records_as_success } = queryOptions;
        const { where_filters } = queryOptions.delete_rows || {};
        const { query, params } = queryBuilder.deleteRows(table, { where_filters, limit }) as {
          query: string;
          params: unknown[];
        };
        const [okPacket] = await knexInstance.raw(query, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        const deletedRecords = okPacket.affectedRows || 0;

        if (zero_records_as_success === false && deletedRecords === 0) {
          throw new Error('No rows were deleted.');
        }

        return { status: 'ok', deletedRecords } as unknown as QueryResult;
      }

      case 'bulk_insert': {
        const { records } = queryOptions;
        const { query, params } = queryBuilder.bulkInsert(table, { rows_insert: records }) as {
          query: string;
          params: unknown[];
        };
        const [okPacket] = await knexInstance.raw(query, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        return { status: 'ok', data: okPacket };
      }

      case 'bulk_update_pkey': {
        const { primary_key_column, records } = queryOptions;
        const { queries } = queryBuilder.bulkUpdateWithPrimaryKey(table, {
          primary_key: [primary_key_column],
          rows_update: records,
        }) as { queries: { query: string; params: unknown[] }[] };
        const data = await this.executeBulkQueriesInTransaction(knexInstance, queries);
        return { status: 'ok', data, bulk_update_status: 'success' } as unknown as QueryResult;
      }

      case 'bulk_upsert_pkey': {
        const { primary_key_column, records } = queryOptions;
        const { queries } = queryBuilder.bulkUpsertWithPrimaryKey(table, {
          primary_key: [primary_key_column],
          row_upsert: records,
        }) as { queries: { query: string; params: unknown[] }[] };
        const data = await this.executeBulkQueriesInTransaction(knexInstance, queries);
        return { status: 'ok', data, bulk_upsert_status: 'success' } as unknown as QueryResult;
      }

      default:
        throw new Error(`Unsupported GUI operation: "${operation}"`);
    }
  }

  /**
   * Executes a SELECT query and returns the rows array.
   * MySQL raw() returns [rows, fields], so we destructure and return rows.
   */
  private async executeParameterizedQuery(knexInstance: Knex, query: string, params: unknown[]): Promise<unknown[]> {
    const [rows] = await knexInstance.raw(query, params as any[]).timeout(this.STATEMENT_TIMEOUT);
    return rows;
  }

  /**
   * Executes INSERT and then SELECTs back the inserted row(s) using the inserted column values as WHERE conditions.
   * Wrapped in a transaction to ensure consistency.
   */
  private async executeCreateRow(
    knexInstance: Knex,
    queryBuilder: ReturnType<typeof createQueryBuilder>,
    tableName: string,
    columns: Record<string, any> | undefined | null,
    insertQuery: string,
    insertParams: unknown[]
  ): Promise<unknown[]> {
    return knexInstance.transaction(async (transaction) => {
      await transaction.raw(insertQuery, insertParams as any[]);

      const columnEntries = Object.values(columns || {});
      if (columnEntries.length === 0) return [];

      const whereFilters = Object.fromEntries(
        columnEntries.map((entry: any) => [entry.column, { column: entry.column, operator: 'eq', value: entry.value }])
      );
      const { query: selectQuery, params: selectParams } = queryBuilder.listRows(tableName, {
        where_filters: whereFilters,
      }) as { query: string; params: unknown[] };

      const [rows] = await transaction.raw(selectQuery, selectParams as any[]);
      return rows;
    });
  }

  /**
   * Executes a write query (UPDATE or upsert) and checks affectedRows constraints.
   * When constraints apply, wraps in a transaction so violations automatically roll back.
   * After the write, SELECTs and returns the affected rows.
   */
  private async executeWriteQuery(
    knexInstance: Knex,
    writeQuery: string,
    writeParams: unknown[],
    selectQuery: string,
    selectParams: unknown[],
    options: { allow_multiple_updates?: boolean; zero_records_as_success?: boolean; operationLabel: string }
  ): Promise<unknown[]> {
    const { allow_multiple_updates, zero_records_as_success, operationLabel } = options;
    const hasConstraints = allow_multiple_updates === false || zero_records_as_success === false;

    if (!hasConstraints) {
      await knexInstance.raw(writeQuery, writeParams as any[]).timeout(this.STATEMENT_TIMEOUT);
      const [rows] = await knexInstance.raw(selectQuery, selectParams as any[]).timeout(this.STATEMENT_TIMEOUT);
      return rows;
    }

    return knexInstance.transaction(async (transaction) => {
      const [okPacket] = await transaction.raw(writeQuery, writeParams as any[]);
      const affectedRows = okPacket.affectedRows || 0;

      if (allow_multiple_updates === false && affectedRows > 1) {
        throw new Error(
          'Query matches more than one row. Enable "Allow this Query to modify multiple rows" to permit this.'
        );
      }

      if (zero_records_as_success === false && affectedRows === 0) {
        throw new Error(`No rows were ${operationLabel}.`);
      }

      const [rows] = await transaction.raw(selectQuery, selectParams as any[]);
      return rows;
    });
  }

  /**
   * Executes multiple queries sequentially inside a single transaction.
   * Returns the OkPacket from each query as an array.
   */
  private async executeBulkQueriesInTransaction(
    knexInstance: Knex,
    queries: { query: string; params: unknown[] }[]
  ): Promise<unknown[]> {
    const allResults: unknown[] = [];
    await knexInstance.transaction(async (transaction) => {
      for (const { query, params } of queries) {
        const [okPacket] = await transaction.raw(query, params as any[]);
        allResults.push(okPacket);
      }
    });
    return allResults;
  }

  private async handleRawQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { query, query_params } = queryOptions;
    const queryParams = query_params || [];
    const sanitizedQueryParams: Record<string, any> = Object.fromEntries(queryParams.filter(([key]) => !isEmpty(key)));
    const result = await this.executeQuery(knexInstance, query, sanitizedQueryParams);

    return { status: 'ok', data: result[0] };
  }

  private async executeQuery(knexInstance: Knex, query: string, sanitizedQueryParams: Record<string, any> = {}) {
    if (isEmpty(query)) throw new Error('Query is empty');

    const result = await knexInstance.raw(query, sanitizedQueryParams).timeout(this.STATEMENT_TIMEOUT);
    return result;
  }

  private connectionOptions(sourceOptions: SourceOptions) {
    const _connectionOptions = (sourceOptions?.connection_options || []).filter((o) => o.some((e) => !isEmpty(e)));
    const connectionOptions = Object.fromEntries(_connectionOptions);
    Object.keys(connectionOptions).forEach((key) =>
      connectionOptions[key] === '' ? delete connectionOptions[key] : {}
    );
    return connectionOptions;
  }

  private async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    const props = sourceOptions.socket_path
      ? { socketPath: sourceOptions.socket_path }
      : {
          host: sourceOptions.host,
          port: +sourceOptions.port,
        };

    const shouldUseSSL = sourceOptions.ssl_enabled;
    let sslObject: any = null;

    if (shouldUseSSL) {
      sslObject = { rejectUnauthorized: (sourceOptions.ssl_certificate ?? 'none') !== 'none' };

      if (sourceOptions.ssl_certificate === 'ca_certificate') {
        sslObject.ca = sourceOptions.ca_cert;
      } else if (sourceOptions.ssl_certificate === 'self_signed') {
        sslObject.ca = sourceOptions.root_cert;
        sslObject.key = sourceOptions.client_key;
        sslObject.cert = sourceOptions.client_cert;
      }
    }

    const config: Knex.Config = {
      client: 'mysql2',
      connection: {
        ...props,
        user: sourceOptions.username,
        password: sourceOptions.password,
        database: sourceOptions.database,
        multipleStatements: true,
        ...(shouldUseSSL ? { ssl: sslObject } : {}),
      },
      ...this.connectionOptions(sourceOptions),
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
      const cachedConnection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);
      if (cachedConnection) return cachedConnection;

      const connection = await this.buildConnection(sourceOptions);
      cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
      return connection;
    }

    return await this.buildConnection(sourceOptions);
  }

  buildBulkUpdateQuery(queryOptions: QueryOptions): string {
    let queryText = '';

    const { table: tableName, primary_key_column: primaryKey, records } = queryOptions;

    for (const record of records) {
      const primaryKeyValue = typeof record[primaryKey] === 'string' ? `'${record[primaryKey]}'` : record[primaryKey];

      queryText = `${queryText} UPDATE ${tableName} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primaryKey) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primaryKey} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }
}
