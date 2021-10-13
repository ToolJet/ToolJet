import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { QueryError } from 'src/modules/data_sources/query.error';
import { cacheConnection, getCachedConnection } from 'src/helpers/utils.helper';
import * as snowflake from 'snowflake-sdk';
// Snowflake does not support promise based api and therefore we need to wrap
// connection callbacks within a promise to handle accordingly
// https://github.com/snowflakedb/snowflake-connector-nodejs/issues/3
import { promisify } from 'util';

@Injectable()
export default class snowflakeQueryService implements QueryService {
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
    sourceOptions: any,
    queryOptions: any,
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

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    await this.getConnection(sourceOptions, {}, false);

    return { status: 'ok' };
  }

  async buildConnection(sourceOptions: any) {
    const connection = snowflake.createConnection({
      account: sourceOptions.account,
      username: sourceOptions.username,
      password: sourceOptions.password,
      database: sourceOptions.database,
      warehouse: sourceOptions.warehouse,
      schema: sourceOptions.schema,
      role: sourceOptions.role,
    });

    const connectAsync = promisify(connection.connect);
    await connectAsync();

    return connection;
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
