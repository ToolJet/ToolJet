import { ConnectionTestResult, QueryService, QueryResult, QueryError } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { DBSQLClient } from '@databricks/sql';
import IDBSQLSession from '@databricks/sql/dist/contracts/IDBSQLSession';
import IOperation from '@databricks/sql/dist/contracts/IOperation';
import Int64 from 'node-int64';

export default class Databricks implements QueryService {
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    let result;
    const client = await this.getConnection(sourceOptions);
    const session: IDBSQLSession = await client.openSession();
    try {
      const queryOperation: IOperation = await session.executeStatement('SELECT version();', {
        runAsync: true,
        queryTimeout: new Int64(10000),
      });

      result = await queryOperation.fetchAll();
    } catch (error) {
      throw new Error('Error in connection: ' + error.message);
    } finally {
      await session.close();
      await client.close();
    }

    return {
      status: 'ok',
      data: result,
    };
  }
  async getConnection(sourceOptions: SourceOptions): Promise<DBSQLClient> {
    const credentials = {
      host: sourceOptions.host,
      path: sourceOptions.http_path,
      token: sourceOptions.personal_access_token,
      socketTimeout: 60 * 1000,
    };
    try {
      const client = new DBSQLClient();
      client.connect(credentials);
      client.on('error', (error) => {
        console.log('Error in connection: ' + error.message);
      });
      return client;
    } catch (error) {
      throw new Error('Error in connection: ' + error.message);
    }
  }
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result;
    const client = await this.getConnection(sourceOptions);
    const session: IDBSQLSession = await client.openSession();
    try {
      const queryOperation: IOperation = await session.executeStatement(queryOptions.sql_query, {
        runAsync: true,
        queryTimeout: new Int64(10000),
      });
      result = await queryOperation.fetchAll();
    } catch (error) {
      throw new QueryError('Error fetching query result', error.message, {});
    } finally {
      await session.close();
      await client.close();
    }
    return {
      status: 'ok',
      data: result,
    };
  }
}
