import {
  ConnectionTestResult,
  cacheConnection,
  getCachedConnection,
  QueryService,
  QueryResult,
} from '@tooljet-plugins/common';

import { SourceOptions, QueryOptions } from './types';
import knex, { Knex } from 'knex';

const STATEMENT_TIMEOUT = 10000;

function isEmpty(value: number | null | undefined | string) {
  return (
    value === undefined ||
    value === null ||
    !isNaN(value as number) ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
}

export default class PostgresqlQueryService implements QueryService {
  private static _instance: PostgresqlQueryService;

  constructor() {
    if (PostgresqlQueryService._instance) {
      return PostgresqlQueryService._instance;
    }

    PostgresqlQueryService._instance = this;
    return PostgresqlQueryService._instance;
  }

  connectionOptions(sourceOptions: SourceOptions) {
    const _connectionOptions = (sourceOptions.connection_options || []).filter((o) => {
      return o.some((e) => !isEmpty(e));
    });

    const connectionOptions = Object.fromEntries(_connectionOptions);
    Object.keys(connectionOptions).forEach((key) =>
      connectionOptions[key] === '' ? delete connectionOptions[key] : {}
    );

    return connectionOptions;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    let result = {
      rows: [],
    };

    if (queryOptions.mode === 'gui') {
      if (queryOptions.operation === 'bulk_update_pkey') {
        const bulkQueryOptions = await this.buildBulkUpdateQuery(queryOptions);
        result = await knexInstance
          .raw(bulkQueryOptions.query, bulkQueryOptions.queryParams)
          .timeout(STATEMENT_TIMEOUT);
      }
    } else {
      const query = queryOptions.query;
      const queryParams = isEmpty(queryOptions.queryParams) ? {} : queryOptions.queryParams;
      result = await knexInstance.raw(query, queryParams).timeout(STATEMENT_TIMEOUT);
    }

    return {
      status: 'ok',
      data: result.rows,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('SELECT version();').timeout(STATEMENT_TIMEOUT);

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    const connectionOptions: Knex.Config = {
      client: 'pg',
      connection: {
        user: sourceOptions.username,
        host: sourceOptions.host,
        database: sourceOptions.database,
        password: sourceOptions.password,
        port: sourceOptions.port,
        ssl: sourceOptions.ssl_enabled
          ? {
              rejectUnauthorized: (sourceOptions.ssl_certificate ?? 'none') != 'none',
              ca: sourceOptions.ssl_certificate === 'ca_certificate' ? sourceOptions.ca_cert : undefined,
              key: sourceOptions.ssl_certificate === 'self_signed' ? sourceOptions.client_key : undefined,
              cert: sourceOptions.ssl_certificate === 'self_signed' ? sourceOptions.client_cert : undefined,
            }
          : undefined,
      },
      pool: { min: 0, max: 10, acquireTimeoutMillis: 10000 },
      acquireConnectionTimeout: 10000,
      ...this.connectionOptions(sourceOptions),
    };

    return knex(connectionOptions);
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<Knex> {
    if (checkCache) {
      let connection = await getCachedConnection(dataSourceId, dataSourceUpdatedAt);

      if (connection) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions);
        dataSourceId && cacheConnection(dataSourceId, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions);
    }
  }

  async buildBulkUpdateQuery(queryOptions: any): Promise<{
    query: string;
    queryParams: Record<string, any>;
  }> {
    let queryText = '';

    const tableName = queryOptions['table'];
    const primaryKey = queryOptions['primary_key_column'];
    const records = queryOptions['records'];
    const queryParams: Record<string, any> = isEmpty(queryOptions.queryParams) ? {} : queryOptions.queryParams;

    records.forEach((record: any, index: number) => {
      const primaryKeyValue = `pkey_${index}`;
      queryParams[primaryKeyValue] = record[primaryKey];

      queryText += `UPDATE ${tableName} SET`;

      Object.keys(record).forEach((key) => {
        if (key !== primaryKey) {
          const paramKey = `${key}_${index}`;
          queryText += ` ${key} = :${paramKey},`;
          queryParams[paramKey] = record[key];
        }
      });

      queryText = queryText.slice(0, -1); // Remove trailing comma
      queryText += ` WHERE ${primaryKey} = :${primaryKeyValue}; `;
    });

    return { query: queryText.trim(), queryParams };
  }
}
