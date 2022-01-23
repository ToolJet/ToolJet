

import { Knex, knex } from 'knex';
import { cacheConnection, getCachedConnection, ConnectionTestResult, QueryService, QueryResult } from '@tooljet-plugins/common'

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
    sourceOptions: any,
    queryOptions: any,
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
    }

    return {
      status: 'ok',
      data: result[0],
    };
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await knexInstance.raw('select @@version;');

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: any) {
    const config: Knex.Config = {
      client: 'mysql',
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
