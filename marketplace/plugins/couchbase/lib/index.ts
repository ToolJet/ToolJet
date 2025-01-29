import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import * as couchbase from 'couchbase';

export default class CouchbaseService implements QueryService {
  async run(sourceOptions: any, queryOptions: any): Promise<QueryResult> {
    const { cluster, bucket, scope, collection, disconnect } = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (queryOptions.operation) {
        case 'get_document':
          result = await collection.get(queryOptions.document_id);
          break;

        case 'query':
          const query = queryOptions.query;
          const parameters = this.parseJSON(queryOptions.parameters);
          result = await cluster.query(query, parameters);
          break;

        case 'insert_document':
          const docToInsert = this.parseJSON(queryOptions.document);
          result = await collection.insert(queryOptions.document_id, docToInsert);
          break;

        case 'upsert_document':
          const docToUpsert = this.parseJSON(queryOptions.document);
          result = await collection.upsert(queryOptions.document_id, docToUpsert);
          break;

        case 'delete_document':
          result = await collection.remove(queryOptions.document_id);
          break;

        case 'bulk_operations':
          const operations = this.parseJSON(queryOptions.operations);
          result = await Promise.all(operations.map(async (op: any) => {
            switch (op.type) {
              case 'insert':
                return collection.insert(op.id, op.document);
              case 'upsert':
                return collection.upsert(op.id, op.document);
              case 'remove':
                return collection.remove(op.id);
              default:
                throw new Error(`Unknown operation type: ${op.type}`);
            }
          }));
          break;

        default:
          throw new Error('Operation not supported');
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    } finally {
      await disconnect();
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  private parseJSON(jsonString?: string): any {
    if (!jsonString) return {};
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      throw new Error('Invalid JSON string');
    }
  }

  async testConnection(sourceOptions: any): Promise<ConnectionTestResult> {
    const { cluster, disconnect } = await this.getConnection(sourceOptions);

    try {
      await cluster.ping();
      return {
        status: 'ok',
      };
    } catch (error) {
      throw new QueryError('Connection failed', error.message, {});
    } finally {
      await disconnect();
    }
  }

  public async getConnection(sourceOptions: any) {
    const cluster = await couchbase.connect(sourceOptions.connectionString, {
      username: sourceOptions.username,
      password: sourceOptions.password,
    });

    const bucket = cluster.bucket(sourceOptions.bucket);
    const scope = bucket.scope(sourceOptions.scope || '_default');
    const collection = scope.collection(sourceOptions.collection || '_default');

    return {
      cluster,
      bucket,
      scope,
      collection,
      disconnect: async () => {
        await cluster?.close();
      },
    };
  }
}