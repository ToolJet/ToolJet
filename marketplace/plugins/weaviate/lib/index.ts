import { QueryService, QueryResult, ConnectionTestResult, QueryError } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import { getSchema, collectionOperation, objectsOperation } from './query_operations';
export default class Weaviate implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    try {
      const headers = {};
      let BASE_URL;
      if (sourceOptions.connection_type === 'local') {
        BASE_URL = `http://${sourceOptions.host}:${sourceOptions.port}`;
      } else {
        BASE_URL = `${sourceOptions.instanceUrl}`;
        headers['Authorization'] = `Bearer ${sourceOptions.apiKey}`;
      }
      switch (queryOptions.data_type) {
        case 'schema': {
          result = await getSchema(queryOptions, BASE_URL, headers);
          break;
        }
        case 'collection': {
          result = await collectionOperation(queryOptions, BASE_URL, headers);
          break;
        }
        case 'objects': {
          result = await objectsOperation(queryOptions, BASE_URL, headers);
          break;
        }
        default:
          throw new QueryError('Invalid operation', 'Operation not supported', {});
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error?.message, {});
    }

    return { status: 'ok', data: result };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      let response;
      if (sourceOptions.connection_type === 'local') {
        response = await fetch(`http://${sourceOptions.host}:${sourceOptions.port}/v1/schema`, {
          method: 'GET',
        });
      } else {
        response = await fetch(`${sourceOptions.instanceUrl}/v1/schema`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sourceOptions.apiKey}`,
          },
        });
      }
      if (response.ok) {
        return { status: 'ok' };
      }
    } catch (error) {
      throw new QueryError('Connection failed', error?.message, {});
    }
  }
}
