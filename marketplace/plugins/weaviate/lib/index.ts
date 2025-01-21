import { QueryService, QueryResult, ConnectionTestResult, QueryError } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { getSchema, createClass, listObjects, createObject } from './operations';

export default class Weaviate implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    try {
      switch (queryOptions.operation) {
        case Operation.GetSchema:
          result = await getSchema(sourceOptions);
          break;
        case Operation.CreateClass:
          result = await createClass(sourceOptions, queryOptions);
          break;
        case Operation.ListObjects:
          result = await listObjects(sourceOptions, queryOptions);
          break;
        case Operation.CreateObject:
          result = await createObject(sourceOptions, queryOptions);
          break;
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
      await getSchema(sourceOptions);
      return { status: 'ok' };
    } catch (error) {
      throw new QueryError('Connection failed', error?.message, {});
    }
  }
}
