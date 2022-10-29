import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { listContainers, listBlobs } from './operations';
const { BlobServiceClient } = require('@azure/storage-blob');

export default class Azureblobstorage implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.ListContainers:
          result = await listContainers(client);
          break;
        case Operation.ListBlobs:
          result = await listBlobs(client, queryOptions);
          break;
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = this.getConnection(sourceOptions);
    if (!client) throw new Error('Error');
    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const blobServiceClient = BlobServiceClient.fromConnectionString(sourceOptions.connection_string);
    return blobServiceClient;
  }
}
