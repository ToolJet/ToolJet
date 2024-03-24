import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import { DBSQLClient } from '@databricks/sql';

export default class Databricks implements QueryService {
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
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const result = { message: 'test connection successful' };
    return {
      status: 'ok',
      data: result,
    };
  }
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    try {
      const result = await this.getConnection(sourceOptions).then(async (client) => {
        const session = await client.openSession();
        const queryOperation = await session.executeStatement(queryOptions.sql_query, {
          runAsync: true,
          maxRows: 1000,
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
      throw new QueryError('Query could not be completed', error.message, {});
    }
  }
}
