import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  cacheConnection,
  getCachedConnection,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import * as snowflake from 'snowflake-sdk';

export default class Snowflake implements QueryService {
  async connExecuteAsync(connection: snowflake.Connection, options: any) {
    return new Promise((resolve, reject) => {
      connection.execute({
        ...options,
        complete: function (err, stmt, rows) {
          if (err) {
            reject(err);
          } else {
            resolve({ stmt, rows });
          }
        },
      });
    });
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    const sqlText = queryOptions.query;
    const connection: snowflake.Connection = await this.getConnection(
      sourceOptions,
      {},
      true,
      dataSourceId,
      dataSourceUpdatedAt
    );

    try {
      const result: any = await this.connExecuteAsync(connection, {
        sqlText,
      });

      return { status: 'ok', data: result.rows };
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    await this.getConnection(sourceOptions, {}, false);

    return { status: 'ok' };
  }

  async connAsync(connection: snowflake.Connection) {
    return new Promise((resolve, reject) => {
      connection.connect(function (err, conn) {
        if (err) reject(err);
        resolve(conn);
      });
    });
  }

  async buildConnection(sourceOptions: SourceOptions) {
    const connection = snowflake.createConnection({
      account: sourceOptions.account,
      username: sourceOptions.username,
      password: sourceOptions.password,
      warehouse: sourceOptions.warehouse,
      database: sourceOptions.database,
      schema: sourceOptions.schema,
      role: sourceOptions.role,
      clientSessionKeepAlive: true,
    });

    return await this.connAsync(connection);
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
        await cacheConnection(dataSourceId, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions);
    }
  }
}
