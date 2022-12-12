import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import sdk from 'node-appwrite';
import { bulkUpdate, createDocument, deleteDocument, getDocument, queryCollection, updateDocument } from './operations';
const JSON5 = require('json5');

export default class Appwrite implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const database = await this.getConnection(sourceOptions);
    const operation = queryOptions.operation;
    const body = this.returnObject(queryOptions.body);
    let result = {};

    try {
      switch (operation) {
        case 'list_docs':
          result = await queryCollection(
            database,
            queryOptions.collectionId,
            queryOptions.limit,
            queryOptions.order_fields,
            queryOptions.order_types,
            queryOptions.where_field,
            queryOptions.where_operation,
            queryOptions.where_value
          );
          break;
        case 'get_document':
          result = await getDocument(database, queryOptions.collectionId, queryOptions.documentId);
          break;
        case 'add_document':
          result = await createDocument(database, queryOptions.collectionId, body);
          break;
        case 'update_document':
          result = await updateDocument(database, queryOptions.collectionId, queryOptions.documentId, body);
          break;
        case 'delete_document':
          result = await deleteDocument(database, queryOptions.collectionId, queryOptions.documentId);
          break;
        case 'bulk_update':
          result = await bulkUpdate(
            database,
            queryOptions.collectionId,
            this.returnObject(queryOptions.records),
            queryOptions['document_id_key']
          );
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

  private returnObject(data: any) {
    if (!data) {
      return {};
    }
    return typeof data === 'string' ? JSON5.parse(data) : data;
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
