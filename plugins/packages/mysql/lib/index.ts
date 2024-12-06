import knex, { Knex } from 'knex';
import {
  cacheConnection,
  getCachedConnection,
  ConnectionTestResult,
  QueryService,
  QueryResult,
  QueryError,
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
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('select @@version;').timeout(this.STATEMENT_TIMEOUT);
    knexInstance.destroy();
    return { status: 'ok' };
  }

  private async handleGuiQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<any> {
    if (queryOptions.operation !== 'bulk_update_pkey') {
      return { rows: [] };
    }

    const query = this.buildBulkUpdateQuery(queryOptions);
    return await this.executeQuery(knexInstance, query);
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
          ssl: sourceOptions.ssl_enabled ?? false,
        };

    const sslObject = { rejectUnauthorized: (sourceOptions.ssl_certificate ?? 'none') != 'none' };
    if (sourceOptions.ssl_certificate === 'ca_certificate') {
      sslObject['ca'] = sourceOptions.ca_cert;
    }
    if (sourceOptions.ssl_certificate === 'self_signed') {
      sslObject['ca'] = sourceOptions.root_cert;
      sslObject['key'] = sourceOptions.client_key;
      sslObject['cert'] = sourceOptions.client_cert;
    }

    const config: Knex.Config = {
      client: 'mysql2',
      connection: {
        ...props,
        user: sourceOptions.username,
        password: sourceOptions.password,
        database: sourceOptions.database,
        multipleStatements: true,
        ...(sourceOptions.ssl_enabled && { ssl: sslObject }),
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
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primaryKey} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }
}
