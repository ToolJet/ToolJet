import { ConnectionTestResult, cacheConnection, getCachedConnection, QueryService, QueryResult } from 'common';

const { Pool } = require('pg');

export default class PostgresqlQueryService implements QueryService {
  private static _instance: PostgresqlQueryService;

  constructor() {
    if (PostgresqlQueryService._instance) {
      return PostgresqlQueryService._instance;
    }
  
    PostgresqlQueryService._instance = this;
    return PostgresqlQueryService._instance;
  }

  async run(
    sourceOptions: any,
    queryOptions: any,
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

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const pool = await this.getConnection(sourceOptions, {}, false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await pool.query('SELECT version();');

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: any) {
    const poolConfig: any = {
      user: sourceOptions.username,
      host: sourceOptions.host,
      database: sourceOptions.database,
      password: sourceOptions.password,
      port: sourceOptions.port,
      statement_timeout: 10000,
      connectionTimeoutMillis: 10000,
    };

    if (sourceOptions.ssl_enabled) poolConfig['ssl'] = { rejectUnauthorized: false };

    return new Pool(poolConfig);
  }

  async getConnection(
    sourceOptions: any,
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
      queryText = `${queryText} UPDATE ${tableName} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primaryKey) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primaryKey} = ${record[primaryKey]};`;
    }

    return queryText.trim();
  }
}
