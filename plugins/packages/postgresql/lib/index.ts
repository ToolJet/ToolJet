import {
  ConnectionTestResult,
  cacheConnection,
  getCachedConnection,
  QueryService,
  QueryResult,
} from '@tooljet-plugins/common';

const { Pool } = require('pg');
import { SourceOptions, QueryOptions } from './types';

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
    const pool = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    let result = {
      rows: [],
    };
    let query = '';

    if (queryOptions.mode === 'gui') {
      if (queryOptions.operation === 'bulk_update_pkey') {
        query = await this.buildBulkUpdateQuery(queryOptions);
      }
    } else {
      query = queryOptions.query;
    }

    result = await pool.query(query);

    return {
      status: 'ok',
      data: result.rows,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const pool = await this.getConnection(sourceOptions, {}, false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await pool.query('SELECT version();');

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: SourceOptions) {
    const poolConfig: any = {
      user: sourceOptions.username,
      host: sourceOptions.host,
      database: sourceOptions.database,
      password: sourceOptions.password,
      port: sourceOptions.port,
      statement_timeout: 10000,
      connectionTimeoutMillis: 10000,
      ...this.connectionOptions(sourceOptions),
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

    if (sourceOptions.ssl_enabled) poolConfig['ssl'] = sslObject;

    return new Pool(poolConfig);
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<any> {
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

  async buildBulkUpdateQuery(queryOptions: any): Promise<string> {
    let queryText = '';

    const tableName = queryOptions['table'];
    const primaryKey = queryOptions['primary_key_column'];
    const records = queryOptions['records'];

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
