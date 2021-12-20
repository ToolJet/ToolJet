import { QueryResult } from 'common/lib/query_result.type';
import { QueryService } from 'common/lib/query_service.interface';
import { Knex } from 'knex';
import { ConnectionTestResult } from 'common/lib/connection_test_result.type';
export default class MysqlQueryService implements QueryService {
    run(sourceOptions: any, queryOptions: any, dataSourceId: string, dataSourceUpdatedAt: string): Promise<QueryResult>;
    testConnection(sourceOptions: object): Promise<ConnectionTestResult>;
    buildConnection(sourceOptions: any): Promise<Knex<any, unknown[]>>;
    getConnection(sourceOptions: any, options: any, checkCache: boolean, dataSourceId?: string, dataSourceUpdatedAt?: string): Promise<any>;
    buildBulkUpdateQuery(queryOptions: any): Promise<string>;
}
//# sourceMappingURL=mysql.d.ts.map