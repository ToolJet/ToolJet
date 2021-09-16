import { ConnectionTestResult } from './connection_test_result.type';
import { QueryResult } from './query_result.type';

export interface QueryService {
  run(
    sourceOptions: Record<string, any>,
    queryOptions: Record<string, any>,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<QueryResult>;
  getConnection?(
    queryOptions: Record<string, any>,
    options: any,
    checkCache: boolean,
    dataSourceId: string
  ): Promise<Record<string, any>>;
  testConnection?(sourceOptions: Record<string, any>): Promise<ConnectionTestResult>;
}
