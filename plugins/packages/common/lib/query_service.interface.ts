import { App } from './app.type';
import { ConnectionTestResult } from './connection_test_result.type';
import { QueryResult } from './query_result.type';
import { User } from './user.type';
export interface QueryService {
  run(
    sourceOptions: object,
    queryOptions: object,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string,
    // signal: fires when the caller gives up on the query (its timeout, a workflow step's deadline);
    // a plugin that honours it cancels its request
    context?: { user?: User; app?: App; signal?: AbortSignal }
  ): Promise<QueryResult>;
  getConnection?(queryOptions: object, options: any, checkCache: boolean, dataSourceId: string): Promise<object>;
  testConnection?(sourceOptions: object): Promise<ConnectionTestResult>;
  invokeMethod?(methodName: string, ...args: any[]): Promise<unknown>;
}
