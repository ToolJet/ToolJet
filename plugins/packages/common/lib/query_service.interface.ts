import { ConnectionTestResult } from './connection_test_result.type';
import { QueryResult } from './query_result.type';

export interface QueryService {
  run(
    sourceOptions: object,
    queryOptions: object,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<QueryResult>;
  getConnection?(queryOptions: object, options: any, checkCache: boolean, dataSourceId: string): Promise<object>;
  testConnection?(sourceOptions: object): Promise<ConnectionTestResult>;
}
