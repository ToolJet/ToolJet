import { ConnectionTestResult, QueryService, QueryResult, QueryError } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { DBSQLClient } from '@databricks/sql';
import IDBSQLSession from '@databricks/sql/dist/contracts/IDBSQLSession';
import IOperation from '@databricks/sql/dist/contracts/IOperation';

export default class Databricks implements QueryService {
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const credentials = {
      host: sourceOptions.host,
      path: sourceOptions.http_path,
      token: sourceOptions.personal_access_token,
    };
    try {
      const client = await this.getConnection(sourceOptions);
      const result = client.connect(credentials).then(async (client) => {
        const session: IDBSQLSession = await client.openSession();

        const queryOperation: IOperation = await session.executeStatement('SELECT 1', {
          runAsync: true,
          maxRows: 10000, // This option enables the direct results feature.
        });
        const result = await queryOperation.fetchAll();
        await session.close();
        await client.close();
        return result;
      });
      return {
        status: 'ok',
        data: result,
      };
    } catch (error) {
      throw new QueryError('Error connecting to databricks', error.message, {});
    }
  }
  async getConnection(sourceOptions: SourceOptions): Promise<DBSQLClient> {
    const credentials = {
      host: sourceOptions.host,
      path: sourceOptions.http_path,
      token: sourceOptions.personal_access_token,
    };
    const client = new DBSQLClient();
    client.connect(credentials);
    return client;
  }
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);

    const session: IDBSQLSession = await client.openSession();
    const queryOperation: IOperation = await session.executeStatement(queryOptions.sql_query, {
      runAsync: true,
      maxRows: 10000,
    });
    const result = await queryOperation.fetchAll();

    await session.close();
    await client.close();

    return {
      status: 'ok',
      data: result,
    };
  }
  catch(error) {
    throw new QueryError('Query could not be completed', error.message, {});
  }
}
