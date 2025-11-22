import { App } from './app.type.js';
import { ConnectionTestResult } from './connection_test_result.type.js';
import { QueryResult } from './query_result.type.js';
import { User } from './user.type.js';
export interface QueryService {
  run(
    sourceOptions: object,
    queryOptions: object,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult>;
  getConnection?(queryOptions: object, options: any, checkCache: boolean, dataSourceId: string): Promise<object>;
  testConnection?(sourceOptions: object): Promise<ConnectionTestResult>;
  invokeMethod?(methodName: string, ...args: any[]): Promise<QueryResult>;
}
