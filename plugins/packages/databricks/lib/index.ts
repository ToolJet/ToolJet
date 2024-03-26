import { ConnectionTestResult, QueryService, QueryResult, QueryError } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { DBSQLClient } from '@databricks/sql';
import IDBSQLSession from '@databricks/sql/dist/contracts/IDBSQLSession';
import IOperation from '@databricks/sql/dist/contracts/IOperation';

export default class Databricks implements QueryService {
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    const session: IDBSQLSession = await client.openSession();
    const queryOperation: IOperation = await session.executeStatement('SELECT 1', {
      runAsync: true,
      maxRows: 10000,
    });
    let result;
    try {
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
    };
    if (credentials.host === '' || credentials.path === '' || credentials.token === '') {
      throw new Error(
        'Cannot find Server Hostname, HTTP Path, or personal access token. ' +
          'Check the environment variables DATABRICKS_SERVER_HOSTNAME, ' +
          'DATABRICKS_HTTP_PATH, and DATABRICKS_TOKEN.'
      );
    } else {
      const client = new DBSQLClient();
      client.connect(credentials);
      return client;
    }
  }
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    const session: IDBSQLSession = await client.openSession();
    const queryOperation: IOperation = await session.executeStatement(queryOptions.sql_query, {
      runAsync: true,
      maxRows: 10000,
    });
    let result;
    try {
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
