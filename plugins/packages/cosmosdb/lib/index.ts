// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { CosmosClient } from '@azure/cosmos';

export default class Cosmosdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    return {
      status: 'ok',
      data: {},
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { endpoint, key } = sourceOptions;
    const genericClient = new CosmosClient({ endpoint, key });

    await genericClient.databases.readAll({}).fetchAll();

    return {
      status: 'ok',
    };
  }
}
