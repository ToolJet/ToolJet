import { Knex, knex } from 'knex';
import {
  ConnectionTestResult,
  QueryError,
  QueryResult,
  QueryService,
  cacheConnection,
  getCachedConnection,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class MssqlQueryService implements QueryService {
  private static _instance: MssqlQueryService;

  constructor() {
    if (MssqlQueryService._instance) {
      return MssqlQueryService._instance;
    }

    MssqlQueryService._instance = this;
    return MssqlQueryService._instance;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    let result = {};
    let query = queryOptions.query;
    const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    try {
      if (queryOptions.mode === 'gui') {
        if (queryOptions.operation === 'bulk_update_pkey') {
          query = this.buildBulkUpdateQuery(queryOptions);
        }
      }
      result = await knexInstance.raw(query);
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return { status: 'ok', data: result };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await knexInstance.raw('select @@version;');

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: SourceOptions) {
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
        },
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

  buildBulkUpdateQuery(queryOptions: QueryOptions): string {
    let queryText = '';

    const tableName = queryOptions['table'];
    const primaryKey = queryOptions['primary_key_column'];
    const records = queryOptions['records'];

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
