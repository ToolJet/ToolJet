import { ConnectionTestResult, QueryService, QueryResult } from '@tooljet-plugins/common'

import { createCollection, getDocument, updateDocument, deleteDocument, indexDocument, search } from './operations';
import { Client } from 'typesense';

export default class TypeSenseService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    let result = {};
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'create_collection':
          result = await createCollection(client, queryOptions.schema);
          break;
        case 'search':
          result = await search(client, queryOptions.collection, queryOptions.searchParams);
          break;
        case 'index_document':
          result = await indexDocument(client, queryOptions.collection, queryOptions.document);
          break;
        case 'get':
          result = await getDocument(client, queryOptions.collection, queryOptions.id);
          break;
        case 'update':
          result = await updateDocument(client, queryOptions.collection, queryOptions.id, queryOptions.document);
          break;
        case 'delete':
          result = await deleteDocument(client, queryOptions.collection, queryOptions.id);
          break;
      }
    } catch (err) {
      console.log(err);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    const health = await client.health.retrieve();

    return {
      status: health.ok ? 'ok' : 'failed',
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    const client = new Client({
      nodes: [
        {
          host: sourceOptions.host,
          port: sourceOptions.port,
          protocol: sourceOptions.protocol,
        },
      ],
      apiKey: sourceOptions.api_key,
      connectionTimeoutSeconds: 2,
    });

    return client;
  }
}
