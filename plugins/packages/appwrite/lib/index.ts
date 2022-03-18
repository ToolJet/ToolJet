import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import sdk from 'node-appwrite';
import { queryCollection } from './operations';

export default class Appwrite implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const database = await this.getConnection(sourceOptions);
    const operation = queryOptions.operation;
    let result = {};

    try {
      switch (operation) {
        case 'query_collection': {
          result = await queryCollection(
            database,
            queryOptions.path,
            parseInt(queryOptions.limit),
            queryOptions.order_field,
            queryOptions.order_type
          );
          break;
        }
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<sdk.Database> {
    const { host, secret_key, project_id } = sourceOptions;
    const client = new sdk.Client();

    client
      .setEndpoint(host) // Your API Endpoint
      .setProject(project_id) // Your project ID
      .setKey(secret_key); // Your secret API key;

    return new sdk.Database(client);
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const databaseClient = await this.getConnection(sourceOptions);

    if (!databaseClient) {
      throw new Error('Invalid credentials');
    }

    await databaseClient.listCollections();

    return {
      status: 'ok',
    };
  }
}
