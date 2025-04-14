import {
  ConnectionTestResult,
  cacheConnection,
  getCachedConnection,
  QueryService,
  QueryResult,
  QueryError,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import knex, { Knex } from 'knex';
import { isEmpty } from '@tooljet-plugins/common';

export default class PostgresqlQueryService implements QueryService {
  private static _instance: PostgresqlQueryService;
  private STATEMENT_TIMEOUT;

  constructor() {
    // Default 120 secs
    this.STATEMENT_TIMEOUT =
      process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT && !isNaN(Number(process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT))
        ? Number(process.env.PLUGINS_SQL_DB_STATEMENT_TIMEOUT)
        : 120000;

    if (PostgresqlQueryService._instance) {
      return PostgresqlQueryService._instance;
    }
    PostgresqlQueryService._instance = this;
    return PostgresqlQueryService._instance;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    let pgPool;
    let pgConnection;
    try {
      const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

      switch (queryOptions.mode) {
        case 'sql': {
          if (this.isSqlParametersUsed(queryOptions)) {
            return await this.handleRawQuery(knexInstance, queryOptions);
          } else {
            pgPool = knexInstance.client.pool;
            pgConnection = await pgPool.acquire().promise;
            const query = queryOptions.query;
            let result = { rows: [] };
            result = await pgConnection.query(query);
            return {
              status: 'ok',
              data: result.rows,
            };
          }
        }
        case 'gui': {
          return await this.handleGuiQuery(knexInstance, queryOptions);
        }
        default:
          throw new Error("Invalid query mode. Must be either 'sql' or 'gui'.");
      }
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      const errorDetails: any = {};
      if (err && err instanceof Error) {
        const postgresError = err as any;
        const { code, detail, hint, routine } = postgresError;
        errorDetails.code = code || null;
        errorDetails.detail = detail || null;
        errorDetails.hint = hint || null;
        errorDetails.routine = routine || null;
      }
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    } finally {
      if (pgPool && pgConnection) pgPool.release(pgConnection);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('SELECT version();').timeout(this.STATEMENT_TIMEOUT);
    return { status: 'ok' };
  }

  private async handleGuiQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<any> {
    if (queryOptions.operation !== 'bulk_update_pkey') {
      return { rows: [] };
    }

    const query = this.buildBulkUpdateQuery(queryOptions);
    return await this.executeQuery(knexInstance, query);
  }

  private isSqlParametersUsed(queryOptions: QueryOptions): boolean {
    const { query_params } = queryOptions;
    const queryParams = query_params || [];
    const sanitizedQueryParams: string[][] = queryParams.filter(([key]) => !isEmpty(key));
    return !!sanitizedQueryParams.length;
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
    const { rows } = await knexInstance.raw(query, sanitizedQueryParams);
    return rows;
  }

  private connectionOptions(sourceOptions: SourceOptions) {
    const _connectionOptions = (sourceOptions.connection_options || []).filter((o) => o.some((e) => !isEmpty(e)));
    const connectionOptions = Object.fromEntries(_connectionOptions);
    Object.keys(connectionOptions).forEach((key) =>
      connectionOptions[key] === '' ? delete connectionOptions[key] : {}
    );
    return connectionOptions;
  }

  private async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    let connectionConfig;
    if (sourceOptions.connection_type === 'manual') {
      connectionConfig = {
        user: sourceOptions.username,
        host: sourceOptions.host,
        database: sourceOptions.database,
        password: sourceOptions.password,
        port: sourceOptions.port,
        ssl: this.getSslConfig(sourceOptions),
        statement_timeout: this.STATEMENT_TIMEOUT,
      };
    } else if (sourceOptions.connection_type === 'string' && sourceOptions.connection_string) {
      connectionConfig = {
        connectionString: sourceOptions.connection_string,
        ssl: this.getSslConfig(sourceOptions),
      };
    }
    const connectionOptions: Knex.Config = {
      client: 'pg',
      connection: connectionConfig,
      pool: { min: 0, max: 10, acquireTimeoutMillis: 10000 },
      acquireConnectionTimeout: 60000,
      ...this.connectionOptions(sourceOptions),
    };

    return knex(connectionOptions);
  }

  private getSslConfig(sourceOptions: SourceOptions) {
    if (!sourceOptions.ssl_enabled) return undefined;

    return {
      rejectUnauthorized: (sourceOptions.ssl_certificate ?? 'none') !== 'none',
      ca: sourceOptions.ssl_certificate === 'ca_certificate' ? sourceOptions.ca_cert : undefined,
      key: sourceOptions.ssl_certificate === 'self_signed' ? sourceOptions.client_key : undefined,
      cert: sourceOptions.ssl_certificate === 'self_signed' ? sourceOptions.client_cert : undefined,
    };
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<Knex> {
    if (checkCache) {
      const cachedConnection = await getCachedConnection(dataSourceId, dataSourceUpdatedAt);
      if (cachedConnection) return cachedConnection;
    }

    const connection = await this.buildConnection(sourceOptions);
    if (checkCache && dataSourceId) cacheConnection(dataSourceId, connection);
    return connection;
  }

  buildBulkUpdateQuery(queryOptions: QueryOptions): string {
    let queryText = '';

    const { table: tableName, primary_key_column: primaryKey, records } = queryOptions;

    for (const record of records) {
      const primaryKeyValue = typeof record[primaryKey] === 'string' ? `'${record[primaryKey]}'` : record[primaryKey];

      queryText = `${queryText} UPDATE ${tableName} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primaryKey) {
          queryText = ` ${queryText} ${key} = ${record[key] === null ? null : `'${record[key]}'`},`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primaryKey} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }
}
