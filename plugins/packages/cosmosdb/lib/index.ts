import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { CosmosClient } from '@azure/cosmos';
import { deleteItem, getItem, insertItems, listContainers, listDatabases } from './operations';

export default class Cosmosdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { endpoint, key } = sourceOptions;
    const operation = queryOptions.operation;
    const client = new CosmosClient({ endpoint, key });
    let result = {};
    console.log('queryOptions =======>', operation, queryOptions);

    try {
      switch (operation) {
        case 'list_databases':
          result = await listDatabases(client);
          break;
        case 'list_containers':
          result = await listContainers(client, queryOptions.database);
          break;
        case 'insert_items':
          result = await insertItems(client, queryOptions.database, queryOptions.container, queryOptions.items);
          break;
        case 'read_item':
          result = await getItem(client, queryOptions.database, queryOptions.container, queryOptions.itemId);
          break;
        case 'delete_item':
          result = await deleteItem(client, queryOptions.database, queryOptions.container, queryOptions.itemId);
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
