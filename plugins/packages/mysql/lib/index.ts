import { Knex, knex } from 'knex';
import {
  cacheConnection,
  getCachedConnection,
  ConnectionTestResult,
  QueryService,
  QueryResult,
  QueryError,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class MysqlQueryService implements QueryService {
  private static _instance: MysqlQueryService;

  constructor() {
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

    const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    try {
      result = await knexInstance.raw(query);
    } catch (err) {
      console.log(err);
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return {
      status: 'ok',
      data: result[0],
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('select @@version;');
    knexInstance.destroy();

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: SourceOptions) {
    const config: Knex.Config = {
      client: 'mysql2',
      connection: {
        host: sourceOptions.host,
        user: sourceOptions.username,
        password: sourceOptions.password,
        database: sourceOptions.database,
        port: +sourceOptions.port,
        multipleStatements: true,
        ssl: sourceOptions.ssl_enabled ?? false, // Disabling by default for backward compatibility
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
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primaryKey} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }
}
