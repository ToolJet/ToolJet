import { QueryResult } from 'common/lib/query_result.type';
import { ConnectionTestResult } from 'common/lib/connection_test_result.type';
import { QueryService } from 'common/lib/query_service.interface';
import { Knex } from 'knex';
export default class MssqlQueryService implements QueryService {
    run(sourceOptions: any, queryOptions: any, dataSourceId: string, dataSourceUpdatedAt: string): Promise<QueryResult>;
    testConnection(sourceOptions: object): Promise<ConnectionTestResult>;
    buildConnection(sourceOptions: any): Promise<Knex<any, unknown[]>>;
    getConnection(sourceOptions: any, options: any, checkCache: boolean, dataSourceId?: string, dataSourceUpdatedAt?: string): Promise<any>;
}
//# sourceMappingURL=mssql.d.ts.map