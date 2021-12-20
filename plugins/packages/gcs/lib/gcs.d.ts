import { ConnectionTestResult } from 'common/lib/connection_test_result.type';
import { QueryResult } from 'common/lib/query_result.type';
import { QueryService } from 'common/lib/query_service.interface';
export default class GcsQueryService implements QueryService {
    run(sourceOptions: any, queryOptions: any, _dataSourceId: string): Promise<QueryResult>;
    testConnection(sourceOptions: object): Promise<ConnectionTestResult>;
    getConnection(sourceOptions: any, _options?: object): Promise<any>;
}
//# sourceMappingURL=gcs.d.ts.map