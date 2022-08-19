import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { CosmosClient } from '@azure/cosmos';
import { listDatabases } from './operations';

export default class Cosmosdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { endpoint, key } = sourceOptions;
    const operation = queryOptions.operation;
    const client = new CosmosClient({ endpoint, key });
    let result = {};

    try {
      switch (operation) {
        case 'list_databases':
          result = await listDatabases(client);

          break;

        default:
          break;
      }
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
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
