import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { CosmosClient } from '@azure/cosmos';
import { deleteItem, getItem, insertItems, listContainers, listDatabases, queryDatabase } from './operations';

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
        case 'query_database':
          result = await queryDatabase(client, queryOptions.database, queryOptions.container, queryOptions.query);
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

    await genericClient.getDatabaseAccount();
    return {
      status: 'ok',
    };
  }

  async deleteDatabase(sourceOptions: SourceOptions, databaseId: string) {
    const { endpoint, key } = sourceOptions;
    const genericClient = new CosmosClient({ endpoint, key });
    //check if database exits
    const database = await (await genericClient.databases.readAll().fetchAll()).resources;

    if (database.find((db) => db.id === databaseId)) {
      await genericClient.database(databaseId).delete();
      return {
        status: 'ok',
      };
    }

    return {
      status: 'Database with id ' + databaseId + ' does not exist',
    };
  }
}
