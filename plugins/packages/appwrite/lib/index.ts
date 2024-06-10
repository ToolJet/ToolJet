import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, ReturnObject } from './types';
import sdk from 'node-appwrite';
import { bulkUpdate, createDocument, deleteDocument, getDocument, queryCollection, updateDocument } from './operations';
const JSON5 = require('json5');

export default class Appwrite implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const database = await this.getConnection(sourceOptions);
    const { database_id } = sourceOptions;
    const operation = queryOptions.operation;
    const body = this.returnObject(queryOptions.body);
    const isBodyEmpty = !Object.keys(body).length;
    let result = {};

    try {
      if (!queryOptions.collectionId) {
        throw new Error('Collection id is required.');
      }
      switch (operation) {
        case 'list_docs':
          result = await queryCollection(
            database,
            database_id,
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
          if (!queryOptions.documentId) throw new Error('Document id is required');
          result = await getDocument(database, database_id, queryOptions.collectionId, queryOptions.documentId);
          break;
        case 'add_document':
          if (isBodyEmpty) throw new Error('Body is required');
          result = await createDocument(database, database_id, queryOptions.collectionId, body as object);
          break;
        case 'update_document':
          if (!queryOptions.documentId) throw new Error('Document id is required');
          if (isBodyEmpty) throw new Error('Body is required');
          result = await updateDocument(
            database,
            database_id,
            queryOptions.collectionId,
            queryOptions.documentId,
            body as object
          );
          break;
        case 'delete_document':
          if (!queryOptions.documentId) throw new Error('Document id is required');
          result = await deleteDocument(database, database_id, queryOptions.collectionId, queryOptions.documentId);
          break;
        case 'bulk_update':
          if (!queryOptions.records) throw new Error('Records field is required');
          if (!queryOptions['document_id_key']) throw new Error('Key for document id field is required');
          result = await bulkUpdate(
            database,
            database_id,
            queryOptions.collectionId,
            this.returnObject(queryOptions.records) as object[],
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

  returnObject(data: ReturnObject | string): ReturnObject {
    if (!data) {
      return {};
    }
    return typeof data === 'string' ? JSON5.parse(data) : data;
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<sdk.Databases> {
    const { host, secret_key, project_id } = sourceOptions;
    const client = new sdk.Client();

    client
      .setEndpoint(host) // Your API Endpoint
      .setProject(project_id) // Your project ID
      .setKey(secret_key); // Your secret API key;

    return new sdk.Databases(client);
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const databaseClient = await this.getConnection(sourceOptions);

    try {
      await databaseClient.listCollections(sourceOptions.database_id);

      return {
        status: 'ok',
      };
    } catch (err) {
      throw new Error(`Connection test failed - ${err.message}`);
    }
  }
}
