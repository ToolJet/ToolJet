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
        const result = await this.executeParameterizedQuery(knexInstance, query, params);
        return { status: 'ok', data: result };
      }

      case 'create_row': {
        const { columns } = queryOptions.create_row || {};
        const { query, params } = queryBuilder.createRow(table, columns) as { query: string; params: unknown[] };
        const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');
        const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        return { status: 'ok', data: result.recordset ?? [] };
      }

      case 'update_rows': {
        const { allow_multiple_updates, zero_records_as_success } = queryOptions;
        const { columns, where_filters } = queryOptions.update_rows || {};
        const { query, params } = queryBuilder.updateRows(table, { columns, where_filters }) as {
          query: string;
          params: unknown[];
        };
        const rows = await this.executeWriteQuery(knexInstance, query, params, {
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
        const rows = await this.executeWriteQuery(knexInstance, query, params, {
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
        const queryWithOutput = this.injectMssqlOutput(query, 'DELETED');
        const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        const deletedRecords = (result.recordset ?? []).length;

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
        const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');
        const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        return { status: 'ok', data: result.recordset ?? [] };
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
   * Injects an MSSQL OUTPUT clause into a generated SQL statement so that
   * affected rows are returned.
   *
   * - INSERT:  OUTPUT INSERTED.* is placed before the VALUES keyword.
   * - MERGE:   OUTPUT INSERTED.* is placed before the trailing semicolon.
   * - UPDATE / DELETE: OUTPUT clause is placed before the WHERE clause
   *   (or appended when there is no WHERE).
   */
  private injectMssqlOutput(query: string, outputType: 'INSERTED' | 'DELETED'): string {
    const outputClause = `OUTPUT ${outputType}.*`;

    // MERGE statement — inject OUTPUT before the trailing semicolon
    const trimmedQuery = query.trimEnd();
    if (trimmedQuery.toUpperCase().startsWith('MERGE')) {
      const base = trimmedQuery.endsWith(';') ? trimmedQuery.slice(0, -1) : trimmedQuery;
      return `${base} ${outputClause};`;
    }

    // INSERT statement — inject OUTPUT before the VALUES keyword
    const valuesIndex = query.indexOf(' VALUES ');
    if (valuesIndex !== -1) {
      return `${query.slice(0, valuesIndex)} ${outputClause}${query.slice(valuesIndex)}`;
    }

    // UPDATE / DELETE — inject OUTPUT before the WHERE clause
    const whereIndex = query.lastIndexOf(' WHERE ');
    if (whereIndex !== -1) {
      return `${query.slice(0, whereIndex)} ${outputClause}${query.slice(whereIndex)}`;
    }

    // No WHERE clause — append at end
    return `${query} ${outputClause}`;
  }

  /**
   * Executes a write query (UPDATE / MERGE) with OUTPUT INSERTED.* to surface
   * affected rows. Wraps in a transaction when constraint checks are active so
   * that any thrown error automatically rolls back the write.
   */
  private async executeWriteQuery(
    knexInstance: Knex,
    query: string,
    params: unknown[],
    options: { allow_multiple_updates?: boolean; zero_records_as_success?: boolean; operationLabel: string }
  ): Promise<unknown[]> {
    const { allow_multiple_updates, zero_records_as_success, operationLabel } = options;
    const hasConstraints = allow_multiple_updates === false || zero_records_as_success === false;

    const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');

    if (!hasConstraints) {
      const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
      return result.recordset ?? [];
    }

    // Wrap in a transaction so any thrown error automatically rolls back the write
    return knexInstance.transaction(async (trx) => {
      const result = await trx.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
      const affectedRows: unknown[] = result.recordset ?? [];

      if (allow_multiple_updates === false && affectedRows.length > 1) {
        throw new Error(
          'Query matches more than one row. Enable "Allow this Query to modify multiple rows" to permit this.'
        );
      }

      if (zero_records_as_success === false && affectedRows.length === 0) {
        throw new Error(`No rows were ${operationLabel}.`);
      }

      return affectedRows;
    });
  }

  private async executeParameterizedQuery(knexInstance: Knex, query: string, params: unknown[]): Promise<unknown> {
    const result = await knexInstance.raw(query, params as any[]).timeout(this.STATEMENT_TIMEOUT);
    return result;
  }

  private async executeBulkQueriesInTransaction(
    knexInstance: Knex,
    queries: { query: string; params: unknown[] }[]
  ): Promise<unknown[]> {
    const allRows: unknown[] = [];
    await knexInstance.transaction(async (transaction) => {
      for (const { query, params } of queries) {
        const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');
        const result = await transaction.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        allRows.push(...(result.recordset ?? []));
      }
    });
    return allRows;
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
