import { ConnectionTestResult } from 'common/lib/connection_test_result.type';
import { QueryResult } from 'common/lib/query_result.type';
import { QueryService } from 'common/lib/query_service.interface';
export default class PostgresqlQueryService implements QueryService {
    run(sourceOptions: any, queryOptions: any, dataSourceId: string, dataSourceUpdatedAt: string): Promise<QueryResult>;
    testConnection(sourceOptions: object): Promise<ConnectionTestResult>;
    buildConnection(sourceOptions: any): Promise<any>;
    getConnection(sourceOptions: any, options: any, checkCache: boolean, dataSourceId?: string, dataSourceUpdatedAt?: string): Promise<any>;
    buildBulkUpdateQuery(queryOptions: any): Promise<string>;
}
//# sourceMappingURL=postgresql.d.ts.map